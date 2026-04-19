#!/usr/bin/env node
// Render Veo 3 com prompt manual (voce escreve, nao IA).
// Usa estrutura oficial Subject/Context/Action/Spoken/Style/Camera/Lighting/Audio/Negative.
//
// Uso:
//   GOOGLE_API_KEY=xxx VEO_ENABLED=true node scripts/render-veo-manual.js \
//     --prompt-file=prompt.txt \
//     --slug=anthropic-claude-design \
//     --output-name=clip1
//
// Env:
//   VEO_ENABLED=true (obrigatorio)
//   GOOGLE_API_KEY=xxx
//   VEO_MODEL=veo-3.0-fast-generate-001
//   VEO_DURATION=8 (default 8)
//   VEO_USE_NOVA=true (default true — adiciona reference image Nova)
//   NOVA_REF_IMAGE=path (default brand/mockups/nova-portrait-clean.png)

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const VIDEOS_DIR = path.join(ROOT, 'assets', 'videos');
const SPEND_FILE = path.join(ROOT, 'data', 'veo-spend.json');

const MODEL = process.env.VEO_MODEL || 'veo-3.0-fast-generate-001';
const DURATION_SEC = parseInt(process.env.VEO_DURATION || '8');
const API_KEY = process.env.GOOGLE_API_KEY;
const USE_NOVA = process.env.VEO_USE_NOVA !== 'false';
const COST_USD_SEC = parseFloat(process.env.VEO_COST_PER_SECOND_USD || '0.08');
const USD_BRL = parseFloat(process.env.VEO_USD_TO_BRL || '5.0');

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--prompt-file=')) out.promptFile = a.slice(14);
    else if (a.startsWith('--prompt=')) out.prompt = a.slice(9);
    else if (a.startsWith('--slug=')) out.slug = a.slice(7);
    else if (a.startsWith('--output-name=')) out.outputName = a.slice(14);
    else if (a.startsWith('--negative=')) out.negative = a.slice(11);
    else if (a === '--no-nova') out.noNova = true;
  }
  return out;
}

function log(...a) { console.log('[veo-manual]', ...a); }
function fatal(m) { console.error('[veo-manual] FATAL:', m); process.exit(1); }

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

