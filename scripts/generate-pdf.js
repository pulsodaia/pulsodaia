#!/usr/bin/env node
// Gera o PDF real da biblioteca Pulso da IA (3.004 skills)
// Usa puppeteer pra renderizar HTML editorial -> PDF

const fs = require('fs');
const path = require('path');

async function main() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.log('Installing puppeteer...');
    require('child_process').execSync('npm install puppeteer --no-save', { stdio: 'inherit' });
    puppeteer = require('puppeteer');
  }

  const SKILLS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'skills.json'), 'utf8'));
  const OUT = path.join(__dirname, '..', 'assets', 'pulso-da-ia-biblioteca.pdf');
  if (!fs.existsSync(path.dirname(OUT))) fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const skillsByCategory = {};
  SKILLS.skills.forEach(s => {
    if (!skillsByCategory[s.category]) skillsByCategory[s.category] = [];
    skillsByCategory[s.category].push(s);
  });

  const categoryLabels = {};
  SKILLS.categories.forEach(c => { categoryLabels[c.key] = c.label; });

  const sortedCategories = SKILLS.categories.sort((a, b) => b.count - a.count);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Pulso da IA · Biblioteca</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 20mm 18mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; color: #0A0A0A; font-size: 10pt; line-height: 1.5; }
h1, h2, h3 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; letter-spacing: -0.02em; }
.mono { font-family: 'JetBrains Mono', monospace; }

