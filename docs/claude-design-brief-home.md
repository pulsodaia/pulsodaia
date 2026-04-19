# Brief Claude Design — Home Pulso da IA

**Uso:** colar esse prompt inteiro em claude.ai/design (pode anexar screenshot da home atual tambem).

---

## Prompt pra Claude Design

Voce eh designer senior. Preciso redesenhar a home de um portal editorial brasileiro de IA.

### Contexto
- **Produto:** Pulso da IA (pulsodaia.com.br) — portal de noticias de IA em pt-BR com motor autonomo publicando 3+ artigos a cada 2h.
- **Operador:** Triadeflow (consultoria de processo comercial B2B, CEO Alex Campos).
- **Audiencia:** fundadores, product managers, consultores e profissionais de tech brasileiros que acompanham o mercado de IA.
- **Objetivo:** portal quer ser referencia PT-BR + vitrine pro stack de skills do Claude (300+) que eu uso nos projetos.

### Brand
- **Paleta dark:** #0A0A0A (bg), #1A1A1A (card), #FAFAFA (texto), #FF5E1F (accent laranja), #ADFF2F (accent verde lime — social proof)
- **Paleta light:** #FFFFFF (bg), #F5F5F2 (alt), #171717 (texto), #FF5E1F (accent mantido)
- **Tipografia:** Inter (weight 400-700), Fraunces serif pra headlines (peso semibold)
- **Tom:** direto, sem travessao, pt-BR "voce". Zero emoji decorativo. Zero filler tipo "unlock", "elevate", "boost".
- **Referencias:** blog.google (editorial limpo), linear.app (dark + tipografia), stripe.com (hierarquia), McKinsey Insights (autoridade).

### Estrutura atual da home (10 secoes)
1. **Hero dark** — badge shimmer + H1 "Sinta o pulso / do mercado de IA" + CTA laranja "Receber por email" + CTA ghost "Ver o portal" + 4 stats (skills, artigos, fontes, atualizacao).
2. **Ticker prova social** — bg preto, 3 badges pequenos: "30+ projetos B2B", "Atualizado a cada hora", "Zero trial".
3. **Problema** (bg branco) — "Toda conversa com IA comeca do zero." 3 numeros 01/02/03.
4. **Solucao skills** (bg F5F5F2) — "Skills sao manuais permanentes que a IA carrega sozinha" + card Antes (400 palavras prompt) vs Depois (1 frase).
5. **Categorias** (bg branco) — grid 4 colunas com categorias do catalogo (88+ skills).
6. **Catalogo** (bg F5F5F2) — busca + filtros pill + grid 3 colunas de skills.
7. **Portal** (bg dark) — CTA pro feed de noticias.
8. **Comunidade** (bg dark) — CTA Discord/Telegram.
9. **Newsletter** (bg F5F5F2) — form captura.
10. **Captura final** (bg gradient dark) — CTA conversao.

### O que quero que voce repense

**Problema hoje:**
- Mistura visual de 2 produtos (portal de noticias + catalogo de skills) na mesma home, confundindo quem chega.
- Hero fala de "skills" mas o portal e de noticias — conflito de promessa.
- Muitos CTAs concorrendo (email, portal, Discord, newsletter, capturar).
- Transicoes entre dark/light sem ritmo editorial claro.
- Sem diferenciacao visual clara entre "editorial" (artigos/feed) e "catalogo" (skills).

**Metas do redesign:**
1. **Primeiro fold** deve deixar cristalino: "portal de noticias de IA em PT-BR". Catalogo de skills vira beneficio secundario (nao promessa principal).
2. **Hierarquia editorial** tipo blog.google: destaque visual pro ultimo artigo publicado (foto grande, headline forte, categoria).
3. **Ritmo dark-light** deve contar historia: hero dark, feed editorial claro, sessoes de autoridade (about/stack) dark novamente.
4. **1 CTA primario** por secao — nunca competir. Hero = newsletter. Feed = ler artigo. Skills = ver catalogo. 
5. **Densidade de informacao** como Linear: muito conteudo em pouco espaco, mas com respiro.
6. **Mobile first real** — hoje o Tailwind md:breakpoint quebra em varios pontos.
7. **Motion discreto** — shimmer no badge, counter number rolling, fade-in scroll. Nada chamativo.

### Entregar
1. Mockup desktop (1440) do novo primeiro fold + secao feed editorial
2. Mockup mobile (390) das mesmas secoes
3. Justificativa resumida (3-5 bullets) do que mudou e por que
4. Sugestao de 1 componente novo que eu nao pensei mas faria sentido (tipo "newsletter live count", "trending topics da semana", "indice interativo por laboratorio")

### Restricao
- Nao mudar brand colors, fontes ou logo.
- Manter compatibilidade com Tailwind + Alpine.js.
- Componentes devem ser implementaveis em HTML estatico puro (sem React/Vue).
