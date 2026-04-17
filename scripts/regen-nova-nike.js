#!/usr/bin/env node
// Regenera as 8 Novas com estilo Nike (simbolo pequeno peito esquerdo)
const fs = require('fs');
const path = require('path');
const https = require('https');
const { apply } = require('./apply-brand');

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) { console.error('Set FAL_KEY'); process.exit(1); }

const MODEL = 'fal-ai/imagen4/preview';
const PROMPTS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'brand', 'nova-prompts.json'), 'utf8'));
const OUT = path.join(__dirname, '..', 'brand', 'mockups');

function callFal(prompt, aspect) {
  const body = JSON.stringify({ prompt, num_images: 1, output_format: 'png', aspect_ratio: aspect || '3:4' });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'fal.run', path: '/' + MODEL, method: 'POST',
      headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const j = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (res.statusCode !== 200) { reject(new Error(JSON.stringify(j).substring(0, 300))); return; }
          resolve(j);
        } catch (e) { reject(e); }
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
    https.get(url, res => { res.pipe(f); f.on('finish', () => { f.close(); resolve(); }); }).on('error', reject);
  });
}

async function main() {
  console.log(`[nike] regerando ${PROMPTS.items.length} Novas com estilo Nike\n`);
  for (const item of PROMPTS.items) {
    const rawPath = path.join(OUT, item.filename.replace('.png', '-raw.png'));
    const finalPath = path.join(OUT, item.filename);

    try {
      console.log(`[${item.id}] gerando base...`);
      const r = await callFal(item.prompt, item.aspect);
      const url = r.images?.[0]?.url;
      if (!url) throw new Error('no url');
      await download(url, rawPath);

      console.log(`[${item.id}] aplicando logo Nike...`);
      await apply(rawPath, finalPath, 'tshirt-front-chest');
      fs.unlinkSync(rawPath);

      console.log(`[${item.id}] ✓\n`);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`[${item.id}] ✗ ${e.message}\n`);
    }
  }
  console.log('[nike] concluido');
}

main().catch(e => { console.error(e); process.exit(1); });
