#!/usr/bin/env node
// Gera video short (9:16, 1080x1920) a partir dos cards PNG existentes.
// Usa FFmpeg — cada card aparece ~3s com ken burns + crossfade.
// Audio: trilha royalty-free (opcional).
//
// Uso:
//   node scripts/render-video.js --slug=xxx           # gera 1 video
//   node scripts/render-video.js --slug=xxx --force   # regenera

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CARDS_DIR = path.join(ROOT, 'assets', 'ig-cards');
const VIDEOS_DIR = path.join(ROOT, 'assets', 'videos');
const SOCIAL_DIR = path.join(ROOT, 'social');

const CARD_SEC = 3.5;       // segundos por card
const FADE_SEC = 0.4;       // transicao crossfade
const FPS = 30;
const OUT_W = 1080;
const OUT_H = 1920;
const INNER_W = 1080;       // card dimensoes
const INNER_H = 1080;
const CARD_Y = (OUT_H - INNER_H) / 2; // 420

function args() {
  const out = { force: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--force') out.force = true;
    else if (a.startsWith('--slug=')) out.slug = a.slice(7);
  }
  return out;
}

function fatal(msg) { console.error(msg); process.exit(1); }

function ffmpeg(argv) {
  const res = spawnSync('ffmpeg', argv, { stdio: ['ignore', 'pipe', 'pipe'] });
  if (res.status !== 0) {
    console.error('FFmpeg failed:', (res.stderr || '').toString().substring(0, 800));
    return false;
  }
  return true;
}

function main() {
  const { slug, force } = args();
  if (!slug) fatal('Uso: --slug=xxx');

  const cardsDir = path.join(CARDS_DIR, slug);
  if (!fs.existsSync(cardsDir)) fatal(`Sem cards em ${cardsDir}. Rode render-ig-cards.js primeiro.`);

  const cardFiles = fs.readdirSync(cardsDir)
    .filter(f => /^card-\d+\.png$/i.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))
    .map(f => path.join(cardsDir, f));

  if (cardFiles.length === 0) fatal('Sem cards PNG pra compor.');

  const outDir = path.join(VIDEOS_DIR, slug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'short.mp4');

  if (fs.existsSync(outFile) && !force) {
    console.log(`[video] ${slug}: ja existe (${(fs.statSync(outFile).size / 1024).toFixed(0)}KB). Use --force pra regenerar.`);
    return;
  }

  console.log(`[video] ${slug}: ${cardFiles.length} cards, ~${(cardFiles.length * CARD_SEC).toFixed(1)}s total`);

  // Estrategia: pra cada card, cria um segmento de video com ken-burns zoompan.
  // Junta tudo com xfade crossfade entre eles.
  //
  // Pipeline FFmpeg:
  //   For each card: input image → scale → pad 1080x1920 → zoompan (ken burns)
  //   Concat via xfade transitions
  //
  // Vamos gerar 1 comando monolitico:

  const inputs = [];
  const filters = [];
  cardFiles.forEach((file, i) => {
    inputs.push('-loop', '1', '-t', String(CARD_SEC), '-i', file);
  });

  // Build filter_complex
  // Para cada card: scale+pad+zoompan+setpts
  cardFiles.forEach((_, i) => {
    const totalFrames = Math.round(CARD_SEC * FPS);
    // Ken-burns: ligeiro zoom de 1.0 → 1.05 ao longo do clipe
    filters.push(
      `[${i}:v]scale=${INNER_W}:${INNER_H},pad=${OUT_W}:${OUT_H}:(ow-iw)/2:(oh-ih)/2:color=#0A0A0A,zoompan=z='min(zoom+0.0008,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${OUT_W}x${OUT_H}:fps=${FPS},setsar=1,format=yuv420p[v${i}]`
    );
  });

  // Crossfade chain
  let last = 'v0';
  let cumulative = CARD_SEC;
  for (let i = 1; i < cardFiles.length; i++) {
    const offset = (cumulative - FADE_SEC).toFixed(2);
    const outLabel = `vx${i}`;
    filters.push(
      `[${last}][v${i}]xfade=transition=fade:duration=${FADE_SEC}:offset=${offset}[${outLabel}]`
    );
    last = outLabel;
    cumulative += CARD_SEC - FADE_SEC;
  }

  const finalLabel = last;
  const totalDuration = cumulative.toFixed(2);

  const argv = [
    '-y',
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', `[${finalLabel}]`,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    '-t', totalDuration,
    '-movflags', '+faststart',
    outFile
  ];

  console.log(`[ffmpeg] rendering ${totalDuration}s video...`);
  const ok = ffmpeg(argv);
  if (!ok) fatal('Render falhou');

  const sizeMB = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
  console.log(`[video] ✓ ${path.relative(ROOT, outFile)} · ${sizeMB}MB`);

  // Atualiza meta.json
  const metaPath = path.join(SOCIAL_DIR, slug, 'meta.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    meta.video = {
      path: `/assets/videos/${slug}/short.mp4`,
      url: `https://pulsodaia.com.br/assets/videos/${slug}/short.mp4`,
      duration_seconds: parseFloat(totalDuration),
      cards: cardFiles.length,
      rendered_at: new Date().toISOString()
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }
}

main();
