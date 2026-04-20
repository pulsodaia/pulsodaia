import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const Intro = ({ category }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.06 + 1;

  const logoOpacity = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });

  const categoryOpacity = spring({ frame: frame - fps * 0.7, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 50
      }}
    >
      {/* Halo pulsante laranja atras do logo */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 94, 31, 0.25) 0%, transparent 65%)',
          transform: `scale(${pulse})`
        }}
      />

      {/* Logo Pulso da IA real — sem shadow (evita efeito encaixotado) */}
      <Img
        src={staticFile('logo/pulso-full.png')}
        style={{
          width: 800,
          height: 'auto',
          opacity: logoOpacity,
          transform: `scale(${logoScale})`
        }}
      />

      {/* Categoria */}
      <div
        style={{
          padding: '12px 28px',
          border: '1.5px solid #FF5E1F',
          borderRadius: 999,
          color: '#FF5E1F',
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          opacity: categoryOpacity
        }}
      >
        {category}
      </div>
    </AbsoluteFill>
  );
};
