#!/usr/bin/env node
// Motor Pulso da IA: coleta RSS -> Gemini escreve -> publica em /feed/{slug}/
//
// Uso:
//   GOOGLE_API_KEY=xxx node scripts/feed-engine.js            # coleta + escreve + salva em queue
//   GOOGLE_API_KEY=xxx node scripts/feed-engine.js --publish  # tambem publica (sem review)
//   node scripts/feed-engine.js --list                         # lista queue pendente

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_API_KEY;
const ROOT = path.join(__dirname, '..');
const SOURCES = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'feed-sources.json'), 'utf8'));
const FEED_DIR = path.join(ROOT, 'feed');
const DATA_DIR = path.join(ROOT, 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'feed-queue.json');
const STATE_FILE = path.join(DATA_DIR, 'feed-state.json');
const FEED_JSON = path.join(DATA_DIR, 'feed.json');

if (!fs.existsSync(FEED_DIR)) fs.mkdirSync(FEED_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ================ UTILS ==================

function slugify(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 PulsoDaIA/1.0 (+https://pulsodaia.com.br)',
        ...opts.headers
      }
    }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpGet(res.headers.location, opts).then(resolve).catch(reject);
      }
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    }).on('error', reject);
  });
}

function httpPostJson(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ================ STATE ==================

function loadState() {
  if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  return { seen: {} };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ================ OG IMAGE EXTRACTOR ==================

async function extractOgImage(url) {
  try {
    const res = await httpGet(url);
    if (res.status !== 200) return null;
    const html = res.body;

    // Tenta og:image, twitter:image, link rel image_src
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i,
      /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i
    ];

    for (const p of patterns) {
      const m = html.match(p);
      if (m && m[1]) {
        let imgUrl = m[1].trim();
        if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
        if (imgUrl.startsWith('/')) {
          const base = new URL(url);
          imgUrl = base.origin + imgUrl;
        }
        if (imgUrl.startsWith('http')) return imgUrl;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function downloadImage(imgUrl, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const u = new URL(imgUrl);
    const mod = u.protocol === 'http:' ? require('http') : require('https');
    mod.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'Mozilla/5.0 PulsoDaIA/1.0 (+https://pulsodaia.com.br)' }
    }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { reject(new Error(`DL HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

// ================ RSS PARSER ==================

function parseRss(xml, source) {
  const items = [];
  // Tenta RSS 2.0 primeiro, depois Atom
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

  for (const itemXml of itemMatches.slice(0, SOURCES.config.max_items_per_source_per_run)) {
    const title = extractTag(itemXml, 'title') || '';
    const link = extractTag(itemXml, 'link', 'href') || extractTag(itemXml, 'link') || '';
    const desc = extractTag(itemXml, 'description') || extractTag(itemXml, 'summary') || extractTag(itemXml, 'content') || '';
    const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'published') || extractTag(itemXml, 'updated') || new Date().toISOString();
    const guid = extractTag(itemXml, 'guid') || extractTag(itemXml, 'id') || link;

    if (!title || !guid) continue;

    items.push({
      id: guid,
      title: cleanText(title),
      url: link,
      summary: cleanText(desc).substring(0, 1000),
      published_at: pubDate,
      source_id: source.id,
      source_name: source.name,
      category: source.category,
      source_type: source.type
    });
  }
  return items;
}

function extractTag(xml, tag, attr) {
  if (attr) {
    const m = xml.match(new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["']`, 'i'));
    return m ? m[1] : null;
  }
  // Tenta CDATA
  let m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'));
  if (m) return m[1];
  m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1] : null;
}

function markdownToHtml(md) {
  if (!md) return '';
  let html = md;
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Links [text](url) - adiciona rel+target pra externos
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, url) => {
    const isExternal = /^https?:\/\//.test(url) && !url.includes('pulsodaia');
    return isExternal
      ? `<a href="${url}" target="_blank" rel="external noopener">${text}</a>`
      : `<a href="${url}">${text}</a>`;
  });
  // Code inline
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');
  // Listas
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  // Paragrafos (quebra dupla = <p>)
  html = html.split(/\n\n+/).map(chunk => {
    chunk = chunk.trim();
    if (!chunk) return '';
    if (/^<(h[1-6]|ul|ol|blockquote|pre|p)/.test(chunk)) return chunk;
    return `<p>${chunk.replace(/\n/g, ' ')}</p>`;
  }).join('\n\n');
  return html;
}

