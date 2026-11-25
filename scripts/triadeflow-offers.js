// Mapa tema do artigo -> oferta da Triadeflow + componentes de CTA reutilizaveis.
// Fonte unica: o template de artigo (feed-engine.js) so chama os render*() daqui.
//
// O que a Triadeflow vende (triadeflow.ai, lido em 24/11/2026): recepcionista de IA no
// WhatsApp para clinicas e negocios de agendamento. Responde em segundos, agenda,
// faz follow-up com quem nao agendou, rastreia a origem de cada lead. Implantacao feita
// pela Triadeflow (done-for-you). Entrada: avaliacao gratuita. Parceira OpenAI Select.
// Nao inventar preco, resultado ou prazo aqui.

const BASE_URL = 'https://triadeflow.ai/';
const UTM_SOURCE = 'pulsodaia';
const UTM_MEDIUM = 'artigo';

const POSITIONS = ['banner-topo', 'meio-artigo', 'fim-artigo', 'quem-faz-o-pulso'];

// Cada tema: palavras que o ativam (comparadas em minusculas e sem acento) e a copy.
// anchors: variantes de texto ancora, sempre com a marca. A escolha e deterministica por slug,
// entao o mesmo texto nao se repete em todo o site (evita padrao de link spam).
const THEMES = [
  {
    id: 'saude-clinicas',
    words: ['saude', 'medicina', 'clinica', 'hospital', 'diagnostico', 'paciente', 'healthtech', 'biotecnologia', 'farmaceutic', 'cirurgia'],
    title: 'Clínica que perde paciente no WhatsApp fora do horário',
    text: 'A Triadeflow coloca uma recepcionista de IA no WhatsApp da clínica. Ela responde em segundos, tira dúvida comum, agenda a consulta e chama de volta quem não marcou. Dúvida clínica vai para a sua equipe.',
    anchors: ['Veja como a Triadeflow atende pacientes no WhatsApp', 'Conheça a recepcionista de IA da Triadeflow', 'A Triadeflow responde paciente em 60 segundos', 'Como a Triadeflow agenda consulta pelo WhatsApp', 'Veja a avaliação gratuita para clínicas da Triadeflow', 'Conversa com a equipe da Triadeflow sobre sua clínica']
  },
  {
    id: 'privacidade-lgpd',
    words: ['privacidade', 'seguranca', 'regulament', 'lgpd', 'direitos autorais', 'etica', 'governanca', 'compliance', 'vazamento'],
    title: 'IA no atendimento, com limite claro de dados',
    text: 'A recepcionista de IA da Triadeflow só coleta o que precisa para agendar, não dá diagnóstico nem promete resultado, e segue as regras de publicidade e de proteção de dados do setor de saúde.',
    anchors: ['Entenda o que a IA da Triadeflow não faz', 'Como a Triadeflow trata dados no atendimento', 'Conheça a abordagem da Triadeflow', 'Os limites da recepcionista de IA da Triadeflow', 'Triadeflow: IA no atendimento com regra de dados', 'Veja como a Triadeflow evita promessa de resultado']
  },
  {
    id: 'agentes-automacao',
    words: ['agente', 'automacao', 'claude code', 'copilot', 'workflow', 'produtividade', 'desenvolvimento de software', 'assistente', 'codigo', 'mcp'],
    title: 'Um agente de IA que já trabalha no seu atendimento',
    text: 'Agentes de IA saíram do laboratório. Na Triadeflow, um deles atende o WhatsApp de clínicas e negócios de agenda: responde, marca horário e faz follow-up em 72 horas sem ninguém precisar lembrar.',
    anchors: ['Veja um agente de IA em operação na Triadeflow', 'Conheça o agente de WhatsApp da Triadeflow', 'Um agente de IA no atendimento: veja a Triadeflow', 'Como a Triadeflow põe agentes para trabalhar', 'Triadeflow: agente de IA com follow-up em 72 horas', 'Veja o agente de atendimento da Triadeflow']
  },
  {
    id: 'modelos-llm',
    words: ['openai', 'chatgpt', 'gpt', 'llm', 'modelos de linguagem', 'gemini', 'anthropic', 'claude', 'deepseek', 'mistral', 'llama', 'benchmark', 'modelo'],
    title: 'Modelo de linguagem bom só importa se chega no cliente',
    text: 'A Triadeflow é parceira OpenAI Select e monta o atendimento no WhatsApp em cima desses modelos, com regras de saúde e de dados por cima. Você não configura nada: a implantação é feita por nós.',
    anchors: ['Veja como a Triadeflow usa IA no WhatsApp', 'Conheça a Triadeflow, parceira OpenAI Select', 'Da API ao WhatsApp: veja o trabalho da Triadeflow', 'Como a Triadeflow implanta IA para clínicas', 'Triadeflow: implantação de IA feita para você', 'Conheça a parceira OpenAI Select de Fortaleza']
  },
  {
    id: 'negocios-mercado',
    words: ['startup', 'investimento', 'ipo', 'mercado', 'empresa', 'negocio', 'vendas', 'mercado de trabalho', 'empreend', 'receita', 'funding', 'aquisicao'],
    title: 'Quem responde primeiro costuma fechar o agendamento',
    text: 'Para negócios que vendem por conversa e agenda, o ganho da IA aparece no tempo de primeira resposta. A Triadeflow responde em até 60 segundos, faz três follow-ups em 72 horas e mostra de onde veio cada contato.',
    anchors: ['Veja o Método da Primeira Resposta da Triadeflow', 'Conheça o atendimento de IA da Triadeflow', 'Como a Triadeflow mede a origem de cada lead', 'Triadeflow: resposta em 60 segundos, todo dia', 'Veja como a Triadeflow recupera quem não agendou', 'Conheça a avaliação gratuita da Triadeflow']
  },
  {
    id: 'geral',
    words: [],
    title: 'IA no atendimento da sua clínica',
    text: 'A Triadeflow é a empresa por trás do Pulso da IA. Ela implanta uma recepcionista de IA no WhatsApp para clínicas e negócios de agendamento: responde rápido, agenda e faz follow-up. A primeira conversa é uma avaliação gratuita.',
    anchors: ['Conheça a Triadeflow', 'Veja o que a Triadeflow faz com IA no WhatsApp', 'Quem está por trás do Pulso: a Triadeflow', 'Triadeflow: recepcionista de IA no WhatsApp', 'Saiba mais sobre a Triadeflow', 'Peça uma avaliação gratuita à Triadeflow']
  }
];

