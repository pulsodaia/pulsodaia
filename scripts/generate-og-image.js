#!/usr/bin/env node
// Gera a OG image (1200x630) do Pulso da IA via Puppeteer
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const OUT = path.join(__dirname, '..', 'assets', 'og-image.png');
if (!fs.existsSync(path.dirname(OUT))) fs.mkdirSync(path.dirname(OUT), { recursive: true });

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1200px;
  height: 630px;
  background: radial-gradient(ellipse at top left, #1A1A1A 0%, #0A0A0A 50%, #050505 100%);
  color: #FAFAFA;
  font-family: 'Inter', sans-serif;
  padding: 70px 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}
body::before {
  content: '';
  position: absolute;
  top: 0; right: -100px;
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(255,94,31,0.20), transparent 60%);
  filter: blur(80px);
  pointer-events: none;
}
.header {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  z-index: 2;
}
.header svg { width: 68px; height: 27px; }
.header .wordmark {
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -0.02em;
}
.header .wordmark .da { font-style: italic; color: rgba(255,255,255,0.5); }
.header .wordmark .ia { font-weight: 700; }

.hero {
  position: relative;
  z-index: 2;
}
.hero h1 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 110px;
  font-weight: 600;
  line-height: 0.96;
  letter-spacing: -0.035em;
  margin-bottom: 24px;
}
.hero h1 .italic {
  font-style: italic;
  color: #FF5E1F;
  display: block;
  margin-top: 4px;
}
.hero .sub {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  color: rgba(255,255,255,0.55);
  max-width: 680px;
  line-height: 1.4;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: relative;
  z-index: 2;
}
.footer .mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.footer .stats {
  display: flex;
  gap: 40px;
}
.footer .stat .n {
  font-family: 'JetBrains Mono', monospace;
  font-size: 30px;
  font-weight: 600;
  color: #FF5E1F;
  letter-spacing: -0.02em;
  line-height: 1;
}
.footer .stat .l {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-top: 4px;
}
</style>
</head>
<body>

<div class="header">
  <svg viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16"
          stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/>
    <circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/>
    <circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/>
  </svg>
  <span class="wordmark">pulso<span class="da">da</span><span class="ia">IA</span></span>
</div>

<div class="hero">
  <h1>Sinta o pulso<span class="italic">do mercado de IA.</span></h1>
  <p class="sub">Portal brasileiro com as novidades dos laboratorios e founders que constroem IA.</p>
</div>

<div class="footer">
  <div class="mono">PULSODAIA.COM.BR · @PULSODAIA</div>
  <div class="stats">
    <div class="stat">
      <div class="n">3.004</div>
      <div class="l">Skills</div>
    </div>
    <div class="stat">
      <div class="n">19</div>
      <div class="l">Categorias</div>
    </div>
    <div class="stat">
      <div class="n">17 ABR</div>
      <div class="l">Atualizado</div>
    </div>
  </div>
</div>

</body>
</html>`;

async function main() {
  const tmpHtml = path.join(__dirname, '..', 'tmp-og.html');
  fs.writeFileSync(tmpHtml, html);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.goto('file://' + tmpHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.screenshot({ path: OUT, type: 'png', omitBackground: false });
  await browser.close();
  fs.unlinkSync(tmpHtml);

  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`[og] ✓ ${OUT} (${kb}KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
