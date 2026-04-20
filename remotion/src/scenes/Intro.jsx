import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

// Intro: categoria + simbolo pulse + URL (sem tentativa de renderizar "Pulso da IA" que fica ilegivel)
export const Intro = ({ category }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.06 + 1;

  const categoryOpacity = spring({ frame, fps, config: { damping: 14 } });
  const symbolOpacity = spring({ frame: frame - fps * 0.3, fps, config: { damping: 12, stiffness: 100 } });
  const symbolScale = spring({ frame: frame - fps * 0.3, fps, config: { damping: 14, stiffness: 120 } });
  const urlOpacity = spring({ frame: frame - fps * 1.1, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 48
      }}
    >
      {/* Halo pulsante */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 94, 31, 0.22) 0%, transparent 60%)',
          transform: `scale(${pulse})`
        }}
      />

      {/* Categoria topo */}
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

      {/* Simbolo pulse — unico elemento de marca no intro */}
      <Img
        src={staticFile('logo/pulso-symbol.png')}
        style={{
          width: 360,
          height: 'auto',
          opacity: symbolOpacity,
          transform: `scale(${symbolScale * pulse})`
        }}
      />

      {/* URL limpo embaixo */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 500,
          color: '#FAFAFA',
          letterSpacing: '0.02em',
          opacity: urlOpacity
        }}
      >
        pulsodaia.com.br
      </div>
    </AbsoluteFill>
  );
};
