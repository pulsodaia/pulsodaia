#!/usr/bin/env node
// Re-renderiza TODOS os artigos a partir do article.json com o template atual (feed-engine.js).
// Nao reescreve article.json nem feed.json (ao contrario de rerender-existing.js).
// Uso: node scripts/rerender-articles.js [--dry]
const fs = require('fs');
const path = require('path');
const engine = require('./feed-engine.js');

const FEED_DIR = path.join(__dirname, '..', 'feed');
const feed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'feed.json'), 'utf8'));
const dry = process.argv.includes('--dry');

if (!dry) engine.ensureArticleCss();
let done = 0, skipped = 0;
for (const entry of feed.articles) {
  const jsonPath = path.join(FEED_DIR, entry.slug, 'article.json');
  if (!fs.existsSync(jsonPath)) { skipped++; continue; }
  const article = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const html = engine.renderArticleHtml(article, engine.getRelatedArticles(article.slug, feed.articles));
  if (!dry) fs.writeFileSync(path.join(FEED_DIR, entry.slug, 'index.html'), html);
  done++;
}
console.log(`[rerender-articles] ${done} renderizados, ${skipped} sem article.json${dry ? ' (dry)' : ''}`);
