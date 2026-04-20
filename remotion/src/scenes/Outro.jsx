import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const symbolOpacity = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const textOpacity = spring({ frame: frame - fps * 0.3, fps, config: { damping: 14 } });
  const urlOpacity = spring({ frame: frame - fps * 0.7, fps, config: { damping: 14 } });

  const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.04 + 1;

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
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 94, 31, 0.18) 0%, transparent 65%)',
          transform: `scale(${pulse})`
        }}
      />

      {/* Simbolo */}
      <Img
        src={staticFile('logo/pulso-symbol.png')}
        style={{
          width: 180,
          height: 'auto',
          opacity: symbolOpacity,
          transform: `scale(${pulse})`
        }}
      />

      {/* Marca */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 110,
          fontWeight: 500,
          color: '#FAFAFA',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          opacity: textOpacity
        }}
      >
        Pulso <span style={{ fontStyle: 'italic', color: 'rgba(250,250,250,0.55)', fontWeight: 400 }}>da</span> IA
      </div>

      {/* URL */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 500,
          color: '#FF5E1F',
          opacity: urlOpacity,
          textAlign: 'center',
          letterSpacing: '0.02em'
        }}
      >
        pulsodaia.com.br
      </div>
    </AbsoluteFill>
  );
};
