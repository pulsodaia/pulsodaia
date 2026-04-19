#!/usr/bin/env node
// Gera serie cinematica semanal: 5 clipes x 8s = 40s Short.
// Cada clipe tem papel narrativo:
//   1. INTRO      — Nova apresenta o tema
//   2. CONTEXTO   — Nova explica o que aconteceu
//   3. B-ROLL     — cena tech SEM Nova (tela, dispositivo, ambiente)
//   4. ANALISE    — Nova volta, impacto BR
//   5. CTA        — Nova fecha com CTA pro portal
//
// Orcamento: 5 clipes x $0.64 = $3.20 = R$16/video
// Uso weekly: 4/mes = R$64/mes (bem dentro do budget R$200)

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOCIAL_DIR = path.join(ROOT, 'social');
const VIDEOS_DIR = path.join(ROOT, 'assets', 'videos');
const SPEND_FILE = path.join(ROOT, 'data', 'veo-spend.json');

const MODEL = process.env.VEO_MODEL || 'veo-3.0-fast-generate-001';
const COST_USD_SEC = parseFloat(process.env.VEO_COST_PER_SECOND_USD || '0.08');
const USD_BRL = parseFloat(process.env.VEO_USD_TO_BRL || '5.0');
const BUDGET_BRL = parseFloat(process.env.VEO_BUDGET_MONTHLY_BRL || '200');
const CLIP_SEC = 8;
const NUM_CLIPS = 5;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const API_KEY = process.env.GOOGLE_API_KEY;

const NOVA_DESCRIPTION = `Brazilian woman late 20s, dark brown wavy shoulder-length hair, natural makeup, confident direct gaze, wearing plain black crew-neck t-shirt. Minimalist modern home office background softly blurred, MacBook visible, soft window light from left. Editorial magazine quality, Leica 50mm look, shallow DOF.`;

const NEGATIVE_PROMPT = 'text, subtitles, captions, closed captions, burned-in text, lower thirds, on-screen graphics, logos, watermarks, written words, floating text, language overlay, silent intro, muted beginning, background music, sound effects, dramatic score';

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) out.slug = a.slice(7);
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--force') out.force = true;
  }
  return out;
}

function log(...a) { console.log('[veo-weekly]', ...a); }
function fatal(m) { console.error('[veo-weekly] FATAL:', m); process.exit(1); }

function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
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
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: headers || {} }, res => {
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
      https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: headers || {} }, res => {
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
  const month = new Date().toISOString().substring(0, 7);
  if (!fs.existsSync(SPEND_FILE)) return { month, spent_usd: 0, spent_brl: 0, videos: [] };
  const data = JSON.parse(fs.readFileSync(SPEND_FILE, 'utf8'));
  if (data.month !== month) return { month, spent_usd: 0, spent_brl: 0, videos: [] };
  return data;
}

function saveSpend(spend) {
  const dir = path.dirname(SPEND_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SPEND_FILE, JSON.stringify(spend, null, 2));
}

function selectTopArticleOfWeek() {
  if (!fs.existsSync(SOCIAL_DIR)) return null;
  const dirs = fs.readdirSync(SOCIAL_DIR).filter(d => fs.existsSync(path.join(SOCIAL_DIR, d, 'meta.json')));
  const candidates = [];
  const now = Date.now();

  for (const slug of dirs) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(SOCIAL_DIR, slug, 'meta.json'), 'utf8'));
      if (meta.veo_weekly) continue;
      const pubDate = new Date(meta.generated_at || meta.published_at || meta.written_at);
      if (now - pubDate > 7 * 24 * 3600 * 1000) continue; // ultimos 7d
      candidates.push({
        slug,
        score: meta.quality_score || 0.7,
        headline: meta.article_headline || meta.headline || '',
        lead: meta.article_lead || meta.lead || '',
        category: meta.article_category || meta.eyebrow_category || '',
        meta_path: path.join(SOCIAL_DIR, slug, 'meta.json'),
        meta,
        pubDate
      });
    } catch {}
  }

  candidates.sort((a, b) => b.score - a.score || b.pubDate - a.pubDate);
  return candidates[0] || null;
}

