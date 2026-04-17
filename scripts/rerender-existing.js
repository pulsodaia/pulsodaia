#!/usr/bin/env node
// Re-renderiza artigos ja publicados com o template atual (related cards + follow-us).
// Le feed/{slug}/index.html, extrai campos, salva article.json, re-renderiza.
// Uso: node scripts/rerender-existing.js

const fs = require('fs');
const path = require('path');
const engine = require('./feed-engine.js');

const ROOT = path.join(__dirname, '..');
const FEED_DIR = path.join(ROOT, 'feed');
const FEED_JSON = path.join(ROOT, 'data', 'feed.json');

// Importar helpers do feed-engine via require direto nao da (main roda). Copiar funcoes.
function extractBetween(html, openRe, closeTag) {
  const m = html.match(openRe);
  if (!m) return null;
  const startIdx = m.index + m[0].length;
  const endIdx = html.indexOf(closeTag, startIdx);
  if (endIdx === -1) return null;
  return html.substring(startIdx, endIdx).trim();
}

function stripTags(s) {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseArticleHtml(html, slug, feedEntry) {
  // Meta tags
  const metaTitle = (html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || [])[1] || '';
  const metaDesc = (html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) || [])[1] || '';
  const metaUrl = (html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i) || [])[1] || '';
  const pubTime = (html.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i) || [])[1] || feedEntry.published_at;
  const section = (html.match(/<meta\s+property="article:section"\s+content="([^"]+)"/i) || [])[1] || feedEntry.source_name;

  // Tags
  const tagMatches = [...html.matchAll(/<meta\s+property="article:tag"\s+content="([^"]+)"/gi)];
  const tags = tagMatches.map(m => m[1]);

  // Eyebrow (category)
  const eyebrowHtml = extractBetween(html, /<div class="eyebrow">/i, '</div>') || '';
  const eyebrowParts = [...eyebrowHtml.matchAll(/<span(?![^>]*class="dot")[^>]*>([^<]+)<\/span>/gi)].map(m => m[1].trim());
  const eyebrow_category = (eyebrowParts[0] || feedEntry.eyebrow_category || 'NOTICIA').toUpperCase();

  // Headline
  const headline = stripTags(extractBetween(html, /<h1>/i, '</h1>') || feedEntry.headline);
  const subtitle = stripTags(extractBetween(html, /<p class="subtitle">/i, '</p>') || feedEntry.subtitle || '');

  // Lead
  const lead = stripTags(extractBetween(html, /<p class="lead">/i, '</p>') || '');

  // Body: tudo entre o fim do <p class="lead"> e o inicio do <div class="source-box">
  // Fallback: tudo entre o subtitle e o source-box se nao houver lead
  let body_html = '';
  const leadMatch = html.match(/<p class="lead">[\s\S]*?<\/p>/i);
  const sourceBoxIdx = html.search(/<div class="source-box">/i);
  if (leadMatch && sourceBoxIdx > -1) {
    const bodyStart = leadMatch.index + leadMatch[0].length;
    body_html = html.substring(bodyStart, sourceBoxIdx).trim();
  } else if (sourceBoxIdx > -1) {
    // Sem lead, tenta depois do <article class="post">
    const articleStart = html.search(/<article class="post">/i);
    if (articleStart > -1) {
      body_html = html.substring(articleStart + '<article class="post">'.length, sourceBoxIdx).trim();
    }
  }

  // Hero image: procura arquivo hero.* no dir
  const dir = path.join(FEED_DIR, slug);
  let hero_image = null;
  try {
    const files = fs.readdirSync(dir);
    hero_image = files.find(f => /^hero\.(jpg|jpeg|png|webp|gif)$/i.test(f)) || null;
  } catch {}

  // Source url: do JSON-LD ou do feedEntry
  const ld = (html.match(/"isBasedOn":\s*"([^"]+)"/) || [])[1] || feedEntry.source_url;
  const readTimeMatch = html.match(/(\d+)\s+min de leitura/i);
  const read_time_min = readTimeMatch ? parseInt(readTimeMatch[1]) : (feedEntry.read_time_min || 3);

  return {
    slug,
    headline,
    subtitle,
    eyebrow_category,
    lead,
    body_html,
    body_markdown: '',
    tags,
    read_time_min,
    quality_score: feedEntry.quality_score || 0.85,
    seo_keywords: [],
    meta_description_seo: metaDesc,
    url: ld,
    source_name: feedEntry.source_name || section,
    category: feedEntry.category,
    published_at: pubTime,
    written_at: feedEntry.written_at || new Date().toISOString(),
    hero_image,
    hero_source_url: null
  };
}

async function main() {
  // Forca re-escrita do CSS pra pegar novos estilos
  if (typeof engine.ensureArticleCss === 'function') {
    engine.ensureArticleCss();
  }

  const feed = JSON.parse(fs.readFileSync(FEED_JSON, 'utf8'));
  console.log(`[rerender] ${feed.articles.length} artigos\n`);

  // Primeira passada: parse e salva article.json + atualiza feed.json com hero_image
  const parsed = [];
  for (const entry of feed.articles) {
    const idx = path.join(FEED_DIR, entry.slug, 'index.html');
    if (!fs.existsSync(idx)) {
      console.log(`[skip] ${entry.slug} (sem index.html)`);
      continue;
    }
    const html = fs.readFileSync(idx, 'utf8');
    const article = parseArticleHtml(html, entry.slug, entry);
    parsed.push(article);

    // Salva article.json
    fs.writeFileSync(path.join(FEED_DIR, entry.slug, 'article.json'), JSON.stringify(article, null, 2));

    // Atualiza entry com hero_image
    entry.hero_image = article.hero_image;
    console.log(`[parse] ${entry.slug} · headline="${article.headline.substring(0, 60)}" · body=${article.body_html.length}c · hero=${article.hero_image || '-'}`);
  }

  // Salva feed.json atualizado
  feed.generated_at = new Date().toISOString();
  fs.writeFileSync(FEED_JSON, JSON.stringify(feed, null, 2));

  // Segunda passada: re-renderiza com novo template e related atualizado
  for (const article of parsed) {
    const related = engine.getRelatedArticles(article.slug, feed.articles, 3);
    const outHtml = engine.renderArticleHtml(article, related);
    fs.writeFileSync(path.join(FEED_DIR, article.slug, 'index.html'), outHtml);
    console.log(`[render] ${article.slug} · related=${related.length}`);
  }

  console.log(`\n[rerender] concluido · ${parsed.length} artigos`);
}

main().catch(e => { console.error(e); process.exit(1); });
