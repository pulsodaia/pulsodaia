// Pulso da IA — GHL to GA4 bridge (Cloudflare Worker)
//
// Receives webhooks from HUB (GoHighLevel) and forwards them to GA4 as
// server-side events via the Measurement Protocol. Gives us attribution
// for conversions that happen off-site (newsletter confirmed via email
// click, WhatsApp conversations, pipeline stage changes) which the
// browser gtag cannot see.
//
// Routes (all POST):
//   POST /api/ghl/newsletter-confirmed  -> event: newsletter_confirmed
//   POST /api/ghl/whatsapp-message      -> event: whatsapp_message_received
//   POST /api/ghl/lead-qualified        -> event: lead_qualified
//
// Webhook body (flexible — GHL sends various shapes depending on trigger):
//   {
//     "email":     "lead@example.com",
//     "phone":     "+5519...",
//     "tag":       "newsletter-confirmed",
//     "source":    "homepage-popup",
//     "contactId": "abc123"      // stable GHL contact id
//   }
//
// Setup:
//   1. npm install -D wrangler
//   2. npx wrangler secret put GA4_API_SECRET          (paste GA4 MP secret)
//   3. npx wrangler secret put GHL_WEBHOOK_SECRET      (optional shared secret)
//   4. npx wrangler deploy                              (reads wrangler.toml)
//   5. In HUB, create webhook for each tag/trigger pointing at:
//        https://pulsodaia.com.br/api/ghl/newsletter-confirmed
//        https://pulsodaia.com.br/api/ghl/whatsapp-message
//        https://pulsodaia.com.br/api/ghl/lead-qualified
//      If GHL_WEBHOOK_SECRET is set, add header:
//        X-GHL-Secret: <same value>

const ROUTE_TO_EVENT = {
  '/api/ghl/newsletter-confirmed': 'newsletter_confirmed',
  '/api/ghl/whatsapp-message': 'whatsapp_message_received',
  '/api/ghl/lead-qualified': 'lead_qualified'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only POST on configured routes
    const eventName = ROUTE_TO_EVENT[url.pathname];
    if (!eventName) {
      return json({ error: 'not_found', path: url.pathname }, 404);
    }
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405);
    }

    // Optional shared-secret validation
    if (env.GHL_WEBHOOK_SECRET) {
      const provided = request.headers.get('X-GHL-Secret') || '';
      if (provided !== env.GHL_WEBHOOK_SECRET) {
        return json({ error: 'unauthorized' }, 401);
      }
    }

    // Parse body (tolerate empty / malformed)
    let body = {};
    try {
      const raw = await request.text();
      body = raw ? JSON.parse(raw) : {};
    } catch (err) {
      return json({ error: 'invalid_json', detail: err.message }, 400);
    }

    const clientId = await deriveClientId(body);
    const params = mapParams(eventName, body);

    // Forward to GA4 Measurement Protocol
    const measurementId = env.GA4_MEASUREMENT_ID || 'G-32GWZHPJGJ';
    const apiSecret = env.GA4_API_SECRET;

    if (!apiSecret) {
      // Fail soft — log and accept so we don't block HUB workflow
      console.warn('[ghl-bridge] GA4_API_SECRET missing — event dropped', { event: eventName, clientId });
      return json({ status: 'accepted_but_not_forwarded', reason: 'missing GA4_API_SECRET', event: eventName }, 200);
    }

    const mpUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
    const mpPayload = {
      client_id: clientId,
      events: [{ name: eventName, params }]
    };

    let mpStatus = 0;
    try {
      const mpRes = await fetch(mpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mpPayload)
      });
      mpStatus = mpRes.status;
    } catch (err) {
      console.error('[ghl-bridge] MP fetch failed:', err.message);
      return json({ status: 'error', event: eventName, detail: err.message }, 502);
    }

    return json({ status: 'ok', event: eventName, client_id: clientId, ga_status: mpStatus }, 200);
  }
};

// =============== helpers ===============

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Derive a deterministic client_id so repeated events from the same
// contact land on the same GA4 user. Preference order:
//   1. explicit contactId (stable GHL id)
//   2. SHA-256 hash of email
//   3. SHA-256 hash of phone
//   4. random UUID (fallback — will not cross-link to web sessions)
async function deriveClientId(body) {
  if (body.contactId && typeof body.contactId === 'string') {
    return `ghl-${body.contactId}`;
  }
  if (body.email && typeof body.email === 'string') {
    return `em-${(await sha256Hex(body.email.trim().toLowerCase())).slice(0, 16)}`;
  }
  if (body.phone && typeof body.phone === 'string') {
    const normalized = body.phone.replace(/\D+/g, '');
    if (normalized) return `ph-${(await sha256Hex(normalized)).slice(0, 16)}`;
  }
  return crypto.randomUUID();
}

async function sha256Hex(input) {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Map the incoming GHL body to a sanitized GA4 params object.
// Keep keys short (<40 chars), values scalar, and drop nulls.
function mapParams(eventName, body) {
  const params = {
    event_source: 'ghl',
    ghl_event: eventName
  };
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
  // Event-specific enrichment
  if (eventName === 'whatsapp_message_received' && body.direction) {
    params.direction = String(body.direction).slice(0, 20); // inbound/outbound
  }
  return params;
}