function cleanText(s) {
  return (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ================ COLLECTOR ==================

async function collectAll() {
  const state = loadState();
  const collected = [];

  for (const source of SOURCES.rss_sources) {
    if (!source.rss) continue;
    try {
      console.log(`[collect] ${source.id}...`);
      const res = await httpGet(source.rss);
      if (res.status !== 200) { console.log(`  HTTP ${res.status}, skip`); continue; }
      const items = parseRss(res.body, source);
      let novos = 0;
      for (const item of items) {
        if (state.seen[item.id]) continue;
        collected.push(item);
        state.seen[item.id] = { date: new Date().toISOString(), title: item.title };
        novos++;
      }
      console.log(`  ${items.length} itens · ${novos} novos`);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`  ERR: ${e.message}`);
    }
  }

  saveState(state);
  return collected;
}

// ================ WRITER (GEMINI) ==================

async function writeArticle(item, retries = 2) {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY nao definida');

  const prompt = `Voce e editor-chefe do Pulso da IA (pulsodaia.com.br), portal brasileiro de noticias sobre IA. Tom Bloomberg/Axios: direto, analitico, sem cliche.

FONTE ORIGINAL:
- Titulo: ${item.title}
- Fonte: ${item.source_name}
- URL: ${item.url}
- Resumo: ${(item.summary || '').substring(0, 800)}
- Data: ${item.published_at}

ESCREVA uma materia editorial baseada nessa fonte.

REGRAS INVIOLAVEIS (falhar aqui = rejeicao automatica):

1. ZERO TRAVESSAO. Proibido usar "—" (em-dash, U+2014) em NENHUM lugar do texto. Use virgula, ponto, parenteses ou "e". Exemplo: ao inves de "skills — codigo, contratos, dados — economizam tempo", escreva "skills economizam tempo (codigo, contratos, dados)".

2. ZERO CLICHE. Proibido: "revolucionario", "transformar", "futuro da IA", "em tempo real" (isso e generico), "superpoderes", "game-changer", "nao eh so X, eh Y", "na era da IA", "sinergia", "ecossistema", "jornada".

3. LINKS PRA FONTE. No body_html, inclua pelo menos 2 links <a href="URL" target="_blank" rel="external noopener">texto</a> apontando pra fonte oficial (${item.url}) ou outras fontes relacionadas mencionadas. Backlinks de qualidade sao essenciais pra SEO.

4. NAO INVENTE. Proibido inventar numeros, datas, nomes ou fatos que nao estao no resumo da fonte. Se a fonte e pobre, escreva menos. Nunca minta.

5. PT-BR brasileiro. Use "voce" (nao "tu"). Evite regionalismos. Traducao tecnica de termos (ex: "prompt" pode ficar em EN, mas "training" vira "treinamento").

FORMATO DE SAIDA (use DELIMITADORES DE SECAO, nao JSON):

===HEADLINE===
Titulo jornalistico PT-BR
===SUBTITLE===
1 frase com contexto brasileiro
===CATEGORY===
LANCAMENTO
===LEAD===
Paragrafo lead de 2-3 linhas
===BODY===
## O que aconteceu

Paragrafo com [link pra fonte](${item.url}) com contexto.

## Por que importa

Paragrafo sobre impacto no mercado brasileiro.

## O que esperar

Paragrafo com previsoes e proximos passos. Inclua [outro link](${item.url}) aqui.
===TAGS===
tag1, tag2, tag3
===READ_TIME===
3
===SCORE===
0.85
===KEYWORDS===
keyword 1, keyword 2, keyword 3
===META===
Descricao SEO de 155 caracteres pra Google
===END===

REGRAS:
- CATEGORY: uma entre LANCAMENTO, ANALISE, RESEARCH, MERCADO, FOUNDERS
- BODY: markdown puro, minimo 350 palavras, maximo 700
- BODY: 3 secoes obrigatorias (## O que aconteceu, ## Por que importa, ## O que esperar)
- BODY: inclua pelo menos 2 links [texto](${item.url})
- NUNCA travessao ou em-dash
- TAGS: 3 tags separadas por virgula, lowercase
- SCORE: 0 a 1

Responda APENAS com o formato acima. Sem comentarios extras.`;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
      const response = await httpPostJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 3000
          }
        }
      );

      if (response.status === 503 || response.status === 429) {
        lastErr = new Error(`Gemini ${response.status} (rate limit), tentativa ${attempt + 1}/${retries + 1}`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
          continue;
        }
        throw lastErr;
      }

      if (response.status !== 200) throw new Error(`Gemini HTTP ${response.status}: ${JSON.stringify(response.body).substring(0, 300)}`);

      const text = response.body.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Sem texto na resposta Gemini');

      // Parse formato ===SECTION===
      const sections = {};
      const sectionRegex = /===([A-Z_]+)===\s*\n([\s\S]*?)(?=\n===[A-Z_]+===|$)/g;
      let m;
      while ((m = sectionRegex.exec(text)) !== null) {
        sections[m[1].toLowerCase()] = m[2].trim();
      }

      if (!sections.headline) throw new Error(`parse falhou · sem HEADLINE · raw: ${text.substring(0, 300)}`);

      // Sanitizacao anti-travessao em TUDO
      Object.keys(sections).forEach(k => {
        sections[k] = sections[k].replace(/—/g, ',').replace(/–/g, '-');
      });

      const article = {
        headline: sections.headline,
        subtitle: sections.subtitle || '',
        eyebrow_category: (sections.category || 'NOTICIA').toUpperCase(),
        lead: sections.lead || '',
        body_markdown: sections.body || '',
        body_html: markdownToHtml(sections.body || ''),
        tags: (sections.tags || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
        read_time_min: parseInt(sections.read_time || '3'),
        quality_score: parseFloat(sections.score || '0.75'),
        seo_keywords: (sections.keywords || '').split(',').map(s => s.trim()).filter(Boolean),
        meta_description_seo: sections.meta || ''
      };

      return {
        ...item,
        ...article,
        written_at: new Date().toISOString(),
        slug: slugify(article.headline)
      };
    } catch (e) {
      lastErr = e;
      if (attempt < retries && e.message.includes('503')) {
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

// ================ PUBLISHER ==================

function formatShortDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/\./g, '');
  } catch { return ''; }
}

