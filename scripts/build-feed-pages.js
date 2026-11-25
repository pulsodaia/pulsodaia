#!/usr/bin/env node
// Gera HTML estatico com links de artigo (antes /feed/ e a home montavam tudo no navegador via fetch,
// entao o HTML nao tinha nenhum link de artigo e os 1.399 ficavam orfaos para o Google):
//   - /feed/            : 48 mais recentes + paginacao numerada completa
//   - /feed/page/N/     : paginas 2..N, todas com link para todas as paginas (profundidade maxima 2 cliques)
//   - home (index.html) : bloco "Ultimas do Pulso" com 12 links
// Os pontos de injecao sao os marcadores <!--SSR:nome--> ... <!--/SSR:nome--> dos dois arquivos.
// Uso: node scripts/build-feed-pages.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGE_SIZE = 48;
const HOME_COUNT = 12;
const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'feed.json'), 'utf8')).articles
  .sort((a, b) => new Date(b.written_at || b.published_at) - new Date(a.written_at || a.published_at));

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = iso => { try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/\./g, ''); } catch { return ''; } };
const inject = (html, name, content) => {
  const re = new RegExp(`(<!--SSR:${name}-->)[\\s\\S]*?(<!--/SSR:${name}-->)`);
  if (!re.test(html)) throw new Error(`marcador SSR:${name} ausente`);
  return html.replace(re, (_, a, b) => a + content + b);
};

function featured(a) {
  const img = a.hero_image ? `<img src="/feed/${a.slug}/${a.hero_image}" alt="${esc(a.headline)}" loading="eager">` : `<div class="featured-placeholder"><span>${esc((a.eyebrow_category || 'PULSO').toUpperCase())}</span></div>`;
  return `<a href="/feed/${a.slug}/" class="featured-card"><div class="featured-image"><div class="featured-tag">DESTAQUE</div>${img}</div><div class="featured-meta"><div class="cat">${esc((a.eyebrow_category || 'NOTICIA').toUpperCase())} · ${esc((a.source_name || '').toUpperCase())}</div><h2>${esc(a.headline)}</h2><p class="subtitle">${esc(a.subtitle)}</p><div class="byline">Por Pulso da IA · ${fmt(a.published_at || a.written_at)} · ${a.read_time_min || 3} min</div></div></a>`;
}
function card(a) {
  const img = a.hero_image ? `<img src="/feed/${a.slug}/${a.hero_image}" alt="${esc(a.headline)}" loading="lazy">` : `<div class="article-card-placeholder"><span>${esc((a.eyebrow_category || 'PULSO').toUpperCase())}</span></div>`;
  return `<a href="/feed/${a.slug}/" class="article-card"><div class="article-card-image">${img}</div><div class="article-card-cat">${esc((a.eyebrow_category || 'NOTICIA').toUpperCase())}</div><h4>${esc(a.headline)}</h4><div class="byline">Por Pulso da IA · ${fmt(a.published_at || a.written_at)}</div></a>`;
}

const pages = Math.ceil(articles.length / PAGE_SIZE);
const pageUrl = n => (n === 1 ? '/feed/' : `/feed/page/${n}/`);
function pager(cur) {
  const links = Array.from({ length: pages }, (_, i) => i + 1).map(n => (n === cur ? `<span class="cur" aria-current="page">${n}</span>` : `<a href="${pageUrl(n)}">${n}</a>`));
  const prev = cur > 1 ? `<a href="${pageUrl(cur - 1)}" rel="prev">← Anteriores</a>` : '';
  const next = cur < pages ? `<a href="${pageUrl(cur + 1)}" rel="next">Mais antigos →</a>` : '';
  return `<nav class="pager" id="pager" aria-label="Paginação">${prev}${links.join('')}${next}</nav>`;
}

// idempotente: tira o rel=next que uma rodada anterior pos em /feed/ antes de usar o arquivo como molde
const tpl = fs.readFileSync(path.join(ROOT, 'feed', 'index.html'), 'utf8').replace(/\n<link rel="next"[^>]*>/g, '');
const slice = n => articles.slice((n - 1) * PAGE_SIZE, n * PAGE_SIZE);

// pagina 1 = /feed/
let p1 = inject(tpl, 'featured', featured(slice(1)[0]));
p1 = inject(p1, 'grid', slice(1).slice(1).map(card).join(''));
p1 = inject(p1, 'pager', pager(1));
p1 = inject(p1, 'count', String(articles.length));
p1 = p1.replace(/<link rel="canonical" href="https:\/\/pulsodaia\.com\.br\/feed\/">/, `$&\n<link rel="next" href="https://pulsodaia.com.br${pageUrl(2)}">`);
fs.writeFileSync(path.join(ROOT, 'feed', 'index.html'), p1);

// paginas 2..N: sem filtros nem boot por JS (listam so a propria fatia)
fs.rmSync(path.join(ROOT, 'feed', 'page'), { recursive: true, force: true });
for (let n = 2; n <= pages; n++) {
  const url = `https://pulsodaia.com.br${pageUrl(n)}`;
  let h = inject(tpl, 'featured', '');
  h = inject(h, 'grid', slice(n).map(card).join(''));
  h = inject(h, 'pager', pager(n));
  h = inject(h, 'count', String(articles.length));
  h = h.replace(/<title>[^<]*<\/title>/, `<title>Feed, página ${n} · Pulso da IA</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1Feed, página ${n} · Pulso da IA"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">\n<link rel="prev" href="https://pulsodaia.com.br${pageUrl(n - 1)}">${n < pages ? `\n<link rel="next" href="https://pulsodaia.com.br${pageUrl(n + 1)}">` : ''}`)
    .replace(/<section class="filters container">[\s\S]*?<\/section>\s*/, '')
    .replace(/<script>\s*const FEED_URL[\s\S]*?<\/script>/, '');
  fs.mkdirSync(path.join(ROOT, 'feed', 'page', String(n)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'feed', 'page', String(n), 'index.html'), h);
}

// home: bloco estatico com os links mais recentes
const homeBlock = `
<section style="max-width:1100px;margin:0 auto;padding:56px 24px" aria-label="Últimas do Pulso">
  <h2 style="font-size:28px;font-weight:700;margin-bottom:20px">Últimas do Pulso da IA</h2>
  <ul style="list-style:none;padding:0;margin:0;display:grid;gap:14px">
${articles.slice(0, HOME_COUNT).map(a => `    <li><a href="/feed/${a.slug}/" style="font-weight:600;text-decoration:none">${esc(a.headline)}</a><div style="font-size:14px;opacity:.7">${esc(a.subtitle)}</div></li>`).join('\n')}
  </ul>
  <p style="margin-top:20px"><a href="/feed/" style="font-weight:600">Ver todos os ${articles.length} artigos →</a></p>
</section>
`;
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'index.html'), inject(home, 'latest', homeBlock));
console.log(`[feed-pages] ${articles.length} artigos, ${pages} paginas (${PAGE_SIZE}/pag), home com ${HOME_COUNT} links`);
