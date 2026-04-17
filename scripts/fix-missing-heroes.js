#!/usr/bin/env node
// Baixa og:image pros artigos que ainda nao tem hero.*
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const FEED_DIR = path.join(ROOT, 'feed');
const FEED_JSON = path.join(ROOT, 'data', 'feed.json');
const engine = require('./feed-engine.js');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'Mozilla/5.0 PulsoDaIA/1.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) return httpGet(res.headers.location).then(resolve).catch(reject);
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    }).on('error', reject);
  });
}

function download(imgUrl, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const u = new URL(imgUrl);
    const mod = u.protocol === 'http:' ? require('http') : require('https');
    mod.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'Mozilla/5.0 PulsoDaIA/1.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); fs.unlinkSync(destPath);
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function extractOgImage(url) {
  try {
    const res = await httpGet(url);
    if (res.status !== 200) return null;
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
    ];
    for (const p of patterns) {
      const m = res.body.match(p);
      if (m && m[1]) {
        let u = m[1].trim();
        if (u.startsWith('//')) u = 'https:' + u;
        if (u.startsWith('/')) { const base = new URL(url); u = base.origin + u; }
        if (u.startsWith('http')) return u;
      }
    }
  } catch {}
  return null;
}

async function main() {
  const feed = JSON.parse(fs.readFileSync(FEED_JSON, 'utf8'));
  for (const entry of feed.articles) {
    const dir = path.join(FEED_DIR, entry.slug);
    if (!fs.existsSync(dir)) continue;
    const existing = fs.readdirSync(dir).find(f => /^hero\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    if (existing) { console.log(`[skip] ${entry.slug} · ja tem ${existing}`); continue; }

    const url = entry.source_url;
    if (!url) { console.log(`[skip] ${entry.slug} · sem source_url`); continue; }

    console.log(`[fetch] ${entry.slug} ← ${url}`);
    const og = await extractOgImage(url);
    if (!og) { console.log(`  [x] sem og:image`); continue; }
    const ext = (og.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) || [])[1] || 'jpg';
    const heroPath = path.join(dir, `hero.${ext.toLowerCase()}`);
    try {
      await download(og, heroPath);
      entry.hero_image = `hero.${ext.toLowerCase()}`;
      console.log(`  ✓ ${og} → hero.${ext.toLowerCase()} (${(fs.statSync(heroPath).size/1024).toFixed(0)}KB)`);

      // Atualiza article.json do dir se existir
      const ajPath = path.join(dir, 'article.json');
      if (fs.existsSync(ajPath)) {
        const aj = JSON.parse(fs.readFileSync(ajPath, 'utf8'));
        aj.hero_image = entry.hero_image;
        aj.hero_source_url = og;
        fs.writeFileSync(ajPath, JSON.stringify(aj, null, 2));
      }
    } catch (e) {
      console.log(`  [x] download falhou: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  feed.generated_at = new Date().toISOString();
  fs.writeFileSync(FEED_JSON, JSON.stringify(feed, null, 2));

  // Re-renderiza artigos cujo hero mudou (simples: re-renderiza todos usando article.json)
  console.log('\n[rerender] aplicando novo hero + related atualizado...');
  for (const entry of feed.articles) {
    const dir = path.join(FEED_DIR, entry.slug);
    const ajPath = path.join(dir, 'article.json');
    if (!fs.existsSync(ajPath)) continue;
    const article = JSON.parse(fs.readFileSync(ajPath, 'utf8'));
    article.hero_image = entry.hero_image || article.hero_image;
    const related = engine.getRelatedArticles(article.slug, feed.articles, 3);
    fs.writeFileSync(path.join(dir, 'index.html'), engine.renderArticleHtml(article, related));
    console.log(`  ✓ ${entry.slug} · hero=${article.hero_image || '-'}`);
  }
  console.log('[fix-missing-heroes] concluido');
}

main().catch(e => { console.error(e); process.exit(1); });
