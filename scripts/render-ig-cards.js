#!/usr/bin/env node
// Render de cards Instagram 1080x1080 com variacoes visuais por TYPE.
// Le roteiro tipado em social/{slug}/instagram.md e gera carousel 2-10 cards.
//
// Tipos suportados: COVER, COVER_HERO, INSIGHT, STAT, QUOTE, LIST, TIMELINE, COMPARISON, SOURCE, CTA
//
// Uso:
//   node scripts/render-ig-cards.js                         # render todos artigos
//   node scripts/render-ig-cards.js --slug=abc              # so 1 slug
//   node scripts/render-ig-cards.js --force                 # regenera todos

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOCIAL_DIR = path.join(ROOT, 'social');
const FEED_DIR = path.join(ROOT, 'feed');
const PUBLIC_CARDS_DIR = path.join(ROOT, 'assets', 'ig-cards');
const PUBLIC_CARDS_URL = 'https://pulsodaia.com.br/assets/ig-cards';

const BG = '#0A0A0A';
const FG = '#FAFAFA';
const ACCENT = '#FF5E1F';
const ACCENT_DARK = '#cc4717';
const MUTED = 'rgba(250,250,250,0.6)';
const CARD_SIZE = 1080;

const CTA_KEYWORD = process.env.CTA_KEYWORD || 'PULSE';
const CTA_HOOK_1 = 'Quer 300+ skills';
const CTA_HOOK_2 = 'de IA pra rodar?';

// ================ UTILS ==================

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

// Hash deterministico pro slug → escolhe variante
function slugHash(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ================ PARSER ==================

function parseInstagramMd(md) {
  const cards = [];
  // Suporta "---CARD 1 (TIPO)---" e legado "---CARD 1 (CAPA)---"
  const re = /---CARD\s+(\d+)\s*\(([^)]+)\)---([\s\S]*?)(?=---CARD\s+\d+|---\s*##|\n##\s|$)/gi;
  let m;
  while ((m = re.exec(md)) !== null) {
    const n = parseInt(m[1]);
    let type = m[2].trim().toUpperCase();
    const raw = m[3].trim();

    // Aliases legado
    if (type === 'CAPA') type = 'COVER';

    // Extrai campos estruturados (TITLE: ... / BODY: ... / STAT: ... etc)
    const fields = {};
    const fieldRe = /^(TITLE|SUBTITLE|BODY|STAT|LABEL|QUOTE|ATTRIBUTION|INSTRUCTION|HEADLINE):\s*(.+)$/gim;
    let fm;
    while ((fm = fieldRe.exec(raw)) !== null) {
      fields[fm[1].toLowerCase()] = fm[2].trim();
    }
    // ITEM: ... (repeated)
    const items = [];
    const itemRe = /^ITEM:\s*(.+)$/gim;
    let im;
    while ((im = itemRe.exec(raw)) !== null) items.push(im[1].trim());
    if (items.length) fields.items = items;

    // Fallback: se nao achou campos estruturados, trata raw como texto livre
    if (Object.keys(fields).length === 0) {
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length) {
        fields.title = lines[0].substring(0, 100);
        if (lines[1]) fields.subtitle = lines[1].substring(0, 150);
        fields.body = lines.slice(2).join(' ').substring(0, 400) || lines.join(' ').substring(0, 400);
      }
    }

    cards.push({ n, type, fields, raw });
  }
  return cards;
}

// ================ SVG RENDERERS POR TIPO ==================

