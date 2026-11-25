# Pulso da IA: SEO, GEO, rastreamento e tráfego para triadeflow.ai

Branch: `seo-geo-trafego-triadeflow` (só commits locais; sem push, PR ou deploy).
Pedido do Alex em 24/11/2026. Diagnóstico de origem: `~/.orca/bots/clara/relatorios/pulso-da-ia-status-2026-11-24.md`.

## O que mudou, por arquivo

| Arquivo | Mudança |
|---|---|
| `scripts/triadeflow-offers.js` (novo) | Mapa tema para oferta, UTM padrão, componentes de CTA (banner, CTA do meio e do fim, box "Quem faz o Pulso") e o CSS deles. Fonte única. |
| `scripts/feed-engine.js` | Template de artigo: banner, resumo "Em resumo", CTA do meio (artigos com 400+ palavras), FAQ visível, CTA do fim, "Quem faz o Pulso", byline com link de autor e editor, `og:image` com a imagem do próprio artigo, WebSite + SearchAction e licença no JSON-LD, breadcrumb com o título do artigo, relacionados por afinidade (tags e categoria) em vez de "os 3 mais recentes", 6 relacionados em vez de 3. Formulários de newsletter só mostram "Inscrito" quando o worker responde 2xx. |
| `scripts/rerender-articles.js` (novo) | Aplica o template a todos os artigos a partir do `article.json`, sem reescrever `article.json` nem `feed.json`. |
| `feed/*/index.html` (1.399) | Re-renderizados pelo script acima. |
| `index.html` | Mesmo conserto do formulário de newsletter da home. |
| `assets/js/tracking.js` | Parâmetros de `data-gtm-*` passam a sair em snake_case (`article_slug`, `to_slug`, `offer_theme`). Antes saíam em camelCase e o GTM, que lê snake_case, recebia vazio. |
| `config/gtm-setup.json` | Variáveis `offer_*`, gatilho com prefixo `triadeflow_`, parâmetros no catch-all e `triadeflow_click` como key event. É só config no repo: nada foi publicado no GTM. |
| `scripts/build-seo-files.js` | `llms-full.txt` limitado aos 300 artigos mais recentes (o arquivo com os 1.399 passaria de 5 MB). |
| `.github/workflows/feed-autopilot.yml` | Novo passo que regera `sitemap.xml`, `sitemap-news.xml` e `llms-full.txt` a cada rodada, e passo IndexNow depois do deploy (não bloqueia o job se falhar). |
| `.github/workflows/publish-custom.yml` | Mesmo passo de sitemaps. |
| `scripts/indexnow.js` + `dd7c0ba89ac97bc9fadf9276c785dd7a.txt` (novos) | IndexNow com teto de 100 URLs e `--dry-run`. A chave é pública por desenho. Vale para Bing e Yandex; o Google não participa. |
| `sitemap.xml`, `sitemap-news.xml`, `llms-full.txt`, `llms.txt`, `rss.xml` | Regenerados. `sitemap.xml` passou de 45 para 1.819 URLs; `sitemap-news.xml` tem os artigos das últimas 48h. `robots.txt` já apontava para os dois. |
| `categoria/`, `tag/`, `autores/`, `pillar/`, `sobre/`, `contato/`, `politica-privacidade/` | Regenerados pelos builders que já existiam. As páginas de categoria e tag estavam congeladas desde abril (4 páginas de tag, contagens velhas) enquanto cada artigo linka 2 a 4 tags: agora são 399 páginas de tag (mínimo de 2 artigos) e 5 de categoria. |
| `workers/ghl-bridge.js` | Duplicado do GHL v2 vem como HTTP 400, não 422. Antes, e-mail já cadastrado virava erro 502. Só entra em vigor com `wrangler deploy` (ordem do Alex). |
| `scripts/newsletter-weekly.js` + `.github/workflows/newsletter-weekly.yml` (novos) | Monta a edição de quinta (5 melhores dos últimos 7 dias). Os 4 guardrails estão no código. Não tem cron; nada envia sozinho. |
| `scripts/test-pulso-traffic.js` (novo) | Autoverificação: UTM, tema, CTA do meio, guardrails da newsletter. |

## Como conferir

