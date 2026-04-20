import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { Intro } from './scenes/Intro.jsx';
import { Headline } from './scenes/Headline.jsx';
import { InsightCard } from './scenes/InsightCard.jsx';
import { CTA } from './scenes/CTA.jsx';

export const ArticleShort = ({
  headline,
  subtitle,
  category,
  heroUrl,
  insights = [],
  articleUrl,
  ctaKeyword = 'PULSO',
  narrationAudioPath,
  narrationDurationSec = 42
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  // 5 scenes: Intro (fixed) + Headline (fixed) + 2 Insights (dynamic) + CTA (fixed)
  const INTRO_SEC = 4;
  const HEADLINE_SEC = 8;
  const CTA_SEC = 7;
  const fixed = INTRO_SEC + HEADLINE_SEC + CTA_SEC;
  const insightsTotal = Math.max(10, narrationDurationSec - fixed);
  const numInsights = Math.min(Math.max(insights.length, 1), 3);
  const insightSec = insightsTotal / numInsights;

  const introFrames = INTRO_SEC * fps;
  const headlineFrames = HEADLINE_SEC * fps;
  const insightFrames = Math.floor(insightSec * fps);
  const ctaStart = durationInFrames - CTA_SEC * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', fontFamily: 'Inter, sans-serif' }}>
      {/* Narracao pt-BR over everything */}
      {narrationAudioPath && (
        <Audio src={staticFile(narrationAudioPath)} volume={1.0} />
      )}

      {/* 1. Intro */}
      <Sequence durationInFrames={introFrames}>
        <Intro category={category} headline={headline} />
      </Sequence>

      {/* 2. Headline + hero */}
      <Sequence from={introFrames} durationInFrames={headlineFrames}>
        <Headline headline={headline} subtitle={subtitle} category={category} heroUrl={heroUrl} />
      </Sequence>

      {/* 3+. Insights — distribuidos dinamicamente */}
      {insights.slice(0, numInsights).map((insight, i) => (
        <Sequence
          key={i}
          from={introFrames + headlineFrames + i * insightFrames}
          durationInFrames={insightFrames}
        >
          <InsightCard number={i + 1} text={insight} />
        </Sequence>
      ))}

      {/* Ultimo: CTA */}
      <Sequence from={ctaStart}>
        <CTA ctaKeyword={ctaKeyword} />
      </Sequence>
    </AbsoluteFill>
  );
};
