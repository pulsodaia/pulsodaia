// Hostname-based rewrite pra subdominios de aulas Triadeflow.
//
// aula-01.triadeflow.com.br/* -> /aula-01/* (internal rewrite)
// Outros hostnames passam direto.
//
// Links na landing sao relativos, entao depois do rewrite resolvem certo
// (ex: aula-01.triadeflow.com.br/ -> serve /aula-01/index.html, e href="pacote.zip"
// resolve pra aula-01.triadeflow.com.br/pacote.zip -> /aula-01/pacote.zip).

const SUBDOMAIN_MAP = {
  "aula-01.triadeflow.com.br": "/aula-01",
  "aula-02.triadeflow.com.br": "/aula-02",
};

export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  const prefix = SUBDOMAIN_MAP[url.hostname];

  if (prefix && !url.pathname.startsWith(prefix)) {
    const newPath = url.pathname === "/" ? `${prefix}/` : `${prefix}${url.pathname}`;
    const newUrl = new URL(newPath + url.search, url);
    return context.env.ASSETS.fetch(new Request(newUrl, context.request));
  }

  return context.next();
};
