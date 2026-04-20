import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const Intro = ({ category }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.06 + 1;

  const symbolOpacity = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const textOpacity = spring({ frame: frame - fps * 0.3, fps, config: { damping: 14, stiffness: 120 } });
  const categoryOpacity = spring({ frame: frame - fps * 1.0, fps, config: { damping: 14 } });

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
      {/* Halo pulsante laranja */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 94, 31, 0.22) 0%, transparent 65%)',
          transform: `scale(${pulse})`
        }}
      />

      {/* Simbolo pulse no topo */}
      <Img
        src={staticFile('logo/pulso-symbol.png')}
        style={{
          width: 200,
          height: 'auto',
          opacity: symbolOpacity,
          transform: `scale(${pulse})`
        }}
      />

      {/* Marca tipografada — legivel, sem squish */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 130,
          fontWeight: 500,
          color: '#FAFAFA',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          opacity: textOpacity,
          textAlign: 'center'
        }}
      >
        Pulso <span style={{ fontStyle: 'italic', color: 'rgba(250,250,250,0.55)', fontWeight: 400 }}>da</span> IA
      </div>

      {/* Categoria */}
      <div
        style={{
          padding: '14px 32px',
          border: '1.5px solid #FF5E1F',
          borderRadius: 999,
          color: '#FF5E1F',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          opacity: categoryOpacity,
          marginTop: 20
        }}
      >
        {category}
      </div>
    </AbsoluteFill>
  );
};
