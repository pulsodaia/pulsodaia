#!/usr/bin/env node
// Gera variacoes da Nova com ROSTO CONSISTENTE usando Flux Kontext (character reference)
// Base: brand/mockups/nova-portrait-clean.png
// Pra cada variacao, usa essa imagem como input + prompt de edicao de cenario

const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) { console.error('Set FAL_KEY'); process.exit(1); }

const MODEL = process.env.FAL_MODEL || 'fal-ai/flux-pro/kontext';
const BASE_URL = 'https://pulsodaia.pages.dev/brand/mockups/nova-portrait-clean.png';
const OUT = path.join(__dirname, '..', 'brand', 'mockups');

// Prompts de EDICAO (nao geracao do zero) - mantem rosto, muda cenario
const VARIATIONS = [
  { id: 'nova-01-homeoffice', prompt: 'Keep the same woman with same face, same hair, same plain black crew neck t-shirt. Change background to modern minimalist home office with plants and a MacBook in soft focus. Soft natural window light from the left. Editorial magazine quality, 8K.' },
  { id: 'nova-02-headphones', prompt: 'Keep the same woman with same exact face, same hair, same plain black t-shirt. Add premium black over-ear studio headphones on her head. She is focused concentrated, looking off-camera slightly. Dark minimalist workspace background. Subtle warm orange accent light on face. Editorial 8K.' },
  { id: 'nova-03-stage', prompt: 'Keep the same woman with same exact face, same hair, same plain black t-shirt. She is now on a conference stage holding a wireless microphone, mid-gesture speaking. Dramatic stage spot lighting from above. Dark blurred audience in background with subtle orange stage lights. Confident presentation pose. Editorial event photography 8K.' },
  { id: 'nova-04-breaking-news', prompt: 'Keep the same woman with same exact face, same hair, same plain black t-shirt. She is now holding a black smartphone in her hand, looking at the screen with an expression of genuine surprise and interest (as if reading breaking news). Modern cafe background in soft focus. Warm afternoon lighting. Candid editorial style 8K.' },
  { id: 'nova-05-warm-coffee', prompt: 'Keep the same woman with same exact face, same hair, same plain black t-shirt. She is holding a matte black plain ceramic mug close to her face with both hands, with a genuine warm full smile. Steam rising from the mug. Cozy home office background softly blurred with plants. Golden hour warm natural lighting from left. Editorial lifestyle 8K.' },
  { id: 'nova-06-dramatic-profile', prompt: 'Keep the same woman with same exact face, same hair, same plain black t-shirt. Show her in dramatic 3/4 profile angle with serious analytical expression looking into distance. Pure black background. Single sharp rim light from the right creating strong shadow chiaroscuro. Moody cinematic tone. Editorial cover shoot 8K.' },
  { id: 'nova-07-notebook', prompt: 'Keep the same woman with same exact face, same hair, same plain black t-shirt. She is now holding a plain black open notebook and writing in it with a black fountain pen, focused thoughtful expression looking down at notebook. Minimalist dark wood desk. Soft natural window light from side. Warm editorial 8K.' },
  { id: 'nova-08-official-portrait', prompt: 'Keep the same woman with same exact face, same hair, same plain black t-shirt. Professional official headshot. Confident direct gaze to camera, subtle warm smile. Solid charcoal dark grey professional studio background. Professional studio lighting: soft key light from left, fill from right, rim from behind. Executive headshot magazine quality 8K.' }
];

function callKontext(prompt, imageUrl) {
  const body = JSON.stringify({
    prompt,
    image_url: imageUrl,
    guidance_scale: 3.5,
    num_inference_steps: 30,
    output_format: 'png',
    aspect_ratio: '3:4'
  });
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
          if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}: ${raw.substring(0, 400)}`)); return; }
          resolve(j);
        } catch (e) { reject(new Error(`parse: ${raw.substring(0, 300)}`)); }
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
      res.pipe(f); f.on('finish', () => { f.close(); resolve(); });
    }).on('error', reject);
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

async function applyLogo(input, output) {
  const meta = await sharp(input).metadata();
  const logoW = Math.round(meta.width * 0.55);
  const logoBuf = await sharp(Buffer.from(buildLogoSvg(logoW)))
    .blur(0.5).modulate({ brightness: 0.92 }).png().toBuffer();
  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((meta.width - logoMeta.width) / 2);
  const top = Math.round(meta.height * 0.43);
  await sharp(input).composite([{ input: logoBuf, top, left, blend: 'over' }]).png().toFile(output);
}

async function main() {
  console.log(`[kontext] gerando ${VARIATIONS.length} Novas consistentes via ${MODEL}`);
  console.log(`[kontext] base: ${BASE_URL}\n`);

  for (const v of VARIATIONS) {
    const rawPath = path.join(OUT, v.id + '-raw.png');
    const finalPath = path.join(OUT, v.id + '.png');

    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);

    try {
      console.log(`[${v.id}] kontext edit...`);
      const t0 = Date.now();
      const r = await callKontext(v.prompt, BASE_URL);
      const url = r.images?.[0]?.url || r.image?.url;
      if (!url) throw new Error(`no url: ${JSON.stringify(r).substring(0, 200)}`);
      await download(url, rawPath);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[${v.id}]   base ${secs}s · ${(fs.statSync(rawPath).size/1024).toFixed(0)}KB`);

      console.log(`[${v.id}] aplicando logo...`);
      await applyLogo(rawPath, finalPath);
      fs.unlinkSync(rawPath);

      console.log(`[${v.id}] ✓ ${(fs.statSync(finalPath).size/1024).toFixed(0)}KB\n`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`[${v.id}] ✗ ${e.message}\n`);
    }
  }
  console.log('[kontext] concluido');
}

main().catch(e => { console.error(e); process.exit(1); });