function svgBase(inner, bgExtra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_SIZE}" height="${CARD_SIZE}" viewBox="0 0 ${CARD_SIZE} ${CARD_SIZE}">
    <rect width="${CARD_SIZE}" height="${CARD_SIZE}" fill="${BG}"/>
    ${bgExtra}
    ${inner}
  </svg>`;
}

function logoSvg(color = FG, accentColor = ACCENT, x = 72, y = 96) {
  return `<g transform="translate(${x}, ${y})">
    <path d="M 0 20 L 40 20 L 54 -4 L 72 44 L 92 10 L 110 32 L 130 16 L 154 24 L 180 20 L 220 20" stroke="${accentColor}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <circle cx="238" cy="20" r="3.5" fill="${accentColor}"/>
    <circle cx="252" cy="20" r="3.5" fill="${accentColor}" opacity="0.6"/>
    <circle cx="266" cy="20" r="3.5" fill="${accentColor}" opacity="0.3"/>
    <text x="290" y="28" font-family="Georgia, serif" font-size="40" font-weight="400" fill="${color}">pulso<tspan font-style="italic" fill="${color}80">da</tspan><tspan font-weight="700">IA</tspan></text>
  </g>`;
}

function footerSvg(cardNum, totalCards, accent = ACCENT, textColor = '#ffffff80') {
  return `<rect x="72" y="${CARD_SIZE - 120}" width="${CARD_SIZE - 144}" height="1" fill="#ffffff30"/>
    <text x="72" y="${CARD_SIZE - 70}" font-family="'Courier New', monospace" font-size="22" letter-spacing="2" fill="${textColor}">PULSODAIA.COM.BR</text>
    <text x="${CARD_SIZE - 72}" y="${CARD_SIZE - 70}" text-anchor="end" font-family="'Courier New', monospace" font-size="22" letter-spacing="2" fill="${accent}">${cardNum} / ${totalCards}</text>`;
}

function categoryPill(cat, y = 230, fill = ACCENT) {
  return `<text x="72" y="${y}" font-family="'Courier New', monospace" font-size="24" font-weight="700" letter-spacing="4" fill="${fill}">${esc((cat || 'PULSO').toUpperCase())}</text>`;
}

// COVER — 3 variantes rotativas por hash do slug
function renderCover({ title, subtitle, category, cardNum, totalCards, variant }) {
  const titleLines = wrapText(title, 22).slice(0, 4);

  if (variant === 'split') {
    // Metade laranja em cima com categoria, metade escura com título
    const startY = 540;
    const lineHeight = 100;
    const inner = `
      <rect x="0" y="0" width="${CARD_SIZE}" height="420" fill="${ACCENT}"/>
      ${logoSvg('#ffffff', '#ffffff')}
      <text x="72" y="260" font-family="'Courier New', monospace" font-size="26" font-weight="700" letter-spacing="4" fill="#ffffff">${esc((category || 'PULSO').toUpperCase())}</text>
      <text x="72" y="340" font-family="Georgia, serif" font-size="36" font-style="italic" fill="#ffffffdd">${subtitle ? esc(wrapText(subtitle, 50)[0] || '') : 'Sinta o pulso da IA'}</text>
      ${titleLines.map((l, i) => `<text x="72" y="${startY + i * lineHeight}" font-family="Georgia, serif" font-size="80" font-weight="600" fill="${FG}" letter-spacing="-2">${esc(l)}</text>`).join('\n')}
      ${footerSvg(cardNum, totalCards)}
    `;
    return svgBase(inner);
  }

  if (variant === 'gradient-hero') {
    // Gradient elegante + texto
    const startY = 380;
    const lineHeight = 100;
    const inner = `
      ${logoSvg()}
      <defs>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <circle cx="${CARD_SIZE - 200}" cy="200" r="300" fill="url(#accentGrad)"/>
      ${categoryPill(category, 260)}
      ${titleLines.map((l, i) => `<text x="72" y="${startY + i * lineHeight}" font-family="Georgia, serif" font-size="82" font-weight="600" fill="${FG}" letter-spacing="-2">${esc(l)}</text>`).join('\n')}
      ${subtitle ? `<text x="72" y="${CARD_SIZE - 200}" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#ffffffaa">
        ${wrapText(subtitle, 42).slice(0, 2).map((l, i) => `<tspan x="72" dy="${i === 0 ? 0 : 44}">${esc(l)}</tspan>`).join('')}
      </text>` : ''}
      ${footerSvg(cardNum, totalCards)}
    `;
    return svgBase(inner);
  }

  // Default: minimalist
  const startY = 340;
  const lineHeight = 100;
  const inner = `
    <rect x="0" y="0" width="${CARD_SIZE}" height="8" fill="${ACCENT}"/>
    ${logoSvg()}
    ${categoryPill(category, 230)}
    ${titleLines.map((l, i) => `<text x="72" y="${startY + i * lineHeight}" font-family="Georgia, serif" font-size="80" font-weight="600" fill="${FG}" letter-spacing="-2">${esc(l)}</text>`).join('\n')}
    ${subtitle ? `<text x="72" y="${CARD_SIZE - 220}" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#ffffffaa">
      ${wrapText(subtitle, 40).slice(0, 2).map((l, i) => `<tspan x="72" dy="${i === 0 ? 0 : 44}">${esc(l)}</tspan>`).join('')}
    </text>` : ''}
    ${footerSvg(cardNum, totalCards)}
  `;
  return svgBase(inner);
}

// COVER_HERO — capa com imagem do artigo como bg
async function renderCoverHero({ title, subtitle, category, cardNum, totalCards, heroPath }) {
  const titleLines = wrapText(title, 20).slice(0, 3);
  const lineHeight = 100;
  const startY = 620;

  const inner = `
    <defs>
      <linearGradient id="heroGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0A0A0A" stop-opacity="0.3"/>
        <stop offset="60%" stop-color="#0A0A0A" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#0A0A0A" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="${CARD_SIZE}" height="${CARD_SIZE}" fill="url(#heroGrad)"/>
    ${logoSvg()}
    ${categoryPill(category, 260)}
    ${titleLines.map((l, i) => `<text x="72" y="${startY + i * lineHeight}" font-family="Georgia, serif" font-size="80" font-weight="600" fill="${FG}" letter-spacing="-2">${esc(l)}</text>`).join('\n')}
    ${subtitle ? `<text x="72" y="${CARD_SIZE - 180}" font-family="Georgia, serif" font-size="32" font-style="italic" fill="#ffffffaa">
      ${wrapText(subtitle, 44).slice(0, 2).map((l, i) => `<tspan x="72" dy="${i === 0 ? 0 : 40}">${esc(l)}</tspan>`).join('')}
    </text>` : ''}
    ${footerSvg(cardNum, totalCards)}
  `;

  // Composite: hero image bg → svg overlay
  if (heroPath && fs.existsSync(heroPath)) {
    try {
      const heroBuf = await sharp(heroPath).resize(CARD_SIZE, CARD_SIZE, { fit: 'cover', position: 'center' }).toBuffer();
      const overlayBuf = await sharp(Buffer.from(svgBase(inner))).toBuffer();
      return await sharp(heroBuf)
        .composite([{ input: overlayBuf, blend: 'over' }])
        .png({ quality: 90, compressionLevel: 9 })
        .toBuffer();
    } catch (e) {
      console.log(`  ! hero composite falhou: ${e.message}`);
    }
  }
  // Fallback sem hero
  return await sharp(Buffer.from(svgBase(inner))).png().toBuffer();
}

function renderInsight({ body, category, cardNum, totalCards }) {
  const bodyLines = wrapText(body, 30).slice(0, 11);
  const lineHeight = 62;
  const startY = 340;
  const inner = `
    <rect x="0" y="0" width="8" height="${CARD_SIZE}" fill="${ACCENT}"/>
    ${logoSvg()}
    ${categoryPill(category || 'CONTEXTO', 240)}
    ${bodyLines.map((l, i) => `<text x="72" y="${startY + i * lineHeight}" font-family="Georgia, serif" font-size="48" font-weight="400" fill="${FG}" letter-spacing="-0.5">${esc(l)}</text>`).join('\n')}
    ${footerSvg(cardNum, totalCards)}
  `;
  return svgBase(inner);
}

function renderStat({ stat, label, category, cardNum, totalCards }) {
  // Numero BIG destaque
  const inner = `
    <rect x="0" y="0" width="${CARD_SIZE}" height="8" fill="${ACCENT}"/>
    ${logoSvg()}
    ${categoryPill(category || 'NUMERO', 230)}
    <text x="${CARD_SIZE / 2}" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="180" font-weight="700" fill="${ACCENT}" letter-spacing="-6">${esc((stat || '—').substring(0, 14))}</text>
    <text x="${CARD_SIZE / 2}" y="680" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-style="italic" fill="#ffffffcc">
      ${wrapText(label || '', 34).slice(0, 3).map((l, i) => `<tspan x="${CARD_SIZE / 2}" dy="${i === 0 ? 0 : 52}">${esc(l)}</tspan>`).join('')}
    </text>
    ${footerSvg(cardNum, totalCards)}
  `;
  return svgBase(inner);
}

function renderQuote({ quote, attribution, category, cardNum, totalCards }) {
  const q = String(quote || '').replace(/^["']|["']$/g, '');
  const qLines = wrapText(q, 26).slice(0, 8);
  const startY = 360;
  const inner = `
    <rect x="0" y="0" width="${CARD_SIZE}" height="8" fill="${ACCENT}"/>
    ${logoSvg()}
    ${categoryPill(category || 'CITACAO', 230)}
    <text x="60" y="370" font-family="Georgia, serif" font-size="220" fill="${ACCENT}" opacity="0.3">"</text>
    ${qLines.map((l, i) => `<text x="110" y="${startY + 50 + i * 68}" font-family="Georgia, serif" font-size="54" font-style="italic" fill="${FG}" letter-spacing="-0.5">${esc(l)}</text>`).join('\n')}
    ${attribution ? `<text x="72" y="${CARD_SIZE - 180}" font-family="'Courier New', monospace" font-size="22" letter-spacing="2" fill="${ACCENT}">— ${esc(attribution.toUpperCase())}</text>` : ''}
    ${footerSvg(cardNum, totalCards)}
  `;
  return svgBase(inner);
}

function renderList({ items, title, category, cardNum, totalCards }) {
  const list = (items || []).slice(0, 5);
  const inner = `
    <rect x="0" y="0" width="8" height="${CARD_SIZE}" fill="${ACCENT}"/>
    ${logoSvg()}
    ${categoryPill(category || 'LISTA', 240)}
    ${title ? `<text x="72" y="340" font-family="Georgia, serif" font-size="52" font-weight="600" fill="${FG}" letter-spacing="-1">${esc(wrapText(title, 22)[0] || title)}</text>` : ''}
    ${list.map((item, i) => {
      const lines = wrapText(item, 32).slice(0, 2);
      return `
      <g transform="translate(72, ${420 + i * 120})">
        <circle cx="30" cy="0" r="24" fill="${ACCENT}"/>
        <text x="30" y="12" text-anchor="middle" font-family="Georgia, serif" font-size="32" font-weight="700" fill="${BG}">${i + 1}</text>
        ${lines.map((l, j) => `<text x="90" y="${j === 0 ? 12 : 12 + j * 44}" font-family="Georgia, serif" font-size="34" fill="${FG}">${esc(l)}</text>`).join('')}
      </g>`;
    }).join('\n')}
    ${footerSvg(cardNum, totalCards)}
  `;
  return svgBase(inner);
}

function renderCta({ cardNum, totalCards }) {
  const inner = `
    <defs>
      <linearGradient id="ctaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${ACCENT}"/>
        <stop offset="100%" stop-color="${ACCENT_DARK}"/>
      </linearGradient>
    </defs>
    <rect width="${CARD_SIZE}" height="${CARD_SIZE}" fill="${BG}"/>
    <rect x="0" y="0" width="${CARD_SIZE}" height="240" fill="url(#ctaGrad)"/>
    ${logoSvg('#ffffff', '#ffffff')}
    <text x="72" y="190" font-family="'Courier New', monospace" font-size="22" font-weight="700" letter-spacing="4" fill="#ffffff">BONUS GRATUITO</text>
    <text x="72" y="370" font-family="Georgia, serif" font-size="88" font-weight="600" fill="${FG}" letter-spacing="-2">${esc(CTA_HOOK_1)}</text>
    <text x="72" y="468" font-family="Georgia, serif" font-size="88" font-weight="600" font-style="italic" fill="${ACCENT}" letter-spacing="-2">${esc(CTA_HOOK_2)}</text>
    <text x="72" y="560" font-family="Georgia, serif" font-size="32" font-style="italic" fill="#ffffff99" letter-spacing="-0.5">+ novidades de IA toda semana no seu inbox</text>
    <rect x="72" y="640" width="${CARD_SIZE - 144}" height="180" rx="20" fill="${ACCENT}"/>
    <text x="${CARD_SIZE / 2}" y="712" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="600" fill="${BG}">Comenta</text>
    <text x="${CARD_SIZE / 2}" y="782" text-anchor="middle" font-family="Georgia, serif" font-size="88" font-weight="700" fill="${BG}" letter-spacing="4">${esc(CTA_KEYWORD)}</text>
    <text x="${CARD_SIZE / 2}" y="890" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#ffffffcc">aqui no post e recebe <tspan font-weight="700" fill="${FG}">na hora</tspan></text>
    ${footerSvg(cardNum, totalCards)}
  `;
  return svgBase(inner);
}

// ================ DISPATCH ==================

const COVER_VARIANTS = ['minimalist', 'split', 'gradient-hero'];

async function renderCardToBuffer(card, ctx) {
  const { type, fields } = card;
  const { cardNum, totalCards, category, heroPath, coverVariant, articleHeadline, articleSubtitle } = ctx;

  switch (type) {
    case 'COVER': {
      const title = fields.title || articleHeadline || 'Pulso da IA';
      return await sharp(Buffer.from(renderCover({
        title, subtitle: fields.subtitle || articleSubtitle || '', category,
        cardNum, totalCards, variant: coverVariant
      }))).png({ quality: 90 }).toBuffer();
    }
    case 'COVER_HERO': {
      const title = fields.title || articleHeadline || 'Pulso da IA';
      return await renderCoverHero({
        title, subtitle: fields.subtitle || articleSubtitle || '', category,
        cardNum, totalCards, heroPath
      });
    }
    case 'STAT':
      return await sharp(Buffer.from(renderStat({
        stat: fields.stat, label: fields.label, category,
        cardNum, totalCards
      }))).png({ quality: 90 }).toBuffer();
    case 'QUOTE':
      return await sharp(Buffer.from(renderQuote({
        quote: fields.quote, attribution: fields.attribution, category,
        cardNum, totalCards
      }))).png({ quality: 90 }).toBuffer();
    case 'LIST':
    case 'TIMELINE':
      return await sharp(Buffer.from(renderList({
        items: fields.items || [], title: fields.title, category,
        cardNum, totalCards
      }))).png({ quality: 90 }).toBuffer();
    case 'CTA':
      return await sharp(Buffer.from(renderCta({
        cardNum, totalCards
      }))).png({ quality: 90 }).toBuffer();
    case 'INSIGHT':
    case 'SOURCE':
    case 'COMPARISON':
    default:
      return await sharp(Buffer.from(renderInsight({
        body: fields.body || fields.title || card.raw.substring(0, 400),
        category, cardNum, totalCards
      }))).png({ quality: 90 }).toBuffer();
  }
}

// ================ ORCHESTRATION ==================

async function renderCardsForSlug(slug, opts = {}) {
  const mdPath = path.join(SOCIAL_DIR, slug, 'instagram.md');
  if (!fs.existsSync(mdPath)) return { skipped: true, reason: 'no instagram.md' };

  const md = fs.readFileSync(mdPath, 'utf8');
  const cards = parseInstagramMd(md);
  if (cards.length === 0) return { skipped: true, reason: 'no cards parsed' };

  const metaPath = path.join(SOCIAL_DIR, slug, 'meta.json');
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
  const category = meta.article_category || 'PULSO';

  // Hero image do artigo (pra COVER_HERO)
  const articleDir = path.join(FEED_DIR, slug);
  let heroPath = null;
  if (fs.existsSync(articleDir)) {
    const hero = fs.readdirSync(articleDir).find(f => /^hero\.(jpg|jpeg|png|webp)$/i.test(f));
    if (hero) heroPath = path.join(articleDir, hero);
  }

  // Variante determinística de cover
  const coverVariant = COVER_VARIANTS[slugHash(slug) % COVER_VARIANTS.length];

  const outDir = path.join(SOCIAL_DIR, slug);
  const publicDir = path.join(PUBLIC_CARDS_DIR, slug);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // Limpa PNGs obsoletos (se quantidade de cards mudou)
  if (opts.force) {
    for (const f of fs.readdirSync(publicDir)) {
      if (/^card-\d+\.png$/.test(f)) fs.unlinkSync(path.join(publicDir, f));
    }
    for (const f of fs.readdirSync(outDir).filter(f => /^card-\d+\.png$/.test(f))) {
      fs.unlinkSync(path.join(outDir, f));
    }
  }

  const totalCards = cards.length;
  const results = [];

  for (const card of cards) {
    const outFile = path.join(outDir, `card-${card.n}.png`);
    const publicFile = path.join(publicDir, `card-${card.n}.png`);
    if (!opts.force && fs.existsSync(outFile) && fs.existsSync(publicFile)) {
      results.push({ card: card.n, type: card.type, status: 'exists' });
      continue;
    }

    try {
      const buf = await renderCardToBuffer(card, {
        cardNum: card.n, totalCards, category, heroPath, coverVariant,
        articleHeadline: meta.article_headline, articleSubtitle: ''
      });
      fs.writeFileSync(outFile, buf);
      fs.writeFileSync(publicFile, buf);
      results.push({ card: card.n, type: card.type, status: 'rendered', bytes: buf.length });
    } catch (e) {
      results.push({ card: card.n, type: card.type, status: 'error', error: e.message });
    }
  }

  return { slug, cards: results, totalCards, coverVariant };
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
    if (result.skipped) { console.log(`  - ${slug}: ${result.reason}`); skip++; continue; }
    const types = result.cards.map(c => `${c.card}:${c.type}`).join(' ');
    console.log(`  ✓ ${slug} · cover=${result.coverVariant} · total=${result.totalCards} · ${types}`);
    ok++;
    for (const c of result.cards) if (c.status === 'error') err++;
  }

  console.log(`\n[render] ok=${ok} skip=${skip} errors=${err}`);
}

main().catch(e => { console.error(e); process.exit(1); });