```
node scripts/test-pulso-traffic.js                 # checks de lógica
node scripts/rerender-articles.js                  # re-render (idempotente)
node scripts/build-seo-files.js                    # sitemaps + llms-full
node scripts/indexnow.js --dry-run                 # lista o que iria para o IndexNow
node scripts/newsletter-weekly.js --out=/tmp/ed.html   # dry-run da edição de quinta
python3 -m http.server 8765                        # servir local e abrir:
```

Páginas de exemplo (servidas local): `/feed/a-corrida-do-ouro-da-ia-quem-ganha-e-quem-fica-para-tras/` (CTA do meio, FAQ, resumo),
`/feed/huang-da-nvidia-planos-de-sucessao-geram-hierarquia-desnecessaria/` (artigo de hoje), `/tag/anthropic/`, `/categoria/analise/`.
O build deste projeto é a sequência de scripts acima: não há `npm run build`.

rt-qa (`~/TriadeFlow/squad-rastreamento/qa.mjs`, medição bloqueada), local e produção deram o mesmo resultado:
B1, B2, B3, B4, B6, B7 passam. Falham A1, B6b e B8, e já falhavam em produção antes desta branch:
A1 e B8 pedem captura de atribuição e clique em WhatsApp, que um portal de notícias não tem; B6b falha porque o QA procura
`data-consent="granted"` e o banner usa `accept_all` (falso negativo do QA). B5 (opcional) acusa `llms.txt` em `text/plain`; não mexi
porque `text/markdown` faz alguns navegadores baixar o arquivo.

## Mapa de tema do artigo para oferta da Triadeflow

A Triadeflow vende (triadeflow.ai, lido em 24/11/2026): recepcionista de IA no WhatsApp para clínicas e negócios de agendamento. Responde em até 60 segundos, agenda, faz 3 follow-ups em 72 horas, mostra a origem de cada lead. Implantação feita por eles. Entrada: avaliação gratuita. Parceira OpenAI Select.
O tema sai de tags e keywords do artigo (peso 3) e de título e subtítulo (peso 1). Empate vale a ordem da tabela.

| `utm_campaign` | Dispara com (exemplos) | Artigos hoje | Oferta e ângulo |
|---|---|---|---|
| `saude-clinicas` | saúde, clínica, hospital, paciente, diagnóstico | 38 | Recepcionista de IA no WhatsApp da clínica: responde, agenda, chama de volta quem não marcou |
| `privacidade-lgpd` | privacidade, segurança, regulamentação, direitos autorais | 169 | O que a IA da Triadeflow não faz: sem diagnóstico, sem promessa de resultado, coleta mínima de dados |
| `agentes-automacao` | agentes, automação, Claude Code, produtividade | 218 | Um agente de IA já em operação no atendimento |
| `modelos-llm` | OpenAI, Anthropic, Gemini, LLM, benchmark | 558 | Parceira OpenAI Select; implantação feita pela Triadeflow |
| `negocios-mercado` | startups, investimento, IPO, mercado, vendas | 314 | Quem responde primeiro fecha o agendamento (método da primeira resposta) |
| `geral` | sem acerto | 102 | A Triadeflow por trás do Pulso; avaliação gratuita |

Posições (`utm_content`): `banner-topo`, `meio-artigo` (só artigos com 400+ palavras, 857 de 1.399), `fim-artigo`, `quem-faz-o-pulso`.
Link: `https://triadeflow.ai/?utm_source=pulsodaia&utm_medium=artigo&utm_campaign=<tema>&utm_content=<posicao>`.
Cada clique empurra `triadeflow_click` no dataLayer com `offer_theme`, `offer_position`, `article_slug`, `offer_destination`.
Texto âncora: sempre com a marca e com 3 variações por tema, escolhida por hash do slug, então nenhuma frase se repete em todo o site.
Sem anúncio de terceiros. Os links não usam `nofollow`: se quiser a opção mais conservadora contra link spam, é trocar `rel="noopener"` por `rel="noopener nofollow"` em `link()` no `triadeflow-offers.js` (o tráfego não muda, só o repasse de autoridade).

## Indexação: /feed/, home e www (análise do Search Console de 24/11)

