#!/usr/bin/env node
// Renderiza a logo oficial Pulso da IA em PNG (varios tamanhos)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT_DIR = path.join(__dirname, '..', 'brand', 'assets');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Logo horizontal em orange (fundo transparente)
const logoHorizontalOrange = `<svg width="800" height="320" viewBox="0 0 80 32" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16"
        stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/>
  <circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/>
  <circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/>
</svg>`;

// Logo completo com wordmark (pra mockups de camiseta, caneca, etc)
const logoCompleteWhite = `<svg width="1200" height="300" viewBox="0 0 300 75" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0,22)">
    <path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16"
          stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/>
    <circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/>
    <circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/>
  </g>
  <text x="95" y="48" font-family="Inter, sans-serif" font-size="32" font-weight="400" fill="#FAFAFA">pulso</text>
  <text x="152" y="48" font-family="Inter, sans-serif" font-size="32" font-weight="400" font-style="italic" fill="#A8A8A8">da</text>
  <text x="186" y="48" font-family="Inter, sans-serif" font-size="32" font-weight="700" fill="#FAFAFA">IA</text>
</svg>`;

async function main() {
  // Symbol only (horizontal)
  await sharp(Buffer.from(logoHorizontalOrange))
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'logo-symbol-800.png'));
  console.log('✓ logo-symbol-800.png');

  // Symbol 400px (pra favicon e mockups menores)
  await sharp(Buffer.from(logoHorizontalOrange))
    .resize(400)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'logo-symbol-400.png'));
  console.log('✓ logo-symbol-400.png');

  // Completo com wordmark (white/orange)
  await sharp(Buffer.from(logoCompleteWhite))
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'logo-complete-white-1200.png'));
  console.log('✓ logo-complete-white-1200.png');

  // Versao menor pra camiseta
  await sharp(Buffer.from(logoCompleteWhite))
    .resize(600)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'logo-complete-white-600.png'));
  console.log('✓ logo-complete-white-600.png');

  console.log('\nAll logos rendered to', OUT_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
