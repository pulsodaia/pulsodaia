#!/usr/bin/env node
// Gera paginas estaticas institucionais (sobre, contato, privacidade, termos) + rss.xml
// Todas usam mesmo header/footer dos artigos pra padronizacao total.
// Uso: node scripts/build-static-pages.js

const fs = require('fs');
const path = require('path');
const engine = require('./feed-engine.js');

const ROOT = path.join(__dirname, '..');
const FEED_JSON = path.join(ROOT, 'data', 'feed.json');

function pageShell({ slug, title, metaDesc, eyebrow, headline, subtitle, bodyHtml }) {
  const canonical = `https://pulsodaia.com.br${slug === 'home' ? '/' : '/' + slug + '/'}`;
  return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · Pulso da IA</title>
<meta name="description" content="${metaDesc.replace(/"/g, '&quot;')}">
<meta name="author" content="Pulso da IA">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Pulso da IA">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${title} · Pulso da IA">
<meta property="og:description" content="${metaDesc.replace(/"/g, '&quot;')}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://pulsodaia.com.br/assets/og-image.png">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/assets/favicon.ico">
<link rel="alternate" type="application/rss+xml" title="Pulso da IA · Feed" href="/rss.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/feed/article.css">
<style>
/* Pagina estatica tem largura ligeiramente maior que artigo */
body main.static-page { padding: 48px 0 80px; }
.static-page .container { max-width: 780px; }
.static-page .eyebrow-solo { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 16px; }
.static-page h1 { font-family: 'Fraunces', Georgia, serif; font-size: clamp(40px, 5vw, 58px); font-weight: 600; line-height: 1.05; letter-spacing: -0.02em; color: #FAFAFA; margin-bottom: 18px; }
.static-page .sub { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-style: italic; color: rgba(255,255,255,0.6); line-height: 1.4; margin-bottom: 40px; max-width: 640px; }
.static-page .body-prose { font-size: 17px; line-height: 1.75; color: rgba(250,250,250,0.85); }
.static-page .body-prose h2 { font-family: 'Fraunces', Georgia, serif; font-size: 28px; font-weight: 600; letter-spacing: -0.01em; margin: 40px 0 14px; color: #FAFAFA; }
.static-page .body-prose h3 { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 600; margin: 28px 0 10px; color: #FAFAFA; }
.static-page .body-prose p { margin-bottom: 18px; }
.static-page .body-prose strong { color: #FAFAFA; font-weight: 600; }
.static-page .body-prose ul, .static-page .body-prose ol { margin: 0 0 20px 20px; }
.static-page .body-prose li { margin-bottom: 6px; }
.static-page .body-prose a { color: #FF5E1F; font-weight: 500; }
.static-page .contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 32px 0 48px; }
.static-page .contact-card { padding: 24px; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; transition: border-color .2s ease; }
.static-page .contact-card:hover { border-color: rgba(255,94,31,0.4); text-decoration: none; }
.static-page .contact-card .cc-icon { display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; background: rgba(255,94,31,0.12); border-radius: 10px; margin-bottom: 14px; color: #FF5E1F; }
.static-page .contact-card .cc-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #FF5E1F; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 4px; display: block; }
.static-page .contact-card .cc-value { color: #FAFAFA; font-size: 15px; font-weight: 500; display: block; }
.static-page .contact-card .cc-note { font-size: 12px; color: rgba(250,250,250,0.5); margin-top: 4px; display: block; }
@media (max-width: 720px) { .static-page .contact-grid { grid-template-columns: 1fr; } }
.static-page .last-updated { margin-top: 56px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5C5C5C; text-transform: uppercase; letter-spacing: 0.1em; }
</style>
</head>
<body>

<header class="site">
  <div class="nav">
    <a href="/" class="brand">
      <svg viewBox="0 0 80 32" fill="none"><path d="M2 16 L12 16 L16 4 L22 28 L28 10 L34 22 L40 14 L46 20 L54 16 L64 16" stroke="#FF5E1F" stroke-width="2.5" stroke-linecap="round"/><circle cx="68" cy="16" r="1.8" fill="#FF5E1F"/><circle cx="73" cy="16" r="1.8" fill="#FF5E1F" opacity="0.6"/><circle cx="78" cy="16" r="1.8" fill="#FF5E1F" opacity="0.3"/></svg>
      <span class="wm">pulso<span class="da">da</span><span class="ia">IA</span></span>
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/feed/">Feed</a>
      <a href="/feed/?c=lancamento">Lancamentos</a>
      <a href="/feed/?c=analise">Analises</a>
    </div>
    <a href="#newsletter" class="nav-cta">Assinar</a>
  </div>
</header>

<main class="static-page">
  <div class="container">
    <nav class="breadcrumb"><a href="/">Pulso da IA</a><span>›</span>${title}</nav>
    <div class="eyebrow-solo">${eyebrow}</div>
    <h1>${headline}</h1>
    ${subtitle ? `<p class="sub">${subtitle}</p>` : ''}
    <div class="body-prose">
${bodyHtml}
    </div>
  </div>
</main>

${engine.renderFollowUsHtml()}

<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

${engine.renderFooterBottom()}
</body>
</html>`;
}

// ================ PAGINAS ==================

const SOBRE = {
  slug: 'sobre',
  title: 'Sobre',
  metaDesc: 'Pulso da IA eh o portal brasileiro que traduz em tempo real o que acontece no mercado de inteligencia artificial. Fontes oficiais, sem filtro de influenciador.',
  eyebrow: 'QUEM SOMOS',
  headline: 'Sinta o pulso do mercado de IA.',
  subtitle: 'Sem filtro de influenciador. Sem hype. Direto das fontes oficiais, em portugues brasileiro.',
  body: `
<p>O <strong>Pulso da IA</strong> eh um portal brasileiro de noticias sobre inteligencia artificial. A gente traduz em tempo real o que sai de OpenAI, Google DeepMind, Anthropic, Meta, HuggingFace, Mistral, ArXiv e outras fontes tecnicas relevantes.</p>

<h2>Por que existe</h2>
<p>O mercado de IA se move rapido demais pra depender de influenciador traduzindo uma semana depois. A gente eh direto da fonte. Se OpenAI lanca, esta aqui em minutos. Se a Anthropic publica research, voce le a essencia em 3 minutos.</p>

<h2>Como funciona</h2>
<p>Um motor pulsante coleta RSS e announcements oficiais a cada 2 horas. Uma IA editora reescreve cada materia em portugues brasileiro, mantendo os fatos e respeitando a fonte original. Zero clichê. Zero invencao. Backlink sempre pra fonte oficial.</p>

<h3>Tom editorial</h3>
<ul>
<li><strong>Bloomberg + Axios</strong>: analitico, direto, curto.</li>
<li><strong>Zero hype</strong>: nada de "revolucionario", "transformar", "futuro da IA".</li>
<li><strong>PT-BR real</strong>: voce, nao tu. Traducao tecnica sem soar robotizado.</li>
<li><strong>Sempre a fonte</strong>: link pro artigo original, citacao clara.</li>
</ul>

<h2>Por tras</h2>
<p><strong>Alex Campos</strong> conduz o editorial. Fundador da <a href="https://triadeflow.com.br" target="_blank" rel="noopener">Triadeflow</a>, consultoria de implantacao de processo comercial B2B com IA. 30+ projetos em producao usando IA real, nao demonstracao. <a href="https://instagram.com/triadeflow" target="_blank" rel="noopener">@triadeflow</a> no Instagram.</p>

<h2>Quer contribuir?</h2>
<p>Esta cobrindo IA em portugues e quer ter seu conteudo citado aqui? <a href="/contato/">Manda mensagem</a>. Boas coberturas originais viram referencia no Pulso da IA.</p>
`
};

const CONTATO = {
  slug: 'contato',
  title: 'Contato',
  metaDesc: 'Fale com o Pulso da IA. Email, WhatsApp, redes sociais. Tempo de resposta em 1 dia util.',
  eyebrow: 'FALE COM A GENTE',
  headline: 'Da pra falar direto.',
  subtitle: 'Email chega em 1 dia util. WhatsApp em algumas horas. Redes sociais quando rola tempo.',
  body: `
<div class="contact-grid">
  <a href="mailto:contato@triadeflow.com.br" class="contact-card">
    <div class="cc-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></div>
    <span class="cc-label">EMAIL</span>
    <span class="cc-value">contato@triadeflow.com.br</span>
    <span class="cc-note">Melhor canal. 1 dia util.</span>
  </a>
  <a href="https://wa.me/5519983805908" target="_blank" rel="noopener" class="contact-card">
    <div class="cc-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.465 3.488"/></svg></div>
    <span class="cc-label">WHATSAPP</span>
    <span class="cc-value">+55 19 98380-5908</span>
    <span class="cc-note">Resposta em horas.</span>
  </a>
  <a href="https://instagram.com/triadeflow" target="_blank" rel="noopener" class="contact-card">
    <div class="cc-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></div>
    <span class="cc-label">INSTAGRAM</span>
    <span class="cc-value">@triadeflow</span>
    <span class="cc-note">DM quando rola tempo.</span>
  </a>
</div>

<h2>O que entra aqui</h2>
<ul>
<li><strong>Sugestao de pauta</strong>: coisa que voce viu sair de alguma fonte e quer ver coberto em portugues.</li>
<li><strong>Correcao</strong>: errata, atualizacao, contexto que faltou.</li>
<li><strong>Parceria editorial</strong>: voce cobre IA serio e quer ser citado ou cross-posted.</li>
<li><strong>Sponsorship</strong>: marca querendo patrocinar pulso semanal ou fazer content study.</li>
<li><strong>Triadeflow consultoria</strong>: se e sobre implantacao de IA em processo comercial B2B, eh <a href="https://triadeflow.com.br" target="_blank" rel="noopener">triadeflow.com.br</a>.</li>
</ul>

<h2>O que NAO entra</h2>
<ul>
<li>Spam de release generico (a gente le tudo, mas so publica o que tem fonte oficial).</li>
<li>Pedido pra "falar sobre meu curso de IA".</li>
<li>"Topa conversar pra ver sinergias" sem contexto especifico.</li>
</ul>
`
};

const PRIVACIDADE = {
  slug: 'politica-privacidade',
  title: 'Politica de Privacidade',
  metaDesc: 'Como o Pulso da IA trata seus dados. LGPD compliant. Transparente e sem enrolacao.',
  eyebrow: 'LGPD',
  headline: 'Sua privacidade, sem enrolacao.',
  subtitle: 'O que a gente coleta, porque, e como voce controla.',
  body: `
<p class="last-updated" style="margin-top: 0; padding-top: 0; border: 0;">Ultima atualizacao: 19 de abril de 2026</p>

<h2>1. Dados que a gente coleta</h2>
<p>Quando voce assina o Pulso Semanal, coletamos <strong>nome</strong> e <strong>email</strong>. Quando manda mensagem via formulario de contato, coletamos o que voce escrever. Nada mais.</p>
<p>Nos bastidores, servidores de hospedagem (Cloudflare Pages) registram IP e user agent como parte do log padrao de acesso. Nao cruzamos isso com identidade.</p>

<h2>2. Como a gente usa</h2>
<ul>
<li><strong>Newsletter</strong>: mandar o Pulso Semanal toda quinta. Nada de email diario. Nada de spam.</li>
<li><strong>Contato</strong>: responder sua mensagem. So isso.</li>
<li><strong>Analytics agregado</strong>: entender quais assuntos rendem mais (sem rastrear voce individualmente).</li>
</ul>

<h2>3. Com quem compartilhamos</h2>
<p>Com <strong>ninguem</strong> pra fins comerciais. Os dados passam por ferramentas que a gente usa pra operar:</p>
<ul>
<li><strong>GoHighLevel (HUB)</strong>: processa a inscricao da newsletter (servidor em Cloud US).</li>
<li><strong>Cloudflare</strong>: hospeda o site e serve as paginas.</li>
<li><strong>Google (Fonts + Analytics agregado)</strong>: servem fontes tipograficas e metricas anonimas.</li>
</ul>
<p>Nao vendemos, nao alugamos, nao trocamos dado com parceiros.</p>

<h2>4. Seus direitos (LGPD)</h2>
<p>Voce pode, a qualquer momento:</p>
<ul>
<li><strong>Acessar</strong> tudo que temos sobre voce.</li>
<li><strong>Corrigir</strong> algo errado.</li>
<li><strong>Apagar</strong> tudo (descadastro total).</li>
<li><strong>Portar</strong> os dados pra outro servico.</li>
<li><strong>Revogar consentimento</strong> com 1 clique no link de cada email.</li>
</ul>
<p>Manda mensagem pra <a href="mailto:contato@triadeflow.com.br">contato@triadeflow.com.br</a>. Atendemos em 1 dia util.</p>

<h2>5. Cookies</h2>
<p>A gente usa <strong>cookies essenciais</strong> (sessao, preferencias de tema) e <strong>cookies analiticos anonimos</strong> (Google Analytics agregado). Nao usa cookies de publicidade, nao usa cookies de remarketing, nao compartilha cookie com terceiros pra tracking cross-site.</p>

<h2>6. Crianca e adolescente</h2>
<p>O Pulso da IA eh destinado a maiores de 18 anos. Nao coletamos dados de menores conscientemente.</p>

<h2>7. Mudancas nesta politica</h2>
<p>Se a gente mudar algo relevante, atualiza aqui e manda aviso no proximo Pulso Semanal. Sem alteracao silenciosa.</p>

<h2>8. Contato do controlador</h2>
<p>Controlador dos dados: <strong>Triadeflow / Alex Campos</strong>.<br>
Email: <a href="mailto:contato@triadeflow.com.br">contato@triadeflow.com.br</a><br>
WhatsApp: <a href="https://wa.me/5519983805908" target="_blank" rel="noopener">+55 19 98380-5908</a></p>

<div class="last-updated">Documento vivo · Pulso da IA · 2026-04-19</div>
`
};

const TERMOS = {
  slug: 'termos',
  title: 'Termos de Uso',
  metaDesc: 'Termos de uso do Pulso da IA. O que voce pode, o que a gente entrega, onde param os limites.',
  eyebrow: 'TERMOS',
  headline: 'As regras, sem letra miuda.',
  subtitle: 'O que voce pode fazer com o conteudo, o que a gente garante, onde param os limites.',
  body: `
<p class="last-updated" style="margin-top: 0; padding-top: 0; border: 0;">Ultima atualizacao: 19 de abril de 2026</p>

<h2>1. Sobre este site</h2>
<p>O Pulso da IA (<strong>pulsodaia.com.br</strong>) eh um portal editorial de noticias sobre inteligencia artificial. Operado por <strong>Triadeflow / Alex Campos</strong>.</p>

<h2>2. Uso do conteudo</h2>
<ul>
<li><strong>Leitura</strong>: livre, gratuita, sem login.</li>
<li><strong>Compartilhamento</strong>: pode compartilhar links, printar, citar trechos curtos com credito visivel.</li>
<li><strong>Republicacao integral</strong>: proibido sem autorizacao escrita.</li>
<li><strong>Uso em treinamento de IA</strong>: proibido usar este conteudo pra treinar modelos de IA sem licenca expressa.</li>
</ul>

<h2>3. Fontes originais</h2>
<p>Todo artigo do Pulso da IA eh <strong>reescrito em portugues</strong> com base em fontes oficiais (OpenAI, Google, Anthropic, DeepMind, etc.) linkadas no corpo do texto. Quando voce quer a versao "oficial-oficial", clica no link pra fonte. A gente respeita copyright.</p>

<h2>4. Opiniao vs fato</h2>
<p>A gente separa. Quando e fato, e fato (com backlink). Quando e analise ou opiniao, sinalizamos com <strong>ANALISE</strong> no eyebrow. Nunca maquiamos uma como a outra.</p>

<h2>5. Newsletter</h2>
<p>O Pulso Semanal eh gratuito, semanal (toda quinta as 9h), e voce descadastra com 1 clique. Nao tem "trial pago". Nao tem pagamento escondido.</p>

<h2>6. Comentarios e contato</h2>
<p>Mensagens enviadas via formulario de contato sao respondidas em ate 1 dia util. A gente se reserva o direito de nao responder spam, assedio ou mensagem comercial fora do escopo do portal.</p>

<h2>7. Limite de responsabilidade</h2>
<p>Conteudo editorial eh jornalismo, nao aconselhamento. Antes de tomar decisao de investimento, tecnica ou de negocio com base no que leu aqui, valide com profissional da area. A gente se esforca pra manter tudo preciso e atualizado, mas pode acontecer erro.</p>

<h2>8. Propriedade intelectual</h2>
<ul>
<li><strong>Marca "Pulso da IA"</strong>, logo e identidade visual: propriedade da Triadeflow.</li>
<li><strong>Artigos originais</strong>: licenca Creative Commons BY-NC 4.0 (voce pode citar e linkar, nao pode usar comercialmente sem permissao).</li>
<li><strong>Imagens ilustrativas</strong>: usamos imagem oficial da fonte (og:image) com credito visivel. Se voce eh dono de alguma e quer retirada, <a href="/contato/">manda mensagem</a>.</li>
</ul>

<h2>9. Mudancas nos termos</h2>
<p>Se a gente mudar algo, atualiza aqui e avisa na proxima edicao do Pulso Semanal. Sem alteracao silenciosa.</p>

<h2>10. Lei aplicavel e foro</h2>
<p>Estes termos sao regidos pela legislacao brasileira. Qualquer disputa sera julgada no foro da comarca de <strong>Campinas / SP</strong>.</p>

<div class="last-updated">Documento vivo · Pulso da IA · 2026-04-19</div>
`
};

// ================ BUILD ==================

function build() {
  engine.ensureArticleCss();

  const pages = [SOBRE, CONTATO, PRIVACIDADE, TERMOS];
  for (const p of pages) {
    const outDir = path.join(ROOT, p.slug);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const html = pageShell({
      slug: p.slug,
      title: p.title,
      metaDesc: p.metaDesc,
      eyebrow: p.eyebrow,
      headline: p.headline,
      subtitle: p.subtitle,
      bodyHtml: p.body
    });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`[build] /${p.slug}/ · ${p.title}`);
  }

  // RSS.xml
  const feed = JSON.parse(fs.readFileSync(FEED_JSON, 'utf8'));
  const rssItems = feed.articles.slice(0, 50).map(a => {
    const pubDate = new Date(a.written_at || a.published_at).toUTCString();
    const url = `https://pulsodaia.com.br/feed/${a.slug}/`;
    const desc = (a.subtitle || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const title = (a.headline || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <category>${a.eyebrow_category || 'NOTICIA'}</category>
      <source url="${a.source_url || ''}">${a.source_name || 'Pulso da IA'}</source>
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pulso da IA</title>
    <link>https://pulsodaia.com.br</link>
    <atom:link href="https://pulsodaia.com.br/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Sinta o pulso do mercado de IA. Fontes oficiais em portugues, direto da fonte, sem filtro de influenciador.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Pulso da IA Motor Pulsante</generator>
${rssItems}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(ROOT, 'rss.xml'), rss);
  console.log(`[build] /rss.xml · ${feed.articles.length} artigos`);

  console.log(`\n[build] concluido · ${pages.length} paginas + rss.xml`);
}

build();
