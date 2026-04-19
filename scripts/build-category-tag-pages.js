#!/usr/bin/env node
// Gera paginas de categoria (/categoria/{slug}/) e tag (/tag/{slug}/)
// agrupando artigos relacionados. Cada pagina vira CollectionPage no Schema.
//
// Uso: node scripts/build-category-tag-pages.js

const fs = require('fs');
const path = require('path');
const engine = require('./feed-engine.js');

const ROOT = path.join(__dirname, '..');
const FEED_JSON = path.join(ROOT, 'data', 'feed.json');
const DOMAIN = 'https://pulsodaia.com.br';

const CATEGORY_LABELS = {
  LANCAMENTO: 'Lancamentos',
  ANALISE: 'Analises',
  RESEARCH: 'Research',
  MERCADO: 'Mercado',
  FOUNDERS: 'Founders',
  NOTICIA: 'Noticias'
};

const CATEGORY_DESCRIPTIONS = {
  LANCAMENTO: 'Todos os lancamentos de produtos, modelos e features novas de IA cobertos pelo Pulso.',
  ANALISE: 'Analises aprofundadas de tendencias, estrategias e impactos do mercado de IA.',
  RESEARCH: 'Papers academicos e breakthroughs cientificos em inteligencia artificial.',
  MERCADO: 'Movimentos financeiros, rodadas de investimento, aquisicoes e tendencias de mercado em IA.',
  FOUNDERS: 'Bastidores, decisoes e trajetoria de fundadores e personalidades do ecosistema de IA.',
  NOTICIA: 'Coberturas gerais do ecosistema de inteligencia artificial.'
};

function slugify(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function esc(s) {
  return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/\./g, '');
  } catch { return ''; }
}

function renderArticleCard(a) {
  const hero = a.hero_image
    ? `<img src="/feed/${a.slug}/${a.hero_image}" alt="${esc(a.headline)}" loading="lazy" decoding="async">`
    : `<div class="card-placeholder"><span>${esc((a.eyebrow_category || 'PULSO').toUpperCase())}</span></div>`;
  return `
    <a href="/feed/${a.slug}/" class="cat-card" data-gtm-event="category_article_click" data-gtm-to-slug="${a.slug}">
      <div class="cat-card-image">${hero}<span class="cat-card-pill">${esc((a.eyebrow_category || 'NOTICIA').toUpperCase())}</span></div>
      <div class="cat-card-meta">
        <h3>${esc(a.headline)}</h3>
        <div class="cat-card-byline">Pulso da IA · ${formatDate(a.published_at || a.written_at)}</div>
      </div>
    </a>`;
}

