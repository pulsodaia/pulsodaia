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
function extractText(slug, file) {
  const mdPath = path.join(SOCIAL_DIR, slug, file);
  if (!fs.existsSync(mdPath)) return null;
  const md = fs.readFileSync(mdPath, 'utf8');
  const parts = md.split(/^---$/gm);
  if (parts.length < 3) return null;
  return parts[1].trim();
}

function extractInstagramCaption(slug) {
  const mdPath = path.join(SOCIAL_DIR, slug, 'instagram.md');
  if (!fs.existsSync(mdPath)) return null;
  const md = fs.readFileSync(mdPath, 'utf8');
  // Caption fica na secao "## Legenda do post" ou similar
  const match = md.match(/##\s*Legenda do post[\s\S]*?\n\n([\s\S]*?)(?=\n##|\n---|$)/i);
  if (match) return match[1].trim();
  // Fallback: pega primeiro paragrafo util
  return extractText(slug, 'linkedin.md') || '';
}

// URLs publicas dos cards IG (renderizados em assets/ig-cards/)
function getCardUrls(slug) {
  const dir = path.join(__dirname, '..', 'assets', 'ig-cards', slug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /^card-\d+\.png$/.test(f))
    .sort()
    .map(f => `https://pulsodaia.com.br/assets/ig-cards/${slug}/${f}`);
}

// URL publica do hero do artigo (pra Pinterest/single-image posts)
function getHeroUrl(slug) {
  const dir = path.join(__dirname, '..', 'feed', slug);
  if (!fs.existsSync(dir)) return null;
  const hero = fs.readdirSync(dir).find(f => /^hero\.(jpg|jpeg|png|webp)$/i.test(f));
  return hero ? `https://pulsodaia.com.br/feed/${slug}/${hero}` : null;
}

async function createPost({ accountIds, text, mediaUrls = [], scheduleDate, status = 'draft' }) {
  const body = {
    accountIds,
    summary: String(text || '').substring(0, 3000),
    type: 'post',
    status,
    userId: USER_ID,
    ...(mediaUrls.length ? { media: mediaUrls.map(url => ({ url, type: 'image' })) } : {}),
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

  // Escolhe platforms desejadas (default: todas as conectadas ativas exceto YouTube/TikTok que exigem video)
  const platformsArg = (args.find(a => a.startsWith('--platforms=')) || '').split('=')[1];
  const wantedPlatforms = platformsArg
    ? platformsArg.split(',').map(s => s.trim().toLowerCase())
    : ['facebook', 'instagram', 'pinterest', 'bluesky'];

  const byPlatform = {};
  for (const a of accounts) {
    if (a.isExpired) continue;
    if (wantedPlatforms.includes(a.platform)) byPlatform[a.platform] = a;
  }

  if (Object.keys(byPlatform).length === 0) {
    console.error('[ghl] nenhuma conta das platforms solicitadas esta ativa');
    return;
  }
  console.log(`\n[ghl] platforms alvo: ${Object.keys(byPlatform).join(', ')}`);

  if (!fs.existsSync(SOCIAL_DIR)) { console.log('social/ nao existe'); return; }
  const slugs = slugArg ? [slugArg] : (allFlag ? fs.readdirSync(SOCIAL_DIR).filter(d => fs.statSync(path.join(SOCIAL_DIR, d)).isDirectory()) : []);
  if (slugs.length === 0) {
    console.log('\nPassa --slug=xxx ou --all. Usa --list-accounts pra so listar contas.');
    return;
  }

  console.log(`\n[ghl] postando ${slugs.length} artigo(s) como ${publish ? 'published' : 'draft'}...\n`);
  let ok = 0, fail = 0;
  for (const slug of slugs) {
    const linkedinText = extractText(slug, 'linkedin.md');
    const igCaption = extractInstagramCaption(slug);
    const cardUrls = getCardUrls(slug);
    const heroUrl = getHeroUrl(slug);

    if (!linkedinText && !igCaption) {
      console.log(`  - ${slug}: sem drafts, skip`);
      continue;
    }

    const metaPath = path.join(SOCIAL_DIR, slug, 'meta.json');
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
    meta.ghl_posts = meta.ghl_posts || {};

    console.log(`[${slug}]`);

    // Estrategia: 2 posts maximo
    // Post A — Instagram (carousel cards, se tiver); senao junta com B
    // Post B — Multi-platform (FB + Pinterest + Bluesky) com hero image compartilhada
    const jobs = [];

    if (byPlatform.instagram && cardUrls.length) {
      jobs.push({
        key: 'instagram-carousel',
        accountIds: [byPlatform.instagram.id],
        text: igCaption || linkedinText,
        mediaUrls: cardUrls,
        platforms: ['instagram']
      });
    }

    const multiAccounts = [];
    const multiPlatforms = [];
    if (byPlatform.facebook) { multiAccounts.push(byPlatform.facebook.id); multiPlatforms.push('facebook'); }
    if (byPlatform.pinterest && heroUrl) { multiAccounts.push(byPlatform.pinterest.id); multiPlatforms.push('pinterest'); }
    if (byPlatform.bluesky) { multiAccounts.push(byPlatform.bluesky.id); multiPlatforms.push('bluesky'); }
    // Se IG nao tiver cards, vai junto com single-image hero
    if (byPlatform.instagram && !cardUrls.length && heroUrl) {
      multiAccounts.push(byPlatform.instagram.id);
      multiPlatforms.push('instagram');
    }

    if (multiAccounts.length) {
      jobs.push({
        key: 'multi-hero',
        accountIds: multiAccounts,
        text: linkedinText,
        mediaUrls: heroUrl ? [heroUrl] : [],
        platforms: multiPlatforms
      });
    }

    for (const job of jobs) {
      const alreadyDone = job.platforms.every(p => meta.ghl_posts[p] && !args.includes('--force'));
      if (alreadyDone) {
        console.log(`  - ${job.key} (${job.platforms.join('+')}): ja postado, skip`);
        continue;
      }

      try {
        const res = await createPost({
          accountIds: job.accountIds,
          text: job.text,
          mediaUrls: job.mediaUrls,
          status: publish ? 'published' : 'draft'
        });

        if (res.status >= 200 && res.status < 300) {
          const postId = res.body?.results?._id || res.body?.results?.id || res.body?._id || res.body?.results?.post?._id || '(id?)';
          console.log(`  ✓ ${job.key} (${job.platforms.join('+')}): ${res.status} · post_id=${postId}${job.mediaUrls.length ? ` · ${job.mediaUrls.length} media` : ''}`);
          for (const p of job.platforms) {
            meta.ghl_posts[p] = { post_id: postId, posted_at: new Date().toISOString(), status: publish ? 'published' : 'draft', job: job.key };
          }
          ok++;
        } else {
          console.log(`  ✗ ${job.key}: ${res.status} ${JSON.stringify(res.body).substring(0, 200)}`);
          fail++;
        }
      } catch (e) {
        console.log(`  ✗ ${job.key}: ${e.message}`);
        fail++;
      }
      await new Promise(r => setTimeout(r, 1500));
    }
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }

  console.log(`\n[ghl] ok=${ok} fail=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
