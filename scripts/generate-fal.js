#!/usr/bin/env node
// Gera imagens via FAL.ai
// Uso: FAL_KEY=xxx node scripts/generate-fal.js [target]
//   target = 'woman-branded' ou id de brand/mockup-prompts.json ou 'all'

const fs = require('fs');
const path = require('path');
const https = require('https');

const FAL_KEY = process.env.FAL_KEY;
const MODEL = process.env.FAL_MODEL || 'fal-ai/imagen4/preview';

if (!FAL_KEY) { console.error('Set FAL_KEY'); process.exit(1); }

const SPECIAL = {
  'woman-branded': {
    filename: 'woman-branded-portrait.png',
    aspect: '3:4',
    prompt: "Editorial portrait photography of a confident Brazilian woman in her late 20s, natural subtle makeup, shoulder-length dark brown wavy hair. She is wearing a premium black crew neck t-shirt with the 'pulsodaIA' wordmark in white and a minimal orange pulse wave logo (bright orange #FF5E1F) printed across the chest. She is holding a matte black ceramic mug with the same orange pulse wave symbol, about to drink coffee. Slight warm smile. Modern minimalist home office in softly blurred background with a MacBook and plants. Natural soft window light from the left creating gentle rim highlights. Shot on Leica Q2 with 50mm lens, shallow depth of field, magazine cover quality, 8K, editorial magazine tone, moody cinematic color grading."
  },
  'woman-blank': {
    filename: 'nova-blank-tshirt.png',
    aspect: '3:4',
    prompt: "Editorial portrait photography of a confident Brazilian woman in her late 20s, natural subtle makeup, shoulder-length dark brown wavy hair. She is wearing a PLAIN BLACK crew neck t-shirt with NO LOGO, NO TEXT, NO GRAPHICS AT ALL - completely empty black fabric on the chest. She is holding a matte black plain ceramic mug (no logo, no design). Slight warm smile. Modern minimalist home office in softly blurred background with a MacBook and plants. Natural soft window light from the left creating gentle rim highlights. Shot on Leica Q2 with 50mm lens, shallow depth of field, magazine cover quality, 8K, editorial magazine tone, moody cinematic color grading. IMPORTANT: t-shirt must be completely plain with no text or logo or print of any kind."
  },
  'nova-portrait-clean': {
    filename: 'nova-portrait-clean.png',
    aspect: '3:4',
    prompt: "Editorial portrait of Brazilian woman late 20s, dark brown wavy shoulder-length hair, natural makeup, confident subtle smile. Wearing a completely plain black crew neck t-shirt (no print, no logo, no graphic, pure black fabric). Minimalist modern home office background softly blurred, MacBook and green plants visible. Soft natural window light from left. Shot on Leica 50mm, shallow DOF, editorial magazine quality 8K. No text anywhere in the image."
  }
};

function callFal(prompt, aspect) {
  const body = JSON.stringify({
    prompt,
    num_images: 1,
    output_format: 'png',
    aspect_ratio: aspect || '1:1'
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'fal.run',
      path: '/' + MODEL,
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          const j = JSON.parse(raw);
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(j).substring(0, 500)}`));
            return;
          }
          resolve(j);
        } catch (e) { reject(new Error(`parse: ${raw.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) { reject(new Error(`DL HTTP ${res.statusCode}`)); return; }
      res.pipe(f);
      f.on('finish', () => { f.close(); resolve(); });
    }).on('error', reject);
  });
}

async function generate(item, aspect) {
  const out = path.join(__dirname, '..', 'brand', 'mockups', item.filename);
  const dir = path.dirname(out);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log(`[fal] ${item.filename} · ${MODEL}`);
  const t0 = Date.now();
  const r = await callFal(item.prompt, aspect || item.aspect);
  const url = r.images?.[0]?.url;
  if (!url) throw new Error('no image url: ' + JSON.stringify(r).substring(0, 200));
  await download(url, out);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`    ✓ ${secs}s · ${kb}KB · ${out}`);
  return out;
}

async function main() {
  const target = process.argv[2] || 'woman-branded';

  if (target === 'all') {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'brand', 'mockup-prompts.json'), 'utf8'));
    for (const item of data.items) {
      const out = path.join(__dirname, '..', 'brand', 'mockups', item.filename);
      if (fs.existsSync(out)) { console.log(`skip ${item.filename}`); continue; }
      try { await generate(item, '16:9'); } catch (e) { console.log(`  ✗ ${e.message}`); }
      await new Promise(r => setTimeout(r, 500));
    }
  } else if (SPECIAL[target]) {
    await generate(SPECIAL[target]);
  } else {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'brand', 'mockup-prompts.json'), 'utf8'));
    const item = data.items.find(i => i.id === target);
    if (!item) { console.error('not found:', target); process.exit(1); }
    await generate(item, '16:9');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
