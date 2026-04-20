import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Headline = ({ headline, subtitle, category, heroUrl }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Ken Burns sutil no hero
  const heroScale = interpolate(frame, [0, durationInFrames], [1.05, 1.15]);
  const heroOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' });

  // Headline entra palavra por palavra
  const words = headline.split(' ');
  const wordDelay = fps * 0.08;

  const subtitleOpacity = spring({
    frame: frame - fps * (1 + words.length * 0.08),
    fps,
    config: { damping: 14 }
  });

  return (
    <AbsoluteFill>
      {/* Hero image com Ken Burns + overlay escuro */}
      <AbsoluteFill style={{ opacity: heroOpacity }}>
        {heroUrl && (
          <Img
            src={heroUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${heroScale})`,
              transition: 'none'
            }}
          />
        )}
        {/* Overlay gradiente pro texto ser legivel */}
        <AbsoluteFill
          style={{
            background: 'linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.85) 70%, #0A0A0A 100%)'
          }}
        />
      </AbsoluteFill>

      {/* Texto por cima */}
      <AbsoluteFill
        style={{
          padding: '0 70px',
          justifyContent: 'flex-end',
          paddingBottom: 180,
          color: '#FAFAFA'
        }}
      >
        {/* Badge categoria pequena */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#FF5E1F',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 28
          }}
        >
          {category}
        </div>

        {/* Headline palavra-a-palavra */}
        <div
          style={{
            fontFamily: 'Fraunces, Inter, serif',
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            marginBottom: 32
          }}
        >
          {words.map((word, i) => {
            const wordFrame = frame - fps * 0.5 - i * wordDelay;
            const opacity = interpolate(wordFrame, [0, fps * 0.3], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp'
            });
            const y = interpolate(wordFrame, [0, fps * 0.3], [20, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp'
            });
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity,
                  transform: `translateY(${y}px)`,
                  marginRight: '0.28em'
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: 'rgba(250,250,250,0.75)',
            lineHeight: 1.4,
            opacity: subtitleOpacity
          }}
        >
          {subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
