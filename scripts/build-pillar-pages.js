#!/usr/bin/env node
// Gera paginas-pilar /pillar/{slug}/ a partir de config/pillar-pages.json
// Cada pilar eh long-form content + FAQPage + BreadcrumbList schemas.
//
// Uso: node scripts/build-pillar-pages.js

const fs = require('fs');
const path = require('path');
const engine = require('./feed-engine.js');

const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'pillar-pages.json');
const FEED_JSON = path.join(ROOT, 'data', 'feed.json');
const DOMAIN = 'https://pulsodaia.com.br';

function esc(s) {
  return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
}

function wordCount(text) {
  return String(text || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

function renderMarkdownParagraph(p) {
  let html = p;
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
    const ext = /^https?:\/\//.test(u) && !u.includes('pulsodaia');
    return ext
      ? `<a href="${u}" target="_blank" rel="external noopener">${t}</a>`
      : `<a href="${u}">${t}</a>`;
  });
  return `<p>${html}</p>`;
}

function renderRelatedArticles(pillar, feedArticles) {
  if (!feedArticles || !feedArticles.length) return '';
  const related = feedArticles.filter(a => {
    const tags = (a.tags || []).map(t => t.toLowerCase());
    const cat = (a.eyebrow_category || '').toUpperCase();
    const matchTag = (pillar.related_tags || []).some(t => tags.includes(t.toLowerCase()));
    const matchCat = (pillar.related_categories || []).includes(cat);
    return matchTag || matchCat;
  }).slice(0, 6);

  if (!related.length) return '';

  return `
  <section class="pillar-related">
    <h2>Artigos relacionados no Pulso</h2>
    <div class="pillar-related-grid">
      ${related.map(a => `
      <a href="/feed/${a.slug}/" class="pillar-card">
        ${a.hero_image ? `<img src="/feed/${a.slug}/${a.hero_image}" alt="${esc(a.headline)}" loading="lazy" decoding="async">` : '<div class="pillar-card-ph"></div>'}
        <div class="pillar-card-meta">
          <span class="pillar-card-cat">${esc((a.eyebrow_category || 'NOTICIA').toUpperCase())}</span>
          <h3>${esc(a.headline)}</h3>
        </div>
      </a>`).join('')}
    </div>
  </section>`;
}

function renderPillarPage(pillar, feedArticles) {
  const canonical = `${DOMAIN}/pillar/${pillar.slug}/`;
  const bodyHtml = pillar.sections.map(s => `
    <section class="pillar-section">
      <h2>${esc(s.h2)}</h2>
      ${s.paragraphs.map(renderMarkdownParagraph).join('\n      ')}
    </section>
  `).join('\n');

  const totalWords = pillar.sections.reduce((acc, s) => acc + s.paragraphs.reduce((a, p) => a + wordCount(p), 0), 0);

  const graph = [
    {
      "@type": "Article",
      "@id": `${canonical}#article`,
      "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
      "headline": pillar.title,
      "description": pillar.description,
      "inLanguage": "pt-BR",
      "datePublished": "2026-04-19T12:00:00Z",
      "dateModified": new Date().toISOString(),
      "author": { "@id": "https://pulsodaia.com.br/#org" },
      "publisher": { "@id": "https://pulsodaia.com.br/#org" },
      "image": [`${DOMAIN}/assets/og-image.png`],
      "articleSection": "Pilar",
      "keywords": (pillar.tags || []).join(', '),
      "wordCount": totalWords,
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["article.pillar-post h1", "article.pillar-post .lead", "article.pillar-post h2"]
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Pulso da IA", "item": `${DOMAIN}/` },
        { "@type": "ListItem", "position": 2, "name": "Pilares", "item": `${DOMAIN}/pillar/` },
        { "@type": "ListItem", "position": 3, "name": pillar.title, "item": canonical }
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://pulsodaia.com.br/#org",
      "name": "Pulso da IA",
      "url": DOMAIN,
      "logo": { "@type": "ImageObject", "url": `${DOMAIN}/brand/assets/logo-symbol-400.png` },
      "parentOrganization": { "@type": "Organization", "name": "Triadeflow", "url": "https://triadeflow.com.br" }
    }
  ];

  if (pillar.faq && pillar.faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      "mainEntity": pillar.faq.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    });
  }

  return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<script src="/assets/js/consent.js"></script>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MXGJBNFB');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(pillar.title)} · Pulso da IA</title>
