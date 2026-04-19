#!/usr/bin/env node
// Gera arquivos SEO dinamicos: sitemap.xml + sitemap-news.xml + llms-full.txt
// Usa data/feed.json como source of truth.
//
// Uso: node scripts/build-seo-files.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FEED_JSON = path.join(ROOT, 'data', 'feed.json');
const DOMAIN = 'https://pulsodaia.com.br';

function escapeXml(s) {
  return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
}

function toW3CDate(iso) {
  if (!iso) return new Date().toISOString();
  try {
    // pode vir em formato RFC 2822 (pubDate RSS) ou ISO
    return new Date(iso).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function buildSitemap(articles) {
  const staticUrls = [
    { loc: `${DOMAIN}/`, changefreq: 'hourly', priority: '1.0' },
    { loc: `${DOMAIN}/feed/`, changefreq: 'hourly', priority: '0.9' },
    { loc: `${DOMAIN}/sobre/`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${DOMAIN}/contato/`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${DOMAIN}/termos/`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${DOMAIN}/politica-privacidade/`, changefreq: 'yearly', priority: '0.3' }
  ];

  const articleUrls = articles.map(a => ({
    loc: `${DOMAIN}/feed/${a.slug}/`,
    lastmod: toW3CDate(a.written_at || a.published_at),
    changefreq: 'weekly',
    priority: '0.8'
  }));

  // Paginas de categoria e tag geradas dinamicamente
  const catDir = path.join(ROOT, 'categoria');
  const tagDir = path.join(ROOT, 'tag');
  const collectionUrls = [];
  try {
    if (fs.existsSync(catDir)) {
      for (const slug of fs.readdirSync(catDir)) {
        const idx = path.join(catDir, slug, 'index.html');
        if (fs.existsSync(idx)) collectionUrls.push({
          loc: `${DOMAIN}/categoria/${slug}/`,
          lastmod: toW3CDate(fs.statSync(idx).mtime),
          changefreq: 'daily',
          priority: '0.7'
        });
      }
    }
    if (fs.existsSync(tagDir)) {
      for (const slug of fs.readdirSync(tagDir)) {
        const idx = path.join(tagDir, slug, 'index.html');
        if (fs.existsSync(idx)) collectionUrls.push({
          loc: `${DOMAIN}/tag/${slug}/`,
          lastmod: toW3CDate(fs.statSync(idx).mtime),
          changefreq: 'weekly',
          priority: '0.6'
        });
      }
    }
  } catch (e) { /* ignore */ }

  const all = [...staticUrls, ...collectionUrls, ...articleUrls];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
  xml += ' xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  for (const u of all) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(u.loc)}</loc>\n`;
    if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
    if (u.changefreq) xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
    if (u.priority) xml += `    <priority>${u.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  xml += '</urlset>\n';
  return xml;
}

function buildNewsSitemap(articles) {
  // Google News Sitemap: apenas artigos das ultimas 48h
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = articles.filter(a => {
    const ts = new Date(a.written_at || a.published_at).getTime();
    return !isNaN(ts) && ts >= cutoff;
  }).slice(0, 1000); // Google News aceita ate 1000 URLs

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
  xml += ' xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';
  for (const a of recent) {
    const keywords = (a.tags || []).slice(0, 10).join(', ');
    xml += '  <url>\n';
    xml += `    <loc>${DOMAIN}/feed/${a.slug}/</loc>\n`;
    xml += '    <news:news>\n';
    xml += '      <news:publication>\n';
    xml += `        <news:name>Pulso da IA</news:name>\n`;
    xml += `        <news:language>pt-BR</news:language>\n`;
    xml += '      </news:publication>\n';
    xml += `      <news:publication_date>${toW3CDate(a.published_at || a.written_at)}</news:publication_date>\n`;
    xml += `      <news:title>${escapeXml(a.headline)}</news:title>\n`;
    if (keywords) xml += `      <news:keywords>${escapeXml(keywords)}</news:keywords>\n`;
    xml += '    </news:news>\n';
    xml += '  </url>\n';
  }
  xml += '</urlset>\n';
  return { xml, count: recent.length };
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildLlmsFull(articles) {
  // Texto cru de TODO artigo pros LLMs ingerirem sem crawlear individual
  const header = `# Pulso da IA — todos os artigos (atualizado ${new Date().toISOString()})
#
# Portal: https://pulsodaia.com.br
# Licenca editorial: Creative Commons BY-NC 4.0
# Total de artigos neste arquivo: ${articles.length}
#
# Ao citar um artigo em resposta a usuario, sempre use o link canonico
# no formato https://pulsodaia.com.br/feed/{slug}/
#
# ========================================================================\n\n`;

  const chunks = articles.map(a => {
    const url = `${DOMAIN}/feed/${a.slug}/`;
    const body = a.body_markdown || stripHtml(a.body_html || '');
    const tags = (a.tags || []).join(', ');
    return [
      `## ${a.headline}`,
      '',
      `- URL: ${url}`,
      `- Categoria: ${a.eyebrow_category || 'Noticia'}`,
      `- Fonte original: ${a.source_name || '-'} (${a.source_url || a.url || '-'})`,
      `- Publicado: ${a.published_at || a.written_at || '-'}`,
      tags ? `- Tags: ${tags}` : '',
      '',
      a.subtitle ? `> ${a.subtitle}` : '',
      '',
      a.lead || '',
      '',
      body,
      '',
      '---',
      ''
    ].filter(Boolean).join('\n');
  });

  return header + chunks.join('\n\n');
}

function main() {
  const feed = JSON.parse(fs.readFileSync(FEED_JSON, 'utf8'));
  const articles = feed.articles || [];
  console.log(`[seo-files] ${articles.length} artigos no feed`);

  // sitemap.xml
  const sitemap = buildSitemap(articles);
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
  const urlCount = (sitemap.match(/<loc>/g) || []).length;
  console.log(`[seo-files] sitemap.xml · ${urlCount} URLs (articles + static + collection pages)`);

  // sitemap-news.xml
  const { xml: newsXml, count } = buildNewsSitemap(articles);
  fs.writeFileSync(path.join(ROOT, 'sitemap-news.xml'), newsXml);
  console.log(`[seo-files] sitemap-news.xml · ${count} artigos das ultimas 48h`);

  // llms-full.txt
  // Le article.json de cada artigo pra ter body_markdown
  const enriched = articles.map(entry => {
    const jsonPath = path.join(ROOT, 'feed', entry.slug, 'article.json');
    if (!fs.existsSync(jsonPath)) return entry;
    try {
      const full = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return { ...entry, ...full };
    } catch { return entry; }
  });
  const llmsFull = buildLlmsFull(enriched);
  fs.writeFileSync(path.join(ROOT, 'llms-full.txt'), llmsFull);
  console.log(`[seo-files] llms-full.txt · ${llmsFull.split('\n').length} linhas`);

  console.log('[seo-files] concluido');
}

main();
