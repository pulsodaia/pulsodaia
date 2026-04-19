#!/usr/bin/env node
// Gera paginas de autor /autores/{slug}/ com Person/Organization schema.
// E-E-A-T signals: experience, expertise, authoritativeness, trustworthiness.
//
// Uso: node scripts/build-author-pages.js

const fs = require('fs');
const path = require('path');
const engine = require('./feed-engine.js');

const ROOT = path.join(__dirname, '..');
const DOMAIN = 'https://pulsodaia.com.br';

const AUTHORS = [
  {
    slug: 'pulso-da-ia',
    type: 'Organization',
    name: 'Pulso da IA',
    alternateName: 'Pulsodaia',
    description: 'Entidade editorial do portal Pulso da IA. Traduz em tempo real fontes oficiais de inteligencia artificial (OpenAI, Google DeepMind, Anthropic, Meta, HuggingFace, Mistral, ArXiv) em portugues brasileiro.',
    role: 'Editor-chefe coletivo',
    bio: [
      'O Pulso da IA eh uma entidade editorial coletiva que opera o portal pulsodaia.com.br. Nao assina individualmente: representa a linha editorial, o padrao de traducao e curadoria do portal.',
      'Opera com motor pulsante (autopilot) que coleta fontes oficiais a cada 2 horas, reescreve em portugues brasileiro com tom Bloomberg/Axios (direto, analitico, sem hype) e publica com backlink sempre para a fonte original.',
      'Quando um artigo eh assinado por um autor humano especifico (ex: Alex Campos), a byline aparece explicita. Sem byline individual = linha editorial coletiva.'
    ],
    expertise: [
      'Traducao tecnica PT-BR de anuncios de IA',
      'Curadoria editorial de releases OpenAI/Anthropic/Google/Meta',
      'Cobertura de funding rounds e moves de mercado em IA',
      'Benchmarks e research summaries'
    ],
    credentials: [
      'Operado pela Triadeflow (consultoria B2B de implantacao de IA)',
      'Fundado em 17 de abril de 2026',
      'Licenca Creative Commons BY-NC 4.0',
      'Politica editorial publica em /sobre/'
    ],
    sameAs: [
      'https://instagram.com/pulsodaia',
      'https://x.com/pulsodaia',
      'https://www.youtube.com/@pulsodaia',
      'https://www.tiktok.com/@pulsodaia',
      'https://www.pinterest.com/pulsodaia/',
      'https://github.com/pulsodaia'
    ]
  },
  {
    slug: 'alex-campos',
    type: 'Person',
    name: 'Alex Campos',
    alternateName: 'alexcamposcrm',
    description: 'Founder da Triadeflow, consultoria especializada em implantacao de processo comercial B2B com inteligencia artificial. Editor responsavel do Pulso da IA.',
    role: 'Editor responsavel',
    jobTitle: 'Founder, Triadeflow',
    bio: [
      'Alex Campos eh founder da Triadeflow, consultoria B2B especializada em implantacao de processo comercial com IA. Opera 30+ projetos em producao usando IA real (nao demonstracao).',
      'Na Triadeflow, conduz implantacao de agentes de IA em WhatsApp, CRM HUB (GoHighLevel), content marketing automatizado, rastreamento server-side e arquiteturas editoriais como o Pulso da IA.',
      'No Pulso da IA, assume o papel de editor responsavel: supervisiona linha editorial, curadoria de fontes, decisoes de arquitetura do portal e integracoes tecnicas. Artigos com byline individual "Alex Campos" sao assinados pessoalmente.'
    ],
    expertise: [
      'Implantacao de IA em processo comercial B2B',
      'Arquitetura de agentes de IA (WhatsApp, CRM, voz)',
      'Content engine automatizado (editorial + SEO)',
      'Integracao GoHighLevel / LeadConnector',
      'Rastreamento server-side e analytics (GA4, GTM)'
    ],
    credentials: [
      'Founder da Triadeflow (triadeflow.com.br)',
      '30+ projetos de IA em producao',
      'Experiencia em Laquila, Camarmo, Talentus Digital, Sushi da Hora e outros'
    ],
    sameAs: [
      'https://instagram.com/alexcamposcrm',
      'https://triadeflow.com.br',
      'https://instagram.com/triadeflow'
    ],
    contactPoint: {
      email: 'contato@triadeflow.com.br',
      phone: '+5519983805908'
    }
  }
];