- **Orfandade resolvida:** `/feed/` e a home montavam a lista no navegador (`fetch('/data/feed.json')`), então o HTML não tinha nenhum link de artigo. O novo `scripts/build-feed-pages.js` gera `/feed/` com os 48 mais recentes em HTML, `/feed/page/2/` até `/feed/page/30/` (48 por página, cada uma linka todas as páginas, profundidade máxima de 2 cliques) e um bloco "Últimas do Pulso da IA" com 12 links na home. Os 1.399 artigos têm link em HTML estático; o teste `test-pulso-traffic.js` falha se algum ficar fora. O filtro por categoria e a lista completa no navegador continuam como antes. O script roda no autopilot antes dos sitemaps.
- **Sitemap:** `sitemap.xml` (arquivo único, 1.848 URLs) tem os 1.399 artigos, todos com `lastmod` real (data de escrita, 165 datas distintas entre 17/04 e 25/11), mais as 29 páginas de `/feed/page/N/`. Não é sitemap índice porque cabe no limite de 50 mil URLs. O Search Console mostrou nenhum sitemap enviado: ver TAREFA HUMANA abaixo.
- **www:** `www.pulsodaia.com.br` responde 200 (sem redirect) e o Cloudflare Pages não faz redirect por host (`_redirects` só trata caminho). Todos os `canonical`, `og:url`, sitemap e robots já usam o domínio sem www, então o Google consolida no domínio certo; falta o 301 no Cloudflare (TAREFA HUMANA).

### TAREFA HUMANA
- titulo: Criar Redirect Rule 301 de www para o domínio sem www
- responsavel: Alex
- prazo: 01/12/2026
- prioridade: medium
- item: B3
- como fazer: Cloudflare, zona pulsodaia.com.br > Rules > Redirect Rules > Create rule. Se o nome do host for igual a `www.pulsodaia.com.br`, redirecionar (Dynamic) para `concat("https://pulsodaia.com.br", http.request.uri.path)` preservando a query, status 301. Conferir que o registro DNS de `www` existe e está com proxy ligado (nuvem laranja). Não foi alterado nada no Cloudflare.
- pronto quando: `curl -sI https://www.pulsodaia.com.br/` devolve 301 com `location: https://pulsodaia.com.br/`.

### TAREFA HUMANA
- titulo: Enviar sitemap.xml e sitemap-news.xml no Search Console (propriedade de domínio)
- responsavel: Alex
- prazo: 01/12/2026
- prioridade: high
- item: B11
- como fazer: Search Console, propriedade `pulsodaia.com.br` (domínio) > Sitemaps > enviar `sitemap.xml` e `sitemap-news.xml`, depois do deploy desta branch.
- pronto quando: os dois aparecem como "Sucesso" e as URLs descobertas passam de 1.800.

## Pontos de atenção

- **triadeflow.ai está em inglês** e não tem versão em português (`/pt` e `/pt-br` dão 404). Quem lê o Pulso é brasileiro, então a taxa de clique para a conversão tende a ser baixa. Duas saídas: criar uma página em português no triadeflow.ai, ou apontar os CTAs para triadeflow.com.br. Troca em uma linha (`BASE_URL`).
- **Texto do CTA** só afirma o que o site da Triadeflow já afirma. Nada de preço, prazo ou resultado.
- **FAQPage** estava só no JSON-LD, sem texto na página (Google pode ignorar ou penalizar). Agora o FAQ aparece na página, em 1.377 artigos. Os 22 artigos sem `faq` não têm o bloco.
- **Resumo "Em resumo"** é extraído sem IA: a primeira frase de cada seção (O que aconteceu, Por que importa, O que esperar). É citável, mas só tão bom quanto a primeira frase do artigo.
- **Páginas de tag** com 1 artigo não são geradas (regra do builder), então o link da tag fica 404 em alguns artigos. Páginas de tag com 2 a 4 artigos são finas; se o Search Console acusar conteúdo raso, é trocar para `noindex` abaixo de 5.
- O autopilot só regera sitemap, RSS e os artigos novos. Categoria, tag, autor e pilar continuam fora do autopilot. Convém incluir `build-category-tag-pages.js` no workflow para não congelar de novo.
- A newsletter e o envio de quinta não foram testados no GHL (PIT inválido).
- GA4 (lido pelo coordenador em 24/11): 52 visualizações em 30 dias e 47 dos 51 usuários são bots da China (Urumqi, Kashgar). Nada foi mexido no Cloudflare. O problema de tráfego é descoberta (sitemap parado, quase nenhuma entrada orgânica), não falta de tag: GTM-MXGJBNFB está nas páginas de artigo e `page_view` aparece para URLs `/feed/<slug>/`. Nenhum commit mexeu em `tracking.js`, `consent.js`, worker ou GTM depois de 20/04, então o que parou em 26/09 (`newsletter_confirmed`, `outbound_click`) não veio do repo: conferir o histórico de versões do GTM e o secret `GA4_API_SECRET` do worker. Também: o worker mandava `newsletter_confirmed` e o Lead do CAPI mesmo quando o GHL falhava; agora só manda com sucesso (vale após `wrangler deploy`). `newsletter_confirmed` é evento do servidor e `newsletter_success` é o do navegador: manter `newsletter_submit` e `newsletter_success` como key events e não marcar `newsletter_confirmed` junto, para não contar o mesmo cadastro duas vezes.

