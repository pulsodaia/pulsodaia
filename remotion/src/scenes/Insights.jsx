import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Insights = ({ insights = [] }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const perItem = durationInFrames / (insights.length + 1);

  const titleOpacity = spring({ frame, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        padding: '120px 70px',
        color: '#FAFAFA'
      }}
    >
      {/* Heading */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#FF5E1F',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 18,
          opacity: titleOpacity
        }}
      >
        Pontos-chave
      </div>

      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 56,
          fontWeight: 600,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          marginBottom: 80,
          opacity: titleOpacity
        }}
      >
        O que <span style={{ fontStyle: 'italic', color: 'rgba(250,250,250,0.55)' }}>importa</span>.
      </div>

      {/* Lista de insights */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {insights.map((insight, i) => {
          const start = fps * 0.8 + i * perItem * 0.6;
          const itemFrame = frame - start;
          const opacity = interpolate(itemFrame, [0, fps * 0.4], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp'
          });
          const x = interpolate(itemFrame, [0, fps * 0.4], [-40, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp'
          });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 28,
                opacity,
                transform: `translateX(${x}px)`
              }}
            >
              {/* Numero */}
              <div
                style={{
                  fontFamily: 'Fraunces, Inter, serif',
                  fontSize: 54,
                  fontWeight: 400,
                  color: '#FF5E1F',
                  lineHeight: 1,
                  minWidth: 70
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              {/* Texto */}
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: '#FAFAFA',
                  flex: 1
                }}
              >
                {insight}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