function esc(s) {
  return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
}

function renderAuthorPage(a) {
  const canonical = `${DOMAIN}/autores/${a.slug}/`;

  const personSchema = a.type === 'Person' ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${canonical}#person`,
    "name": a.name,
    "alternateName": a.alternateName,
    "url": canonical,
    "description": a.description,
    "jobTitle": a.jobTitle,
    "worksFor": { "@type": "Organization", "name": "Triadeflow", "url": "https://triadeflow.com.br" },
    "knowsAbout": a.expertise,
    "sameAs": a.sameAs,
    "mainEntityOfPage": { "@type": "ProfilePage", "@id": canonical }
  } : {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${canonical}#org`,
    "name": a.name,
    "alternateName": a.alternateName,
    "url": canonical,
    "description": a.description,
    "knowsAbout": a.expertise,
    "sameAs": a.sameAs,
    "parentOrganization": { "@type": "Organization", "name": "Triadeflow", "url": "https://triadeflow.com.br" }
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Pulso da IA", "item": DOMAIN + "/" },
      { "@type": "ListItem", "position": 2, "name": "Autores", "item": DOMAIN + "/autores/" },
      { "@type": "ListItem", "position": 3, "name": a.name, "item": canonical }
    ]
  };

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
<title>${esc(a.name)} · Pulso da IA</title>
<meta name="description" content="${esc(a.description).substring(0, 160)}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="Pulso da IA">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(a.name)}">
<meta property="og:description" content="${esc(a.description).substring(0, 160)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${DOMAIN}/assets/og-image.png">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/assets/favicon.ico">
<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM manifest">
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<meta name="ai-content-declaration" content="editorial">
<script type="application/ld+json">${JSON.stringify(personSchema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/feed/article.css">
<style>
.author-hero { padding: 72px 0 32px; max-width: 780px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }
.author-hero .kicker { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 14px; }
.author-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(40px, 5vw, 60px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; margin-bottom: 10px; color: #FAFAFA; }
.author-hero .role { font-family: 'Fraunces', serif; font-size: 22px; font-style: italic; color: rgba(255,255,255,0.6); margin-bottom: 24px; }
.author-hero .desc { font-size: 17px; color: rgba(250,250,250,0.85); line-height: 1.7; margin-bottom: 32px; }
.author-body { max-width: 780px; margin: 0 auto 80px; padding: 0 24px; }
.author-section { margin-bottom: 40px; }
.author-section h2 { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 600; color: #FAFAFA; margin-bottom: 14px; }
.author-section p { font-size: 17px; line-height: 1.7; color: rgba(250,250,250,0.85); margin-bottom: 14px; }
.author-section ul { padding-left: 20px; }
.author-section li { font-size: 16px; line-height: 1.6; color: rgba(250,250,250,0.85); margin-bottom: 8px; }
.author-links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
.author-links a { display: inline-flex; align-items: center; padding: 8px 16px; background: rgba(255,94,31,0.08); border: 1px solid rgba(255,94,31,0.25); border-radius: 999px; color: #FF5E1F; font-size: 13px; font-weight: 500; text-decoration: none; }
.author-links a:hover { background: rgba(255,94,31,0.15); }
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
      <a href="/sobre/" class="nav-direct">Sobre</a>
    </nav>
    <div class="nav-right">
      <a href="#newsletter" class="nav-cta" data-gtm-event="cta_assinar_click" data-gtm-cta-location="header">Assinar</a>
      <div class="nav-lang" aria-label="Idioma">PT-BR</div>
    </div>
  </div>
</header>

<main class="author-hero">
  <nav class="breadcrumb"><a href="/">Pulso da IA</a><span>›</span><a href="/autores/">Autores</a><span>›</span>${esc(a.name)}</nav>
  <div class="kicker">${a.type === 'Person' ? 'AUTOR' : 'EDITORIAL'}</div>
  <h1>${esc(a.name)}</h1>
  <p class="role">${esc(a.role)}</p>
  <p class="desc">${esc(a.description)}</p>
</main>

<article class="author-body">
  <div class="author-section">
    <h2>Bio</h2>
    ${a.bio.map(p => `<p>${esc(p)}</p>`).join('')}
  </div>

  <div class="author-section">
    <h2>Expertise</h2>
    <ul>
      ${a.expertise.map(e => `<li>${esc(e)}</li>`).join('')}
    </ul>
  </div>

  <div class="author-section">
    <h2>Credenciais</h2>
    <ul>
      ${a.credentials.map(c => `<li>${esc(c)}</li>`).join('')}
    </ul>
  </div>

  ${a.sameAs && a.sameAs.length ? `
  <div class="author-section">
    <h2>Presenca digital</h2>
    <div class="author-links">
      ${a.sameAs.map(url => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`).join('')}
    </div>
  </div>` : ''}

  ${a.contactPoint ? `
  <div class="author-section">
    <h2>Contato</h2>
    <div class="author-links">
      <a href="mailto:${esc(a.contactPoint.email)}">${esc(a.contactPoint.email)}</a>
      ${a.contactPoint.phone ? `<a href="https://wa.me/${a.contactPoint.phone.replace(/\D/g, '')}" target="_blank" rel="noopener">WhatsApp ${esc(a.contactPoint.phone)}</a>` : ''}
    </div>
  </div>` : ''}
</article>

${engine.renderFollowUsHtml()}

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script defer src="/assets/js/tracking.js"></script>
<script src="https://link.triadeflow.ai/js/external-tracking.js" data-tracking-id="tk_bca577a169fb418e896b50cae1972352"></script>

${engine.renderFooterBottom()}
</body>
</html>`;
}

function main() {
  // Cria /autores/{slug}/ para cada autor
  for (const a of AUTHORS) {
    const dir = path.join(ROOT, 'autores', a.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const html = renderAuthorPage(a);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    console.log(`[autores] /autores/${a.slug}/ · ${a.type}: ${a.name}`);
  }

  // Cria indice /autores/index.html listando todos
  const indexHtml = `<!DOCTYPE html>
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
<title>Autores · Pulso da IA</title>
<meta name="description" content="Lista de autores e responsaveis editoriais do Pulso da IA.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${DOMAIN}/autores/">
<link rel="icon" href="/assets/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/feed/article.css">
<style>
.authors-index { max-width: 780px; margin: 0 auto; padding: 72px 24px 80px; }
.authors-index h1 { font-family: 'Fraunces', serif; font-size: clamp(40px, 5vw, 60px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; margin-bottom: 32px; color: #FAFAFA; }
.authors-list { display: grid; gap: 24px; }
.author-card { display: block; padding: 28px; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: inherit; text-decoration: none; transition: border-color .2s ease; }
.author-card:hover { border-color: rgba(255,94,31,0.4); }
.author-card .kicker { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 8px; }
.author-card h2 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 6px; color: #FAFAFA; }
.author-card .role { font-family: 'Fraunces', serif; font-size: 16px; font-style: italic; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
.author-card .desc { font-size: 15px; color: rgba(250,250,250,0.8); line-height: 1.6; }
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
      <a href="/sobre/" class="nav-direct">Sobre</a>
    </nav>
    <div class="nav-right">
      <a href="#newsletter" class="nav-cta" data-gtm-event="cta_assinar_click" data-gtm-cta-location="header">Assinar</a>
    </div>
  </div>
</header>

<main class="authors-index">
  <nav class="breadcrumb"><a href="/">Pulso da IA</a><span>›</span>Autores</nav>
  <h1>Autores</h1>
  <div class="authors-list">
    ${AUTHORS.map(a => `
    <a href="/autores/${a.slug}/" class="author-card">
      <div class="kicker">${a.type === 'Person' ? 'AUTOR' : 'EDITORIAL'}</div>
      <h2>${esc(a.name)}</h2>
      <p class="role">${esc(a.role)}</p>
      <p class="desc">${esc(a.description).substring(0, 180)}${a.description.length > 180 ? '...' : ''}</p>
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

  const indexDir = path.join(ROOT, 'autores');
  if (!fs.existsSync(indexDir)) fs.mkdirSync(indexDir, { recursive: true });
  fs.writeFileSync(path.join(indexDir, 'index.html'), indexHtml);
  console.log(`[autores] /autores/ indice (${AUTHORS.length} autores)`);
}

main();
