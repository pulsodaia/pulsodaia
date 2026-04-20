import { Composition } from 'remotion';
import { ArticleShort } from './ArticleShort.jsx';

const FPS = 30;

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
  ctaKeyword: 'PULSO',
  narrationAudioPath: null,
  narrationDurationSec: 42
};

export const Root = () => {
  return (
    <Composition
      id="article-short"
      component={ArticleShort}
      durationInFrames={Math.ceil(defaultProps.narrationDurationSec * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
      // Adapta duracao total a duracao real da narracao TTS
      calculateMetadata={({ props }) => {
        const total = Math.max(20, Math.ceil((props.narrationDurationSec || 42) * FPS));
        return {
          durationInFrames: total,
          props
        };
      }}
    />
  );
};
