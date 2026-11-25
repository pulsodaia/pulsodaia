#!/usr/bin/env node
// Newsletter semanal "Pulso Semanal" (quinta, 9h): monta a edicao com os 5 melhores artigos
// dos ultimos 7 dias e, SO com ordem explicita, envia pelos contatos do GHL.
//
// NO MASS DISPATCH: este script manda e-mail para mais de 1 pessoa, entao tem os 4 guardrails em codigo:
//   1. Teto fixo: MAX_RECIPIENTS. Passou disso, aborta (nao trunca).
//   2. Dry-run e o padrao. So envia com --send.
//   3. CRONS_ENABLED desligado por padrao: --send sem CRONS_ENABLED=true aborta.
//   4. Allowlist herdada: --send exige NEWSLETTER_ALLOWLIST (e-mails separados por virgula);
//      so quem esta na lista recebe. "*" libera geral, decisao so do Alex.
// Nao existe cron nem schedule apontando para este arquivo. Nada dispara sozinho.
//
// Uso:
//   node scripts/newsletter-weekly.js                       # dry-run: mostra assunto e artigos
//   node scripts/newsletter-weekly.js --out=/tmp/ed.html    # dry-run + grava o HTML da edicao
//   CRONS_ENABLED=true NEWSLETTER_ALLOWLIST=a@b.com GHL_LOCATION_PIT=... NEWSLETTER_UNSUBSCRIBE_URL=... \
//     node scripts/newsletter-weekly.js --send
//
// NAO TESTADO contra o GHL: o PIT guardado esta invalido (401 em 24/11/2026). As chamadas de
// busca de contatos e envio seguem a API v2 e precisam ser validadas com 1 e-mail na allowlist.

const fs = require('fs');
const path = require('path');
const https = require('https');
const tf = require('./triadeflow-offers.js');

const MAX_RECIPIENTS = 50;
const LOCATION_ID = 'l4nQqozhymP3hUZibeRY'; // sub-account Pulso da IA
const TAG = 'newsletter-ia-semanal';
const SITE = 'https://pulsodaia.com.br';

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function articleUrl(slug, position) {
  return `${SITE}/feed/${slug}/?utm_source=pulsodaia&utm_medium=email&utm_campaign=newsletter-semanal&utm_content=${position}`;
}

// Os 5 melhores dos ultimos 7 dias: maior quality_score, desempate por recencia.
function pickTop(articles, now = Date.now(), n = 5) {
  const cutoff = now - 7 * 24 * 3600 * 1000;
  return articles
    .filter(a => new Date(a.written_at || a.published_at).getTime() >= cutoff)
    .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0) || new Date(b.written_at) - new Date(a.written_at))
    .slice(0, n);
}

