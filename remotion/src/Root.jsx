import { Composition } from 'remotion';
import { ArticleShort } from './ArticleShort.jsx';
import { PlantaoCasa } from './PlantaoCasa.jsx';
import { UgcReel } from './UgcReel.jsx';

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
    <>
    <Composition
      id="plantao-casa"
      component={PlantaoCasa}
      durationInFrames={662}
      fps={30}
      width={720}
      height={1280}
    />
    <Composition
      id="ugc-reel"
      component={UgcReel}
      fps={30}
      width={720}
      height={1280}
      durationInFrames={660}
      defaultProps={{
        videoBase: 'plantao/base.mp4',
        wordsFile: 'plantao/words.json',
        marca: 'Plantão da Casa',
        cta: 'Chamar no WhatsApp',
        ctaSub: 'Eusébio e Fortaleza · segunda a segunda',
        corMarca: '#0F3D2E',
        corAtiva: '#FF6B1A',
        duracaoSec: 22,
      }}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil((props.duracaoSec || 22) * 30),
        props,
      })}
    />
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
    </>
  );
};
