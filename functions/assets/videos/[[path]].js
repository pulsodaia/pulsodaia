// Pages Function: corrige Content-Type de videos servidos de assets/videos/
// Default Cloudflare Pages Direct Upload eh application/octet-stream,
// o que GHL/YouTube/TikTok rejeitam. Setamos video/mp4 explicito.

export async function onRequest({ request, next }) {
  const response = await next();
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();

  // Clona pra modificar headers (Response original eh imutavel)
  const newHeaders = new Headers(response.headers);

  if (pathname.endsWith('.mp4')) {
    newHeaders.set('Content-Type', 'video/mp4');
  } else if (pathname.endsWith('.webm')) {
    newHeaders.set('Content-Type', 'video/webm');
  } else if (pathname.endsWith('.mov')) {
    newHeaders.set('Content-Type', 'video/quicktime');
  } else if (pathname.endsWith('.mp3')) {
    newHeaders.set('Content-Type', 'audio/mpeg');
  }

  // CORS pra clients externos (GHL, YouTube crawler)
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Accept-Ranges', 'bytes');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