function buildIssue(articles, { now = Date.now(), unsubscribeUrl = '{{UNSUBSCRIBE_URL}}' } = {}) {
  const top = pickTop(articles, now);
  if (!top.length) return null;
  const subject = `Pulso da IA: ${top[0].headline}${top.length > 1 ? ` e mais ${top.length - 1} da semana` : ''}`;
  const theme = tf.THEME_BY_ID.geral;
  const items = top.map((a, i) => `<tr><td style="padding:14px 0;border-bottom:1px solid #eee">
      <a href="${esc(articleUrl(a.slug, `item-${i + 1}`))}" style="font-size:18px;font-weight:600;color:#111;text-decoration:none">${esc(a.headline)}</a>
      <div style="font-size:14px;color:#555;margin-top:4px">${esc(a.subtitle)}</div></td></tr>`).join('');
  const html = `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;background:#f6f6f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;padding:28px">
<tr><td><div style="font-size:12px;letter-spacing:2px;color:#FF5E1F;font-weight:700">PULSO SEMANAL</div>
<h1 style="font-size:24px;margin:8px 0 16px">Os ${top.length} destaques de IA da semana</h1></td></tr>
${items}
<tr><td style="padding-top:22px;font-size:14px;color:#333">${esc(theme.text)}
<a href="${esc(tf.buildUrl(theme.id, 'newsletter-rodape', 'newsletter'))}" style="color:#FF5E1F;font-weight:600">${esc(tf.pickAnchor(theme, 'newsletter', 'rodape'))}</a></td></tr>
<tr><td style="padding-top:24px;font-size:12px;color:#888">Você recebe este e-mail porque assinou o Pulso Semanal em pulsodaia.com.br. <a href="${esc(unsubscribeUrl)}" style="color:#888">Cancelar inscrição</a>.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, slugs: top.map(a => a.slug) };
}

// Guardrails 1 e 4 como funcao pura (testavel sem rede).
function selectRecipients(contacts, allowlistRaw, max = MAX_RECIPIENTS) {
  const raw = String(allowlistRaw || '').trim();
  if (!raw) throw new Error('NEWSLETTER_ALLOWLIST vazia: envio bloqueado');
  const allowed = raw === '*' ? null : new Set(raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean));
  const list = contacts.filter(c => c.email && (!allowed || allowed.has(String(c.email).toLowerCase())));
  if (list.length > max) throw new Error(`${list.length} destinatarios > teto ${max}: abortado (risco de mass dispatch)`);
  return list;
}

function ghl(pit, method, urlPath, body, version) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'services.leadconnectorhq.com', path: urlPath, method,
      headers: { Authorization: `Bearer ${pit}`, Version: version, 'Content-Type': 'application/json', Accept: 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
    }, res => {
      let out = '';
      res.on('data', c => (out += c));
      res.on('end', () => (res.statusCode < 300 ? resolve(out ? JSON.parse(out) : {}) : reject(new Error(`GHL ${res.statusCode} ${urlPath}`))));
    });
    req.on('error', reject);
    req.end(data);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const send = args.includes('--send') && !args.includes('--dry-run');
  const out = (args.find(a => a.startsWith('--out=')) || '').slice(6);
  const unsubscribeUrl = process.env.NEWSLETTER_UNSUBSCRIBE_URL || '';

  const feed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'feed.json'), 'utf8'));
  const issue = buildIssue(feed.articles, { unsubscribeUrl: unsubscribeUrl || '{{UNSUBSCRIBE_URL}}' });
  if (!issue) { console.log('[newsletter] sem artigos nos ultimos 7 dias, nada a montar'); return; }
  console.log(`[newsletter] assunto: ${issue.subject}`);
  console.log(`[newsletter] artigos: ${issue.slugs.join(', ')}`);
  if (out) { fs.writeFileSync(out, issue.html); console.log(`[newsletter] HTML gravado em ${out}`); }

  if (!send) { console.log(`[newsletter] DRY-RUN: nada enviado, GHL nao consultado (teto fixo ${MAX_RECIPIENTS} destinatarios)`); return; }

  if (String(process.env.CRONS_ENABLED || 'false').toLowerCase() !== 'true') { console.error('[newsletter] CRONS_ENABLED desligado. Envio bloqueado.'); process.exit(3); }
  if (!unsubscribeUrl) { console.error('[newsletter] NEWSLETTER_UNSUBSCRIBE_URL ausente: sem link de descadastro nao envia.'); process.exit(3); }
  const pit = process.env.GHL_LOCATION_PIT;
  if (!pit) { console.error('[newsletter] GHL_LOCATION_PIT ausente.'); process.exit(3); }

  const found = await ghl(pit, 'POST', '/contacts/search', { locationId: LOCATION_ID, pageLimit: MAX_RECIPIENTS + 1, filters: [{ field: 'tags', operator: 'contains', value: [TAG] }] }, '2021-07-28');
  const recipients = selectRecipients(found.contacts || [], process.env.NEWSLETTER_ALLOWLIST);
  console.log(`[newsletter] ${recipients.length} destinatario(s) apos allowlist`);
  for (const c of recipients) {
    await ghl(pit, 'POST', '/conversations/messages', { type: 'Email', contactId: c.id, subject: issue.subject, html: issue.html }, '2021-04-15');
    console.log(`[newsletter] audit enviado contactId=${c.id} em ${new Date().toISOString()}`);
    await new Promise(r => setTimeout(r, 1000));
  }
}

module.exports = { MAX_RECIPIENTS, pickTop, buildIssue, selectRecipients };
if (require.main === module) main().catch(e => { console.error('[newsletter] erro:', e.message); process.exit(1); });
