#!/usr/bin/env node
// Gera video hero cinematico via Veo 3 Fast a partir do artigo TOP do dia.
// Orcamento controlado: hard stop em VEO_BUDGET_MONTHLY_BRL (default R$200).
//
// Uso:
//   VEO_ENABLED=true node scripts/render-veo-hero.js        # auto-select top artigo
//   VEO_ENABLED=true node scripts/render-veo-hero.js --slug=xxx
//
// Env:
//   VEO_ENABLED=true                     # OBRIGATORIO pra ativar (default off)
//   GOOGLE_API_KEY=xxx                   # mesma key Gemini
//   VEO_MODEL=veo-3.0-fast-generate-001  # default Fast (mais barato)
//   VEO_BUDGET_MONTHLY_BRL=200           # limite mensal R$
//   VEO_USD_TO_BRL=5.0                   # conversao
//   VEO_COST_PER_SECOND_USD=0.08         # Fast default

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const SOCIAL_DIR = path.join(ROOT, 'social');
const VIDEOS_DIR = path.join(ROOT, 'assets', 'videos');
const SPEND_FILE = path.join(ROOT, 'data', 'veo-spend.json');

const MODEL = process.env.VEO_MODEL || 'veo-3.0-fast-generate-001';
const COST_USD_SEC = parseFloat(process.env.VEO_COST_PER_SECOND_USD || '0.08');
const USD_BRL = parseFloat(process.env.VEO_USD_TO_BRL || '5.0');
const BUDGET_BRL = parseFloat(process.env.VEO_BUDGET_MONTHLY_BRL || '200');
const DURATION_SEC = 8; // Veo 3 Fast default
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const API_KEY = process.env.GOOGLE_API_KEY;

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) out.slug = a.slice(7);
    else if (a === '--force') out.force = true;
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function log(...a) { console.log('[veo]', ...a); }
function warn(...a) { console.error('[veo]', ...a); }
function fatal(m) { console.error('[veo] FATAL:', m); process.exit(1); }

function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers }
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

function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: headers || {}
    }, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath, headers, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    function attempt(currentUrl, redirectsLeft) {
      const u = new URL(currentUrl);
      https.get({
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: headers || {}
      }, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
          const nextUrl = res.headers.location.startsWith('http') ? res.headers.location : `https://${u.hostname}${res.headers.location}`;
          res.resume();
          return attempt(nextUrl, redirectsLeft - 1);
        }
        if (res.statusCode !== 200) {
          let errBody = '';
          res.on('data', c => errBody += c.toString());
          res.on('end', () => reject(new Error(`Download HTTP ${res.statusCode}: ${errBody.substring(0, 300)}`)));
          return;
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(destPath)));
        file.on('error', reject);
      }).on('error', reject);
    }
    attempt(url, maxRedirects);
  });
}

function loadSpend() {
  const month = new Date().toISOString().substring(0, 7); // YYYY-MM
  if (!fs.existsSync(SPEND_FILE)) {
    return { month, spent_usd: 0, spent_brl: 0, videos: [] };
  }
  const data = JSON.parse(fs.readFileSync(SPEND_FILE, 'utf8'));
  if (data.month !== month) {
    log(`Novo mes ${month}, reset spend (era ${data.month}: $${data.spent_usd})`);
    return { month, spent_usd: 0, spent_brl: 0, videos: [] };
  }
  return data;
}

function saveSpend(spend) {
  const dir = path.dirname(SPEND_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SPEND_FILE, JSON.stringify(spend, null, 2));
}

function selectTopArticle() {
  if (!fs.existsSync(SOCIAL_DIR)) return null;
  const dirs = fs.readdirSync(SOCIAL_DIR).filter(d => {
    const meta = path.join(SOCIAL_DIR, d, 'meta.json');
    return fs.existsSync(meta);
  });

  const candidates = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const slug of dirs) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(SOCIAL_DIR, slug, 'meta.json'), 'utf8'));
      if (meta.veo_hero) continue; // ja tem Veo
      const pubDate = new Date(meta.generated_at || meta.published_at || meta.written_at);
      // Ultimas 48h apenas (hero deve ser fresco)
      if (today - pubDate > 48 * 3600 * 1000) continue;
      candidates.push({
        slug,
        score: meta.quality_score || 0.7,
        headline: meta.article_headline || meta.headline || '',
        lead: meta.article_lead || meta.lead || '',
        category: meta.article_category || meta.eyebrow_category || '',
        meta_path: path.join(SOCIAL_DIR, slug, 'meta.json'),
        meta
      });
    } catch {}
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