## TAREFA HUMANA

### TAREFA HUMANA
- titulo: Configurar o GTM com os eventos da Triadeflow e da newsletter (sem publicar até testar)
- responsavel: Alex
- prazo: 28/11/2026
- prioridade: high
- item: T (GTM-MXGJBNFB)
- como fazer:
  1. GTM, container GTM-MXGJBNFB, workspace novo. Variáveis, Nova, tipo "Variável da camada de dados", versão 2: criar `DLV - offer_theme` (chave `offer_theme`), `DLV - offer_position` (`offer_position`) e `DLV - offer_destination` (`offer_destination`). `DLV - article_slug` já existe.
  2. Acionador "Pulso - Custom Events (regex)": trocar o regex por
     `^(article_|newsletter_|nav_|theme_|web_vital_|outbound_|tag_|share_|related_|source_|feed_|logo_|breadcrumb_|cta_|whatsapp_|triadeflow_).+|^(js_error|unhandled_rejection|resource_error)$`
  3. Tag "GA4 Event - Catch-All": em Parâmetros do evento, somar `offer_theme` = `{{DLV - offer_theme}}`, `offer_position` = `{{DLV - offer_position}}`, `offer_destination` = `{{DLV - offer_destination}}`.
  4. Visualizar (Preview) em um artigo da branch servida local ou no preview do Cloudflare: clicar no CTA do fim e conferir que `triadeflow_click` dispara a tag com os 3 parâmetros e `article_slug` preenchido. Enviar um cadastro de teste e conferir `newsletter_success`.
  5. Só então Enviar > Publicar. Alternativa por script: `node scripts/setup-gtm-ga4.js` (simula) e depois `--publish`; precisa de `.secrets/pulso-autopilot-sa.json`, que não está neste clone.
- pronto quando: GA4 DebugView mostra `triadeflow_click` com `offer_theme` e `newsletter_success` com `newsletter_source`.

### TAREFA HUMANA
- titulo: Marcar key events e criar dimensões personalizadas no GA4
- responsavel: Alex
- prazo: 28/11/2026
- prioridade: high
- item: T
- como fazer:
  1. GA4 (stream G-32GWZHPJGJ, property 533692705 no repo; confirmar qual property tem esse stream). Admin > Eventos: `newsletter_submit` e `newsletter_success` já são key events (manter os nomes). Marcar `triadeflow_click` como key event (depois que aparecer na lista, até 24h). Não marcar `newsletter_confirmed`: é o mesmo cadastro visto pelo servidor e contaria em dobro.
  2. Admin > Definições personalizadas > Dimensões, escopo Evento: `offer_theme`, `offer_position`, `offer_destination`, `article_slug`, `newsletter_source`.
  3. Dar acesso Visualizador (ou Analista) ao Google conectado no Composio, ou restaurar `~/.secrets/gcp-sa.json` e adicionar a conta de serviço na property. Hoje o 403 impede qualquer leitura de número.
  4. Na mesma tela, vincular Search Console à property.
- pronto quando: relatório de eventos mostra `triadeflow_click` por `offer_theme` e o Composio lê `properties/533692705` sem 403.

