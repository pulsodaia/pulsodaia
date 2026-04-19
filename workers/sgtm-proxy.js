// Pulso da IA — Server-side GTM proxy (SKELETON — do not deploy yet)
//
// Purpose: route tracking traffic through our own subdomain (tm.pulsodaia.com.br)
// so first-party cookies survive ad-blockers and ITP. Requests arrive at the
// Cloudflare Worker, which forwards them to a Google Tag Manager Server
// Container running on Cloud Run (or equivalent).
//
// STATUS: skeleton. Activate in a later phase. Before deploying:
//
//   1) PROVISION GTM SERVER CONTAINER
//      - tagmanager.google.com -> Create container -> type "Server"
//      - Deploy the container (App Engine / Cloud Run). You will get a
//        container URL like https://server-side-tagging-xxx-uc.a.run.app
//      - Copy that URL into GTM_SERVER_URL below (or set as wrangler var).
//
//   2) DNS
//      - Cloudflare dashboard -> pulsodaia.com.br -> DNS
//      - Add AAAA/CNAME record for `tm` pointing to the Worker (proxied, orange)
//        In practice, Workers routes replace the origin, so an A record
//        pointing anywhere proxied is fine. Simplest: CNAME tm -> pulsodaia.com.br
//
//   3) GTM WEB CONTAINER
//      - In your web container (GTM-MXGJBNFB) -> GA4 config tag
//      - Check "Send to server container" -> URL = https://tm.pulsodaia.com.br
//
//   4) WRANGLER ROUTE
//      - Add a second route in wrangler.toml (or create a dedicated wrangler-sgtm.toml):
//          { pattern = "tm.pulsodaia.com.br/*", zone_name = "pulsodaia.com.br" }
//
//   5) DEPLOY
//      - npx wrangler deploy workers/sgtm-proxy.js
//
// References:
//   https://developers.google.com/tag-platform/tag-manager/server-side/custom-domain
//   https://developers.cloudflare.com/workers/examples/

const GTM_SERVER_URL = 'https://REPLACE-ME-server-side-tagging.run.app';

// Paths the GTM Server container expects to receive. Everything else is 404.
const ALLOWED_PATHS = [
  '/g/collect',    // GA4 hits
  '/gtm/',         // container script + client loading
  '/gtag/js',      // gtag library
  '/healthz'       // health check (optional)
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Allow only expected paths
    const pathOk = ALLOWED_PATHS.some(p => url.pathname === p || url.pathname.startsWith(p));
    if (!pathOk) {
      return new Response('not_found', { status: 404 });
    }

    // Forward to GTM server container, preserving path + query
    const target = new URL(GTM_SERVER_URL);
    target.pathname = url.pathname;
    target.search = url.search;

    // Rebuild request — strip hop-by-hop headers, preserve method + body
    const forwarded = new Request(target.toString(), {
      method: request.method,
      headers: stripHopByHopHeaders(request.headers),
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual'
    });

    // Add the original client IP so GTM server sees it (for geo, etc.)
    forwarded.headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
    forwarded.headers.set('X-Forwarded-Host', url.host);

    try {
      const response = await fetch(forwarded);
      // Pass through. Could add CORS or cache rules here.
      return response;
    } catch (err) {
      console.error('[sgtm-proxy] upstream error:', err.message);
      return new Response('upstream_error', { status: 502 });
    }
  }
};

function stripHopByHopHeaders(headers) {
  const out = new Headers(headers);
  for (const h of ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']) {
    out.delete(h);
  }
  return out;
}
