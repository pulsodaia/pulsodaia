#!/usr/bin/env node
// Re-gera as 8 Novas com logo correto (apos fix do apply-logo.js)
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

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

function buildLogoSvg(width) {
  return `<svg width="${width}" height="${Math.round(width * 0.22)}" viewBox="0 0 360 80" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 24)">
      <path d="M4 16 L14 16 L18 4 L24 28 L30 10 L36 22 L42 14 L48 20 L56 16 L66 16" stroke="#FF5E1F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="72" cy="16" r="2.5" fill="#FF5E1F"/>
      <circle cx="79" cy="16" r="2.5" fill="#FF5E1F" opacity="0.6"/>
      <circle cx="86" cy="16" r="2.5" fill="#FF5E1F" opacity="0.3"/>
    </g>
    <text x="100" y="54" font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="34" font-weight="400" fill="#FAFAFA" letter-spacing="-0.5">pulso</text>
    <text x="190" y="54" font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="34" font-style="italic" font-weight="400" fill="#FFFFFF" fill-opacity="0.55" letter-spacing="-0.5">da</text>
    <text x="232" y="54" font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="34" font-weight="700" fill="#FAFAFA" letter-spacing="-1">IA</text>
  </svg>`;
}

async function applyLogo(input, output, widthRatio = 0.60, topRatio = 0.42) {
  const meta = await sharp(input).metadata();
  const logoW = Math.round(meta.width * widthRatio);
  const logoBuf = await sharp(Buffer.from(buildLogoSvg(logoW)))
    .blur(0.5).modulate({ brightness: 0.92 }).png().toBuffer();
  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((meta.width - logoMeta.width) / 2);
  const top = Math.round(meta.height * topRatio);
  await sharp(input).composite([{ input: logoBuf, top, left, blend: 'over' }]).png().toFile(output);
}

async function main() {
  console.log(`[nova] re-gerando ${PROMPTS.items.length} Novas\n`);
  for (const item of PROMPTS.items) {
    const rawPath = path.join(OUT, item.filename.replace('.png', '-raw.png'));
    const finalPath = path.join(OUT, item.filename);

    // Remove old versions
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);

    try {
      console.log(`[${item.id}] gerando base...`);
      const r = await callFal(item.prompt, item.aspect);
      const url = r.images?.[0]?.url;
      if (!url) throw new Error('no url');
      await download(url, rawPath);

      console.log(`[${item.id}] aplicando logo...`);
      await applyLogo(rawPath, finalPath, 0.55, 0.43);
      fs.unlinkSync(rawPath);

      console.log(`[${item.id}] ✓ ${(fs.statSync(finalPath).size/1024).toFixed(0)}KB\n`);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`[${item.id}] ✗ ${e.message}\n`);
    }
  }
  console.log('[nova] concluido');
}

main().catch(e => { console.error(e); process.exit(1); });