function getRelatedArticles(currentSlug, feedArticles, limit = 3) {
  if (!Array.isArray(feedArticles)) return [];
  return feedArticles
    .filter(a => a.slug !== currentSlug)
    .sort((a, b) => new Date(b.written_at || b.published_at) - new Date(a.written_at || a.published_at))
    .slice(0, limit);
}

function renderRelatedHtml(related) {
  if (!related || related.length === 0) return '';
  return `
    <section class="related-section">
      <div class="related-eyebrow">CONTINUE LENDO</div>
      <div class="related-grid">
        ${related.map(r => `
        <a href="/feed/${r.slug}/" class="related-card">
          <div class="related-image">
            ${r.hero_image
              ? `<img src="/feed/${r.slug}/${r.hero_image}" alt="${(r.headline || '').replace(/"/g, '&quot;')}" loading="lazy">`
              : `<div class="related-placeholder"><span>${(r.eyebrow_category || 'PULSO').toUpperCase()}</span></div>`}
          </div>
          <div class="related-meta">
            <span class="related-cat">${(r.eyebrow_category || 'NOTICIA').toUpperCase()}</span>
            <h4>${r.headline || ''}</h4>
            <div class="related-byline">Por Pulso da IA · ${formatShortDate(r.published_at || r.written_at)}</div>
          </div>
        </a>`).join('')}
      </div>
    </section>`;
}

function renderFollowUsHtml() {
  return `
    <section class="follow-us">
      <div class="container follow-inner">
        <div class="follow-title">
          <div class="follow-eyebrow">SIGA O PULSO</div>
          <h3>Siga a gente por onde quiser.</h3>
        </div>
        <div class="social-links">
          <a href="https://instagram.com/pulsodaia" target="_blank" rel="noopener" aria-label="Instagram">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
            <span>Instagram</span>
          </a>
          <a href="https://x.com/pulsodaia" target="_blank" rel="noopener" aria-label="X">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>X</span>
          </a>
          <a href="https://www.youtube.com/@pulsodaia" target="_blank" rel="noopener" aria-label="YouTube">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z"/></svg>
            <span>YouTube</span>
          </a>
          <a href="https://www.tiktok.com/@pulsodaia" target="_blank" rel="noopener" aria-label="TikTok">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>
            <span>TikTok</span>
          </a>
          <a href="https://www.pinterest.com/pulsodaia/" target="_blank" rel="noopener" aria-label="Pinterest">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/></svg>
            <span>Pinterest</span>
          </a>
        </div>
        <div class="subscribe-banner">
          <span>Newsletter semanal. Toda quinta, 9h. Em portugues.</span>
          <a href="/#newsletter">Assinar pulso semanal →</a>
        </div>
      </div>
    </section>`;
}