async function main() {
  if (process.env.VEO_ENABLED !== 'true') fatal('VEO_ENABLED!=true');
  if (!API_KEY) fatal('GOOGLE_API_KEY missing');

  const args = parseArgs();

  let prompt = args.prompt;
  if (args.promptFile) {
    if (!fs.existsSync(args.promptFile)) fatal(`Prompt file nao existe: ${args.promptFile}`);
    prompt = fs.readFileSync(args.promptFile, 'utf8').trim();
  }
  if (!prompt) fatal('Sem --prompt ou --prompt-file');

  const slug = args.slug || `manual-${Date.now()}`;
  const outputName = args.outputName || 'veo-manual';
  const useNova = USE_NOVA && !args.noNova;

  const outDir = path.join(VIDEOS_DIR, slug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${outputName}.mp4`);

  log(`Modelo: ${MODEL}`);
  log(`Duracao: ${DURATION_SEC}s`);
  log(`Output: ${path.relative(ROOT, outPath)}`);
  log(`Reference Nova: ${useNova ? 'sim' : 'nao'}`);
  log(`Prompt (${prompt.length} chars):`);
  console.log('─'.repeat(70));
  console.log(prompt);
  console.log('─'.repeat(70));

  const negativePrompt = args.negative || 'no subtitles, no captions, no closed captions, no burned-in text, no text overlays, no lower thirds, no floating text, no written words in any language, no logos, no watermarks, no on-screen graphics, no glitch effects, no dramatic music, no English dialogue, no foreign language text, no silent intro, no muted beginning';
  log(`Negative: ${negativePrompt.substring(0, 120)}...`);

  // Monta instance
  const instance = { prompt };
  if (useNova) {
    const novaImg = process.env.NOVA_REF_IMAGE || path.join(ROOT, 'brand', 'mockups', 'nova-portrait-clean.png');
    if (fs.existsSync(novaImg)) {
      const imgBytes = fs.readFileSync(novaImg).toString('base64');
      const mimeType = novaImg.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
      instance.image = { bytesBase64Encoded: imgBytes, mimeType };
      log(`Reference: ${path.basename(novaImg)}`);
    } else {
      log(`Aviso: ${novaImg} nao existe, rodando sem reference`);
    }
  }

  log('Disparando Veo...');
  const startRes = await httpPost(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning`,
    { 'x-goog-api-key': API_KEY },
    {
      instances: [instance],
      parameters: {
        aspectRatio: '9:16',
        personGeneration: 'allow_adult',
        durationSeconds: DURATION_SEC,
        negativePrompt
      }
    }
  );
  if (startRes.status !== 200 || !startRes.body?.name) {
    fatal(`Veo start ${startRes.status}: ${JSON.stringify(startRes.body).substring(0, 400)}`);
  }
  const opName = startRes.body.name;
  log(`Operation: ${opName}`);

  // Poll
  let response;
  for (let i = 0; i < 120; i++) {
    const pollRes = await httpGet(`https://generativelanguage.googleapis.com/v1beta/${opName}`, { 'x-goog-api-key': API_KEY });
    if (pollRes.status !== 200) fatal(`Poll ${pollRes.status}: ${JSON.stringify(pollRes.body).substring(0, 300)}`);
    if (pollRes.body.done) {
      if (pollRes.body.error) fatal(`Veo error: ${JSON.stringify(pollRes.body.error)}`);
      response = pollRes.body.response;
      break;
    }
    if (i % 6 === 0) log(`  ... polling (${i * 5}s)`);
    await new Promise(r => setTimeout(r, 5000));
  }
  if (!response) fatal('Timeout 10min');

  const videos = response?.generateVideoResponse?.generatedSamples || response?.generatedSamples || [];
  if (!videos.length) fatal(`Sem videos: ${JSON.stringify(response).substring(0, 400)}`);
  const uri = videos[0]?.video?.uri || videos[0]?.uri;
  if (!uri) fatal(`Sem URI: ${JSON.stringify(videos[0])}`);

  log(`Download: ${uri.substring(0, 80)}...`);
  const dlUrl = uri.includes('key=') ? uri : `${uri}${uri.includes('?') ? '&' : '?'}key=${API_KEY}`;
  try {
    await downloadFile(dlUrl, outPath, { 'x-goog-api-key': API_KEY });
  } catch (e) {
    if (fs.existsSync(outPath) && fs.statSync(outPath).size === 0) fs.unlinkSync(outPath);
    throw e;
  }

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  const costUsd = COST_USD_SEC * DURATION_SEC;
  const costBrl = costUsd * USD_BRL;
  log(`VIDEO OK: ${path.relative(ROOT, outPath)} (${sizeMB}MB)`);
  log(`Custo: R$${costBrl.toFixed(2)}`);

  // Atualiza spend
  const spend = loadSpend();
  spend.spent_usd += costUsd;
  spend.spent_brl += costBrl;
  spend.videos.push({
    slug,
    output_name: outputName,
    type: 'manual',
    date: new Date().toISOString(),
    cost_usd: costUsd,
    cost_brl: costBrl,
    model: MODEL,
    duration: DURATION_SEC,
    prompt_preview: prompt.substring(0, 200)
  });
  saveSpend(spend);
  log(`Total mes: R$${spend.spent_brl.toFixed(2)}`);

  // URL publica
  log(`\nURL publica (apos deploy):`);
  log(`https://pulsodaia.com.br/assets/videos/${slug}/${outputName}.mp4`);
}

main().catch(e => { console.error('[veo-manual] ERRO:', e.message); process.exit(1); });
