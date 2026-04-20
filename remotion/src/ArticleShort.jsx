import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { Intro } from './scenes/Intro.jsx';
import { Headline } from './scenes/Headline.jsx';
import { Insights } from './scenes/Insights.jsx';
import { CTA } from './scenes/CTA.jsx';

export const ArticleShort = ({ headline, subtitle, category, heroUrl, insights, articleUrl, ctaKeyword }) => {
  const { fps } = useVideoConfig();
  const INTRO = 3 * fps;
  const HEADLINE = 10 * fps;
  const INSIGHTS = 6 * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', fontFamily: 'Inter, sans-serif' }}>
      <Sequence durationInFrames={INTRO}>
        <Intro category={category} />
      </Sequence>
      <Sequence from={INTRO} durationInFrames={HEADLINE}>
        <Headline headline={headline} subtitle={subtitle} category={category} heroUrl={heroUrl} />
      </Sequence>
      <Sequence from={INTRO + HEADLINE} durationInFrames={INSIGHTS}>
        <Insights insights={insights} />
      </Sequence>
      <Sequence from={INTRO + HEADLINE + INSIGHTS}>
        <CTA articleUrl={articleUrl} ctaKeyword={ctaKeyword} />
      </Sequence>
    </AbsoluteFill>
  );
};
