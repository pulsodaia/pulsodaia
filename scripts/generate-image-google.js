#!/usr/bin/env node
// Gera imagens via Google AI Studio (Imagen 4)
// Uso: GOOGLE_API_KEY=xxx node scripts/generate-image-google.js [prompt-id]
//      onde prompt-id eh o id do item em brand/mockup-prompts.json
//      ou 'woman-branded' pra gerar so a mulher com logo

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_API_KEY;
// nano-banana (free tier) = gemini-2.5-flash-image
// imagen 4 (paid) = imagen-4.0-generate-001
const MODEL = process.env.GOOGLE_MODEL || 'gemini-2.5-flash-image';
const ASPECT = process.env.ASPECT || '3:4';

if (!API_KEY) {
  console.error('Set GOOGLE_API_KEY env var');
  process.exit(1);
}

const SPECIAL_PROMPTS = {
  'woman-branded': {
    filename: 'woman-branded-portrait.png',
    aspect: '3:4',
    prompt: "Editorial portrait photography of a confident Brazilian woman in her late 20s, natural subtle makeup, shoulder-length dark brown wavy hair. She is wearing a premium black crew neck t-shirt with the 'pulsodaIA' wordmark and a minimal orange pulse wave logo (Pulse Orange #FF5E1F) printed across the chest. She is holding a matte black ceramic mug with the same orange pulse wave symbol, about to drink coffee. Slight warm smile. Modern minimalist home office in softly blurred background with a laptop and plants. Natural soft window light from the left creating gentle rim highlights. Shot on Leica Q2 with a 50mm lens, shallow depth of field, magazine cover quality, 8K resolution, editorial magazine tone, dark moody cinematic color grading."
  }
};

async function generate(prompt, aspect, outPath) {
  const isImagen = MODEL.startsWith('imagen');
  let body, apiPath;

  if (isImagen) {
    body = JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: aspect, personGeneration: 'ALLOW_ADULT' }
    });
    apiPath = `/v1beta/models/${MODEL}:predict?key=${API_KEY}`;
  } else {
    // Gemini native image generation (nano-banana)
    body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect } }
    });
    apiPath = `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  }

  const opts = {
    hostname: 'generativelanguage.googleapis.com',
    path: apiPath,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          const j = JSON.parse(raw);
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${j.error?.message || raw.substring(0, 300)}`));
            return;
          }
          let b64;
          if (isImagen) {
            b64 = j.predictions?.[0]?.bytesBase64Encoded;
          } else {
            const parts = j.candidates?.[0]?.content?.parts || [];
            const imgPart = parts.find(p => p.inlineData?.data);
            b64 = imgPart?.inlineData?.data;
          }
          if (!b64) {
            reject(new Error(`no image: ${raw.substring(0, 400)}`));
            return;
          }
          fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
          resolve({ path: outPath, size: fs.statSync(outPath).size });
        } catch (e) { reject(new Error(`parse: ${e.message} · raw: ${raw.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const OUT = path.join(__dirname, '..', 'brand', 'mockups');
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const target = process.argv[2] || 'woman-branded';

  if (SPECIAL_PROMPTS[target]) {
    const spec = SPECIAL_PROMPTS[target];
    const out = path.join(OUT, spec.filename);
    console.log(`[gen] ${target} · ${MODEL} · ${spec.aspect}`);
    console.log(`[gen] saving to: ${out}\n`);
    try {
      const t0 = Date.now();
      const r = await generate(spec.prompt, spec.aspect, out);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      const kb = (r.size / 1024).toFixed(0);
      console.log(`✓ OK · ${secs}s · ${kb}KB`);
      console.log(`  ${r.path}`);
    } catch (e) {
      console.error(`✗ ERR: ${e.message}`);
      process.exit(1);
    }
    return;
  }

  // prompt from file
  const prompts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'brand', 'mockup-prompts.json'), 'utf8'));
  const item = prompts.items.find(i => i.id === target);
  if (!item) {
    console.error(`Prompt id "${target}" nao encontrado`);
    console.error('Ids disponiveis:', prompts.items.map(i => i.id).join(', '));
    process.exit(1);
  }
  const out = path.join(OUT, item.filename);
  console.log(`[gen] ${item.id} · ${MODEL}`);
  try {
    const r = await generate(item.prompt, ASPECT, out);
    const kb = (r.size / 1024).toFixed(0);
    console.log(`✓ ${kb}KB · ${r.path}`);
  } catch (e) {
    console.error(`✗ ERR: ${e.message}`);
    process.exit(1);
  }
}

main();
