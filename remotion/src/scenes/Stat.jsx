import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Stat = ({ stat, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const statOpacity = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const statScale = interpolate(
    spring({ frame, fps, config: { damping: 14, stiffness: 120 } }),
    [0, 1],
    [0.7, 1]
  );
  const labelOpacity = spring({ frame: frame - fps * 0.5, fps, config: { damping: 14 } });
  const lineOpacity = spring({ frame: frame - fps * 0.3, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
        flexDirection: 'column',
        gap: 40
      }}
    >
      {/* Numero gigante */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 240,
          fontWeight: 600,
          color: '#FF5E1F',
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          textAlign: 'center',
          opacity: statOpacity,
          transform: `scale(${statScale})`
        }}
      >
        {stat}
      </div>

      {/* Linha divisora */}
      <div
        style={{
          width: 120,
          height: 3,
          background: '#FF5E1F',
          opacity: lineOpacity,
          borderRadius: 2
        }}
      />

      {/* Label */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 500,
          color: '#FAFAFA',
          textAlign: 'center',
          maxWidth: 800,
          lineHeight: 1.3,
          opacity: labelOpacity
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
