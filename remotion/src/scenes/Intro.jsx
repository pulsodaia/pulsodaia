import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Intro = ({ category }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulso pulsante (circulo que bate como coracao)
  const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.08 + 1;

  const logoOpacity = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const logoY = interpolate(spring({ frame, fps, config: { damping: 14, stiffness: 120 } }), [0, 1], [30, 0]);

  const categoryOpacity = spring({ frame: frame - fps * 0.8, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 40
      }}
    >
      {/* Pulso visual central */}
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #FF5E1F 0%, rgba(255, 94, 31, 0.15) 60%, transparent 100%)',
          transform: `scale(${pulse})`,
          boxShadow: '0 0 80px rgba(255, 94, 31, 0.4)',
          opacity: logoOpacity
        }}
      />

      {/* Marca */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 80,
          fontWeight: 600,
          color: '#FAFAFA',
          letterSpacing: '-0.02em',
          transform: `translateY(${logoY}px)`,
          opacity: logoOpacity
        }}
      >
        Pulso <span style={{ fontStyle: 'italic', color: 'rgba(250,250,250,0.6)' }}>da IA</span>
      </div>

      {/* Categoria */}
      <div
        style={{
          padding: '10px 24px',
          border: '1.5px solid #FF5E1F',
          borderRadius: 999,
          color: '#FF5E1F',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          opacity: categoryOpacity
        }}
      >
        {category}
      </div>
    </AbsoluteFill>
  );
};
