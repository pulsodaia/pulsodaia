#!/usr/bin/env node
// Render de cards Instagram 1080x1080 em PNG a partir dos roteiros em social/{slug}/instagram.md
// Usa Sharp + SVG compositing (sem Puppeteer — rapido e leve).
//
// Uso:
//   node scripts/render-ig-cards.js                         # render todos artigos sem cards PNG ainda
//   node scripts/render-ig-cards.js --slug=abc              # so o slug abc
//   node scripts/render-ig-cards.js --force                 # regenera todos

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOCIAL_DIR = path.join(ROOT, 'social');
const PUBLIC_CARDS_DIR = path.join(ROOT, 'assets', 'ig-cards'); // deployado publico
const PUBLIC_CARDS_URL = 'https://pulsodaia.com.br/assets/ig-cards';

const BG = '#0A0A0A';
const FG = '#FAFAFA';
const ACCENT = '#FF5E1F';
const CARD_SIZE = 1080;

const CTA_WHATSAPP = process.env.CTA_WHATSAPP || '+55 19 98380-5908';
const CTA_KEYWORD = process.env.CTA_KEYWORD || 'PULSE';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseInstagramMd(md) {
  const cards = [];
  const cardRegex = /---CARD\s+(\d+)[^-]*---([\s\S]*?)(?=---CARD\s+\d+|---\s*##|\n##\s|$)/gi;
  let m;
  while ((m = cardRegex.exec(md)) !== null) {
    cards.push({ n: parseInt(m[1]), raw: m[2].trim() });
  }
  return cards;
}

function parseCardContent(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const parts = { title: '', subtitle: '', body: '' };
  if (lines.length === 0) return parts;
  const cleanLines = lines.filter(l => !/^emoji/i.test(l) && !/^\*\*/.test(l));

  if (cleanLines[0] && cleanLines[0].length <= 80) {
    parts.title = cleanLines[0];
    if (cleanLines[1] && cleanLines[1].length <= 120) {
      parts.subtitle = cleanLines[1];
    }
    parts.body = cleanLines.slice(parts.subtitle ? 2 : 1).join(' ').trim();
  } else {
    parts.body = cleanLines.join(' ').trim();
  }
  return parts;
}

function wrapText(text, maxLength) {
  const words = String(text || '').split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function renderCoverSvg({ title, subtitle, category, cardNum, totalCards }) {
  const titleLines = wrapText(title, 22).slice(0, 4);
  const lineHeight = 100;
  const startY = 340;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_SIZE}" height="${CARD_SIZE}" viewBox="0 0 ${CARD_SIZE} ${CARD_SIZE}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0A0A0A"/>
        <stop offset="100%" stop-color="#1a1a1a"/>
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${ACCENT}"/>
        <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${CARD_SIZE}" height="${CARD_SIZE}" fill="url(#bgGrad)"/>
    <rect x="0" y="0" width="${CARD_SIZE}" height="8" fill="url(#accentGrad)"/>
    <g transform="translate(72, 96)">
      <path d="M 0 20 L 40 20 L 54 -4 L 72 44 L 92 10 L 110 32 L 130 16 L 154 24 L 180 20 L 220 20" stroke="${ACCENT}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <circle cx="238" cy="20" r="3.5" fill="${ACCENT}"/>
      <circle cx="252" cy="20" r="3.5" fill="${ACCENT}" opacity="0.6"/>
      <circle cx="266" cy="20" r="3.5" fill="${ACCENT}" opacity="0.3"/>
      <text x="290" y="28" font-family="Georgia, serif" font-size="40" font-weight="400" fill="${FG}">pulso<tspan font-style="italic" fill="#ffffff80">da</tspan><tspan font-weight="700">IA</tspan></text>
    </g>
    <text x="72" y="230" font-family="'Courier New', monospace" font-size="24" font-weight="700" letter-spacing="4" fill="${ACCENT}">${esc((category || 'NOTICIA').toUpperCase())}</text>
    ${titleLines.map((line, i) => `<text x="72" y="${startY + i * lineHeight}" font-family="Georgia, serif" font-size="80" font-weight="600" fill="${FG}" letter-spacing="-2">${esc(line)}</text>`).join('\n    ')}
    ${subtitle ? `<text x="72" y="${CARD_SIZE - 220}" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#ffffffaa" letter-spacing="-0.5">${wrapText(subtitle, 40).slice(0, 2).map((l, i) => `<tspan x="72" dy="${i === 0 ? 0 : 44}">${esc(l)}</tspan>`).join('')}</text>` : ''}
    <rect x="72" y="${CARD_SIZE - 120}" width="${CARD_SIZE - 144}" height="1" fill="#ffffff30"/>
    <text x="72" y="${CARD_SIZE - 70}" font-family="'Courier New', monospace" font-size="22" letter-spacing="2" fill="#ffffff80">PULSODAIA.COM.BR</text>
    <text x="${CARD_SIZE - 72}" y="${CARD_SIZE - 70}" text-anchor="end" font-family="'Courier New', monospace" font-size="22" letter-spacing="2" fill="${ACCENT}">${cardNum} / ${totalCards}</text>
  </svg>`;
}

function renderInsightSvg({ body, category, cardNum, totalCards }) {
  const bodyLines = wrapText(body, 30).slice(0, 11);
  const lineHeight = 62;
  const startY = 340;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_SIZE}" height="${CARD_SIZE}" viewBox="0 0 ${CARD_SIZE} ${CARD_SIZE}">
    <rect width="${CARD_SIZE}" height="${CARD_SIZE}" fill="${BG}"/>
    <rect x="0" y="0" width="8" height="${CARD_SIZE}" fill="${ACCENT}"/>
    <g transform="translate(72, 96)">
      <path d="M 0 20 L 40 20 L 54 -4 L 72 44 L 92 10 L 110 32 L 130 16 L 154 24 L 180 20 L 220 20" stroke="${ACCENT}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <circle cx="238" cy="20" r="3.5" fill="${ACCENT}"/>
      <circle cx="252" cy="20" r="3.5" fill="${ACCENT}" opacity="0.6"/>
      <circle cx="266" cy="20" r="3.5" fill="${ACCENT}" opacity="0.3"/>
      <text x="290" y="28" font-family="Georgia, serif" font-size="40" font-weight="400" fill="${FG}">pulso<tspan font-style="italic" fill="#ffffff80">da</tspan><tspan font-weight="700">IA</tspan></text>
    </g>
    <text x="72" y="240" font-family="'Courier New', monospace" font-size="22" font-weight="700" letter-spacing="4" fill="${ACCENT}">${esc((category || 'CONTEXTO').toUpperCase())}</text>
    ${bodyLines.map((line, i) => `<text x="72" y="${startY + i * lineHeight}" font-family="Georgia, serif" font-size="48" font-weight="400" fill="${FG}" letter-spacing="-0.5">${esc(line)}</text>`).join('\n    ')}
    <rect x="72" y="${CARD_SIZE - 120}" width="${CARD_SIZE - 144}" height="1" fill="#ffffff30"/>
    <text x="72" y="${CARD_SIZE - 70}" font-family="'Courier New', monospace" font-size="22" letter-spacing="2" fill="#ffffff80">PULSODAIA.COM.BR</text>
    <text x="${CARD_SIZE - 72}" y="${CARD_SIZE - 70}" text-anchor="end" font-family="'Courier New', monospace" font-size="22" letter-spacing="2" fill="${ACCENT}">${cardNum} / ${totalCards}</text>
  </svg>`;
}

function renderCtaSvg({ cardNum, totalCards }) {
  const steps = [
    { n: '1', text: `Abre o WhatsApp ${CTA_WHATSAPP}` },
    { n: '2', text: `Digita ${CTA_KEYWORD}` },
    { n: '3', text: 'Recebe 2 mil+ skills de IA' }
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_SIZE}" height="${CARD_SIZE}" viewBox="0 0 ${CARD_SIZE} ${CARD_SIZE}">
    <defs>
      <linearGradient id="ctaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${ACCENT}"/>
        <stop offset="100%" stop-color="#cc4717"/>
      </linearGradient>
    </defs>
    <rect width="${CARD_SIZE}" height="${CARD_SIZE}" fill="${BG}"/>
    <rect x="0" y="0" width="${CARD_SIZE}" height="240" fill="url(#ctaGrad)"/>
    <g transform="translate(72, 96)">
      <path d="M 0 20 L 40 20 L 54 -4 L 72 44 L 92 10 L 110 32 L 130 16 L 154 24 L 180 20 L 220 20" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <circle cx="238" cy="20" r="3.5" fill="#ffffff"/>
      <circle cx="252" cy="20" r="3.5" fill="#ffffff" opacity="0.6"/>
      <circle cx="266" cy="20" r="3.5" fill="#ffffff" opacity="0.3"/>
      <text x="290" y="28" font-family="Georgia, serif" font-size="40" font-weight="400" fill="#ffffff">pulso<tspan font-style="italic" fill="#ffffffcc">da</tspan><tspan font-weight="700">IA</tspan></text>
    </g>
    <text x="72" y="190" font-family="'Courier New', monospace" font-size="22" font-weight="700" letter-spacing="4" fill="#ffffff">BONUS</text>
    <text x="72" y="380" font-family="Georgia, serif" font-size="88" font-weight="600" fill="${FG}" letter-spacing="-2">Quer a biblioteca</text>
    <text x="72" y="478" font-family="Georgia, serif" font-size="88" font-weight="600" font-style="italic" fill="${ACCENT}" letter-spacing="-2">completa?</text>
    ${steps.map((s, i) => `
    <g transform="translate(72, ${600 + i * 100})">
      <circle cx="30" cy="0" r="30" fill="${ACCENT}"/>
      <text x="30" y="12" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="700" fill="${BG}">${s.n}</text>
      <text x="90" y="12" font-family="Georgia, serif" font-size="34" fill="${FG}">${esc(s.text)}</text>
    </g>`).join('')}
    <rect x="72" y="${CARD_SIZE - 120}" width="${CARD_SIZE - 144}" height="1" fill="#ffffff30"/>
    <text x="72" y="${CARD_SIZE - 70}" font-family="'Courier New', monospace" font-size="22" letter-spacing="2" fill="#ffffff80">PULSODAIA.COM.BR</text>
    <text x="${CARD_SIZE - 72}" y="${CARD_SIZE - 70}" text-anchor="end" font-family="'Courier New', monospace" font-size="22" letter-spacing="2" fill="${ACCENT}">${cardNum} / ${totalCards}</text>
  </svg>`;
}

async function renderCardsForSlug(slug, opts = {}) {
  const mdPath = path.join(SOCIAL_DIR, slug, 'instagram.md');
  if (!fs.existsSync(mdPath)) return { skipped: true, reason: 'no instagram.md' };

  const md = fs.readFileSync(mdPath, 'utf8');
  const cards = parseInstagramMd(md);
  if (cards.length === 0) return { skipped: true, reason: 'no cards parsed' };

  const metaPath = path.join(SOCIAL_DIR, slug, 'meta.json');
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
  const category = meta.article_category || 'PULSO';

  const outDir = path.join(SOCIAL_DIR, slug);
  const publicDir = path.join(PUBLIC_CARDS_DIR, slug);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const totalCards = cards.length;
  const results = [];

  for (const card of cards) {
    const outFile = path.join(outDir, `card-${card.n}.png`);
    const publicFile = path.join(publicDir, `card-${card.n}.png`);
    if (!opts.force && fs.existsSync(outFile) && fs.existsSync(publicFile)) {
      results.push({ card: card.n, status: 'exists', url: `${PUBLIC_CARDS_URL}/${slug}/card-${card.n}.png` });
      continue;
    }

    const parsed = parseCardContent(card.raw);
    let svg;
    if (card.n === 1) {
      svg = renderCoverSvg({
        title: parsed.title || meta.article_headline || 'Pulso da IA',
        subtitle: parsed.subtitle || '',
        category, cardNum: card.n, totalCards
      });
    } else if (card.n === totalCards) {
      svg = renderCtaSvg({ cardNum: card.n, totalCards });
    } else {
      svg = renderInsightSvg({
        body: parsed.body || parsed.title || '',
        category, cardNum: card.n, totalCards
      });
    }

    try {
      const buf = await sharp(Buffer.from(svg)).png({ quality: 90, compressionLevel: 9 }).toBuffer();
      fs.writeFileSync(outFile, buf);
      fs.writeFileSync(publicFile, buf);
      results.push({ card: card.n, status: 'rendered', bytes: buf.length, url: `${PUBLIC_CARDS_URL}/${slug}/card-${card.n}.png` });
    } catch (e) {
      results.push({ card: card.n, status: 'error', error: e.message });
    }
  }

  return { slug, cards: results };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const slugFilter = (args.find(a => a.startsWith('--slug=')) || '').split('=')[1];

  if (!fs.existsSync(SOCIAL_DIR)) { console.log('[render] social/ nao existe'); return; }

  const slugs = fs.readdirSync(SOCIAL_DIR).filter(d => fs.statSync(path.join(SOCIAL_DIR, d)).isDirectory());
  const targets = slugFilter ? [slugFilter] : slugs;

  console.log(`[render] ${targets.length} artigo(s) a processar (force=${force})\n`);

  let ok = 0, skip = 0, err = 0;
  for (const slug of targets) {
    const result = await renderCardsForSlug(slug, { force });
    if (result.skipped) {
      console.log(`  - ${slug}: ${result.reason}`);
      skip++;
      continue;
    }
    const status = result.cards.map(c => `c${c.card}=${c.status}`).join(' ');
    console.log(`  ✓ ${slug}: ${status}`);
    ok++;
    for (const c of result.cards) if (c.status === 'error') err++;
  }

  console.log(`\n[render] ok=${ok} skip=${skip} errors=${err}`);
}

main().catch(e => { console.error(e); process.exit(1); });