async function generateScript5Clips(article) {
  log(`Gerando roteiro 5 clipes via Gemini: ${article.headline}`);
  const prompt = `Voce eh roteirista de short noticioso (estilo Pulso da IA, portal PT-BR de IA).
Cria um roteiro estruturado em 5 clipes de 8 segundos cada (40s total vertical 9:16).
A apresentadora Nova fala em 4 clipes (intro, contexto, analise, cta). Clipe 3 eh B-ROLL sem narracao (cena tech).

REGRAS:
- Cada fala tem 15-18 palavras em pt-BR (preenche os 8s, evita Veo repetir palavras por ter tempo sobrando)
- Tom: analista de mercado, direto, sem adjetivo promocional (zero "incrivel/revolucionario")
- Zero "olha so/pessoal/bora" ou gírias
- Clipe 5 (CTA) DEVE terminar EXATAMENTE com "Leia em pulsodaia ponto com ponto br" (escrever por extenso pra TTS do Veo pronunciar certo — NUNCA escrever "pulsodaia.com.br" com pontos)

NOTICIA:
Headline: ${article.headline}
Lead: ${article.lead}
Categoria: ${article.category}

Retorne APENAS JSON valido (sem markdown):
{
  "clip1_intro": "fala da Nova no clipe 1",
  "clip2_contexto": "fala da Nova no clipe 2",
  "clip3_broll_description": "descricao VISUAL em INGLES da cena b-roll sem pessoas (ex: 'close-up of laptop screen showing AI interface, soft blue lighting')",
  "clip4_analise": "fala da Nova no clipe 4 — impacto Brasil/mercado",
  "clip5_cta": "fala da Nova no clipe 5 — SEMPRE termina 'Leia em pulsodaia ponto com ponto br'"
}`;

  const res = await httpPost(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
    {},
    { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 500, responseMimeType: 'application/json' } }
  );
  if (res.status !== 200) throw new Error(`Gemini script ${res.status}: ${JSON.stringify(res.body).substring(0, 400)}`);
  const raw = res.body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini sem texto');
  return JSON.parse(raw);
}

function buildClipPrompt(role, script) {
  // Formato estruturado recomendado pro Veo 3 (Subject/Context/Action/Spoken/Style/Camera/Lighting/Audio/Negative)
  // Negative MUITO FORTE: NO subtitles, NO captions, NO text of any kind.
  const NEG = `no subtitles, no captions, no closed captions, no burned-in text, no text overlays, no lower thirds, no floating text, no written words in any language, no logos, no watermarks, no on-screen graphics, no glitch effects, no dramatic music`;

  if (role === 'broll') {
    return [
      `Subject: ${script.clip3_broll_description}`,
      `Context: modern editorial tech environment, softly lit workspace`,
      `Action: slow camera reveal of the scene, subtle environmental movement`,
      `Style: cinematic, realistic, Bloomberg Quicktake aesthetic, magazine editorial quality`,
      `Camera: medium shot, slow push-in, 35mm lens, shallow depth of field`,
      `Lighting: neutral with slight warm highlights, soft window light`,
      `Audio: natural ambient room tone only, no voiceover, no music`,
      `Negative constraints: ${NEG}, no people in frame`
    ].join('\n');
  }

  const lineMap = {
    intro: script.clip1_intro,
    contexto: script.clip2_contexto,
    analise: script.clip4_analise,
    cta: script.clip5_cta
  };
  const spokenLine = lineMap[role];

  return [
    `Subject: Nova — Brazilian woman late 20s, dark brown wavy shoulder-length hair, natural subtle makeup, confident direct gaze, wearing plain black crew-neck t-shirt`,
    `Context: minimalist modern home office, MacBook visible, green plants, softly blurred background, soft natural window light from the left`,
    `Action: she is already speaking naturally from second one, looking directly at camera, small natural head movement, confident calm demeanor`,
    `Spoken text (Portuguese - BR): "${spokenLine}"`,
    `Style: cinematic editorial, naturalistic, magazine quality, Leica 50mm aesthetic, shallow depth of field, neutral color grading with slight warm highlights`,
    `Camera: medium close-up, static or very subtle push-in, 50mm lens equivalent`,
    `Lighting: soft natural window light from the left, editorial portrait feel`,
    `Audio: clean Brazilian Portuguese dialogue ONLY (pt-BR, accurate lip sync), subtle natural room ambience, zero music, zero sound effects`,
    `Negative constraints: ${NEG}, no English dialogue, no foreign language text, no silent intro, no muted beginning`
  ].join('\n');
}

