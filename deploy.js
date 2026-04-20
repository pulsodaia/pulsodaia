#!/usr/bin/env node
// Direct upload pra Cloudflare Pages usando API Workers
// docs: https://developers.cloudflare.com/pages/platform/direct-upload/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '5ec238b420a9e6b7e78efdde132b4291';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const PROJECT = process.env.PAGES_PROJECT || 'pulsodaia';
const BRANCH = process.env.PAGES_BRANCH || 'main';

if (!API_TOKEN) { console.error('Set CLOUDFLARE_API_TOKEN'); process.exit(1); }

const ROOT = __dirname;
const IGNORE = new Set([
  'node_modules', '.git', '.wrangler', 'logos-temp',
  'deploy.js', '.gitignore', '.last-generated',
  'social', 'scripts', 'config'
]);

function walk(dir, base = '') {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (IGNORE.has(name) || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walk(full, rel));
    else out.push({ full, rel: '/' + rel, size: stat.size });
  }
  return out;
}

function contentHash(filepath, extHint) {
  const data = fs.readFileSync(filepath);
  // Cloudflare Pages usa SHA-256 do conteudo + extension hint (ex: html,json,png)
  // Hash final: 32 chars hex
  const ext = (extHint || path.extname(filepath).slice(1)).toLowerCase();
  const content = Buffer.concat([data, Buffer.from(ext)]);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 32);
}

function mime(ext) {
  const map = {
    html: 'text/html', htm: 'text/html',
    js: 'application/javascript', json: 'application/json',
    css: 'text/css', svg: 'image/svg+xml',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', ico: 'image/x-icon',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/x-m4v',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
    pdf: 'application/pdf',
    md: 'text/markdown', txt: 'text/plain', xml: 'application/xml',
    woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

function request(host, pathUrl, method, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: host, path: pathUrl, method, headers };
    const req = https.request(opts, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('[1/5] Coletando arquivos...');
  const files = walk(ROOT);
  console.log(`    ${files.length} arquivos`);

  console.log('[2/5] Calculando hashes (manifest)...');
  const manifest = {};
  const byHash = {};
  for (const f of files) {
    const ext = path.extname(f.full).slice(1);
    const h = contentHash(f.full, ext);
    manifest[f.rel] = h;
    byHash[h] = { ...f, ext };
  }

  console.log('[3/5] Pegando JWT de upload...');
  const jwtRes = await request(
    'api.cloudflare.com',
    `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/upload-token`,
    'GET',
    { 'Authorization': `Bearer ${API_TOKEN}` }
  );
  if (!jwtRes.body.success) { console.error('JWT fail:', JSON.stringify(jwtRes.body.errors)); process.exit(1); }
  const jwt = jwtRes.body.result.jwt;
  console.log(`    JWT ok (${jwt.length} chars)`);

  console.log('[4/5] Checando hashes faltantes...');
  const hashes = Object.keys(byHash);
  const checkBody = JSON.stringify({ hashes });
  const checkRes = await request(
    'api.cloudflare.com',
    '/client/v4/pages/assets/check-missing',
    'POST',
    {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(checkBody)
    },
    checkBody
  );
  if (!checkRes.body.success) { console.error('check-missing fail:', JSON.stringify(checkRes.body.errors)); process.exit(1); }
  const missing = checkRes.body.result || [];
  console.log(`    ${missing.length} / ${hashes.length} missing (precisam upload)`);

  console.log('[4.5/5] Upload dos arquivos faltantes...');
  const batchSize = 5;
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize).map(h => {
      const f = byHash[h];
      const content = fs.readFileSync(f.full);
      return {
        key: h,
        value: content.toString('base64'),
        metadata: { contentType: mime(f.ext) },
        base64: true
      };
    });
    const uploadBody = JSON.stringify(batch);
    const up = await request(
      'api.cloudflare.com',
      '/client/v4/pages/assets/upload',
      'POST',
      {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(uploadBody)
      },
      uploadBody
    );
    if (!up.body.success) { console.error(`upload batch ${i} fail:`, JSON.stringify(up.body.errors)); process.exit(1); }
    process.stdout.write(`    ${Math.min(i + batchSize, missing.length)}/${missing.length}\r`);
  }
  console.log();

  console.log('[5/5] Criando deployment...');
  const boundary = '----------bnd_' + Date.now();
  const parts = [];
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="manifest"\r\n\r\n${JSON.stringify(manifest)}\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="branch"\r\n\r\n${BRANCH}\r\n`));
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  const deployRes = await request(
    'api.cloudflare.com',
    `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/deployments`,
    'POST',
    {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    },
    body
  );
  if (!deployRes.body.success) { console.error('deploy fail:', JSON.stringify(deployRes.body.errors)); process.exit(1); }
  const d = deployRes.body.result;
  console.log(`\n✅ Deploy OK`);
  console.log(`   URL: ${d.url}`);
  console.log(`   Stage: ${d.latest_stage.name} / ${d.latest_stage.status}`);
  console.log(`   ID: ${d.id}`);
}

main().catch(e => { console.error(e); process.exit(1); });
