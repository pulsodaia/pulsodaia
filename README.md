# Pulso da IA

Portal vivo de atualizacoes do mercado IA, direto dos laboratorios e founders verificados.

**Domínio:** pulsodaia.com.br
**Instagram:** [@pulsodaia](https://instagram.com/pulsodaia)
**Discord:** [Comunidade Pulso da IA](https://discord.gg/c2qr3rN9)

## O que tem aqui

- **Catalogo de 3.000+ skills** Claude Code categorizadas, com busca e filtro
- **Portal de noticias** IA direto de blogs oficiais + founders verificados
- **Secao comunidade** com discussoes de HN, Reddit, newsletters
- **Newsletter semanal** (quinta 9h) + alertas WhatsApp em tempo real
- **3 idiomas:** PT / ES / EN

## Estrutura

```
pulsodaia/
  index.html              # Pagina principal (Tailwind + Alpine.js)
  extract.js              # Script Node que le ~/.claude/skills/ + ~/.flowhub/skills/
  skills.json             # 3.004 skills categorizadas (auto-gerado)
  data/
    news.json             # 30 noticias mock (Fase 2)
  assets/
    logo-horizontal-bege.png
    logo-full-clara.png
    logo-full-azul.png
    logo-symbol-azul.png
    favicon.ico
  carrossel-ig.md         # Copy carrossel lancamento IG
```

## Rodar local

```bash
node extract.js          # regenera skills.json
python -m http.server    # serve em localhost:8000
```

## Arquitetura de fontes

### Portal principal (FONTE PRIMARIA)
- **Blogs oficiais:** Anthropic, OpenAI, Google AI, DeepMind, Meta, Mistral, xAI, Perplexity, Cursor, Midjourney, ElevenLabs, Suno, Hugging Face
- **Founders verificados:** Sam Altman, Dario Amodei, Demis Hassabis, Yann LeCun, Mark Zuckerberg, Andrej Karpathy, Aravind Srinivas, Mira Murati, Elon Musk, Mustafa Suleyman
- **Research direto:** ArXiv cs.AI, cs.CL daily
- **GitHub releases:** Claude Code, Cursor, MCP, modelos open source

### Secao comunidade (SECUNDARIA)
- Hacker News (filtro "AI/LLM/Claude/GPT")
- Reddit (r/MachineLearning, r/LocalLLaMA, r/ClaudeAI, r/OpenAI)
- Newsletters (AINews, TLDR AI, Ben's Bites, Import AI, Last Week in AI)
- X (debates tecnicos verificados)

## Integracao CRM (HUB)

Tres capturas distintas, tres tags diferentes:
- `lead-skills-page` - PDF biblioteca completa (hero CTA)
- `newsletter-ia-semanal` - Newsletter semanal (quinta)
- `alerta-whatsapp-tempo-real` - Alertas no WhatsApp

## Deploy

Cloudflare Pages conectado ao repo. Commit em `main` dispara re-deploy em ~30s.

## Feito por

[Alex Campos](https://triadeflow.com.br) · Triadeflow
