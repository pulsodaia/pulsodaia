#!/usr/bin/env node
// Sistema universal de aplicacao da marca Pulso da IA
// Aplica logo correta em qualquer mockup baseado na biblioteca brand-applications.json
//
// Uso:
//   node scripts/apply-brand.js <input.png> <output.png> <type>
//   node scripts/apply-brand.js <input.png> <output.png> <type> --variant wordmark-white --scale 1.0
//
// Tipos disponiveis: tshirt-front-chest, mug-side, cap-front, facade-illuminated, etc.
// Lista completa em brand/brand-applications.json

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const APPS_FILE = path.join(__dirname, '..', 'brand', 'brand-applications.json');
const APPS = JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));

function buildLogoSvg(width, variant) {
  const h = Math.round(width * 0.22);

  const variants = {
    'wordmark-white': {
      wordColor: '#FAFAFA', daColor: 'rgba(255,255,255,0.55)', iaColor: '#FAFAFA', strokeColor: '#FF5E1F'
    },
    'wordmark-black': {
      wordColor: '#0A0A0A', daColor: 'rgba(10,10,10,0.55)', iaColor: '#0A0A0A', strokeColor: '#FF5E1F'
    },
    'wordmark-orange': {
      wordColor: '#FF5E1F', daColor: 'rgba(255,94,31,0.55)', iaColor: '#FF5E1F', strokeColor: '#FF5E1F'
    }
  };

  const v = variants[variant] || variants['wordmark-white'];

  if (variant === 'symbol-only-orange' || variant === 'symbol-only-white') {
    const color = variant === 'symbol-only-white' ? '#FAFAFA' : '#FF5E1F';
    const symbolW = width;
    const symbolH = Math.round(width * 0.40);
    return `<svg width="${symbolW}" height="${symbolH}" viewBox="0 0 80 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16"
            stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="68" cy="16" r="2.2" fill="${color}"/>
      <circle cx="73" cy="16" r="2.2" fill="${color}" opacity="0.6"/>
      <circle cx="78" cy="16" r="2.2" fill="${color}" opacity="0.3"/>
    </svg>`;
  }

  if (variant === 'stacked-white' || variant === 'stacked-orange') {
    // Symbol em cima + wordmark embaixo, centralizados
    const isOrange = variant === 'stacked-orange';
    const textColor = isOrange ? '#FF5E1F' : '#FAFAFA';
    const daColor = isOrange ? 'rgba(255,94,31,0.55)' : 'rgba(255,255,255,0.55)';
    const stackedH = Math.round(width * 0.58);
    return `<svg width="${width}" height="${stackedH}" viewBox="0 0 200 115" xmlns="http://www.w3.org/2000/svg">
      <!-- Symbol centralizado -->
      <g transform="translate(57, 10)">
        <path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16"
              stroke="#FF5E1F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="68" cy="16" r="3" fill="#FF5E1F"/>
        <circle cx="75" cy="16" r="3" fill="#FF5E1F" opacity="0.6"/>
        <circle cx="82" cy="16" r="3" fill="#FF5E1F" opacity="0.3"/>
      </g>
      <!-- Wordmark centralizado embaixo -->
      <g transform="translate(0, 75)">
        <text x="38" y="30" font-family="system-ui, Arial, sans-serif" font-size="26" font-weight="400" fill="${textColor}" letter-spacing="-0.5">pulso</text>
        <text x="108" y="30" font-family="system-ui, Arial, sans-serif" font-size="26" font-style="italic" font-weight="400" fill="${daColor}" letter-spacing="-0.5">da</text>
        <text x="140" y="30" font-family="system-ui, Arial, sans-serif" font-size="26" font-weight="700" fill="${textColor}" letter-spacing="-1">IA</text>
      </g>
    </svg>`;
  }

  return `<svg width="${width}" height="${h}" viewBox="0 0 360 80" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 24)">
      <path d="M4 16 L14 16 L18 4 L24 28 L30 10 L36 22 L42 14 L48 20 L56 16 L66 16"
            stroke="${v.strokeColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="72" cy="16" r="2.5" fill="${v.strokeColor}"/>
      <circle cx="79" cy="16" r="2.5" fill="${v.strokeColor}" opacity="0.6"/>
      <circle cx="86" cy="16" r="2.5" fill="${v.strokeColor}" opacity="0.3"/>
    </g>
    <text x="100" y="54" font-family="system-ui, Arial, sans-serif" font-size="34" font-weight="400" fill="${v.wordColor}" letter-spacing="-0.5">pulso</text>
    <text x="190" y="54" font-family="system-ui, Arial, sans-serif" font-size="34" font-style="italic" font-weight="400" fill="${v.daColor}" letter-spacing="-0.5">da</text>
    <text x="232" y="54" font-family="system-ui, Arial, sans-serif" font-size="34" font-weight="700" fill="${v.iaColor}" letter-spacing="-1">IA</text>
  </svg>`;
}

