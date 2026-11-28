#!/usr/bin/env node
// Autoverificacao de logica nao trivial: mapa tema->oferta, UTM, CTA do meio e guardrails da newsletter.
// Uso: node scripts/test-pulso-traffic.js   (sai com 1 se algo quebrar)
const assert = require('assert');
const tf = require('./triadeflow-offers.js');
const nl = require('./newsletter-weekly.js');

// UTM padrao
const u = new URL(tf.buildUrl('saude-clinicas', 'fim-artigo'));
assert.strictEqual(u.origin + u.pathname, 'https://triadeflow.ai/');
assert.deepStrictEqual(Object.fromEntries(u.searchParams), { utm_source: 'pulsodaia', utm_medium: 'artigo', utm_campaign: 'saude-clinicas', utm_content: 'fim-artigo' });
assert.strictEqual(new URL(tf.buildUrl('geral', 'x', 'newsletter')).searchParams.get('utm_medium'), 'newsletter');

// Tema
assert.strictEqual(tf.pickTheme({ tags: ['saúde', 'hospital'], headline: 'x' }).id, 'saude-clinicas');
assert.strictEqual(tf.pickTheme({ tags: ['privacidade'], headline: 'x' }).id, 'privacidade-lgpd');
assert.strictEqual(tf.pickTheme({ tags: [], headline: 'nada a ver' }).id, 'geral');

// Ancora varia entre slugs do mesmo tema (nao repete o mesmo texto no site todo)
const t = tf.THEME_BY_ID['negocios-mercado'];
const anchors = new Set(Array.from({ length: 40 }, (_, i) => tf.pickAnchor(t, `slug-${i}`, 'fim-artigo')));
assert.ok(anchors.size > 1, 'ancora nao varia');
assert.ok([...anchors].every(a => /Triadeflow/.test(a)), 'ancora sem a marca');

// CTA do meio: curto fica intacto, longo recebe 1 bloco antes do 3o h2
const art = { slug: 's', tags: [], headline: 'h' };
const shortBody = '<h2>a</h2><p>poucas palavras</p>';
assert.strictEqual(tf.injectMidCta(shortBody, art), shortBody);
const longBody = `<h2>a</h2><p>${'palavra '.repeat(250)}</p><h2>b</h2><p>${'palavra '.repeat(250)}</p><h2>c</h2><p>fim</p>`;
const mid = tf.injectMidCta(longBody, art);
assert.strictEqual((mid.match(/tf-cta-meio-artigo/g) || []).length, 1);
assert.ok(mid.indexOf('tf-cta-meio-artigo') < mid.indexOf('<h2>c</h2>') && mid.indexOf('tf-cta-meio-artigo') > mid.indexOf('<h2>b</h2>'));

// Guardrails da newsletter
const T = ['newsletter-ia-semanal'];
assert.throws(() => nl.selectRecipients([{ email: 'a@b.com', tags: T }], ''), /ALLOWLIST/);
assert.deepStrictEqual(nl.selectRecipients([{ email: 'a@b.com', tags: T }, { email: 'c@d.com', tags: T }], 'A@b.com').map(c => c.email), ['a@b.com']);
assert.strictEqual(nl.selectRecipients([{ email: 'x@y.com', tags: ['cliente'] }, { email: 'z@y.com', tags: T, dnd: true }], '*').length, 0);
const many = Array.from({ length: nl.MAX_RECIPIENTS + 1 }, (_, i) => ({ email: `u${i}@x.com`, tags: T }));
assert.throws(() => nl.selectRecipients(many, '*'), /teto/);
assert.strictEqual(nl.selectRecipients(many.slice(0, 3), '*').length, 3);

// Nenhum artigo orfao: todo slug do feed.json tem link no HTML de /feed/ ou de /feed/page/N/ (sem JS)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const slugs = JSON.parse(fs.readFileSync(path.join(root, 'data', 'feed.json'), 'utf8')).articles.map(a => a.slug);
const listed = new Set();
const pagesDir = path.join(root, 'feed', 'page');
const files = [path.join(root, 'feed', 'index.html'), ...fs.readdirSync(pagesDir).map(n => path.join(pagesDir, n, 'index.html'))];
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/<a href="\/feed\/([^/"]+)\/" class="(?:article|featured)-card"/g)) listed.add(m[1]);
assert.deepStrictEqual(slugs.filter(sl => !listed.has(sl)), [], 'artigos orfaos fora de /feed/ e /feed/page/N/');

console.log('ok: todos os checks passaram');