function renderCollectionPage({ kind, slug, label, description, articles }) {
  const path = kind === 'categoria' ? `/categoria/${slug}/` : `/tag/${slug}/`;
  const breadcrumbLabel = kind === 'categoria' ? 'Categoria' : 'Tag';
  const canonical = `${DOMAIN}${path}`;
  const metaDesc = description || `Artigos do Pulso da IA sobre ${label}. ${articles.length} publicacoes.`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#collection`,
        "url": canonical,
        "name": `${label} · Pulso da IA`,
        "description": metaDesc,
        "inLanguage": "pt-BR",
        "isPartOf": { "@id": "https://pulsodaia.com.br/#org" },
        "hasPart": articles.slice(0, 20).map(a => ({
          "@type": "NewsArticle",
          "@id": `${DOMAIN}/feed/${a.slug}/#article`,
          "url": `${DOMAIN}/feed/${a.slug}/`,
          "headline": a.headline,
          "datePublished": a.published_at
        }))
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Pulso da IA", "item": `${DOMAIN}/` },
          { "@type": "ListItem", "position": 2, "name": breadcrumbLabel, "item": `${DOMAIN}/feed/` },
          { "@type": "ListItem", "position": 3, "name": label, "item": canonical }
        ]
      },
      {
        "@type": "Organization",
        "@id": "https://pulsodaia.com.br/#org",
        "name": "Pulso da IA",
        "url": "https://pulsodaia.com.br",
        "logo": "https://pulsodaia.com.br/brand/assets/logo-symbol-400.png"
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<!-- Consent Mode v2 (DEVE rodar antes do GTM) -->
<script src="/assets/js/consent.js"></script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MXGJBNFB');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(label)} · Pulso da IA</title>
<meta name="description" content="${esc(metaDesc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Pulso da IA">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(label)} · Pulso da IA">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://pulsodaia.com.br/assets/og-image.png">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/assets/favicon.ico">
<link rel="alternate" type="application/rss+xml" title="Pulso da IA · RSS" href="/rss.xml">
<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM manifest">
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<meta name="ai-content-declaration" content="editorial; auto-translated from linked sources">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/feed/article.css">
<style>
.cat-hero { padding: 72px 0 32px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; max-width: 1100px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }
.cat-hero .kicker { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 14px; }
.cat-hero h1 { font-family: 'Fraunces', Georgia, serif; font-size: clamp(40px, 6vw, 64px); font-weight: 600; letter-spacing: -0.03em; line-height: 1.05; color: #FAFAFA; margin-bottom: 18px; }
.cat-hero h1 .italic { font-style: italic; color: #FF5E1F; }
.cat-hero .desc { font-family: 'Fraunces', serif; font-size: 20px; font-style: italic; color: rgba(255,255,255,0.6); line-height: 1.45; max-width: 720px; margin-bottom: 16px; }
.cat-hero .count { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.45); letter-spacing: 0.1em; text-transform: uppercase; }
.cat-grid-wrap { max-width: 1100px; margin: 48px auto; padding: 0 24px 80px; }
.cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.cat-card { display: block; color: inherit; text-decoration: none; transition: transform .2s ease; }
.cat-card:hover { transform: translateY(-3px); text-decoration: none; }
.cat-card-image { aspect-ratio: 16/9; overflow: hidden; border-radius: 10px; background: #1A1A1A; margin-bottom: 14px; position: relative; }
.cat-card-image img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }
.cat-card:hover .cat-card-image img { transform: scale(1.04); }
.card-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #FF5E1F 0%, #0A0A0A 70%); display: flex; align-items: center; justify-content: center; }
.card-placeholder span { font-family: 'JetBrains Mono', monospace; color: rgba(255,255,255,0.8); font-size: 11px; letter-spacing: 0.2em; }
.cat-card-pill { position: absolute; top: 12px; left: 12px; font-family: 'JetBrains Mono', monospace; font-size: 10px; padding: 5px 10px; background: rgba(10,10,10,0.78); backdrop-filter: blur(8px); color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; border-radius: 4px; border: 1px solid rgba(255,94,31,0.3); }
.cat-card h3 { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; margin: 0 0 8px; color: #FAFAFA; transition: color .2s ease; }
.cat-card:hover h3 { color: #FF5E1F; }
.cat-card-byline { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #A8A8A8; letter-spacing: 0.05em; text-transform: uppercase; }
@media (max-width: 960px) { .cat-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .cat-grid { grid-template-columns: 1fr; } }
.cat-empty { text-align: center; padding: 48px 24px; color: rgba(255,255,255,0.5); font-family: 'Fraunces', serif; font-size: 20px; font-style: italic; }
</style>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MXGJBNFB" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

<header class="site">
  <div class="nav">
    <a href="/" class="brand" data-gtm-event="logo_click">
      <svg viewBox="0 0 80 32" fill="none"><path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16" stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round"/><circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/><circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/><circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/></svg>
      <span class="wm">pulso<span class="da">da</span><span class="ia">IA</span></span>
    </a>
    <nav class="nav-links" aria-label="Principal">
      <a href="/feed/" class="nav-direct">Feed</a>
      <a href="/feed/?c=lancamento" class="nav-direct">Lancamentos</a>
      <a href="/feed/?c=analise" class="nav-direct">Analises</a>
    </nav>
    <div class="nav-right">
      <a href="#newsletter" class="nav-cta" data-gtm-event="cta_assinar_click" data-gtm-cta-location="header">Assinar</a>
      <div class="nav-lang" aria-label="Idioma">PT-BR</div>
    </div>
  </div>
</header>

<section class="cat-hero">
  <nav class="breadcrumb"><a href="/">Pulso da IA</a><span>›</span><a href="/feed/">${breadcrumbLabel}</a><span>›</span>${esc(label)}</nav>
  <div class="kicker">${kind === 'categoria' ? 'CATEGORIA' : 'TAG'}</div>
  <h1>${esc(label)}</h1>
  <p class="desc">${esc(description)}</p>
  <div class="count">${articles.length} artigo${articles.length !== 1 ? 's' : ''} publicado${articles.length !== 1 ? 's' : ''}</div>
</section>

<section class="cat-grid-wrap">
  ${articles.length === 0 ? '<div class="cat-empty">Nenhum artigo ainda. Motor pulsante trabalha sem parar — em breve aparece.</div>' : `
  <div class="cat-grid">
    ${articles.map(renderArticleCard).join('')}
  </div>`}
</section>

${engine.renderFollowUsHtml()}

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script defer src="/assets/js/tracking.js"></script>
<!-- GHL External Tracking -->
<script src="https://link.triadeflow.ai/js/external-tracking.js" data-tracking-id="tk_bca577a169fb418e896b50cae1972352"></script>

${engine.renderFooterBottom()}
</body>
</html>`;
}

function main() {
  const feed = JSON.parse(fs.readFileSync(FEED_JSON, 'utf8'));
  const articles = feed.articles || [];

  // Agrupa por categoria
  const byCat = {};
  const byTag = {};
  for (const a of articles) {
    const cat = (a.eyebrow_category || 'NOTICIA').toUpperCase();
    (byCat[cat] = byCat[cat] || []).push(a);
    for (const tag of (a.tags || [])) {
      const slug = slugify(tag);
      if (!slug) continue;
      (byTag[slug] = byTag[slug] || { label: tag, articles: [] }).articles.push(a);
    }
  }

  // Gera paginas de categoria
  let catCount = 0;
  for (const [cat, arts] of Object.entries(byCat)) {
    const slug = slugify(cat);
    const label = CATEGORY_LABELS[cat] || cat;
    const desc = CATEGORY_DESCRIPTIONS[cat] || `Artigos do Pulso da IA na categoria ${label}.`;
    const dir = path.join(ROOT, 'categoria', slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const html = renderCollectionPage({ kind: 'categoria', slug, label, description: desc, articles: arts });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    console.log(`[cat] /categoria/${slug}/ · ${arts.length} artigo(s)`);
    catCount++;
  }

  // Gera paginas de tag (minimo 2 artigos pra evitar lixo)
  let tagCount = 0;
  for (const [slug, { label, articles: arts }] of Object.entries(byTag)) {
    if (arts.length < 2) continue; // skip tags com 1 so artigo
    const desc = `Artigos do Pulso da IA com a tag ${label}. ${arts.length} publicacoes.`;
    const dir = path.join(ROOT, 'tag', slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const html = renderCollectionPage({ kind: 'tag', slug, label, description: desc, articles: arts });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    tagCount++;
  }
  console.log(`[tags] ${tagCount} paginas de tag geradas`);

  console.log(`[cat+tag] total: ${catCount} categorias + ${tagCount} tags`);
}

main();
