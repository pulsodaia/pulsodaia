#!/usr/bin/env node
// Gera posts pra redes sociais a partir de artigos publicados.
// Pra cada artigo sem pasta social/{slug}/, roda Gemini pra criar:
//   - linkedin.md  (post completo pronto pra colar no LinkedIn)
//   - instagram.md (roteiro de 3 cards: capa, insight, CTA)
//   - x.md         (thread pra X/Twitter)
//   - meta.json    (metadata de geracao)
//
// Uso:
//   GOOGLE_API_KEY=xxx node scripts/generate-social-posts.js           # so artigos sem pasta social/
//   GOOGLE_API_KEY=xxx node scripts/generate-social-posts.js --force   # regenera todos
//   GOOGLE_API_KEY=xxx node scripts/generate-social-posts.js --slug=X  # so o slug X
//   node scripts/generate-social-posts.js --list                        # lista status

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_API_KEY;
const ROOT = path.join(__dirname, '..');
const FEED_JSON = path.join(ROOT, 'data', 'feed.json');
const FEED_DIR = path.join(ROOT, 'feed');
const SOCIAL_DIR = path.join(ROOT, 'social');

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const GEMINI_DELAY_MS = 5000;

// CTA padrao ajustavel via env
const CTA_WHATSAPP = process.env.CTA_WHATSAPP || '+55 19 98380-5908';
const CTA_KEYWORD = process.env.CTA_KEYWORD || 'PULSE';
const CTA_PROMISE = process.env.CTA_PROMISE || 'receba nossa biblioteca com mais de 2 mil skills de IA prontas pra rodar.';

if (!fs.existsSync(SOCIAL_DIR)) fs.mkdirSync(SOCIAL_DIR, { recursive: true });

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

