#!/usr/bin/env node
// IndexNow (Bing, Yandex e outros; o Google nao participa). Avisa URLs novas apos o deploy.
// A chave e publica por desenho: o arquivo /dd7c0ba89ac97bc9fadf9276c785dd7a.txt na raiz prova que o dominio e nosso.
//
// Uso:
//   node scripts/indexnow.js --dry-run     # lista o que enviaria, sem rede
//   node scripts/indexnow.js               # envia (so rodar depois do deploy)
//   node scripts/indexnow.js --urls=https://pulsodaia.com.br/feed/x/,https://...
// Sem --urls, usa as URLs do sitemap-news.xml (artigos das ultimas 48h) mais a home e o /feed/.
const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'pulsodaia.com.br';
const KEY = 'dd7c0ba89ac97bc9fadf9276c785dd7a';
const MAX_URLS = 100; // teto fixo por envio; passou disso, aborta em vez de truncar
const dry = process.argv.includes('--dry-run');
const urlsArg = (process.argv.find(a => a.startsWith('--urls=')) || '').slice(7);

function fromNewsSitemap() {
  const xml = fs.readFileSync(path.join(__dirname, '..', 'sitemap-news.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

const urls = [...new Set([...(urlsArg ? urlsArg.split(',') : fromNewsSitemap()), `https://${HOST}/`, `https://${HOST}/feed/`])];
if (urls.length > MAX_URLS) { console.error(`[indexnow] ${urls.length} URLs > teto ${MAX_URLS}. Abortado.`); process.exit(2); }
if (!fs.existsSync(path.join(__dirname, '..', `${KEY}.txt`))) { console.error('[indexnow] arquivo da chave nao existe na raiz'); process.exit(2); }
console.log(`[indexnow] ${urls.length} URLs${dry ? ' (dry-run, nada enviado)' : ''}`);
if (dry) { urls.slice(0, 5).forEach(u => console.log('  ' + u)); process.exit(0); }

const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls });
const req = https.request({ hostname: 'api.indexnow.org', path: '/IndexNow', method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) } }, res => {
  console.log('[indexnow] HTTP', res.statusCode); // 200/202 = ok
  res.resume();
  res.on('end', () => process.exit(res.statusCode < 300 ? 0 : 1));
});
req.on('error', e => { console.error('[indexnow] falhou:', e.message); process.exit(1); });
req.end(body);
