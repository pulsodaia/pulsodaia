#!/usr/bin/env node
// Compositing: aplica logo real Pulso da IA em camiseta de modelo
// Usa PNG pre-renderizado + blend pra parecer impresso
// Uso: node scripts/apply-logo.js <input> <output> [width_ratio] [top_ratio]

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Logo em SVG com tipografia vetorizada (paths dos caracteres)
// Gera em memoria, mais confiavel que font-family em Sharp
// Dimensoes de referencia: 360x80 (proporcao que respira bem)
function buildLogoSvg(width) {
  const height = Math.round(width * 0.22); // proporcao fixa
  return `<svg width="${width}" height="${height}" viewBox="0 0 360 80" xmlns="http://www.w3.org/2000/svg">
    <!-- Symbol: pulse wave + 3 dots -->
    <g transform="translate(0, 24)">
      <path d="M4 16 L14 16 L18 4 L24 28 L30 10 L36 22 L42 14 L48 20 L56 16 L66 16"
            stroke="#FF5E1F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="72" cy="16" r="2.5" fill="#FF5E1F"/>
      <circle cx="79" cy="16" r="2.5" fill="#FF5E1F" opacity="0.6"/>
      <circle cx="86" cy="16" r="2.5" fill="#FF5E1F" opacity="0.3"/>
    </g>
    <!-- Wordmark: "pulso" regular + "da" italic + "IA" bold -->
    <!-- Usa system-ui como fallback pra Inter/Helvetica nativa -->
    <text x="100" y="54" font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="34" font-weight="400" fill="#FAFAFA" letter-spacing="-0.5">pulso</text>
    <text x="190" y="54" font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="34" font-style="italic" font-weight="400" fill="#FFFFFF" fill-opacity="0.55" letter-spacing="-0.5">da</text>
    <text x="232" y="54" font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="34" font-weight="700" fill="#FAFAFA" letter-spacing="-1">IA</text>
  </svg>`;
}

async function main() {
  const input = process.argv[2];
  const output = process.argv[3];
  const logoWidthRatio = parseFloat(process.argv[4]) || 0.60;
  const logoTopRatio = parseFloat(process.argv[5]) || 0.42;

  if (!input || !output) {
    console.error('Uso: node apply-logo.js input.png output.png [0.60] [0.42]');
    process.exit(1);
  }

  const meta = await sharp(input).metadata();
  const { width, height } = meta;
  const logoW = Math.round(width * logoWidthRatio);
  const logoSvg = buildLogoSvg(logoW);
  const logoBuf = await sharp(Buffer.from(logoSvg))
    .blur(0.5)  // soften edges (printed feel)
    .modulate({ brightness: 0.92 })  // 8% darker (fabric absorb light)
    .png()
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round(height * logoTopRatio);

  console.log(`[apply] ${width}x${height} · logo ${logoMeta.width}x${logoMeta.height} @ (${left},${top})`);

  await sharp(input)
    .composite([{ input: logoBuf, top, left, blend: 'over' }])
    .png({ compressionLevel: 9 })
    .toFile(output);

  const kb = (fs.statSync(output).size / 1024).toFixed(0);
  console.log(`[apply] ✓ ${output} (${kb}KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
