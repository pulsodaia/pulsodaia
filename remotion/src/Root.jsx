import { Composition } from 'remotion';
import { ArticleShort } from './ArticleShort.jsx';

// Defaults usados quando --props nao eh passado (preview local)
const defaultProps = {
  headline: 'Anthropic Apresenta Claude Design Para Criação Rápida de Visuais',
  subtitle: 'Nova ferramenta da Anthropic simplifica criação de protótipos.',
  category: 'LANÇAMENTO',
  heroUrl: 'https://pulsodaia.com.br/feed/anthropic-apresenta-claude-design-para-criacao-rapida-de-visuais/hero.png',
  insights: [
    'Claude Design gera visuais a partir de prompt',
    'Foco em fundadores e product managers',
    'Disponível em claude.ai/design'
  ],
  articleUrl: 'https://pulsodaia.com.br/feed/anthropic-apresenta-claude-design-para-criacao-rapida-de-visuais/',
  ctaKeyword: 'PULSE'
};

// 22s total: 3s intro + 10s headline/hero + 6s insights + 3s CTA
const FPS = 30;
const INTRO_FRAMES = 3 * FPS;
const HEADLINE_FRAMES = 10 * FPS;
const INSIGHTS_FRAMES = 6 * FPS;
const CTA_FRAMES = 3 * FPS;
const TOTAL_FRAMES = INTRO_FRAMES + HEADLINE_FRAMES + INSIGHTS_FRAMES + CTA_FRAMES;

export const Root = () => {
  return (
    <Composition
      id="article-short"
      component={ArticleShort}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};
