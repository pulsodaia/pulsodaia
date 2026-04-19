#!/usr/bin/env node
// Publica artigo ad-hoc passando URL de fonte + metadata.
// Usa feed-engine.writeArticle + publishArticle (mesma pipeline Gemini + og:image).
//
// Uso:
//   GOOGLE_API_KEY=xxx node scripts/publish-custom.js \
//     --url="https://techcrunch.com/..." \
//     --title="Anthropic lanca Claude Design" \
//     --source="TechCrunch AI" \
//     --category="lancamento" \
//     --summary="Anthropic lancou Claude Design..."

const fs = require('fs');
const path = require('path');

// Le feed-engine e extrai helpers privados via internal require
const engine = require('./feed-engine.js');

// Precisamos de acesso a writeArticle (interno) — vamos forcar via processo de clonagem.
// Truque: re-requerer modulo original passando options
const enginePath = path.join(__dirname, 'feed-engine.js');
const engineSrc = fs.readFileSync(enginePath, 'utf8');

// Tenta obter writeArticle via monkey patch: salva item e deixa feed-engine rodar --publish
// Mais simples: invocamos CLI subprocess do feed-engine com URL como fake RSS item.

// Workaround pragmatico: montamos o "item" mock e chamamos publishArticle via require
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
function getArg(name) {
  const a = args.find(x => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
}

const url = getArg('url');
const title = getArg('title');
const source = getArg('source') || 'Fonte externa';
const category = getArg('category') || 'noticia';
const summary = getArg('summary') || '';

if (!url || !title) {
  console.error('Uso: --url=... --title=... [--source=] [--category=] [--summary=]');
  process.exit(1);
}

// Cria item como se viesse do parser RSS
const item = {
  id: `custom-${Date.now()}-${Buffer.from(url).toString('base64').slice(0, 12)}`,
  title,
  url,
  summary,
  published_at: new Date().toISOString(),
  source_id: 'custom',
  source_name: source,
  category,
  source_type: 'custom'
};

(async () => {
  // Como writeArticle nao esta exportada, vamos invocar o feed-engine via require interno
  // usando approach: patchear o SOURCES.rss_sources + state para forcar processamento

  // Approach mais simples: importar funcoes privadas via Node vm
  const Module = require('module');
  const orig = Module.prototype._compile;
  // Nao vamos hackear. Vamos ler src + eval internos relevantes.

  // Solucao efetiva: chamar feed-engine com FORCE via modifying feed-state pra nao skip
  // OR: fazer fetch direto ao Gemini aqui inline.

  const API_KEY = process.env.GOOGLE_API_KEY;
  if (!API_KEY) { console.error('GOOGLE_API_KEY missing'); process.exit(1); }

  const https = require('https');
  function httpPost(url, body) {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const data = JSON.stringify(body);
      const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, res => {
        let chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => { const raw = Buffer.concat(chunks).toString('utf8'); try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); } catch { resolve({ status: res.statusCode, body: raw }); } });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  const prompt = `Voce e editor-chefe do Pulso da IA. Reescreve a noticia abaixo em portugues brasileiro.

FONTE:
- Titulo: ${title}
- Fonte: ${source}
- URL: ${url}
- Resumo: ${summary}

REGRAS: zero travessao, zero cliche, PT-BR "voce", backlink pra fonte (${url}) no body.

Formato delimitado:

===HEADLINE===
Titulo PT-BR
===SUBTITLE===
1 frase contexto
===CATEGORY===
${(category || 'noticia').toUpperCase()}
===LEAD===
Lead 2-3 linhas
===BODY===
## O que aconteceu
Paragrafo com [link](${url}).

## Por que importa
Paragrafo impacto BR.

## O que esperar
Paragrafo previsoes com [outro link](${url}).
===TAGS===
3 tags lowercase
===READ_TIME===
3
===SCORE===
0.90
===KEYWORDS===
key 1, key 2
===META===
SEO 155 chars
===FAQ===
Q: Pergunta 1?
A: Resposta 1.
Q: Pergunta 2?
A: Resposta 2.
Q: Pergunta 3?
A: Resposta 3.
===END===
`;

  console.log(`[custom] chamando Gemini...`);
  const res = await httpPost(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.65, maxOutputTokens: 3500 }
  });

  if (res.status !== 200) { console.error('Gemini error', res.status, JSON.stringify(res.body).substring(0, 400)); process.exit(1); }

  const text = res.body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) { console.error('No text in response'); process.exit(1); }

  // Parse sections (copiado do feed-engine)
  const sections = {};
  const sre = /===([A-Z_]+)===\s*\n([\s\S]*?)(?=\n===[A-Z_]+===|$)/g;
  let m;
  while ((m = sre.exec(text)) !== null) sections[m[1].toLowerCase()] = m[2].trim().replace(/—/g, ',').replace(/–/g, '-');

  if (!sections.headline) { console.error('Parse failed'); process.exit(1); }

  // Parse FAQ
  const faq = [];
  if (sections.faq) {
    const lines = sections.faq.split(/\r?\n/).map(l => l.trim());
    let cur = null;
    for (const line of lines) {
      if (/^Q:\s*/i.test(line)) { if (cur && cur.q && cur.a) faq.push(cur); cur = { q: line.replace(/^Q:\s*/i, '').trim(), a: '' }; }
      else if (/^A:\s*/i.test(line) && cur) cur.a = line.replace(/^A:\s*/i, '').trim();
      else if (cur && cur.a && line) cur.a += ' ' + line;
    }
    if (cur && cur.q && cur.a) faq.push(cur);
  }

  // markdown to html (copia reduzida)
  function md2html(md) {
    if (!md) return '';
    let h = md;
    h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>');
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (mm, t, u) => /^https?:/.test(u) && !u.includes('pulsodaia') ? `<a href="${u}" target="_blank" rel="external noopener">${t}</a>` : `<a href="${u}">${t}</a>`);
    h = h.split(/\n\n+/).map(ch => { ch = ch.trim(); if (!ch) return ''; if (/^<(h[1-6]|ul|p)/.test(ch)) return ch; return `<p>${ch}</p>`; }).join('\n\n');
    return h;
  }

  const article = {
    ...item,
    headline: sections.headline,
    subtitle: sections.subtitle || '',
    eyebrow_category: (sections.category || category).toUpperCase(),
    lead: sections.lead || '',
    body_markdown: sections.body || '',
    body_html: md2html(sections.body || ''),
    tags: (sections.tags || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    read_time_min: parseInt(sections.read_time || '3'),
    quality_score: parseFloat(sections.score || '0.9'),
    seo_keywords: (sections.keywords || '').split(',').map(s => s.trim()).filter(Boolean),
    meta_description_seo: sections.meta || '',
    faq: faq.slice(0, 5),
    written_at: new Date().toISOString(),
    slug: (sections.headline || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80)
  };

  console.log(`[custom] headline: ${article.headline}`);
  console.log(`[custom] slug: ${article.slug}`);

  // Usa engine.publishArticle
  const dir = await engine.publishArticle(article);
  console.log(`[custom] PUBLICADO em ${path.relative(process.cwd(), dir)}`);
})().catch(e => { console.error(e); process.exit(1); });
