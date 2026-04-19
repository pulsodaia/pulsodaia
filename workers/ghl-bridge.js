// Pulso da IA — GHL bridge (Cloudflare Worker)
//
// Duas responsabilidades:
//
// 1. Receber form submissions do browser (newsletter-subscribe) e criar
//    contact na sub-account HUB via GHL API V2, aplicando tags.
//
// 2. Receber webhooks vindos do HUB (newsletter-confirmed, whatsapp-message,
//    lead-qualified) e encaminhar como eventos GA4 Measurement Protocol
//    (server-side), imune a adblocker.
//
// Routes:
//   POST /api/newsletter-subscribe      -> cria contact GHL + MP event
//   POST /api/ghl/newsletter-confirmed  -> GHL webhook -> MP newsletter_confirmed
//   POST /api/ghl/whatsapp-message      -> GHL webhook -> MP whatsapp_message_received
//   POST /api/ghl/lead-qualified        -> GHL webhook -> MP lead_qualified
//
// Setup:
//   1. npm install -D wrangler
//   2. npx wrangler secret put GA4_API_SECRET       (valor do GA4 MP secret)
//   3. npx wrangler secret put GHL_LOCATION_PIT     (PIT da sub-account Pulso)
//   4. npx wrangler secret put GHL_WEBHOOK_SECRET   (opcional, pra webhooks)
//   5. npx wrangler deploy

const WEBHOOK_ROUTES = {
  '/api/ghl/newsletter-confirmed': 'newsletter_confirmed',
  '/api/ghl/whatsapp-message': 'whatsapp_message_received',
  '/api/ghl/lead-qualified': 'lead_qualified'
};

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';
const GHL_LOCATION_ID = 'l4nQqozhymP3hUZibeRY'; // Pulso da IA sub-account

// CORS allowlist: dominios do portal
const CORS_ORIGINS = [
  'https://pulsodaia.com.br',
  'https://pulsodaia.pages.dev',
  'http://localhost:8080',
  'http://localhost:3000'
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = CORS_ORIGINS.find(o => origin === o || origin.endsWith('.pulsodaia.pages.dev')) || 'https://pulsodaia.com.br';

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-GHL-Secret',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Route: newsletter subscribe (browser -> GHL + MP)
    if (url.pathname === '/api/newsletter-subscribe' && request.method === 'POST') {
      return handleNewsletterSubscribe(request, env, allowedOrigin);
    }

    // Route: GHL webhook -> MP event
    const webhookEvent = WEBHOOK_ROUTES[url.pathname];
    if (webhookEvent) {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, allowedOrigin);
      return handleWebhook(request, env, webhookEvent, allowedOrigin);
    }

    return json({ error: 'not_found', path: url.pathname }, 404, allowedOrigin);
  }
};

// =============== NEWSLETTER SUBSCRIBE (browser -> GHL) ===============

async function handleNewsletterSubscribe(request, env, origin) {
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'invalid_json' }, 400, origin);
  }

  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const source = String(body.newsletter_source || body.source || 'unknown').slice(0, 50);
  const articleSlug = body.article_slug ? String(body.article_slug).slice(0, 120) : null;

  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400, origin);
  }

  const locationPit = env.GHL_LOCATION_PIT;
  if (!locationPit) {
    return json({ error: 'server_misconfigured', reason: 'GHL_LOCATION_PIT missing' }, 500, origin);
  }

  // Split nome: firstName + lastName (GHL recomenda separado)
  const nameParts = name ? name.split(/\s+/) : [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  const tags = [
    'newsletter-ia-semanal',
    `fonte-${source}`
  ];
  if (articleSlug) tags.push(`artigo-${articleSlug.substring(0, 80)}`);

  // Cria/upsert contact via GHL V2
  const ghlBody = {
    locationId: GHL_LOCATION_ID,
    firstName,
    lastName,
    email,
    source: `pulsodaia:${source}`,
    tags,
    customFields: articleSlug ? [{ key: 'article_slug', field_value: articleSlug }] : []
  };

  let ghlStatus = 0;
  let ghlBodyRaw = '';
  try {
    const ghlRes = await fetch(`${GHL_API_BASE}/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${locationPit}`,
        'Version': GHL_API_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(ghlBody)
    });
    ghlStatus = ghlRes.status;
    ghlBodyRaw = await ghlRes.text();
  } catch (err) {
    console.error('[newsletter-subscribe] GHL fetch failed:', err.message);
    return json({ error: 'ghl_unreachable', detail: err.message }, 502, origin);
  }

  // 200/201 = criado. 422 = duplicado (ja existe, OK). Outros = erro.
  const ok = ghlStatus >= 200 && ghlStatus < 300;
  const duplicate = ghlStatus === 422 && /duplicate|already exists/i.test(ghlBodyRaw);

  // Dispara MP event newsletter_confirmed (best-effort)
  const measurementId = env.GA4_MEASUREMENT_ID || 'G-32GWZHPJGJ';
  const apiSecret = env.GA4_API_SECRET;
  if (apiSecret) {
    try {
      const clientId = `em-${(await sha256Hex(email)).slice(0, 16)}`;
      await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          events: [{
            name: 'newsletter_confirmed',
            params: {
              event_source: 'worker',
              newsletter_source: source,
              article_slug: articleSlug || '(na)',
              duplicate: duplicate ? 'true' : 'false'
            }
          }]
        })
      });
    } catch (mpErr) { /* silencioso */ }
  }

  if (ok || duplicate) {
    return json({ status: 'ok', duplicate, ghl_status: ghlStatus }, 200, origin);
  }
  console.error('[newsletter-subscribe] GHL error', ghlStatus, ghlBodyRaw.substring(0, 300));
  return json({ error: 'ghl_error', ghl_status: ghlStatus, detail: ghlBodyRaw.substring(0, 200) }, 502, origin);
}