function loadArticle(slug) {
  const jsonPath = path.join(FEED_DIR, slug, 'article.json');
  if (!fs.existsSync(jsonPath)) return null;
  try { return JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch { return null; }
}

function sanitizeText(s) {
  return (s || '').replace(/—/g, ',').replace(/–/g, '-');
}

async function generateForArticle(article) {
  const articleUrl = `https://pulsodaia.com.br/feed/${article.slug}/`;

  const prompt = `Voce e social media editor do Pulso da IA (pulsodaia.com.br), portal brasileiro de noticias sobre inteligencia artificial. Tom Bloomberg/Axios aplicado a redes sociais: hook forte, zero cliche, sem hype.

ARTIGO FONTE:
- URL: ${articleUrl}
- Headline: ${article.headline}
- Subtitle: ${article.subtitle || ''}
- Lead: ${article.lead || ''}
- Categoria: ${article.eyebrow_category || 'NOTICIA'}
- Fonte original: ${article.source_name || 'fonte oficial'} (${article.url || ''})
- Corpo (resumo): ${(article.body_markdown || article.body_html || '').replace(/<[^>]+>/g, ' ').substring(0, 1200)}

MISSAO: criar 3 formatos de post social pra divulgar este artigo.

REGRAS INVIOLAVEIS:
1. ZERO TRAVESSAO (nada de "—"). Use virgula, ponto, parenteses ou "e".
2. ZERO cliches: "revolucionario", "transformar", "futuro da IA", "game-changer", "na era da IA", "sinergia", "ecossistema", "jornada".
3. PT-BR brasileiro, "voce" (nao "tu").
4. CTA sempre presente: "Digite ${CTA_KEYWORD} no WhatsApp ${CTA_WHATSAPP} e ${CTA_PROMISE}"
5. Nunca inventar numeros ou fatos que nao estejam no artigo fonte.
6. Link pro artigo sempre incluido: ${articleUrl}

FORMATO DE SAIDA (use DELIMITADORES ===SECTION===, nao JSON):

===LINKEDIN===
Post completo pra LinkedIn. Estrutura:
- Hook de 1 linha (gancho forte, pergunta ou afirmacao provocadora)
- Linha em branco
- 3 a 5 paragrafos curtos (1-3 linhas cada) contando o que aconteceu e por que importa
- Linha em branco
- CTA em 2 linhas: link pro artigo + CTA da biblioteca
- Hashtags no final (5 a 8, todas minusculas, sem #IA generico)

===INSTAGRAM===
Roteiro pra post de 3 cards (carrossel). Cada card em bloco separado com ---CARD N--- como titulo.

---CARD 1 (CAPA)---
Manchete de maximo 8 palavras (hook visual, Fraunces-style).
Subtitulo de 1 linha explicando o assunto.
Emoji laranja ou orange dot sugerido.

---CARD 2 (INSIGHT)---
Texto principal do post: 2-3 paragrafos curtos com o que aconteceu e por que importa. Maximo 350 caracteres total.

---CARD 3 (CTA)---
Manchete: "Quer a biblioteca completa?"
Texto: "Digite ${CTA_KEYWORD} no WhatsApp ${CTA_WHATSAPP} e ${CTA_PROMISE}"
Assinatura: "Pulso da IA - pulsodaia.com.br"

===INSTAGRAM_CAPTION===
Legenda do post Instagram (texto abaixo dos cards). 3-5 linhas:
- Linha 1: hook curto
- 2-3 linhas: contexto do artigo
- CTA: "Digite ${CTA_KEYWORD} no WhatsApp ${CTA_WHATSAPP} e ${CTA_PROMISE}"
- Link na bio: pulsodaia.com.br
- 6 a 10 hashtags no final

===X===
Thread pra X (Twitter). Ate 3 tweets, cada um separado por "---TWEET N---".
- Tweet 1: hook + fato principal (max 270 chars)
- Tweet 2: por que importa + contexto (max 270 chars)
- Tweet 3: CTA + link pro artigo (max 270 chars)

===END===

Responda APENAS com o formato acima. Sem comentarios extras. Mantenha tom direto e sem hype.`;

  const response = await httpPostJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 3500 }
    }
  );

  if (response.status !== 200) {
    throw new Error(`Gemini HTTP ${response.status}: ${JSON.stringify(response.body).substring(0, 300)}`);
  }

  const text = response.body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Sem texto na resposta Gemini');

  const sections = {};
  const sectionRegex = /===([A-Z_]+)===\s*\n([\s\S]*?)(?=\n===[A-Z_]+===|$)/g;
  let m;
  while ((m = sectionRegex.exec(text)) !== null) {
    sections[m[1].toLowerCase()] = sanitizeText(m[2].trim());
  }

  if (!sections.linkedin || !sections.instagram) {
    throw new Error('Parse falhou: faltou LINKEDIN ou INSTAGRAM na resposta');
  }

  return sections;
}