async function renderClip(role, script, novaImgPath, outPath) {
  const prompt = buildClipPrompt(role, script, novaImgPath);
  log(`  [${role}] prompt: ${prompt.substring(0, 150)}...`);

  const instance = { prompt };
  // B-roll NAO usa imagem Nova (deixa Veo gerar cena tech livre)
  if (role !== 'broll' && fs.existsSync(novaImgPath)) {
    const imgBytes = fs.readFileSync(novaImgPath).toString('base64');
    const mimeType = novaImgPath.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    instance.image = { bytesBase64Encoded: imgBytes, mimeType };
  }

  const startRes = await httpPost(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning`,
    { 'x-goog-api-key': API_KEY },
    {
      instances: [instance],
      parameters: {
        aspectRatio: '9:16',
        personGeneration: role === 'broll' ? 'dont_allow' : 'allow_adult',
        durationSeconds: CLIP_SEC,
        negativePrompt: NEGATIVE_PROMPT
      }
    }
  );
  if (startRes.status !== 200 || !startRes.body?.name) {
    throw new Error(`Veo start [${role}] ${startRes.status}: ${JSON.stringify(startRes.body).substring(0, 400)}`);
  }
  const opName = startRes.body.name;
  log(`  [${role}] operation: ${opName}`);

  // Poll
  for (let i = 0; i < 120; i++) {
    const pollRes = await httpGet(`https://generativelanguage.googleapis.com/v1beta/${opName}`, { 'x-goog-api-key': API_KEY });
    if (pollRes.status !== 200) throw new Error(`Poll [${role}] ${pollRes.status}`);
    if (pollRes.body.done) {
      if (pollRes.body.error) throw new Error(`Veo err [${role}]: ${JSON.stringify(pollRes.body.error)}`);
      const response = pollRes.body.response;
      const videos = response?.generateVideoResponse?.generatedSamples || response?.generatedSamples || [];
      if (!videos.length) throw new Error(`Sem video [${role}]: ${JSON.stringify(response).substring(0, 400)}`);
      const uri = videos[0]?.video?.uri || videos[0]?.uri;
      if (!uri) throw new Error(`Sem URI [${role}]`);
      const dl = uri.includes('key=') ? uri : `${uri}${uri.includes('?') ? '&' : '?'}key=${API_KEY}`;
      await downloadFile(dl, outPath, { 'x-goog-api-key': API_KEY });
      return outPath;
    }
    if (i % 6 === 0) log(`  [${role}] ... ${i * 5}s`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`Timeout [${role}]`);
}

function concatClips(clipPaths, outPath) {
  log(`FFmpeg concat ${clipPaths.length} clipes -> ${outPath}`);
  // Cria lista pra concat demuxer
  const listFile = outPath + '.concat.txt';
  fs.writeFileSync(listFile, clipPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const args = ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outPath];
  const res = spawnSync('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  fs.unlinkSync(listFile);
  if (res.status !== 0) {
    // Fallback: re-encode (se codecs diferirem)
    log('concat copy falhou, re-encoding...');
    const reencArgs = ['-y'];
    clipPaths.forEach(p => reencArgs.push('-i', p));
    const filterInputs = clipPaths.map((_, i) => `[${i}:v:0][${i}:a:0]`).join('');
    reencArgs.push('-filter_complex', `${filterInputs}concat=n=${clipPaths.length}:v=1:a=1[outv][outa]`);
    reencArgs.push('-map', '[outv]', '-map', '[outa]', '-c:v', 'libx264', '-c:a', 'aac', '-preset', 'medium', outPath);
    const r2 = spawnSync('ffmpeg', reencArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    if (r2.status !== 0) throw new Error(`Concat failed: ${r2.stderr?.toString().substring(0, 500)}`);
  }
  return outPath;
}

async function main() {
  if (process.env.VEO_ENABLED !== 'true') { log('VEO_ENABLED!=true, skip.'); return; }
  if (!API_KEY) fatal('GOOGLE_API_KEY missing');

  const args = parseArgs();
  const spend = loadSpend();

  const costPerVideo = COST_USD_SEC * CLIP_SEC * NUM_CLIPS;
  const costBrl = costPerVideo * USD_BRL;
  log(`Gasto mes ${spend.month}: R$${spend.spent_brl.toFixed(2)} / R$${BUDGET_BRL}`);
  log(`Custo previsto serie: R$${costBrl.toFixed(2)} (${NUM_CLIPS} clipes x R$${(costBrl / NUM_CLIPS).toFixed(2)})`);

  if (spend.spent_brl + costBrl > BUDGET_BRL) {
    log(`ORCAMENTO ESTOURARIA. Skip.`);
    return;
  }

  let article;
  if (args.slug) {
    const metaPath = path.join(SOCIAL_DIR, args.slug, 'meta.json');
    if (!fs.existsSync(metaPath)) fatal(`Slug ${args.slug} nao existe`);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    article = {
      slug: args.slug,
      headline: meta.article_headline || meta.headline || '',
      lead: meta.article_lead || '',
      category: meta.article_category || '',
      meta_path: metaPath,
      meta,
      score: meta.quality_score || 0.7
    };
  } else {
    article = selectTopArticleOfWeek();
    if (!article) { log('Nenhum artigo elegivel na semana.'); return; }
  }

  log(`Selecionado: ${article.slug} — ${article.headline}`);

  const script = await generateScript5Clips(article);
  log('Roteiro:');
  log(`  1 INTRO:    "${script.clip1_intro}"`);
  log(`  2 CONTEXTO: "${script.clip2_contexto}"`);
  log(`  3 B-ROLL:   ${script.clip3_broll_description}`);
  log(`  4 ANALISE:  "${script.clip4_analise}"`);
  log(`  5 CTA:      "${script.clip5_cta}"`);

  if (args.dryRun) {
    log('DRY RUN — roteiro exibido, Veo NAO chamado (zero custo).');
    log('Exemplo prompt clip1:');
    log(buildClipPrompt('intro', script));
    return;
  }

  const novaImg = process.env.NOVA_REF_IMAGE || path.join(ROOT, 'brand', 'mockups', 'nova-portrait-clean.png');
  const outDir = path.join(VIDEOS_DIR, article.slug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const clips = [];
  const roles = ['intro', 'contexto', 'broll', 'analise', 'cta'];
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    const clipPath = path.join(outDir, `veo-clip-${i + 1}-${role}.mp4`);
    log(`[${i + 1}/${NUM_CLIPS}] Renderizando ${role}...`);
    await renderClip(role, script, novaImg, clipPath);
    clips.push(clipPath);
    log(`  OK (${(fs.statSync(clipPath).size / 1024 / 1024).toFixed(2)}MB)`);
  }

  const finalPath = path.join(outDir, 'veo-weekly.mp4');
  concatClips(clips, finalPath);

  const sizeMB = (fs.statSync(finalPath).size / 1024 / 1024).toFixed(2);
  log(`FINAL: ${path.relative(ROOT, finalPath)} (${sizeMB}MB, ~40s)`);

  // Atualiza meta
  article.meta.veo_weekly = {
    path: `/assets/videos/${article.slug}/veo-weekly.mp4`,
    url: `https://pulsodaia.com.br/assets/videos/${article.slug}/veo-weekly.mp4`,
    model: MODEL,
    num_clips: NUM_CLIPS,
    total_duration_seconds: NUM_CLIPS * CLIP_SEC,
    cost_usd: costPerVideo,
    cost_brl: costBrl,
    script,
    persona: 'Nova',
    rendered_at: new Date().toISOString()
  };
  fs.writeFileSync(article.meta_path, JSON.stringify(article.meta, null, 2));

  spend.spent_usd += costPerVideo;
  spend.spent_brl += costBrl;
  spend.videos.push({
    slug: article.slug,
    type: 'weekly',
    date: new Date().toISOString(),
    cost_usd: costPerVideo,
    cost_brl: costBrl,
    model: MODEL,
    num_clips: NUM_CLIPS
  });
  saveSpend(spend);
  log(`Total mes: R$${spend.spent_brl.toFixed(2)} / R$${BUDGET_BRL}`);
}

main().catch(e => { console.error('[veo-weekly]', e.message); process.exit(1); });
