#!/usr/bin/env node
// Gera 8 variacoes da persona Nova via FAL Imagen 4 + aplica logo real
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');
const { spawn } = require('child_process');

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) { console.error('Set FAL_KEY'); process.exit(1); }

const MODEL = 'fal-ai/imagen4/preview';
const PROMPTS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'brand', 'nova-prompts.json'), 'utf8'));
const OUT = path.join(__dirname, '..', 'brand', 'mockups');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

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
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          const j = JSON.parse(raw);
          if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(j).substring(0, 300)}`)); return; }
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

async function applyLogo(inputPath, outputPath, logoWidthRatio = 0.50, logoTopRatio = 0.54) {
  const meta = await sharp(inputPath).metadata();
  const { width, height } = meta;
  const logoW = Math.round(width * logoWidthRatio);
  const logoH = Math.round(logoW * (75 / 300));
  const logoSvg = `<svg width="${logoW}" height="${logoH}" viewBox="0 0 300 75" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0,22)">
      <path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16" stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/>
      <circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/>
      <circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/>
    </g>
    <text x="95" y="48" font-family="Arial, sans-serif" font-size="32" font-weight="400" fill="#FAFAFA">pulso</text>
    <text x="155" y="48" font-family="Arial, sans-serif" font-size="32" font-weight="400" font-style="italic" fill="#A8A8A8">da</text>
    <text x="190" y="48" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#FAFAFA">IA</text>
  </svg>`;
  const logoBuf = await sharp(Buffer.from(logoSvg)).blur(0.3).modulate({ brightness: 0.95 }).png().toBuffer();
  const left = Math.round((width - logoW) / 2);
  const top = Math.round(height * logoTopRatio);
  await sharp(inputPath).composite([{ input: logoBuf, top, left, blend: 'over' }]).png().toFile(outputPath);
}

async function main() {
  console.log(`[nova] ${PROMPTS.items.length} variacoes · ${MODEL}\n`);
  for (const item of PROMPTS.items) {
    const rawPath = path.join(OUT, item.filename.replace('.png', '-raw.png'));
    const finalPath = path.join(OUT, item.filename);

    if (fs.existsSync(finalPath)) { console.log(`[skip] ${item.id}`); continue; }

    try {
      // Gerar via FAL
      const t0 = Date.now();
      const r = await callFal(item.prompt, item.aspect);
      const url = r.images?.[0]?.url;
      if (!url) throw new Error('no url');
      await download(url, rawPath);
      const genSecs = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[gen] ${item.id}: ${genSecs}s · ${(fs.statSync(rawPath).size/1024).toFixed(0)}KB`);

      // Aplicar logo real
      await applyLogo(rawPath, finalPath, 0.50, 0.55);
      console.log(`[logo] ${item.id}: logo aplicada · ${(fs.statSync(finalPath).size/1024).toFixed(0)}KB`);

      // Deletar raw (mantem so a final com logo)
      fs.unlinkSync(rawPath);

      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`[err] ${item.id}: ${e.message}`);
    }
  }
  console.log('\n[nova] concluido');
}

main().catch(e => { console.error(e); process.exit(1); });
