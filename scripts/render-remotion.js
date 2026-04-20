#!/usr/bin/env node
// Renderiza video Remotion v2 pra um artigo.
// Features v2: logo real, 45s, hybrid com Nova clip (Veo 3), TTS narration, music.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOCIAL_DIR = path.join(ROOT, 'social');
const VIDEOS_DIR = path.join(ROOT, 'assets', 'videos');
const REMOTION_DIR = path.join(ROOT, 'remotion');
const REMOTION_PUBLIC = path.join(REMOTION_DIR, 'public');
const BRAND_MOCKUPS = path.join(ROOT, 'brand', 'mockups');

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) out.slug = a.slice(7);
    else if (a === '--force') out.force = true;
    else if (a === '--no-narration') out.noNarration = true;
  }
  return out;
}

function log(...a) { console.log('[remotion]', ...a); }
function fatal(m) { console.error('[remotion] FATAL:', m); process.exit(1); }

function extractStructuredFromIG(igMd) {
  const insights = [];
  const stats = [];
  const quotes = [];
  const lists = [];

  const bodyRe = /^BODY:\s*(.+)$/gm;
  const statRe = /---CARD \d+ \(STAT\)---[\s\S]*?STAT:\s*(.+?)$[\s\S]*?LABEL:\s*(.+?)$/gm;
  const quoteRe = /---CARD \d+ \(QUOTE\)---[\s\S]*?QUOTE:\s*"?(.+?)"?$[\s\S]*?ATTRIBUTION:\s*(.+?)$/gm;
  const itemRe = /^ITEM:\s*(.+)$/gm;

  let m;
  while ((m = statRe.exec(igMd)) !== null) stats.push({ value: m[1].trim(), label: m[2].trim() });
  while ((m = quoteRe.exec(igMd)) !== null) quotes.push({ text: m[1].trim(), attribution: m[2].trim() });
  while ((m = itemRe.exec(igMd)) !== null) lists.push(m[1].trim().substring(0, 70));
  while ((m = bodyRe.exec(igMd)) !== null && insights.length < 3) {
    insights.push(m[1].trim().substring(0, 90));
  }

  return { insights, stats, quotes, lists };
}

function copyNovaClipToPublic(slug) {
  // Procura veo-hero.mp4 do artigo, copia pra public/nova-clips/{slug}.mp4
  const veoHeroSrc = path.join(VIDEOS_DIR, slug, 'veo-hero.mp4');
  if (!fs.existsSync(veoHeroSrc)) return null;

  const publicNovaDir = path.join(REMOTION_PUBLIC, 'nova-clips');
  if (!fs.existsSync(publicNovaDir)) fs.mkdirSync(publicNovaDir, { recursive: true });
  const dest = path.join(publicNovaDir, `${slug}.mp4`);
  fs.copyFileSync(veoHeroSrc, dest);
  return `nova-clips/${slug}.mp4`;
}

function pickGalleryImages(slug, heroUrl) {
  // So hero do artigo (sem Nova mockups extras)
  return heroUrl ? [heroUrl] : [];
}

function maybeGenerateNarration(slug, force) {
  if (process.env.GOOGLE_API_KEY) {
    log(`Gerando narracao TTS (pt-BR)...`);
    const extra = force ? ['--force'] : [];
    const res = spawnSync('node', [path.join(__dirname, 'generate-narration.js'), `--slug=${slug}`, ...extra], {
      stdio: 'inherit',
      env: process.env
    });
    if (res.status !== 0) {
      log('Narracao falhou, seguindo sem audio');
      return null;
    }
    const mp3 = path.join(REMOTION_PUBLIC, 'narration', `${slug}.mp3`);
    return fs.existsSync(mp3) ? `narration/${slug}.mp3` : null;
  }
  return null;
}

function main() {
  const args = parseArgs();
  if (!args.slug) fatal('Uso: --slug=xxx');

  const metaPath = path.join(SOCIAL_DIR, args.slug, 'meta.json');
  if (!fs.existsSync(metaPath)) fatal(`Meta nao existe: ${metaPath}`);
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  const outDir = path.join(VIDEOS_DIR, args.slug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'remotion.mp4');

  if (fs.existsSync(outPath) && !args.force) {
    log(`Ja existe: ${path.relative(ROOT, outPath)}. Use --force pra regerar.`);
    return;
  }

  // Carrega structured data do instagram.md
  const igPath = path.join(SOCIAL_DIR, args.slug, 'instagram.md');
  const igMd = fs.existsSync(igPath) ? fs.readFileSync(igPath, 'utf8') : '';
  const { insights, stats, quotes, lists } = extractStructuredFromIG(igMd);

  // Copia Nova clip se existir
  const novaClipPath = copyNovaClipToPublic(args.slug);
  if (novaClipPath) log(`Nova clip encontrado: ${novaClipPath}`);

  // Gera galeria (hero + 2 Nova mockups)
  const heroUrl = meta.hero_image || `https://pulsodaia.com.br/feed/${args.slug}/hero.png`;
  const galleryImages = pickGalleryImages(args.slug, heroUrl);
  log(`Gallery: ${galleryImages.length} imagens`);

  // Gera narração TTS (best-effort, nao bloqueia)
  const narrationAudioPath = args.noNarration ? null : maybeGenerateNarration(args.slug, args.force);
  if (narrationAudioPath) log(`Narracao: ${narrationAudioPath}`);

  const props = {
    headline: meta.article_headline || 'Sem titulo',
    subtitle: meta.subtitle || meta.article_subtitle || '',
    category: meta.article_category || 'NOTÍCIA',
    heroUrl,
    galleryImages,
    insights: insights.length > 0 ? insights.slice(0, 3) : (lists.slice(0, 3).length > 0 ? lists.slice(0, 3) : ['Novidade no mercado de IA']),
    stat: stats[0] || null,
    quote: quotes[0] || null,
    articleUrl: meta.article_url || `https://pulsodaia.com.br/feed/${args.slug}/`,
    ctaKeyword: 'PULSO',
    novaClipPath,
    narrationAudioPath,
    musicAudioPath: null
  };

  log(`Render props:`);
  log(`  headline: ${props.headline}`);
  log(`  stat: ${stats.length ? 'sim' : 'nao'}`);
  log(`  quote: ${quotes.length ? 'sim' : 'nao'}`);
  log(`  nova: ${novaClipPath ? 'sim' : 'nao'}`);
  log(`  narration: ${narrationAudioPath ? 'sim' : 'nao'}`);

  const propsFile = path.join(REMOTION_DIR, '.props.json');
  fs.writeFileSync(propsFile, JSON.stringify(props));

  const cmd = ['render', 'src/index.jsx', 'article-short', outPath, `--props=${propsFile}`];
  log(`Executando: npx remotion ${cmd.join(' ')}`);
  const res = spawnSync('npx', ['remotion', ...cmd], {
    cwd: REMOTION_DIR,
    stdio: 'inherit',
    shell: true
  });

  if (res.status !== 0) fatal(`Render falhou (exit ${res.status})`);

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  log(`VIDEO OK: ${path.relative(ROOT, outPath)} (${sizeMB}MB)`);
}

main();