function renderArticleHtml(article, related) {
  const pubDate = new Date(article.published_at);
  const readableDate = pubDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/\./g, '');
  const metaDesc = (article.meta_description_seo || article.subtitle || '').replace(/"/g, '&quot;').substring(0, 160);
  const keywords = (article.seo_keywords || article.tags || []).join(', ');
  const sourceDomain = (() => { try { return new URL(article.url).hostname.replace('www.', ''); } catch { return article.source_name; } })();

  return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${article.headline} · Pulso da IA</title>
<meta name="description" content="${metaDesc}">
<meta name="keywords" content="${keywords}">
<meta name="author" content="Pulso da IA">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Pulso da IA">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${article.headline.replace(/"/g, '&quot;')}">
<meta property="og:description" content="${metaDesc}">
<meta property="og:url" content="https://pulsodaia.com.br/feed/${article.slug}/">
<meta property="og:image" content="https://pulsodaia.com.br/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="article:published_time" content="${article.published_at}">
<meta property="article:author" content="Pulso da IA">
<meta property="article:section" content="${article.source_name}">
${(article.tags || []).map(t => `<meta property="article:tag" content="${t}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@pulsodaia">
<meta name="twitter:title" content="${article.headline.replace(/"/g, '&quot;')}">
<meta name="twitter:description" content="${metaDesc}">
<meta name="twitter:image" content="https://pulsodaia.com.br/assets/og-image.png">
<link rel="canonical" href="https://pulsodaia.com.br/feed/${article.slug}/">
<link rel="icon" href="/assets/favicon.ico">
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": article.headline,
  "description": article.subtitle,
  "datePublished": article.published_at,
  "dateModified": article.written_at,
  "author": { "@type": "Organization", "name": "Pulso da IA", "url": "https://pulsodaia.com.br" },
  "publisher": {
    "@type": "Organization",
    "name": "Pulso da IA",
    "logo": { "@type": "ImageObject", "url": "https://pulsodaia.com.br/brand/assets/logo-symbol-400.png" }
  },
  "image": ["https://pulsodaia.com.br/assets/og-image.png"],
  "articleSection": article.source_name,
  "isBasedOn": article.url,
  "citation": [{ "@type": "CreativeWork", "name": article.source_name, "url": article.url }]
}, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/feed/article.css">
</head>
<body>

<header class="site">
  <div class="nav">
    <a href="/" class="brand">
      <svg viewBox="0 0 80 32" fill="none"><path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16" stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round"/><circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/><circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/><circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/></svg>
      <span class="wm">pulso<span class="da">da</span><span class="ia">IA</span></span>
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/feed/">Feed</a>
      <a href="/feed/?c=lancamento">Lancamentos</a>
      <a href="/feed/?c=analise">Analises</a>
      <a href="/#newsletter">Pulso Semanal</a>
    </div>
  </div>
</header>

<div class="container">
  <nav class="breadcrumb"><a href="/">Pulso da IA</a><span>›</span><a href="/feed/">Feed</a><span>›</span>${article.source_name}</nav>

  <div class="eyebrow">
    <span>${article.eyebrow_category || 'NOTICIA'}</span>
    <span class="dot">·</span>
    <span>${article.source_name.toUpperCase()}</span>
    <span class="dot">·</span>
    <span>${readableDate}</span>
  </div>

  <h1>${article.headline}</h1>
  <p class="subtitle">${article.subtitle}</p>

  <div class="byline">
    <span class="by">Por Pulso da IA</span>
    <span class="sep">·</span>
    <span>${readableDate.toLowerCase()}</span>
    <span class="sep">·</span>
    <span>${article.read_time_min || 3} min de leitura</span>
  </div>

  <div class="hero-image">
    ${article.hero_image
      ? `<img src="${article.hero_image}" alt="${article.headline.replace(/"/g, '&quot;')}" loading="eager">`
      : `<div class="hero-placeholder"><div class="label">${article.source_name.toUpperCase()}<strong>${article.eyebrow_category}</strong></div></div>`
    }
    <div class="caption">
      Imagem: <a href="${article.url}" target="_blank" rel="external noopener">${sourceDomain}</a>
    </div>
  </div>

  <article class="post">
    <p class="lead">${article.lead}</p>
    ${article.body_html}

    <div class="source-box">
      <div class="label">FONTE OFICIAL</div>
      <div class="title">${article.source_name}</div>
      <div class="meta">${readableDate} · ${sourceDomain}</div>
      <a href="${article.url}" target="_blank" rel="noopener external" class="link">
        Leia o original
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
      </a>
    </div>

    <div class="tags">
      ${(article.tags || []).map(t => `<a href="/tag/${slugify(t)}/" class="tag">#${t}</a>`).join('')}
    </div>

    <!-- FORM NEWSLETTER INLINE (em todas as paginas) -->
    <div class="inline-newsletter" x-data="{ name: '', email: '', submitted: false, submitting: false }">
      <div class="inline-newsletter-grid">
        <div>
          <div class="eyebrow-mini">PULSO SEMANAL</div>
          <h3>Recebe no inbox <span class="italic">toda quinta.</span></h3>
          <p>Top 5 da semana de IA em portugues, em 3 minutos de leitura. Zero spam.</p>
        </div>
        <form @submit.prevent="submitting=true; fetch('https://services.leadconnectorhq.com/hooks/REPLACE_WITH_GHL_WEBHOOK_ID/webhook-trigger/newsletter-skills', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, email, source:'article:${article.slug}', tags:['newsletter-ia-semanal','fonte-pagina','skill']})}).finally(()=>{submitted=true;submitting=false;})" x-show="!submitted">
          <input x-model="name" type="text" placeholder="Seu nome" required>
          <input x-model="email" type="email" placeholder="seu@email.com" required>
          <button type="submit" :disabled="submitting">
            <span x-show="!submitting">Inscrever</span>
            <span x-show="submitting">...</span>
          </button>
        </form>
        <div x-show="submitted" class="success">
          <strong>Inscrito.</strong> Proxima quinta, 9h, chega no teu inbox.
        </div>
      </div>
    </div>

    <div class="article-footer-nav">
      <a href="/feed/" class="back-link">← Ver todo o feed</a>
      <div class="share">
        <span>Compartilhar:</span>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.headline)}&url=https://pulsodaia.com.br/feed/${article.slug}/" target="_blank" rel="noopener">X</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://pulsodaia.com.br/feed/${article.slug}/" target="_blank" rel="noopener">LinkedIn</a>
        <a href="https://wa.me/?text=${encodeURIComponent(article.headline + ' https://pulsodaia.com.br/feed/' + article.slug + '/')}" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </div>
  </article>
