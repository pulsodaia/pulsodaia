#!/usr/bin/env node
// Gera 20 mockups fotorrealistas via FAL.ai (Imagen 4 ou Flux Pro)
// Uso: FAL_KEY=xxx node scripts/generate-mockups.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const FAL_KEY = process.env.FAL_KEY;
const MODEL = process.env.FAL_MODEL || 'fal-ai/imagen4/preview';
const PROMPTS_FILE = path.join(__dirname, '..', 'brand', 'mockup-prompts.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'brand', 'mockups');

if (!FAL_KEY) {
  console.error('\n❌ FAL_KEY nao definido. Rode com:');
  console.error('   FAL_KEY=fal_xxxxx node scripts/generate-mockups.js\n');
  console.error('Pegue o key em https://fal.ai/dashboard/keys');
  process.exit(1);
}

const IMAGE_SIZE = 'landscape_16_9';

async function callFalApi(prompt) {
  const body = JSON.stringify({
    prompt,
    aspect_ratio: '16:9',
    num_images: 1,
    output_format: 'png',
    image_size: IMAGE_SIZE,
    seed: null
  });

  const options = {
    hostname: 'fal.run',
    path: '/' + MODEL,
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          const json = JSON.parse(raw);
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${raw.substring(0, 300)}`));
            return;
          }
          resolve(json);
        } catch (e) {
          reject(new Error(`parse err: ${raw.substring(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const data = JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf8'));
  console.log(`[fal] ${data.items.length} mockups a gerar via ${MODEL}`);
  console.log(`[fal] output: ${OUTPUT_DIR}\n`);

  const log = [];
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const dest = path.join(OUTPUT_DIR, item.filename);

    if (fs.existsSync(dest)) {
      console.log(`[${i+1}/${data.items.length}] SKIP (ja existe): ${item.filename}`);
      log.push({ ...item, status: 'skip' });
      continue;
    }

    try {
      console.log(`[${i+1}/${data.items.length}] Gerando: ${item.id}...`);
      const t0 = Date.now();
      const result = await callFalApi(item.prompt);
      const url = result.images?.[0]?.url || result.image?.url;
      if (!url) {
        console.log(`    ⚠ resposta sem URL:`, JSON.stringify(result).substring(0, 200));
        log.push({ ...item, status: 'err', error: 'no url' });
        continue;
      }
      await downloadImage(url, dest);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      const size = (fs.statSync(dest).size / 1024).toFixed(0);
      console.log(`    ✓ ${secs}s · ${size}KB · ${dest.replace(/.*\//, '')}`);
      log.push({ ...item, status: 'ok', seconds: +secs });
    } catch (e) {
      console.log(`    ✗ ERRO: ${e.message}`);
      log.push({ ...item, status: 'err', error: e.message });
    }

    // rate limit suave
    if (i < data.items.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  const okCount = log.filter(l => l.status === 'ok').length;
  const skipCount = log.filter(l => l.status === 'skip').length;
  const errCount = log.filter(l => l.status === 'err').length;

  console.log(`\n[fal] concluido: ${okCount} ok · ${skipCount} skip · ${errCount} err`);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_log.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), model: MODEL, log }, null, 2)
  );
  console.log(`[fal] log salvo em ${OUTPUT_DIR}/_log.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
