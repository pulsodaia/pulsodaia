#!/usr/bin/env node
// Regenera social posts (instagram + cards) pra artigos ja publicados
// que tem o formato antigo (3 cards fixos) ou que estao sem COVER_HERO.
//
// Uso:
//   GOOGLE_API_KEY=xxx node scripts/regen-social-cards.js
//   GOOGLE_API_KEY=xxx node scripts/regen-social-cards.js --slug=xxx   # um especifico
//   GOOGLE_API_KEY=xxx node scripts/regen-social-cards.js --all        # todos (ignora check)
//   GOOGLE_API_KEY=xxx node scripts/regen-social-cards.js --dry-run

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOCIAL_DIR = path.join(ROOT, 'social');
const CARDS_DIR = path.join(ROOT, 'assets', 'ig-cards');

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slug=')) out.slug = a.slice(7);
    else if (a === '--all') out.all = true;
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function needsRegen(slug) {
  const igMd = path.join(SOCIAL_DIR, slug, 'instagram.md');
  if (!fs.existsSync(igMd)) return false;
  const content = fs.readFileSync(igMd, 'utf8');
  // Detecta formato antigo: so 3 cards, sem tipos COVER_HERO/STAT/QUOTE/LIST
  const hasCoverHero = /---CARD 1 \(COVER_HERO\)---/.test(content);
  const hasVariedTypes = /\((STAT|QUOTE|LIST|TIMELINE|COMPARISON)\)---/.test(content);
  return !hasCoverHero || !hasVariedTypes;
}

async function regenOne(slug, dryRun) {
  console.log(`\n→ ${slug}`);
  if (dryRun) {
    console.log('  [DRY RUN] Skip regen');
    return true;
  }

  // Remove instagram.md e linkedin.md e x.md pra forcar regeneracao
  const files = ['instagram.md', 'linkedin.md', 'x.md'];
  for (const f of files) {
    const fp = path.join(SOCIAL_DIR, slug, f);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  // Remove cards PNG pra regen
  const cardsDir = path.join(CARDS_DIR, slug);
  if (fs.existsSync(cardsDir)) {
    for (const f of fs.readdirSync(cardsDir)) {
      if (/^card-\d+\.png$/.test(f)) fs.unlinkSync(path.join(cardsDir, f));
    }
  }

  // Dispara generate-social-posts.js pra ESTE slug especifico
  // (o script processa artigos sem social/, vai pegar esse de novo)
  return new Promise((resolve) => {
    const proc = spawn('node', [path.join(__dirname, 'generate-social-posts.js'), `--slug=${slug}`, '--force'], {
      stdio: 'inherit',
      cwd: ROOT
    });
    proc.on('close', code => resolve(code === 0));
  });
}

async function main() {
  const args = parseArgs();
  const allDirs = fs.readdirSync(SOCIAL_DIR).filter(d => {
    return fs.statSync(path.join(SOCIAL_DIR, d)).isDirectory();
  });

  let targets;
  if (args.slug) {
    targets = [args.slug];
  } else if (args.all) {
    targets = allDirs;
  } else {
    targets = allDirs.filter(needsRegen);
  }

  console.log(`Alvos: ${targets.length} artigos`);
  targets.forEach(t => console.log(`  - ${t}`));

  if (args.dryRun) {
    console.log(`\n[DRY RUN] Nenhum artigo sera modificado`);
    return;
  }

  let ok = 0, fail = 0;
  for (const slug of targets) {
    const success = await regenOne(slug, false);
    if (success) ok++; else fail++;
  }
  console.log(`\n=== DONE: ${ok} ok, ${fail} falha ===`);
}

main().catch(e => { console.error(e); process.exit(1); });
