#!/usr/bin/env node
// Renderiza video Remotion pra um artigo especifico
// Le social/{slug}/meta.json pra pegar dados (headline, insights, hero)
//
// Uso:
//   node scripts/render-remotion.js --slug=xxx

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOCIAL_DIR = path.join(ROOT, 'social');
const VIDEOS_DIR = path.join(ROOT, 'assets', 'videos');
const REMOTION_DIR = path.join(ROOT, 'remotion');

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) out.slug = a.slice(7);
    else if (a === '--force') out.force = true;
  }
  return out;
}

function log(...a) { console.log('[remotion]', ...a); }
function fatal(m) { console.error('[remotion] FATAL:', m); process.exit(1); }

function extractInsights(meta) {
  // Tenta extrair 3 insights do instagram.md (cards INSIGHT/STAT/LIST)
  const igMd = path.join(SOCIAL_DIR, meta.slug, 'instagram.md');
  if (!fs.existsSync(igMd)) {
    // Fallback: usa lead do artigo
    return [meta.article_headline || 'Nova releasemás do mercado de IA'];
  }
  const content = fs.readFileSync(igMd, 'utf8');
  const insights = [];
  // Captura BODY: / STAT: / ITEM: dos cards
  const bodyRe = /^BODY:\s*(.+)$/gm;
  const statRe = /^STAT:\s*(.+)$/gm;
  const itemRe = /^ITEM:\s*(.+)$/gm;
  const quoteRe = /^QUOTE:\s*"?(.+?)"?$/gm;

  let m;
  while ((m = statRe.exec(content)) !== null && insights.length < 3) {
    insights.push(m[1].trim().substring(0, 70));
  }
  while ((m = itemRe.exec(content)) !== null && insights.length < 3) {
    insights.push(m[1].trim().substring(0, 70));
  }
  while ((m = quoteRe.exec(content)) !== null && insights.length < 3) {
    insights.push(m[1].trim().substring(0, 70));
  }
  if (insights.length === 0) {
    while ((m = bodyRe.exec(content)) !== null && insights.length < 3) {
      const text = m[1].trim().substring(0, 70);
      insights.push(text);
    }
  }
  return insights.slice(0, 3);
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

  const insights = extractInsights({ slug: args.slug, ...meta });

  const props = {
    headline: meta.article_headline || 'Sem titulo',
    subtitle: meta.subtitle || meta.article_subtitle || '',
    category: meta.article_category || 'NOTÍCIA',
    heroUrl: meta.hero_image || `https://pulsodaia.com.br/feed/${args.slug}/hero.png`,
    insights,
    articleUrl: meta.article_url || `https://pulsodaia.com.br/feed/${args.slug}/`,
    ctaKeyword: meta.cta_keyword || 'PULSE'
  };

  log(`Render Remotion: ${args.slug}`);
  log(`  headline: ${props.headline}`);
  log(`  hero: ${props.heroUrl}`);
  log(`  insights: ${insights.length}`);

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
