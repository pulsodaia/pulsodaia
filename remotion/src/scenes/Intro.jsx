import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

// Intro limpa: texto categoria em cima + logo PNG sozinha embaixo
export const Intro = ({ category, headline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.05 + 1;

  const categoryOpacity = spring({ frame, fps, config: { damping: 14 } });
  const logoOpacity = spring({ frame: frame - fps * 0.3, fps, config: { damping: 12, stiffness: 100 } });
  const logoY = interpolate(
    spring({ frame: frame - fps * 0.3, fps, config: { damping: 14, stiffness: 120 } }),
    [0, 1],
    [40, 0]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 56
      }}
    >
      {/* Halo pulsante atras */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 94, 31, 0.2) 0%, transparent 60%)',
          transform: `scale(${pulse})`
        }}
      />

      {/* CATEGORIA — texto em cima */}
      <div
        style={{
          padding: '16px 36px',
          border: '2px solid #FF5E1F',
          borderRadius: 999,
          color: '#FF5E1F',
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          opacity: categoryOpacity
        }}
      >
        {category}
      </div>

      {/* LOGO — PNG limpo, sem typography overlay */}
      <Img
        src={staticFile('logo/pulso-full.png')}
        style={{
          width: 880,
          height: 'auto',
          opacity: logoOpacity,
          transform: `translateY(${logoY}px)`
        }}
      />
    </AbsoluteFill>
  );
};
