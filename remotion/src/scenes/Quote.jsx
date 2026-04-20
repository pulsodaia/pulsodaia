import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Quote = ({ quote, attribution }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const quoteOpacity = spring({ frame, fps, config: { damping: 14 } });
  const attribOpacity = spring({ frame: frame - fps * 0.8, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
        flexDirection: 'column',
        gap: 36
      }}
    >
      {/* Aspas grandes */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 200,
          fontWeight: 600,
          color: '#FF5E1F',
          lineHeight: 0.5,
          opacity: quoteOpacity,
          marginBottom: -60
        }}
      >
        "
      </div>

      {/* Citacao */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 46,
          fontWeight: 500,
          lineHeight: 1.25,
          color: '#FAFAFA',
          textAlign: 'center',
          fontStyle: 'italic',
          maxWidth: 900,
          letterSpacing: '-0.02em',
          opacity: quoteOpacity
        }}
      >
        {quote}
      </div>

      {/* Attribution */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: '#FF5E1F',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          textAlign: 'center',
          opacity: attribOpacity,
          marginTop: 20
        }}
      >
        — {attribution}
      </div>
    </AbsoluteFill>
  );
};