/* COVER */
.cover { page-break-after: always; height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 40mm 0; }
.cover-logo { display: flex; align-items: center; gap: 12px; }
.cover-logo svg { width: 100px; height: 40px; }
.cover-wordmark { font-size: 18pt; font-weight: 400; letter-spacing: -0.02em; }
.cover-wordmark .da { font-style: italic; color: #A8A8A8; }
.cover-wordmark .ia { font-weight: 700; }
.cover h1 { font-size: 56pt; line-height: 1; margin-top: 40mm; }
.cover h1 .italic { font-style: italic; color: #FF5E1F; }
.cover .sub { font-size: 14pt; color: #5C5C5C; margin-top: 20mm; max-width: 70%; line-height: 1.4; }
.cover .meta { font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #A8A8A8; letter-spacing: 0.1em; text-transform: uppercase; }

/* TOC */
.toc { page-break-after: always; }
.toc h2 { font-size: 32pt; margin-bottom: 20mm; }
.toc-list { list-style: none; }
.toc-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.08); font-size: 11pt; }
.toc-item .cat-name { font-family: 'Fraunces', serif; font-weight: 500; }
.toc-item .cat-count { font-family: 'JetBrains Mono', monospace; color: #FF5E1F; font-weight: 600; }

/* INTRO */
.intro { page-break-after: always; padding-top: 10mm; }
.intro h2 { font-size: 28pt; margin-bottom: 12mm; }
.intro p { margin-bottom: 10pt; color: #171717; }
.intro .highlight { background: #FF5E1F; color: white; padding: 2pt 6pt; font-weight: 600; }

/* CATEGORIES */
.category { page-break-before: always; padding-top: 5mm; }
.category-header { border-bottom: 2pt solid #FF5E1F; padding-bottom: 8pt; margin-bottom: 10mm; display: flex; justify-content: space-between; align-items: baseline; }
.category h2 { font-size: 24pt; }
.category-count { font-family: 'JetBrains Mono', monospace; font-size: 14pt; color: #FF5E1F; font-weight: 600; }
.skill { padding: 6pt 0; border-bottom: 0.5pt solid rgba(0,0,0,0.06); page-break-inside: avoid; }
.skill-name { font-family: 'JetBrains Mono', monospace; font-size: 10pt; font-weight: 600; color: #0A0A0A; margin-bottom: 2pt; }
.skill-desc { font-size: 9pt; color: #5C5C5C; line-height: 1.4; }

/* FOOTER */
.footer { position: fixed; bottom: 10mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #A8A8A8; text-transform: uppercase; letter-spacing: 0.1em; padding-top: 4pt; border-top: 0.5pt solid rgba(0,0,0,0.1); }

/* Final page */
.backcover { page-break-before: always; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40mm 0; }
.backcover h2 { font-size: 40pt; line-height: 1; margin-bottom: 20pt; }
.backcover .cta-url { font-family: 'JetBrains Mono', monospace; font-size: 14pt; color: #FF5E1F; background: #0A0A0A; padding: 12pt 20pt; border-radius: 4pt; display: inline-block; }
</style>
</head>
<body>

<!-- COVER -->
<section class="cover">
  <div>
    <div class="cover-logo">
      <svg viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16" stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/>
        <circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/>
        <circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/>
      </svg>
      <span class="cover-wordmark">pulso<span class="da">da</span><span class="ia">IA</span></span>
    </div>
    <div class="meta" style="margin-top: 8pt;">BIBLIOTECA DE SKILLS · V1.0 · 17 ABR 2026</div>
  </div>

  <div>
    <h1>Sinta o pulso<br><span class="italic">do mercado de IA.</span></h1>
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 11pt; color: #FF5E1F; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 8mm;">${SKILLS.total.toLocaleString('pt-BR')} SKILLS CATALOGADAS</p>
    <p class="sub">O catalogo completo das skills Claude Code do stack Triadeflow. Categorizado por area, com indice e descricao de cada uma.</p>
  </div>

  <div class="meta">
    <a href="https://pulsodaia.com.br" style="color:inherit;text-decoration:none;">pulsodaia.com.br</a>
    ·
    <a href="https://www.instagram.com/alexcamposcrm" style="color:inherit;text-decoration:none;">@alexcamposcrm</a>
  </div>
</section>

<!-- TOC -->
<section class="toc">
  <h2>Indice por <span style="font-style: italic; color: #FF5E1F;">categoria</span></h2>
  <ul class="toc-list">
    ${sortedCategories.map(c => `
      <li class="toc-item">
        <a href="https://pulsodaia.com.br/categoria/${c.key}/" style="text-decoration:none;color:inherit;display:flex;justify-content:space-between;width:100%;">
          <span class="cat-name">${c.label}</span>
          <span class="cat-count">${c.count}</span>
        </a>
      </li>
    `).join('')}
  </ul>
</section>

<!-- INTRO -->
<section class="intro">
  <h2>Sobre esta biblioteca</h2>
  <p>Skills sao manuais especializados que o Claude Opus 4.7 carrega automaticamente quando o contexto da conversa bate com a area de aplicacao. Voce nao precisa invocar manualmente.</p>
  <p>Este catalogo reune <span class="highlight">${SKILLS.total.toLocaleString('pt-BR')}</span> skills que uso no meu stack Triadeflow, distribuidas em ${SKILLS.categories.length} categorias.</p>
  <p>Cada skill tem um nome tecnico e uma descricao curta. Pra instalar, salve em <code style="background: rgba(0,0,0,0.05); padding: 2pt 4pt; font-family: 'JetBrains Mono';">~/.claude/skills/{nome}/SKILL.md</code> com o frontmatter contendo nome e descricao.</p>
  <p style="margin-top: 16pt; padding: 12pt; background: rgba(255,94,31,0.06); border-left: 3pt solid #FF5E1F;"><strong>Como usar este PDF:</strong> navegue pelo indice ao lado e va direto pra categoria que te interessa. Cada skill tem pagina individual em <a href="https://pulsodaia.com.br" style="color: #FF5E1F;">pulsodaia.com.br/skills/</a>.</p>
</section>

<!-- CATEGORIES -->
${sortedCategories.map(cat => `
<section class="category">
  <div class="category-header">
    <h2>${cat.label}</h2>
    <span class="category-count">${cat.count}</span>
  </div>
  ${(skillsByCategory[cat.key] || []).map(s => `
    <div class="skill">
      <a href="https://pulsodaia.com.br/skills/${s.name}/" style="text-decoration:none;color:inherit;display:block;">
        <div class="skill-name">${s.name}</div>
        <div class="skill-desc">${(s.description || 'Skill da biblioteca Pulso da IA.').replace(/</g, '&lt;').substring(0, 240)}</div>
      </a>
    </div>
  `).join('')}
</section>
`).join('')}

<!-- BACK COVER -->
<section class="backcover">
  <h2>Receba as novas<br><span style="font-style: italic; color: #FF5E1F;">toda semana</span></h2>
  <p style="color: #5C5C5C; max-width: 400pt; margin-bottom: 30pt; font-size: 12pt;">Inscreva-se no Pulso Semanal pra receber as novidades do mercado de IA toda quinta-feira, direto das fontes oficiais.</p>
  <a href="https://pulsodaia.com.br" style="text-decoration:none;"><div class="cta-url">pulsodaia.com.br</div></a>
  <a href="https://www.instagram.com/alexcamposcrm" style="margin-top:18pt;display:inline-block;font-family:'JetBrains Mono',monospace;font-size:10pt;color:#5C5C5C;text-decoration:none;">@alexcamposcrm</a>
  <p style="margin-top: 40pt; color: #A8A8A8; font-size: 9pt;">Feito por Alex Campos @ Triadeflow</p>
</section>

</body>
</html>`;

  const tmpHtml = path.join(__dirname, '..', 'tmp-pdf.html');
  fs.writeFileSync(tmpHtml, html);

  console.log('[pdf] launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('file://' + tmpHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  console.log('[pdf] generating...');
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="width: 100%; font-size: 7pt; color: #A8A8A8; font-family: 'JetBrains Mono', monospace; padding: 0 18mm; display: flex; justify-content: space-between; letter-spacing: 0.1em; text-transform: uppercase;">
      <span>PULSO DA IA · BIBLIOTECA</span>
      <span>pag. <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`,
    margin: { top: '20mm', right: '18mm', bottom: '20mm', left: '18mm' }
  });

  await browser.close();
  fs.unlinkSync(tmpHtml);

  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`[pdf] ✓ ${OUT} (${kb}KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