const THEME_BY_ID = Object.fromEntries(THEMES.map(t => [t.id, t]));

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Pontua cada tema por palavra encontrada em tags/keywords (peso 3) e headline/subtitle (peso 1).
// Empate: vale a ordem de THEMES (saude primeiro). Sem acerto: "geral".
function pickTheme(article) {
  const strong = norm([...(article.tags || []), ...(article.seo_keywords || [])].join(' | '));
  const weak = norm(`${article.headline || ''} ${article.subtitle || ''} ${article.category || ''}`);
  let best = THEME_BY_ID.geral;
  let bestScore = 0;
  for (const t of THEMES) {
    let score = 0;
    for (const w of t.words) {
      if (strong.includes(w)) score += 3;
      if (weak.includes(w)) score += 1;
    }
    if (score > bestScore) { best = t; bestScore = score; }
  }
  return best;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickAnchor(theme, slug, position) {
  return theme.anchors[hash(`${slug}|${position}`) % theme.anchors.length];
}

function buildUrl(themeId, position, medium = UTM_MEDIUM) {
  const u = new URL(BASE_URL);
  u.searchParams.set('utm_source', UTM_SOURCE);
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', themeId);
  u.searchParams.set('utm_content', position);
  return u.toString();
}

function link(theme, slug, position, text) {
  return `<a href="${esc(buildUrl(theme.id, position))}" target="_blank" rel="noopener" class="tf-link" data-gtm-event="triadeflow_click" data-gtm-offer-theme="${theme.id}" data-gtm-offer-position="${position}" data-gtm-article-slug="${esc(slug)}" data-gtm-offer-destination="triadeflow.ai">${esc(text)}</a>`;
}

function renderBanner(article) {
  const theme = pickTheme(article);
  return `<div class="tf-banner" role="note">Pulso da IA é um projeto da Triadeflow. ${link(theme, article.slug, 'banner-topo', pickAnchor(theme, article.slug, 'banner-topo'))}</div>`;
}

function renderCta(article, position) {
  const theme = pickTheme(article);
  return `<aside class="tf-cta tf-cta-${position}" aria-label="Triadeflow">
      <div class="tf-eyebrow">DA TRIADEFLOW</div>
      <h3>${esc(theme.title)}</h3>
      <p>${esc(theme.text)}</p>
      ${link(theme, article.slug, position, pickAnchor(theme, article.slug, position))}
    </aside>`;
}

function renderAboutBox(article) {
  const theme = pickTheme(article);
  return `<aside class="tf-about" aria-label="Quem faz o Pulso">
      <div class="tf-eyebrow">QUEM FAZ O PULSO</div>
      <p>O Pulso da IA traduz e resume as fontes oficiais de IA para o português, com o link do original em cada artigo. Quem mantém o portal é a Triadeflow, empresa de Fortaleza que implanta recepcionistas de IA no WhatsApp para clínicas. Editor responsável: <a href="/autores/alex-campos/">Alex Campos</a>.</p>
      ${link(theme, article.slug, 'quem-faz-o-pulso', pickAnchor(theme, article.slug, 'quem-faz-o-pulso'))}
    </aside>`;
}

// Insere o CTA do meio antes do 3o <h2> (secao "O que esperar"), so em artigo longo.
// Sem 3 h2, cai no meio dos paragrafos. Curto: devolve o corpo intacto.
const MID_MIN_WORDS = 400;
function injectMidCta(bodyHtml, article) {
  const words = String(bodyHtml || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (words < MID_MIN_WORDS) return bodyHtml;
  const cta = renderCta(article, 'meio-artigo');
  const h2s = [...bodyHtml.matchAll(/<h2[\s>]/g)];
  if (h2s.length >= 3) {
    const at = h2s[2].index;
    return bodyHtml.slice(0, at) + cta + '\n' + bodyHtml.slice(at);
  }
  const ends = [...bodyHtml.matchAll(/<\/p>/g)];
  if (!ends.length) return bodyHtml;
  const at = ends[Math.floor(ends.length / 2)].index + 4;
  return bodyHtml.slice(0, at) + '\n' + cta + bodyHtml.slice(at);
}

const CSS = `
/* ================= TRIADEFLOW (banner, CTA, quem faz o Pulso) ================= */
.tf-banner { background: #111; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 13px; color: rgba(250,250,250,0.6); padding: 8px 16px; line-height: 1.4; }
.tf-banner a { color: #FF5E1F; margin-left: 6px; }
.tf-cta, .tf-about { border: 1px solid rgba(255,94,31,0.35); background: rgba(255,94,31,0.06); border-radius: 12px; padding: 22px 24px; margin: 36px 0; }
.tf-about { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); }
.tf-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 8px; }
.tf-cta h3 { font-family: 'Fraunces', serif; font-size: 22px; line-height: 1.25; margin: 0 0 8px; color: #FAFAFA; }
.tf-cta p, .tf-about p { font-size: 15px; line-height: 1.6; color: rgba(250,250,250,0.8); margin: 0 0 14px; }
.tf-cta .tf-link, .tf-about .tf-link { font-weight: 600; font-size: 15px; }
.tf-cta .tf-link::after, .tf-about .tf-link::after { content: " →"; }
.tldr { border-left: 3px solid #FF5E1F; background: rgba(255,255,255,0.03); border-radius: 0 10px 10px 0; padding: 16px 20px; margin: 0 0 28px; }
.tldr .tldr-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF5E1F; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 8px; }
.tldr ul { margin: 0; padding-left: 18px; }
.tldr li { font-size: 16px; line-height: 1.55; margin: 6px 0; }
.faq-section { margin: 40px 0 8px; }
.faq-section h2 { font-family: 'Fraunces', serif; font-size: 26px; margin-bottom: 14px; }
.faq-section h3 { font-size: 17px; font-weight: 600; margin: 18px 0 6px; color: #FAFAFA; }
.faq-section p { font-size: 16px; color: rgba(250,250,250,0.85); margin: 0; }
.newsletter-error { color: #ff8a65; font-size: 14px; margin-top: 8px; }
`;

module.exports = { THEMES, THEME_BY_ID, POSITIONS, MID_MIN_WORDS, CSS, pickTheme, pickAnchor, buildUrl, renderBanner, renderCta, renderAboutBox, injectMidCta };
