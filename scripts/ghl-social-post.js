#!/usr/bin/env node
// Cria posts draft no GHL Social Planner a partir dos drafts em social/{slug}/
// V1: Facebook text-only (mais simples, valida fluxo). IG/TikTok/Pinterest com imagem
// aguardam upload de media (proxima iteracao).
//
// Uso:
//   node scripts/ghl-social-post.js --list-accounts
//   node scripts/ghl-social-post.js --slug=abc             # posta 1 artigo
//   node scripts/ghl-social-post.js --all                  # todos artigos com social/ sem posts ainda
//   node scripts/ghl-social-post.js --publish              # publica agora (default: draft)

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const SOCIAL_DIR = path.join(ROOT, 'social');

// Le .env.local
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv();
const PIT = env.GHL_LOCATION_PIT || process.env.GHL_LOCATION_PIT;
const LOCATION_ID = env.GHL_LOCATION_ID || process.env.GHL_LOCATION_ID || 'l4nQqozhymP3hUZibeRY';
const USER_ID = env.GHL_USER_ID || process.env.GHL_USER_ID || 'ct09iFGpSL7kEqOASqpJ';
const API_BASE = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

function ghlRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(API_BASE + endpoint);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        'Authorization': `Bearer ${PIT}`,
        'Version': API_VERSION,
        'Accept': 'application/json',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function listAccounts() {
  const res = await ghlRequest('GET', `/social-media-posting/${LOCATION_ID}/accounts`);
  if (res.status !== 200) throw new Error(`List accounts failed: ${res.status} ${JSON.stringify(res.body).substring(0, 200)}`);
  return res.body.results.accounts;
}

// Extrai texto main do linkedin.md (seccao entre primeiro "---" e segundo "---")
function extractLinkedInText(slug) {
  const mdPath = path.join(SOCIAL_DIR, slug, 'linkedin.md');
  if (!fs.existsSync(mdPath)) return null;
  const md = fs.readFileSync(mdPath, 'utf8');
  const parts = md.split(/^---$/gm);
  if (parts.length < 3) return null;
  // parts[0] = header, parts[1] = content, parts[2] = checklist
  return parts[1].trim();
}

async function createPost({ accountIds, text, scheduleDate, status = 'draft' }) {
  const body = {
    accountIds,
    summary: text.substring(0, 3000),
    type: 'post',
    status,
    userId: USER_ID,
    ...(scheduleDate ? { scheduleDate } : {})
  };
  const res = await ghlRequest('POST', `/social-media-posting/${LOCATION_ID}/posts`, body);
  return res;
}

async function main() {
  if (!PIT) {
    console.error('GHL_LOCATION_PIT missing in .env.local');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const listOnly = args.includes('--list-accounts');
  const publish = args.includes('--publish');
  const allFlag = args.includes('--all');
  const slugArg = (args.find(a => a.startsWith('--slug=')) || '').split('=')[1];

  console.log(`[ghl] location: ${LOCATION_ID}`);

  const accounts = await listAccounts();
  console.log(`[ghl] ${accounts.length} conta(s) conectada(s):`);
  for (const a of accounts) {
    console.log(`  - ${a.platform} · ${a.name} · id=${a.id} · expires=${a.expire}`);
  }

  if (listOnly) return;

  // Escolhe Facebook account como primeira (v1: so FB text-only)
  const fbAccount = accounts.find(a => a.platform === 'facebook' && !a.isExpired);
  if (!fbAccount) {
    console.error('[ghl] nenhuma conta Facebook ativa. Aborta.');
    return;
  }
  console.log(`\n[ghl] usando Facebook: ${fbAccount.name} (${fbAccount.id})`);

  // Determina targets
  if (!fs.existsSync(SOCIAL_DIR)) { console.log('social/ nao existe'); return; }
  const slugs = slugArg ? [slugArg] : (allFlag ? fs.readdirSync(SOCIAL_DIR).filter(d => fs.statSync(path.join(SOCIAL_DIR, d)).isDirectory()) : []);
  if (slugs.length === 0) {
    console.log('\nPassa --slug=xxx ou --all. Usa --list-accounts pra so listar contas.');
    return;
  }

  console.log(`\n[ghl] postando ${slugs.length} artigo(s) como ${publish ? 'published' : 'draft'}...`);
  let ok = 0, fail = 0;
  for (const slug of slugs) {
    const text = extractLinkedInText(slug);
    if (!text) { console.log(`  - ${slug}: sem linkedin.md, skip`); continue; }

    // Pula se ja tem meta.json com posted_at (evita repostar)
    const metaPath = path.join(SOCIAL_DIR, slug, 'meta.json');
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
    if (meta.ghl_posted_at && !args.includes('--force')) {
      console.log(`  ✓ ${slug}: ja postado em ${meta.ghl_posted_at}, skip (--force pra reenviar)`);
      continue;
    }

    try {
      const res = await createPost({
        accountIds: [fbAccount.id],
        text,
        status: publish ? 'published' : 'draft'
      });

      if (res.status >= 200 && res.status < 300) {
        const postId = res.body?.results?._id || res.body?.results?.id || res.body?._id || '(id?)';
        console.log(`  ✓ ${slug}: status ${res.status} · post_id=${postId}`);
        // Atualiza meta.json
        meta.ghl_posted_at = new Date().toISOString();
        meta.ghl_post_id = postId;
        meta.ghl_status = publish ? 'published' : 'draft';
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
        ok++;
      } else {
        console.log(`  ✗ ${slug}: ${res.status} ${JSON.stringify(res.body).substring(0, 200)}`);
        fail++;
      }
    } catch (e) {
      console.log(`  ✗ ${slug}: ${e.message}`);
      fail++;
    }

    // Throttle — evita rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n[ghl] ok=${ok} fail=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