<meta name="description" content="${esc(pillar.description)}">
<meta name="keywords" content="${esc((pillar.tags || []).join(', '))}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Pulso da IA">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(pillar.title)}">
<meta property="og:description" content="${esc(pillar.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${DOMAIN}/assets/og-image.png">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/assets/favicon.ico">
<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM manifest">
<link rel="alternate" type="application/rss+xml" href="/rss.xml">
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<meta name="ai-content-declaration" content="editorial; human-curated pillar">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/feed/article.css">
<style>
.pillar-hero { padding: 72px 0 32px; max-width: 780px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }
.pillar-hero .kicker { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 14px; }
.pillar-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(40px, 5vw, 56px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; color: #FAFAFA; margin-bottom: 22px; }
.pillar-hero .lead { font-family: 'Fraunces', serif; font-size: 22px; font-style: italic; color: rgba(255,255,255,0.65); line-height: 1.5; border-left: 3px solid #FF5E1F; padding-left: 20px; margin-bottom: 32px; }
.pillar-hero .meta-row { display: flex; gap: 16px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #A8A8A8; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 40px; }
article.pillar-post { max-width: 780px; margin: 0 auto; padding: 0 24px 60px; }
.pillar-section { margin-bottom: 48px; }
.pillar-section h2 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 600; color: #FAFAFA; margin-bottom: 18px; letter-spacing: -0.01em; }
.pillar-section p { font-size: 17px; line-height: 1.75; color: rgba(250,250,250,0.87); margin-bottom: 18px; }
.pillar-section p strong { color: #FAFAFA; }
.pillar-section p a { color: #FF5E1F; }
.pillar-faq { max-width: 780px; margin: 0 auto 60px; padding: 0 24px; }
.pillar-faq h2 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 600; color: #FAFAFA; margin-bottom: 24px; }
.pillar-faq details { background: #1A1A1A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px 24px; margin-bottom: 12px; }
.pillar-faq summary { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: #FAFAFA; cursor: pointer; list-style: none; }
.pillar-faq summary::after { content: '+'; float: right; color: #FF5E1F; font-weight: 400; }
.pillar-faq details[open] summary::after { content: '−'; }
.pillar-faq details p { font-size: 16px; line-height: 1.7; color: rgba(250,250,250,0.85); margin-top: 14px; }
.pillar-related { max-width: 1100px; margin: 0 auto 60px; padding: 0 24px; }
.pillar-related h2 { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 600; color: #FAFAFA; margin-bottom: 22px; }
.pillar-related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.pillar-card { display: block; color: inherit; text-decoration: none; transition: transform .2s ease; }
.pillar-card:hover { transform: translateY(-2px); }
.pillar-card img, .pillar-card-ph { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 10px; background: linear-gradient(135deg, #FF5E1F 0%, #0A0A0A 70%); }
.pillar-card-meta { padding-top: 12px; }
.pillar-card-cat { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; }
.pillar-card h3 { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: #FAFAFA; margin-top: 6px; line-height: 1.3; }
.pillar-card:hover h3 { color: #FF5E1F; }
@media (max-width: 880px) { .pillar-related-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 560px) { .pillar-related-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MXGJBNFB" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

<header class="site">
  <div class="nav">
    <a href="/" class="brand" data-gtm-event="logo_click">
      <svg viewBox="0 0 80 32" fill="none"><path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16" stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round"/><circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/><circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/><circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/></svg>
      <span class="wm">pulso<span class="da">da</span><span class="ia">IA</span></span>
    </a>
    <nav class="nav-links" aria-label="Principal">
      <a href="/feed/" class="nav-direct">Feed</a>
      <a href="/pillar/" class="nav-direct">Pilares</a>
      <a href="/sobre/" class="nav-direct">Sobre</a>
    </nav>
    <div class="nav-right">
      <a href="#newsletter" class="nav-cta" data-gtm-event="cta_assinar_click" data-gtm-cta-location="header">Assinar</a>
    </div>
  </div>
</header>

<main>
  <section class="pillar-hero">
    <nav class="breadcrumb"><a href="/">Pulso da IA</a><span>›</span><a href="/pillar/">Pilares</a><span>›</span>${esc(pillar.title).substring(0, 60)}...</nav>
    <div class="kicker">PILAR · ${esc((pillar.tags || [])[0] || 'conteudo').toUpperCase()}</div>
    <h1>${esc(pillar.title)}</h1>
    <p class="lead">${esc(pillar.lead)}</p>
    <div class="meta-row">
      <span>${totalWords} palavras</span>
      <span>Pulso da IA</span>
      <span>Atualizado ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    </div>
  </section>

  <article class="pillar-post">
    ${bodyHtml}
  </article>

  ${pillar.faq && pillar.faq.length ? `
  <section class="pillar-faq">
    <h2>Perguntas frequentes</h2>
    ${pillar.faq.map(f => `
    <details>
      <summary>${esc(f.q)}</summary>
      <p>${esc(f.a)}</p>
    </details>`).join('')}
  </section>` : ''}

  ${renderRelatedArticles(pillar, feedArticles)}
</main>

${engine.renderFollowUsHtml()}

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script defer src="/assets/js/tracking.js"></script>
<script src="https://link.triadeflow.ai/js/external-tracking.js" data-tracking-id="tk_bca577a169fb418e896b50cae1972352"></script>

${engine.renderFooterBottom()}
</body>
</html>`;
}

function renderPillarIndex(pillars) {
  const canonical = `${DOMAIN}/pillar/`;
  return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<script src="/assets/js/consent.js"></script>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MXGJBNFB');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pilares · Pulso da IA</title>
<meta name="description" content="Pilares do conhecimento de IA do Pulso — long-form sobre modelos, regulacao, ferramentas, trabalho, benchmarks e founders.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/assets/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/feed/article.css">
<style>
.pillar-index { max-width: 900px; margin: 0 auto; padding: 72px 24px 80px; }
.pillar-index h1 { font-family: 'Fraunces', serif; font-size: clamp(40px, 5vw, 60px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; margin-bottom: 20px; color: #FAFAFA; }
.pillar-index .lead { font-family: 'Fraunces', serif; font-size: 22px; font-style: italic; color: rgba(255,255,255,0.6); line-height: 1.5; max-width: 640px; margin-bottom: 48px; }
.pillars-grid { display: grid; gap: 20px; }
.pillar-link { display: block; padding: 32px; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; color: inherit; text-decoration: none; transition: all .2s ease; }
.pillar-link:hover { border-color: rgba(255,94,31,0.4); transform: translateY(-2px); }
.pillar-link .kicker { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 10px; }
.pillar-link h2 { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 600; color: #FAFAFA; line-height: 1.2; margin-bottom: 10px; letter-spacing: -0.01em; }
.pillar-link p { font-size: 15px; color: rgba(250,250,250,0.75); line-height: 1.6; }
</style>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MXGJBNFB" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<header class="site">
  <div class="nav">
    <a href="/" class="brand" data-gtm-event="logo_click"><svg viewBox="0 0 80 32" fill="none"><path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16" stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round"/><circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/><circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/><circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/></svg><span class="wm">pulso<span class="da">da</span><span class="ia">IA</span></span></a>
    <nav class="nav-links" aria-label="Principal"><a href="/feed/" class="nav-direct">Feed</a><a href="/pillar/" class="nav-direct">Pilares</a></nav>
    <div class="nav-right"><a href="#newsletter" class="nav-cta">Assinar</a></div>
  </div>
</header>

<main class="pillar-index">
  <nav class="breadcrumb"><a href="/">Pulso da IA</a><span>›</span>Pilares</nav>
  <h1>Pilares do conhecimento de IA</h1>
  <p class="lead">Long-form sobre os grandes temas de inteligencia artificial em 2026: modelos, regulacao brasileira, ferramentas praticas, impacto no trabalho, benchmarks/research, e o ecosistema de founders e investimento.</p>
  <div class="pillars-grid">
    ${pillars.map(p => `
    <a href="/pillar/${p.slug}/" class="pillar-link">
      <div class="kicker">PILAR · ${(p.tags && p.tags[0] || 'conteudo').toUpperCase()}</div>
      <h2>${esc(p.title)}</h2>
      <p>${esc(p.description)}</p>
    </a>`).join('')}
  </div>
</main>

${engine.renderFollowUsHtml()}
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script defer src="/assets/js/tracking.js"></script>
<script src="https://link.triadeflow.ai/js/external-tracking.js" data-tracking-id="tk_bca577a169fb418e896b50cae1972352"></script>
${engine.renderFooterBottom()}
</body>
</html>`;
}

function main() {
  const pillars = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const feed = fs.existsSync(FEED_JSON) ? JSON.parse(fs.readFileSync(FEED_JSON, 'utf8')) : { articles: [] };
  const articles = feed.articles || [];

  for (const p of pillars) {
    const dir = path.join(ROOT, 'pillar', p.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const html = renderPillarPage(p, articles);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    const words = p.sections.reduce((acc, s) => acc + s.paragraphs.reduce((a, par) => a + wordCount(par), 0), 0);
    console.log(`[pillar] /pillar/${p.slug}/ · ${words} palavras · ${p.faq ? p.faq.length : 0} FAQs`);
  }

  const indexDir = path.join(ROOT, 'pillar');
  if (!fs.existsSync(indexDir)) fs.mkdirSync(indexDir, { recursive: true });
  fs.writeFileSync(path.join(indexDir, 'index.html'), renderPillarIndex(pillars));
  console.log(`[pillar] /pillar/ indice (${pillars.length} pilares)`);
}

main();