async function makeLogoBuffer(width, variant, opts = {}) {
  let pipeline = sharp(Buffer.from(buildLogoSvg(width, variant)));
  if (opts.blur && opts.blur > 0) pipeline = pipeline.blur(opts.blur);
  if (opts.brightness && opts.brightness !== 1) pipeline = pipeline.modulate({ brightness: opts.brightness });

  if (opts.rounded) {
    const buf = await pipeline.png().toBuffer();
    const meta = await sharp(buf).metadata();
    const size = Math.max(meta.width, meta.height);
    // Criar canvas circular com logo centralizado
    const bg = variant.includes('orange') ? '#FFFFFF' : (variant.includes('black') ? '#FAFAFA' : '#0A0A0A');
    const svg = `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${bg}"/></svg>`;
    pipeline = sharp(Buffer.from(svg)).composite([{ input: buf, gravity: 'center' }]);
  }

  return await pipeline.png().toBuffer();
}

async function apply(inputPath, outputPath, typeKey, overrides = {}) {
  const config = APPS.types[typeKey];
  if (!config) {
    console.error(`Tipo "${typeKey}" nao existe. Disponiveis:`);
    Object.keys(APPS.types).forEach(k => console.error(`  ${k} — ${APPS.types[k].label}`));
    process.exit(1);
  }

  const finalConfig = { ...config, ...overrides };
  const meta = await sharp(inputPath).metadata();
  const { width, height } = meta;

  const logoW = Math.round(width * finalConfig.width);
  const logoBuf = await makeLogoBuffer(logoW, finalConfig.variant, {
    blur: finalConfig.blur || 0,
    brightness: finalConfig.brightness || 1,
    rounded: finalConfig.rounded || false
  });

  const logoMeta = await sharp(logoBuf).metadata();

  let left;
  if (finalConfig.anchor === 'left') {
    left = Math.round(width * finalConfig.x);
  } else if (finalConfig.anchor === 'right') {
    left = Math.round(width * finalConfig.x - logoMeta.width);
  } else {
    left = Math.round(width * finalConfig.x - logoMeta.width / 2);
  }
  const top = Math.round(height * finalConfig.y - logoMeta.height / 2);

  console.log(`[brand] ${typeKey} · ${width}x${height} · logo ${logoMeta.width}x${logoMeta.height} @ (${left},${top}) · variant=${finalConfig.variant}`);

  await sharp(inputPath)
    .composite([{ input: logoBuf, top: Math.max(0, top), left: Math.max(0, left), blend: finalConfig.blend || 'over' }])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  const kb = (fs.statSync(outputPath).size / 1024).toFixed(0);
  console.log(`[brand] ✓ ${outputPath} (${kb}KB)`);
}

function parseArgs(argv) {
  const pos = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      opts[key] = argv[++i];
    } else {
      pos.push(arg);
    }
  }
  return { pos, opts };
}

async function listTypes() {
  console.log('Tipos de aplicacao disponiveis:\n');
  Object.entries(APPS.types).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(30)} — ${v.label}`);
  });
  console.log('\nVariantes de logo:\n');
  Object.entries(APPS._variants).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(25)} — ${v}`);
  });
}

async function main() {
  const { pos, opts } = parseArgs(process.argv.slice(2));

  if (pos.length === 0 || pos[0] === 'list' || pos[0] === '--help') {
    return listTypes();
  }

  if (pos.length < 3) {
    console.error('Uso: node apply-brand.js <input> <output> <type> [--variant X] [--scale N]');
    console.error('   ou: node apply-brand.js list');
    process.exit(1);
  }

  const [input, output, type] = pos;
  const overrides = {};
  if (opts.variant) overrides.variant = opts.variant;
  if (opts.scale) overrides.width = (APPS.types[type]?.width || 0.5) * parseFloat(opts.scale);
  if (opts.x) overrides.x = parseFloat(opts.x);
  if (opts.y) overrides.y = parseFloat(opts.y);

  await apply(input, output, type, overrides);
}

module.exports = { apply, makeLogoBuffer, buildLogoSvg };

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