${renderRelatedHtml(related)}
</div>

${renderFollowUsHtml()}

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

<footer class="site">
  <div class="container">pulsodaia.com.br · Sinta o pulso do mercado de IA · Feito por Alex Campos @ Triadeflow</div>
</footer>
</body>
</html>`;
}

async function publishArticle(article) {
  const dir = path.join(FEED_DIR, article.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Baixa imagem oficial da fonte (og:image)
  try {
    const ogUrl = await extractOgImage(article.url);
    if (ogUrl) {
      const ext = (ogUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) || [])[1] || 'jpg';
      const imgPath = path.join(dir, `hero.${ext.toLowerCase()}`);
      await downloadImage(ogUrl, imgPath);
      article.hero_image = `hero.${ext.toLowerCase()}`;
      article.hero_source_url = ogUrl;
      console.log(`  [img] og:image salva (${(fs.statSync(imgPath).size/1024).toFixed(0)}KB)`);
    } else {
      console.log(`  [img] sem og:image, usando placeholder`);
    }
  } catch (e) {
    console.log(`  [img] falhou: ${e.message}`);
  }

  // Salva article.json pra permitir re-renders sem reprocessar Gemini
  fs.writeFileSync(path.join(dir, 'article.json'), JSON.stringify(article, null, 2));

  // Atualiza feed.json ANTES de renderizar (pra related pegar este artigo se for re-publish)
  let feed = { generated_at: new Date().toISOString(), articles: [] };
  if (fs.existsSync(FEED_JSON)) {
    try { feed = JSON.parse(fs.readFileSync(FEED_JSON, 'utf8')); } catch {}
  }
  feed.articles = feed.articles.filter(a => a.slug !== article.slug);
  feed.articles.unshift({
    slug: article.slug,
    headline: article.headline,
    subtitle: article.subtitle,
    eyebrow_category: article.eyebrow_category,
    source_name: article.source_name,
    source_url: article.url,
    category: article.category,
    tags: article.tags,
    read_time_min: article.read_time_min,
    published_at: article.published_at,
    written_at: article.written_at,
    quality_score: article.quality_score,
    hero_image: article.hero_image || null
  });
  feed.articles.sort((a, b) => new Date(b.written_at) - new Date(a.written_at));
  feed.generated_at = new Date().toISOString();
  fs.writeFileSync(FEED_JSON, JSON.stringify(feed, null, 2));

  const related = getRelatedArticles(article.slug, feed.articles, 3);
  fs.writeFileSync(path.join(dir, 'index.html'), renderArticleHtml(article, related));

  return dir;
}

// ================ CSS SHARED ==================

function ensureArticleCss() {
  const cssPath = path.join(FEED_DIR, 'article.css');
  // Sempre reescreve pra refletir evolucoes do template
  fs.writeFileSync(cssPath, `* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-font-smoothing: antialiased; }
