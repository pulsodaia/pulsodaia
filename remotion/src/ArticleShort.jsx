import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { Intro } from './scenes/Intro.jsx';
import { Headline } from './scenes/Headline.jsx';
import { NovaClip } from './scenes/NovaClip.jsx';
import { Stat } from './scenes/Stat.jsx';
import { Quote } from './scenes/Quote.jsx';
import { Gallery } from './scenes/Gallery.jsx';
import { Insights } from './scenes/Insights.jsx';
import { CTA } from './scenes/CTA.jsx';
import { Outro } from './scenes/Outro.jsx';

export const ArticleShort = ({
  headline,
  subtitle,
  category,
  heroUrl,
  galleryImages = [],
  insights,
  stat,
  quote,
  articleUrl,
  ctaKeyword = 'PULSO',
  novaClipPath,
  narrationAudioPath,
  musicAudioPath
}) => {
  const { fps } = useVideoConfig();

  // Timing em segundos (total 45s)
  const T = {
    intro: 3,
    headline: 6,
    nova: novaClipPath ? 8 : 0,
    stat: stat ? 4 : 0,
    quote: quote ? 5 : 0,
    gallery: galleryImages.length > 0 ? 7 : 0,
    insights: 5,
    cta: 5,
    outro: 2
  };

  // Se nova nao existe, redistribui pros outros
  if (!novaClipPath) {
    T.gallery += 4;
    T.insights += 4;
  }

  const startFrames = {};
  let acc = 0;
  for (const key of ['intro', 'headline', 'nova', 'stat', 'quote', 'gallery', 'insights', 'cta', 'outro']) {
    startFrames[key] = acc * fps;
    acc += T[key];
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', fontFamily: 'Inter, sans-serif' }}>
      {/* Background music (low volume) */}
      {musicAudioPath && (
        <Audio src={staticFile(musicAudioPath)} volume={0.18} />
      )}

      {/* Narration over everything */}
      {narrationAudioPath && (
        <Audio src={staticFile(narrationAudioPath)} volume={1.0} />
      )}

      <Sequence durationInFrames={T.intro * fps}>
        <Intro category={category} />
      </Sequence>

      <Sequence from={startFrames.headline} durationInFrames={T.headline * fps}>
        <Headline headline={headline} subtitle={subtitle} category={category} heroUrl={heroUrl} />
      </Sequence>

      {novaClipPath && (
        <Sequence from={startFrames.nova} durationInFrames={T.nova * fps}>
          <NovaClip clipPath={novaClipPath} />
        </Sequence>
      )}

      {stat && (
        <Sequence from={startFrames.stat} durationInFrames={T.stat * fps}>
          <Stat stat={stat.value} label={stat.label} />
        </Sequence>
      )}

      {quote && (
        <Sequence from={startFrames.quote} durationInFrames={T.quote * fps}>
          <Quote quote={quote.text} attribution={quote.attribution} />
        </Sequence>
      )}

      {galleryImages.length > 0 && (
        <Sequence from={startFrames.gallery} durationInFrames={T.gallery * fps}>
          <Gallery images={galleryImages} />
        </Sequence>
      )}

      <Sequence from={startFrames.insights} durationInFrames={T.insights * fps}>
        <Insights insights={insights} />
      </Sequence>

      <Sequence from={startFrames.cta} durationInFrames={T.cta * fps}>
        <CTA ctaKeyword={ctaKeyword} />
      </Sequence>

      <Sequence from={startFrames.outro} durationInFrames={T.outro * fps}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