// =============== GHL WEBHOOK -> MP EVENT ===============

async function handleWebhook(request, env, eventName, origin) {
  if (env.GHL_WEBHOOK_SECRET) {
    const provided = request.headers.get('X-GHL-Secret') || '';
    if (provided !== env.GHL_WEBHOOK_SECRET) {
      return json({ error: 'unauthorized' }, 401, origin);
    }
  }

  let body = {};
  try {
    const raw = await request.text();
    body = raw ? JSON.parse(raw) : {};
  } catch (err) {
    return json({ error: 'invalid_json', detail: err.message }, 400, origin);
  }

  const clientId = await deriveClientId(body);
  const params = mapParams(eventName, body);

  const measurementId = env.GA4_MEASUREMENT_ID || 'G-32GWZHPJGJ';
  const apiSecret = env.GA4_API_SECRET;
  if (!apiSecret) {
    console.warn('[webhook] GA4_API_SECRET missing — event dropped', { event: eventName });
    return json({ status: 'accepted_but_not_forwarded', reason: 'missing GA4_API_SECRET' }, 200, origin);
  }

  let mpStatus = 0;
  try {
    const mpRes = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        events: [{ name: eventName, params }]
      })
    });
    mpStatus = mpRes.status;
  } catch (err) {
    return json({ status: 'error', detail: err.message }, 502, origin);
  }

  return json({ status: 'ok', event: eventName, client_id: clientId, ga_status: mpStatus }, 200, origin);
}

// =============== helpers ===============

function json(obj, status = 200, origin = 'https://pulsodaia.com.br') {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

async function deriveClientId(body) {
  if (body.contactId && typeof body.contactId === 'string') return `ghl-${body.contactId}`;
  if (body.email && typeof body.email === 'string') return `em-${(await sha256Hex(body.email.trim().toLowerCase())).slice(0, 16)}`;
  if (body.phone && typeof body.phone === 'string') {
    const normalized = body.phone.replace(/\D+/g, '');
    if (normalized) return `ph-${(await sha256Hex(normalized)).slice(0, 16)}`;
  }
  return crypto.randomUUID();
}

async function sha256Hex(input) {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function mapParams(eventName, body) {
  const params = { event_source: 'ghl', ghl_event: eventName };
  if (body.tag) params.ghl_tag = String(body.tag).slice(0, 100);
  if (body.source) params.source = String(body.source).slice(0, 100);
  if (body.medium) params.medium = String(body.medium).slice(0, 100);
  if (body.campaign) params.campaign = String(body.campaign).slice(0, 100);
  if (body.pipeline) params.pipeline = String(body.pipeline).slice(0, 100);
  if (body.stage) params.stage = String(body.stage).slice(0, 100);
  if (body.value != null && !isNaN(Number(body.value))) {
    params.value = Number(body.value);
    params.currency = body.currency || 'BRL';
  }
  if (eventName === 'whatsapp_message_received' && body.direction) {
    params.direction = String(body.direction).slice(0, 20);
  }
  return params;
}