body { background: #0A0A0A; color: #FAFAFA; font-family: 'Inter', sans-serif; font-size: 17px; line-height: 1.7; }
a { color: #FF5E1F; text-decoration: none; }
a:hover { text-decoration: underline; text-underline-offset: 3px; }
.container { max-width: 720px; margin: 0 auto; padding: 0 24px; }
header.site { padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; background: rgba(10,10,10,0.9); backdrop-filter: blur(12px); z-index: 50; }
header.site .nav { max-width: 1100px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; }
header.site .brand { display: flex; align-items: center; gap: 10px; color: #FAFAFA; }
header.site .brand svg { width: 50px; height: 20px; }
header.site .brand .wm { font-size: 16px; font-weight: 400; letter-spacing: -0.01em; }
header.site .brand .wm .da { font-style: italic; color: rgba(255,255,255,0.5); }
header.site .brand .wm .ia { font-weight: 600; }
header.site .nav-links { display: flex; gap: 20px; font-size: 13px; }
header.site .nav-links a { color: #A8A8A8; }
header.site .nav-links a:hover { color: #FAFAFA; text-decoration: none; }
.breadcrumb { padding: 32px 0 16px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5C5C5C; text-transform: uppercase; letter-spacing: 0.1em; }
.breadcrumb a { color: #A8A8A8; }
.breadcrumb span { color: #FF5E1F; margin: 0 8px; }
.eyebrow { display: inline-flex; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 24px; }
.eyebrow .dot { color: rgba(255,94,31,0.4); }
h1 { font-family: 'Fraunces', Georgia, serif; font-size: clamp(36px, 5.5vw, 52px); font-weight: 600; line-height: 1.05; letter-spacing: -0.02em; margin-bottom: 20px; color: #FAFAFA; }
.subtitle { font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: 400; font-style: italic; line-height: 1.4; color: rgba(255,255,255,0.6); margin-bottom: 32px; }
.byline { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 14px; color: #A8A8A8; margin-bottom: 40px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.02em; }
.byline .by { color: #FAFAFA; font-weight: 500; }
.byline .sep { color: #5C5C5C; }
article.post { padding-bottom: 60px; }
.post p { margin-bottom: 20px; color: rgba(250,250,250,0.85); }
.post p.lead { font-size: 20px; line-height: 1.6; color: #FAFAFA; font-weight: 400; margin-bottom: 32px; border-left: 3px solid #FF5E1F; padding-left: 20px; }
.post h2 { font-family: 'Fraunces', Georgia, serif; font-size: 28px; font-weight: 600; letter-spacing: -0.01em; margin: 40px 0 16px; color: #FAFAFA; }
.post h2 .italic { font-style: italic; color: #FF5E1F; }
.post ul { margin-bottom: 20px; padding-left: 20px; color: rgba(250,250,250,0.85); }
.post li { margin-bottom: 8px; }
.post strong { color: #FAFAFA; font-weight: 600; }
.post a { color: #FF5E1F; font-weight: 500; }
.post code { font-family: 'JetBrains Mono', monospace; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; color: #FF5E1F; }
.post blockquote { margin: 32px 0; padding: 24px 28px; background: rgba(255,94,31,0.05); border-left: 4px solid #FF5E1F; border-radius: 0 8px 8px 0; }
.post blockquote p { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-style: italic; line-height: 1.5; color: #FAFAFA; margin: 0 0 12px; }
.post blockquote cite { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #A8A8A8; font-style: normal; text-transform: uppercase; letter-spacing: 0.1em; }
.source-box { margin: 48px 0 32px; padding: 24px 28px; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; }
.source-box .label { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 8px; }
.source-box .title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 500; color: #FAFAFA; margin-bottom: 4px; }
.source-box .meta { font-size: 13px; color: #A8A8A8; margin-bottom: 12px; }
.source-box .link { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: #FF5E1F; font-weight: 500; }
.tags { margin: 32px 0; display: flex; flex-wrap: wrap; gap: 8px; }
.tag { font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 6px 10px; background: rgba(255,94,31,0.08); color: #FF5E1F; border-radius: 4px; letter-spacing: 0.05em; }
.tag:hover { background: rgba(255,94,31,0.15); text-decoration: none; }
.hero-image { margin: 0 -24px 40px; position: relative; }
.hero-image img { width: 100%; display: block; border-radius: 4px; aspect-ratio: 16/9; object-fit: cover; background: #1A1A1A; }
.hero-image .hero-placeholder { width: 100%; aspect-ratio: 16/9; background: linear-gradient(135deg, #FF5E1F 0%, #0A0A0A 60%); border-radius: 4px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.hero-image .hero-placeholder::before { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 100'%3E%3Cpath d='M0 50 L60 50 L80 10 L110 90 L140 30 L170 70 L200 45 L230 55 L260 50 L400 50' stroke='rgba(255,255,255,0.15)' stroke-width='2' fill='none'/%3E%3C/svg%3E"); background-size: 400px 100px; background-repeat: repeat-x; background-position: center; opacity: 0.4; }
.hero-image .hero-placeholder .label { position: relative; z-index: 2; font-family: 'JetBrains Mono', monospace; color: rgba(255,255,255,0.85); font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; text-align: center; line-height: 1.6; }
.hero-image .hero-placeholder .label strong { display: block; font-size: 22px; margin-top: 6px; letter-spacing: -0.02em; font-family: 'Fraunces', serif; font-style: italic; font-weight: 600; text-transform: none; }
.hero-image .caption { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5C5C5C; padding: 10px 24px 0; text-transform: uppercase; letter-spacing: 0.08em; }
.hero-image .caption a { color: #A8A8A8; }

.inline-newsletter { margin: 60px 0 40px; padding: 32px; background: #1A1A1A; border: 1px solid rgba(255,94,31,0.15); border-radius: 16px; }
.inline-newsletter .eyebrow-mini { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 8px; }
.inline-newsletter h3 { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 600; margin-bottom: 8px; line-height: 1.2; }
.inline-newsletter h3 .italic { font-style: italic; color: #FF5E1F; }
.inline-newsletter p { font-size: 14px; color: rgba(250,250,250,0.6); margin: 0; }
.inline-newsletter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; }
.inline-newsletter form { display: flex; flex-direction: column; gap: 8px; }
.inline-newsletter input { padding: 10px 14px; background: #0A0A0A; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #FAFAFA; font-family: 'Inter', sans-serif; font-size: 14px; }
.inline-newsletter input:focus { outline: none; border-color: #FF5E1F; }
.inline-newsletter button { padding: 10px 14px; background: #FF5E1F; color: white; border: 0; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; font-family: 'Inter', sans-serif; }
.inline-newsletter button:hover { background: #E5501A; }
.inline-newsletter .success { padding: 16px; background: rgba(46,204,113,0.08); border: 1px solid rgba(46,204,113,0.2); border-radius: 8px; font-size: 14px; color: #FAFAFA; }
.inline-newsletter .success strong { color: #2ECC71; }
@media (max-width: 640px) { .inline-newsletter-grid { grid-template-columns: 1fr; } }

.article-footer-nav { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.back-link { color: #A8A8A8; }
.back-link:hover { color: #FF5E1F; }
.share { display: flex; align-items: center; gap: 16px; color: #5C5C5C; font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
.share a { color: #A8A8A8; }
.share a:hover { color: #FF5E1F; }

footer.site { border-top: 1px solid rgba(255,255,255,0.06); padding: 40px 0; margin-top: 0; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5C5C5C; text-align: center; }

/* ================= RELATED CARDS (estrutura blog.google) ================= */
.related-section { margin: 80px 0 0; padding: 48px 0 0; border-top: 1px solid rgba(255,255,255,0.08); }
.related-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 24px; }
.related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.related-card { display: block; background: transparent; border-radius: 12px; overflow: hidden; transition: transform .2s ease; text-decoration: none; color: inherit; }
.related-card:hover { transform: translateY(-2px); text-decoration: none; }
.related-card:hover h4 { color: #FF5E1F; }
.related-image { aspect-ratio: 16/9; overflow: hidden; border-radius: 8px; background: #1A1A1A; margin-bottom: 14px; position: relative; }
.related-image img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }
.related-card:hover .related-image img { transform: scale(1.03); }
.related-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #FF5E1F 0%, #0A0A0A 70%); display: flex; align-items: center; justify-content: center; }
.related-placeholder span { font-family: 'JetBrains Mono', monospace; color: rgba(255,255,255,0.8); font-size: 11px; letter-spacing: 0.2em; }
.related-meta { padding: 0 4px; }
.related-cat { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 8px; }
.related-card h4 { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; margin: 0 0 10px; color: #FAFAFA; transition: color .2s ease; }
.related-byline { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #A8A8A8; letter-spacing: 0.05em; }
@media (max-width: 880px) { .related-grid { grid-template-columns: 1fr 1fr; } .related-grid .related-card:nth-child(3) { grid-column: 1 / -1; } }
@media (max-width: 560px) { .related-grid { grid-template-columns: 1fr; } .related-grid .related-card:nth-child(3) { grid-column: auto; } }

/* ================= FOLLOW US (estrutura blog.google) ================= */
.follow-us { background: #0E0E0E; border-top: 1px solid rgba(255,255,255,0.08); padding: 72px 0 64px; margin-top: 80px; }
.follow-inner { max-width: 1100px; }
.follow-title { text-align: center; margin-bottom: 36px; }
.follow-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 10px; }
.follow-us h3 { font-family: 'Fraunces', Georgia, serif; font-size: clamp(28px, 3.2vw, 40px); font-weight: 600; letter-spacing: -0.02em; color: #FAFAFA; margin: 0; }
.social-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-bottom: 40px; }
.social-links a { display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; color: #FAFAFA; font-size: 13px; font-weight: 500; text-decoration: none; transition: all .2s ease; }
.social-links a:hover { background: rgba(255,94,31,0.12); border-color: rgba(255,94,31,0.4); color: #FF5E1F; text-decoration: none; }
.social-links svg { flex-shrink: 0; }
.subscribe-banner { max-width: 720px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 24px 32px; background: linear-gradient(90deg, rgba(255,94,31,0.08) 0%, rgba(255,94,31,0.02) 100%); border: 1px solid rgba(255,94,31,0.25); border-radius: 16px; }
.subscribe-banner span { font-size: 15px; color: #FAFAFA; font-weight: 500; }
.subscribe-banner a { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; white-space: nowrap; }
.subscribe-banner a:hover { text-decoration: underline; text-underline-offset: 4px; }
@media (max-width: 640px) {
  .follow-us { padding: 56px 0 48px; margin-top: 60px; }
  .social-links a { padding: 10px 16px; font-size: 12px; }
  .subscribe-banner { flex-direction: column; align-items: flex-start; padding: 20px; }
}
`);
  console.log('[css] article.css atualizado');
}

// ================ MAIN ==================

async function main() {
  const args = process.argv.slice(2);
  const publishAuto = args.includes('--publish');
  const listOnly = args.includes('--list');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '5');

  ensureArticleCss();

  if (listOnly) {
    const feed = fs.existsSync(FEED_JSON) ? JSON.parse(fs.readFileSync(FEED_JSON, 'utf8')) : { articles: [] };
    console.log(`[feed] ${feed.articles.length} artigos publicados:`);
    feed.articles.slice(0, 20).forEach(a => console.log(`  ${a.slug} · ${a.source_name} · ${a.headline}`));
    return;
  }

  console.log('[feed-engine] iniciando\n');

  // 1. Coletar novos itens
  const items = await collectAll();
  console.log(`\n[collect] ${items.length} itens novos no total`);

  if (items.length === 0) {
    console.log('Nada novo. Use --list pra ver o que ja esta publicado.');
    return;
  }

  // 2. Escrever + publicar (limitado)
  const toWrite = items.slice(0, limit);
  console.log(`\n[write] processando ${toWrite.length} de ${items.length} (limit=${limit})\n`);

  let published = 0;
  for (const item of toWrite) {
    try {
      console.log(`[write] ${item.title.substring(0, 80)}...`);
      const article = await writeArticle(item);
      console.log(`  headline: ${article.headline}`);
      console.log(`  score: ${article.quality_score}`);

      if (publishAuto || (article.quality_score || 0) >= (SOURCES.config.auto_publish_if_score_above || 0.85)) {
        await publishArticle(article);
        console.log(`  ✓ PUBLICADO · /feed/${article.slug}/`);
        published++;
      } else {
        // Salva em queue pra review manual
        const queueDir = path.dirname(QUEUE_FILE);
        if (!fs.existsSync(queueDir)) fs.mkdirSync(queueDir, { recursive: true });
        let queue = [];
        if (fs.existsSync(QUEUE_FILE)) try { queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch {}
        queue.push(article);
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
        console.log(`  ⏸  em queue (score baixo · review manual)`);
      }
      await new Promise(r => setTimeout(r, 6000));
    } catch (e) {
      console.log(`  ✗ ERR: ${e.message}`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  console.log(`\n[feed-engine] concluido · ${published} publicados`);
}

// Exporta helpers pra outros scripts (rerender-existing.js etc)
module.exports = {
  renderArticleHtml,
  renderRelatedHtml,
  renderFollowUsHtml,
  getRelatedArticles,
  formatShortDate,
  ensureArticleCss,
  publishArticle,
  markdownToHtml,
  slugify
};

// So executa main() quando rodado direto via node scripts/feed-engine.js
if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