function writeOutputs(slug, sections, article) {
  const dir = path.join(SOCIAL_DIR, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const articleUrl = `https://pulsodaia.com.br/feed/${slug}/`;
  const hero = article.hero_image ? `https://pulsodaia.com.br/feed/${slug}/${article.hero_image}` : null;

  const linkedinMd = `# LinkedIn - ${article.headline}

**Categoria:** ${article.eyebrow_category || 'NOTICIA'}
**Link pro artigo:** ${articleUrl}
${hero ? `**Imagem sugerida:** ${hero}` : ''}

---

${sections.linkedin}

---

## Checklist antes de postar
- [ ] Copiei o texto acima
- [ ] Anexei a imagem do artigo (ou screenshot do portal)
- [ ] Verifiquei que o link esta funcionando
- [ ] Horario de postagem: 8h-10h ou 18h-20h (best engagement)
`;

  const instagramMd = `# Instagram - ${article.headline}

**Categoria:** ${article.eyebrow_category || 'NOTICIA'}
**Link no perfil:** pulsodaia.com.br
${hero ? `**Hero original:** ${hero}` : ''}

---

## Roteiro dos cards

${sections.instagram}

---

## Legenda do post (abaixo dos cards)

${sections.instagram_caption || '(legenda nao gerada, escrever manual)'}

---

## Checklist antes de postar
- [ ] Cards gerados no Canva/Figma usando template Pulso da IA (Deep Black + Pulse Orange + Fraunces)
- [ ] Minimo de 2 cards (capa + CTA obrigatorios)
- [ ] Ultimo card tem o CTA "Digite ${CTA_KEYWORD} no WhatsApp"
- [ ] Legenda acima copiada
- [ ] Link: bio eh pulsodaia.com.br
- [ ] Horario ideal: 11h-13h ou 19h-21h
`;

  const xMd = `# X (Twitter) - ${article.headline}

**Categoria:** ${article.eyebrow_category || 'NOTICIA'}
**Link pro artigo:** ${articleUrl}

---

${sections.x || '(thread nao gerada)'}

---

## Checklist antes de postar
- [ ] Verifiquei que cada tweet tem < 280 caracteres
- [ ] Tweet 1 tem hook forte (sem emoji no primeiro caractere)
- [ ] Tweet final com link pro artigo
- [ ] Horario ideal: 8h-10h ou 18h-20h
`;

  const meta = {
    slug,
    article_headline: article.headline,
    article_url: articleUrl,
    article_category: article.eyebrow_category,
    hero_image: hero,
    generated_at: new Date().toISOString(),
    cta_keyword: CTA_KEYWORD,
    cta_whatsapp: CTA_WHATSAPP,
    model: MODEL,
    status: 'draft'
  };

  fs.writeFileSync(path.join(dir, 'linkedin.md'), linkedinMd);
  fs.writeFileSync(path.join(dir, 'instagram.md'), instagramMd);
  fs.writeFileSync(path.join(dir, 'x.md'), xMd);
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));

  return dir;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const listOnly = args.includes('--list');
  const slugFilter = (args.find(a => a.startsWith('--slug=')) || '').split('=')[1];

  const feed = JSON.parse(fs.readFileSync(FEED_JSON, 'utf8'));
  console.log(`[social] ${feed.articles.length} artigos no feed\n`);

  if (listOnly) {
    feed.articles.forEach(a => {
      const has = fs.existsSync(path.join(SOCIAL_DIR, a.slug, 'meta.json'));
      console.log(`  ${has ? '✓' : '·'} ${a.slug}`);
    });
    const total = feed.articles.length;
    const done = feed.articles.filter(a => fs.existsSync(path.join(SOCIAL_DIR, a.slug, 'meta.json'))).length;
    console.log(`\n${done}/${total} com social gerado`);
    return;
  }

  if (!API_KEY) { console.error('GOOGLE_API_KEY nao definida'); process.exit(1); }

  const targets = feed.articles.filter(a => {
    if (slugFilter && a.slug !== slugFilter) return false;
    const hasMeta = fs.existsSync(path.join(SOCIAL_DIR, a.slug, 'meta.json'));
    return force || !hasMeta;
  });

  if (targets.length === 0) {
    console.log('Nada pra gerar. Use --force pra regenerar.');
    return;
  }

  console.log(`[social] gerando pra ${targets.length} artigos\n`);

  let ok = 0, fail = 0;
  for (const entry of targets) {
    const article = loadArticle(entry.slug);
    if (!article) {
      console.log(`  ✗ ${entry.slug}: article.json nao existe, skip`);
      fail++;
      continue;
    }
    try {
      console.log(`[gen] ${entry.slug}`);
      const sections = await generateForArticle(article);
      const dir = writeOutputs(entry.slug, sections, article);
      console.log(`  ✓ ${path.relative(ROOT, dir)}`);

      // Render IG cards PNG via Sharp (best-effort, nao pode travar geracao)
      try {
        const { spawn } = require('child_process');
        const proc = spawn('node', [path.join(__dirname, 'render-ig-cards.js'), `--slug=${entry.slug}`], { stdio: 'pipe' });
        await new Promise((resolve) => {
          proc.on('close', () => resolve());
          proc.on('error', () => resolve());
          setTimeout(() => { try { proc.kill(); } catch {} resolve(); }, 30000);
        });
        console.log(`  ✓ IG cards PNG renderizados`);
      } catch (renderErr) {
        console.log(`  ! render PNG falhou: ${renderErr.message.substring(0, 80)}`);
      }

      ok++;
      await new Promise(r => setTimeout(r, GEMINI_DELAY_MS));
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
      fail++;
      await new Promise(r => setTimeout(r, GEMINI_DELAY_MS));
    }
  }

  console.log(`\n[social] concluido · ok=${ok} fail=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
