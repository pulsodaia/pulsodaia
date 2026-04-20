#!/usr/bin/env node
// Gera narracao TTS pt-BR via Gemini 3.1 Flash TTS pra um artigo.
// Le social/{slug}/meta.json + instagram.md, cria roteiro 45s, converte em MP3.
//
// Uso:
//   GOOGLE_API_KEY=xxx node scripts/generate-narration.js --slug=xxx
//
// Env:
//   GOOGLE_API_KEY=xxx
//   TTS_VOICE=Kore (default — outros: Aoede, Zephyr, Charon, Puck)
//   TTS_MODEL=gemini-2.5-flash-preview-tts (default)
//   NARRATION_MODEL=gemini-2.5-flash-lite (pra gerar texto)

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const SOCIAL_DIR = path.join(ROOT, 'social');
const PUBLIC_DIR = path.join(ROOT, 'remotion', 'public', 'narration');

const API_KEY = process.env.GOOGLE_API_KEY;
const TTS_VOICE = process.env.TTS_VOICE || 'Kore';
const TTS_MODEL = process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const NARRATION_MODEL = process.env.NARRATION_MODEL || 'gemini-2.5-flash-lite';

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) out.slug = a.slice(7);
    else if (a === '--force') out.force = true;
  }
  return out;
}

function log(...a) { console.log('[narration]', ...a); }
function fatal(m) { console.error('[narration] FATAL:', m); process.exit(1); }

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

async function generateScript(meta, igContent) {
  log(`Gerando roteiro 45s via ${NARRATION_MODEL}`);
  const prompt = `Voce eh roteirista de short noticioso Pulso da IA (portal pt-BR de IA).
Cria um roteiro narrado pra video Short de 45 segundos vertical sobre a noticia abaixo.

A apresentadora Nova narra em pt-BR, tom analista direto, sem adjetivos promocionais.
Zero "incrivel/revolucionario/game-changer". Zero "pessoal/bora/olha so".
Pausas naturais entre frases (use virgulas e pontos).

ESTRUTURA obrigatoria:
1. Lead (0-10s): hook + o que aconteceu
2. Contexto (10-25s): detalhes concretos + citacao ou numero se tiver
3. Impacto (25-35s): por que importa no Brasil/mercado
4. CTA (35-45s): termina com "Leia a cobertura completa no pulsodaia ponto com ponto br. E se voce quer receber mais de 3000 skills de IA, comenta PULSO aqui."

Cerca de 110-130 palavras (ritmo confortavel pra 45s de narracao).

NOTICIA:
Headline: ${meta.article_headline || meta.headline}
Categoria: ${meta.article_category || ''}
URL: ${meta.article_url || ''}

Resumo do artigo (dos cards IG):
${igContent.substring(0, 1500)}

Retorne APENAS o texto da narracao (sem cabecalhos, marcadores, markdown). Usa apenas pontuacao natural.`;

  const res = await httpPost(
    `https://generativelanguage.googleapis.com/v1beta/models/${NARRATION_MODEL}:generateContent?key=${API_KEY}`,
    {},
    { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.65, maxOutputTokens: 500 } }
  );
  if (res.status !== 200) fatal(`Gemini script ${res.status}: ${JSON.stringify(res.body).substring(0, 400)}`);
  const text = res.body.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) fatal('Sem texto');
  return text;
}

async function synthesizeTTS(narration, slug) {
  log(`TTS via ${TTS_MODEL} voice ${TTS_VOICE}`);

  const res = await httpPost(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`,
    { 'x-goog-api-key': API_KEY },
    {
      contents: [{ parts: [{ text: narration }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: TTS_VOICE }
          }
        }
      }
    }
  );

  if (res.status !== 200) fatal(`TTS ${res.status}: ${JSON.stringify(res.body).substring(0, 500)}`);

  const inlineData = res.body.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData?.data) fatal(`Sem audio na response: ${JSON.stringify(res.body).substring(0, 400)}`);

  const mimeType = inlineData.mimeType || 'audio/L16;rate=24000';
  log(`Audio mime: ${mimeType}`);

  const audioBytes = Buffer.from(inlineData.data, 'base64');
  log(`Audio size: ${(audioBytes.length / 1024).toFixed(1)}KB`);

  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  // Gemini retorna PCM raw 24kHz. Salvamos como .pcm e convertemos via ffmpeg pra wav/mp3.
  const pcmPath = path.join(PUBLIC_DIR, `${slug}.pcm`);
  fs.writeFileSync(pcmPath, audioBytes);

  // Converte pra MP3 via ffmpeg
  const { spawnSync } = require('child_process');
  const mp3Path = path.join(PUBLIC_DIR, `${slug}.mp3`);

  const ffmpegArgs = [
    '-y',
    '-f', 's16le',    // PCM signed 16-bit little-endian
    '-ar', '24000',   // sample rate 24kHz (default Gemini TTS)
    '-ac', '1',       // mono
    '-i', pcmPath,
    '-codec:a', 'libmp3lame',
    '-b:a', '128k',
    mp3Path
  ];
  const ff = spawnSync('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
  if (ff.status !== 0) {
    log(`ffmpeg stderr: ${(ff.stderr || '').toString().substring(0, 400)}`);
    fatal('Conversao pcm->mp3 falhou');
  }

  // Remove PCM intermediario
  fs.unlinkSync(pcmPath);

  const sizeKB = (fs.statSync(mp3Path).size / 1024).toFixed(1);
  log(`MP3 salvo: ${path.relative(ROOT, mp3Path)} (${sizeKB}KB)`);

  // Mede duracao via ffprobe pra Remotion sincronizar scenes
  const probe = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', mp3Path
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const duration = parseFloat((probe.stdout || '').toString().trim()) || 0;
  if (duration > 0) {
    const durationPath = mp3Path.replace(/\.mp3$/, '.duration.txt');
    fs.writeFileSync(durationPath, String(duration));
    log(`Duracao: ${duration.toFixed(2)}s (salvo em ${path.basename(durationPath)})`);
  }

  return mp3Path;
}

async function main() {
  if (!API_KEY) fatal('GOOGLE_API_KEY missing');
  const args = parseArgs();
  if (!args.slug) fatal('Uso: --slug=xxx');

  const metaPath = path.join(SOCIAL_DIR, args.slug, 'meta.json');
  if (!fs.existsSync(metaPath)) fatal(`meta.json nao existe: ${metaPath}`);
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  const igPath = path.join(SOCIAL_DIR, args.slug, 'instagram.md');
  const igContent = fs.existsSync(igPath) ? fs.readFileSync(igPath, 'utf8') : '';

  const mp3Path = path.join(PUBLIC_DIR, `${args.slug}.mp3`);
  if (fs.existsSync(mp3Path) && !args.force) {
    log(`Ja existe: ${path.relative(ROOT, mp3Path)}. Use --force pra regerar.`);
    return;
  }

  const narration = await generateScript(meta, igContent);
  log(`Narracao (${narration.split(/\s+/).length} palavras):`);
  console.log('─'.repeat(70));
  console.log(narration);
  console.log('─'.repeat(70));

  // Salva roteiro pra referencia
  const scriptPath = path.join(PUBLIC_DIR, `${args.slug}.txt`);
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(scriptPath, narration);

  await synthesizeTTS(narration, args.slug);

  log('OK — narracao pronta pra Remotion usar via Audio component');
}

main().catch(e => { console.error('[narration]', e.message); process.exit(1); });