### TAREFA HUMANA
- titulo: Trocar o PIT do GHL e consertar as variáveis do cadastro da newsletter
- responsavel: Alex
- prazo: 26/11/2026
- prioridade: urgent
- item: newsletter
- como fazer:
  1. GHL, sub-account Pulso da IA (location `l4nQqozhymP3hUZibeRY`) > Settings > Private Integrations. Criar um PIT novo com escopos de contatos (leitura e escrita) e, se for ligar o envio da quinta, de conversas/mensagens.
  2. Guardar sem imprimir: `! echo 'PULSO_GHL_PIT_TOKEN=<novo>' >> ~/.secrets.env` e corrigir no mesmo arquivo `PULSO_GHL_LOCATION_ID=l4nQqozhymP3hUZibeRY` (hoje aponta para a location Triadeflow).
  3. Trocar o secret do worker (só com a sua ordem): em `workers/`, `npx wrangler secret put GHL_LOCATION_PIT` e depois `npx wrangler deploy`. O deploy também leva o conserto de duplicado. Trocar igual o secret `GHL_LOCATION_PIT` do GitHub Actions (usado nos rascunhos do Social Planner).
  4. Testar com um e-mail seu: `curl -s -X POST https://ghl-bridge.pulsodaia.workers.dev/api/newsletter-subscribe -H 'Content-Type: application/json' -H 'Origin: https://pulsodaia.com.br' -d '{"name":"Teste","email":"<seu e-mail>","newsletter_source":"teste"}'` deve devolver `{"status":"ok"...}`. Repetir o mesmo e-mail: continua `ok` com `duplicate:true`.
  5. Conferir no GHL o contato com as tags `newsletter-ia-semanal` e `fonte-teste`.
- pronto quando: o POST devolve 200 e o contato aparece na sub-account.

### TAREFA HUMANA
- titulo: Decidir e validar o envio da newsletter de quinta (nada envia hoje)
- responsavel: Alex
- prazo: 05/12/2026
- prioridade: medium
- item: newsletter
- como fazer:
  1. Confirmar no HUB se existe workflow ou campanha que já envia a edição. O repo não tinha nenhum código de envio.
  2. Escolher o caminho: (a) seguir com `scripts/newsletter-weekly.js` (e-mail por conversa, 1 a 1) ou (b) montar a campanha no editor de e-mail do GHL e usar o script só para gerar o HTML (`--out`).
  3. Se for (a): definir o link de descadastro (variável `NEWSLETTER_UNSUBSCRIBE_URL`; o script não envia sem ele, por LGPD) e testar com `CRONS_ENABLED=true NEWSLETTER_ALLOWLIST=<seu e-mail> ... --send`. As chamadas à API do GHL não foram testadas.
  4. Só depois de validar, ligar o cron (instrução no cabeçalho de `newsletter-weekly.yml`). Os guardrails (teto de 50, dry-run, CRONS_ENABLED, allowlist) ficam.
- pronto quando: um e-mail de teste chega na allowlist com o link de descadastro funcionando.

### TAREFA HUMANA
- titulo: Verificar o domínio no Search Console e no Bing e enviar os sitemaps
- responsavel: Alex
- prazo: 01/12/2026
- prioridade: high
- item: B11
- como fazer: no Search Console, propriedade pulsodaia.com.br, enviar `sitemap.xml` e `sitemap-news.xml` (depois do deploy); no Bing Webmaster Tools, importar do Search Console. Para Google News, pedir inclusão do site no Publisher Center se ainda não tiver.
- pronto quando: os dois sitemaps aparecem como "Sucesso" e o relatório de páginas cresce.

## O que precisa de ordem do Alex

1. `git push` da branch `seo-geo-trafego-triadeflow` e abrir PR (o autopilot faz commits em `main` o dia todo; o PR vai precisar de rebase no momento do merge).
2. Merge e deploy. O próximo run do autopilot usa o template novo para todo artigo novo; para aplicar nos 1.399 existentes basta o merge desta branch, porque o HTML re-renderizado está nos commits.
3. `wrangler secret put GHL_LOCATION_PIT` e `wrangler deploy` do worker `ghl-bridge`.
4. Publicar o GTM (ou rodar `setup-gtm-ga4.js --publish`).
5. Ligar qualquer envio de newsletter.
