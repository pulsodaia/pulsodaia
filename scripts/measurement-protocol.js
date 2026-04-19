#!/usr/bin/env node
// Pulso da IA — Google Analytics 4 Measurement Protocol helper (server-side)
//
// Fires events to GA4 via HTTP POST. Use for server events that cannot be
// captured by the browser gtag (e.g. webhook from GHL, cron job, backend
// mutation).
//
// Setup (one-time):
//   1. Go to analytics.google.com -> Admin -> Data Streams
//   2. Click the Pulso da IA stream (G-32GWZHPJGJ)
//   3. Scroll to "Measurement Protocol API secrets" -> Create
//   4. Copy the secret value
//   5. Add to .env.local:  GA4_API_SECRET=xxxxxxxxxxx
//
// Programmatic usage:
//   const { mpEvent, mpBatch, generateClientId } = require('./measurement-protocol');
//   await mpEvent('newsletter_confirmed', { source: 'homepage', medium: 'popup' });
//
// CLI usage:
//   node scripts/measurement-protocol.js --event=test_event --param=key:value --param=source:cli
//   node scripts/measurement-protocol.js --event=page_view --client_id=abc-123

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// ================ ENV LOADER (simple, no dotenv dep) ==================

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // Strip optional surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const ENV = { ...loadEnvLocal(), ...process.env };
const MEASUREMENT_ID = ENV.GA4_MEASUREMENT_ID || 'G-32GWZHPJGJ';
const API_SECRET = ENV.GA4_API_SECRET || '';

if (!API_SECRET) {
  // Warn but do not throw — the script must be importable/runnable before
  // the user has generated the MP secret. Calls will log and no-op.
  console.warn('[mp] WARNING: GA4_API_SECRET missing in .env.local. Events will be logged but NOT sent to GA4.');
  console.warn('[mp] Create one: analytics.google.com -> Admin -> Data Streams -> {stream} -> Measurement Protocol API secrets -> Create');
}

// ================ CLIENT ID ==================

function generateClientId() {
  // UUID v4 — good enough for MP client_id (GA4 expects any stable string)
  return crypto.randomUUID ? crypto.randomUUID() : [
    crypto.randomBytes(4).toString('hex'),
    crypto.randomBytes(2).toString('hex'),
    crypto.randomBytes(2).toString('hex'),
    crypto.randomBytes(2).toString('hex'),
    crypto.randomBytes(6).toString('hex')
  ].join('-');
}

// ================ HTTP ==================

function httpPostJson(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body: raw });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ================ CORE API ==================

// Fire a single event. Returns { ok, status, skipped? }.
async function mpEvent(name, params = {}, clientId) {
  return mpBatch([{ name, params }], clientId);
}

// Fire multiple events in a single MP call (GA4 accepts up to 25).
async function mpBatch(events, clientId) {
  if (!Array.isArray(events) || events.length === 0) {
    return { ok: false, error: 'events must be a non-empty array' };
  }
  if (events.length > 25) {
    return { ok: false, error: 'max 25 events per MP call' };
  }

  const cid = clientId || ENV.MP_DEFAULT_CLIENT_ID || generateClientId();
  const payload = { client_id: cid, events };

  if (!API_SECRET) {
    console.log('[mp] SKIPPED (no secret):', JSON.stringify({ client_id: cid, events }));
    return { ok: false, skipped: true, reason: 'missing GA4_API_SECRET' };
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(MEASUREMENT_ID)}&api_secret=${encodeURIComponent(API_SECRET)}`;

  try {
    const res = await httpPostJson(url, payload);
    // MP returns 204 No Content on success (silent). 2xx = ok.
    const ok = res.status >= 200 && res.status < 300;
    if (!ok) {
      console.error('[mp] HTTP', res.status, res.body);
    }
    return { ok, status: res.status, clientId: cid };
  } catch (err) {
    console.error('[mp] request error:', err.message);
    return { ok: false, error: err.message };
  }
}

// ================ CLI ==================

function parseCliArgs(argv) {
  const out = { event: null, params: {}, client_id: null };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--event=')) {
      out.event = arg.slice('--event='.length);
    } else if (arg.startsWith('--client_id=')) {
      out.client_id = arg.slice('--client_id='.length);
    } else if (arg.startsWith('--param=')) {
      const kv = arg.slice('--param='.length);
      const colon = kv.indexOf(':');
      if (colon === -1) continue;
      out.params[kv.slice(0, colon)] = kv.slice(colon + 1);
    }
  }
  return out;
}

async function runCli() {
  const args = parseCliArgs(process.argv);
  if (!args.event) {
    console.log('usage: node scripts/measurement-protocol.js --event=<name> [--param=key:value ...] [--client_id=<id>]');
    process.exit(1);
  }
  const result = await mpEvent(args.event, args.params, args.client_id);
  console.log('[mp] result:', JSON.stringify(result));
  process.exit(result.ok ? 0 : (result.skipped ? 0 : 2));
}

if (require.main === module) {
  runCli();
}

module.exports = {
  mpEvent,
  mpBatch,
  generateClientId,
  MEASUREMENT_ID
};