async function generateVeoPrompt(article) {
  log(`Gerando roteiro Veo via Gemini pro artigo: ${article.headline}`);

  // Nova eh a persona fixa do Pulso da IA (consistencia entre videos)
  const novaDescription = `Brazilian woman late 20s, dark brown wavy shoulder-length hair, natural makeup, confident direct gaze, wearing plain black crew-neck t-shirt. Minimalist modern home office background softly blurred, MacBook visible, soft window light from left. Editorial magazine quality, Leica 50mm look, shallow DOF.`;

  const scriptPrompt = `Voce eh roteirista de short noticioso (estilo Pulso da IA, Brazilian AI news portal). Crie UMA frase curta em pt-BR (max 12 palavras) que a apresentadora Nova vai falar direto pra camera sobre a noticia. Tom: analista de mercado, direto, sem emocao, sem adjetivos promocionais. Zero "incrivel/revolucionario/game-changer". Retorne APENAS a frase, sem aspas, sem markdown.

Headline: ${article.headline}
Lead: ${article.lead}`;

  const scriptRes = await httpPost(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
    {},
    { contents: [{ parts: [{ text: scriptPrompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 80 } }
  );
  if (scriptRes.status !== 200) throw new Error(`Gemini script ${scriptRes.status}: ${JSON.stringify(scriptRes.body).substring(0, 300)}`);
  const spokenLine = scriptRes.body.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/^["']|["']$/g, '') || article.headline;
  log(`Fala (pt-BR): "${spokenLine}"`);

  // Monta prompt Veo combinando Nova + script + estrutura 8s
  const veoPrompt = `Vertical 9:16 cinematic editorial short, 8 seconds. ${novaDescription} She looks directly at camera, slight natural pause, then speaks in Brazilian Portuguese (pt-BR) with calm analytical tone: "${spokenLine}". Subtle medium close-up, natural ambient audio, no music. No text overlays. Realistic lip sync to the Portuguese dialogue. End with a 1-second clean cut to the same woman slightly nodding, still framed. Mood: sober, trustworthy, editorial tech journalism (think Bloomberg Quicktake meets The Verge). Color grading: neutral with slight warm highlights. Do not show any logos or brand names.`;

  return { veoPrompt, spokenLine };
}

async function startVeoGeneration(veoPrompt, novaImagePath) {
  log(`Disparando Veo ${MODEL} (async)...`);
  const instance = { prompt: veoPrompt };

  // Se temos imagem de referencia da Nova, passa como image-to-video
  if (novaImagePath && fs.existsSync(novaImagePath)) {
    const imgBytes = fs.readFileSync(novaImagePath).toString('base64');
    const mimeType = novaImagePath.endsWith('.jpg') || novaImagePath.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
    instance.image = { bytesBase64Encoded: imgBytes, mimeType };
    log(`  usando Nova como reference: ${path.basename(novaImagePath)}`);
  }

  const res = await httpPost(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning`,
    { 'x-goog-api-key': API_KEY },
    {
      instances: [instance],
      parameters: {
        aspectRatio: '9:16',
        personGeneration: 'allow_adult',
        durationSeconds: DURATION_SEC
      }
    }
  );
  if (res.status !== 200 || !res.body?.name) {
    throw new Error(`Veo start ${res.status}: ${JSON.stringify(res.body).substring(0, 400)}`);
  }
  return res.body.name; // operations/xxxx
}

async function pollOperation(opName) {
  const MAX_POLL = 120; // ate 10min (120*5s)
  for (let i = 0; i < MAX_POLL; i++) {
    const res = await httpGet(
      `https://generativelanguage.googleapis.com/v1beta/${opName}`,
      { 'x-goog-api-key': API_KEY }
    );
    if (res.status !== 200) {
      throw new Error(`Poll ${res.status}: ${JSON.stringify(res.body).substring(0, 300)}`);
    }
    if (res.body.done) {
      if (res.body.error) throw new Error(`Veo error: ${JSON.stringify(res.body.error)}`);
      return res.body.response;
    }
    if (i % 6 === 0) log(`  ... polling Veo (${i * 5}s)`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Veo timeout (10min)');
}

async function main() {
  if (process.env.VEO_ENABLED !== 'true') {
    log('VEO_ENABLED!=true, skipping.');
    return;
  }
  if (!API_KEY) fatal('GOOGLE_API_KEY missing');

  const args = parseArgs();
  const spend = loadSpend();

  const costPerVideo = COST_USD_SEC * DURATION_SEC;
  const costBrl = costPerVideo * USD_BRL;
  log(`Gasto atual mes ${spend.month}: $${spend.spent_usd.toFixed(2)} (R$${spend.spent_brl.toFixed(2)}) / R$${BUDGET_BRL}`);
  log(`Custo previsto vid: $${costPerVideo.toFixed(2)} (R$${costBrl.toFixed(2)})`);

  if (spend.spent_brl + costBrl > BUDGET_BRL) {
    warn(`ORCAMENTO ESTOURARIA (R$${(spend.spent_brl + costBrl).toFixed(2)} > R$${BUDGET_BRL}). Skip.`);
    return;
  }

  let article;
  if (args.slug) {
    const metaPath = path.join(SOCIAL_DIR, args.slug, 'meta.json');
    if (!fs.existsSync(metaPath)) fatal(`Slug ${args.slug} sem meta.json`);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    article = {
      slug: args.slug,
      headline: meta.article_headline || meta.headline || '',
      lead: meta.article_lead || meta.lead || '',
      category: meta.article_category || meta.eyebrow_category || '',
      meta_path: metaPath,
      meta,
      score: meta.quality_score || 0.7
    };
  } else {
    article = selectTopArticle();
    if (!article) { log('Nenhum artigo elegivel (sem veo_hero, <48h).'); return; }
  }

  log(`Selecionado: ${article.slug} (score ${article.score})`);
  if (args.dryRun) { log('DRY RUN — sem chamadas API.'); return; }

  const { veoPrompt, spokenLine } = await generateVeoPrompt(article);
  log(`Prompt Veo: ${veoPrompt}`);

  // Nova portrait como referencia visual (mantem rosto consistente entre videos)
  const novaRef = process.env.NOVA_REF_IMAGE || path.join(ROOT, 'brand', 'mockups', 'nova-portrait-clean.png');
  const opName = await startVeoGeneration(veoPrompt, novaRef);
  log(`Operation: ${opName}`);

  const response = await pollOperation(opName);
  log(`Response keys: ${JSON.stringify(Object.keys(response || {}))}`);
  log(`Response dump: ${JSON.stringify(response).substring(0, 500)}`);

  const videos = response?.generatedSamples
    || response?.generateVideoResponse?.generatedSamples
    || response?.videos
    || response?.generateVideoResponse?.videos
    || [];
  if (!videos.length) throw new Error(`Sem videos no response: ${JSON.stringify(response).substring(0, 600)}`);

  const videoUri = videos[0]?.video?.uri || videos[0]?.uri || videos[0]?.gcsUri;
  if (!videoUri) throw new Error(`Sem URI no sample: ${JSON.stringify(videos[0])}`);

  const outDir = path.join(VIDEOS_DIR, article.slug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'veo-hero.mp4');

  log(`Download: ${videoUri}`);
  const downloadUrl = videoUri.includes('key=') ? videoUri : `${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${API_KEY}`;
  try {
    await downloadFile(downloadUrl, outPath, { 'x-goog-api-key': API_KEY });
  } catch (e) {
    // Remove arquivo 0 bytes em caso de falha
    try { if (fs.existsSync(outPath) && fs.statSync(outPath).size === 0) fs.unlinkSync(outPath); } catch {}
    throw e;
  }

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  log(`VIDEO salvo: ${path.relative(ROOT, outPath)} (${sizeMB}MB)`);

  // Atualiza meta.json
  article.meta.veo_hero = {
    path: `/assets/videos/${article.slug}/veo-hero.mp4`,
    url: `https://pulsodaia.com.br/assets/videos/${article.slug}/veo-hero.mp4`,
    model: MODEL,
    duration_seconds: DURATION_SEC,
    cost_usd: costPerVideo,
    cost_brl: costBrl,
    veo_prompt: veoPrompt,
    spoken_line: spokenLine,
    persona: 'Nova',
    rendered_at: new Date().toISOString()
  };
  fs.writeFileSync(article.meta_path, JSON.stringify(article.meta, null, 2));

  // Atualiza spend
  spend.spent_usd += costPerVideo;
  spend.spent_brl += costBrl;
  spend.videos.push({
    slug: article.slug,
    date: new Date().toISOString(),
    cost_usd: costPerVideo,
    cost_brl: costBrl,
    model: MODEL
  });
  saveSpend(spend);
  log(`Total mes agora: R$${spend.spent_brl.toFixed(2)} / R$${BUDGET_BRL}`);
}

main().catch(e => { warn(e.message); process.exit(1); });
