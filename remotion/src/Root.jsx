import { Composition } from 'remotion';
import { ArticleShort } from './ArticleShort.jsx';

const defaultProps = {
  headline: 'Anthropic Apresenta Claude Design Para Criação Rápida de Visuais',
  subtitle: 'Nova ferramenta da Anthropic simplifica criação de protótipos.',
  category: 'LANÇAMENTO',
  heroUrl: 'https://pulsodaia.com.br/feed/anthropic-apresenta-claude-design-para-criacao-rapida-de-visuais/hero.png',
  galleryImages: [],
  insights: [
    'Claude Design gera visuais a partir de prompt',
    'Foco em fundadores e product managers',
    'Disponível em claude.ai/design'
  ],
  stat: { value: '1', label: 'Nova ferramenta da Anthropic focada em visuais' },
  quote: null,
  articleUrl: 'https://pulsodaia.com.br/feed/anthropic-apresenta-claude-design-para-criacao-rapida-de-visuais/',
  ctaKeyword: 'PULSO',
  novaClipPath: null,
  narrationAudioPath: null,
  musicAudioPath: null
};

const FPS = 30;
// Total 45s = 1350 frames
// Intro 3s + Headline 6s + Nova 8s + Stat 4s + Quote 5s + Gallery 7s + Insights 5s + CTA 5s + Outro 2s = 45s
const TOTAL_FRAMES = 45 * FPS;

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
