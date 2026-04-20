import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// Scene simples: numero grande + texto da insight
export const InsightCard = ({ number, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numberOpacity = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const numberScale = interpolate(
    spring({ frame, fps, config: { damping: 14, stiffness: 120 } }),
    [0, 1],
    [0.7, 1]
  );

  const lineOpacity = spring({ frame: frame - fps * 0.3, fps, config: { damping: 14 } });
  const textOpacity = spring({ frame: frame - fps * 0.5, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
        flexDirection: 'column',
        gap: 48
      }}
    >
      {/* Numero gigante */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 260,
          fontWeight: 500,
          color: '#FF5E1F',
          lineHeight: 0.85,
          letterSpacing: '-0.04em',
          textAlign: 'center',
          opacity: numberOpacity,
          transform: `scale(${numberScale})`
        }}
      >
        {String(number).padStart(2, '0')}
      </div>

      {/* Linha divisora */}
      <div
        style={{
          width: 140,
          height: 3,
          background: '#FF5E1F',
          opacity: lineOpacity,
          borderRadius: 2
        }}
      />

      {/* Texto da insight */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 44,
          fontWeight: 500,
          color: '#FAFAFA',
          textAlign: 'center',
          maxWidth: 880,
          lineHeight: 1.28,
          letterSpacing: '-0.015em',
          opacity: textOpacity
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
