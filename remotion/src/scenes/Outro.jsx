import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const urlOpacity = spring({ frame: frame - fps * 0.5, fps, config: { damping: 14 } });

  const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.04 + 1;

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

      <Img
        src={staticFile('logo/pulso-full.png')}
        style={{
          width: 760,
          height: 'auto',
          opacity: logoOpacity,
          transform: `scale(${pulse})`
        }}
      />

      <div
        style={{
          fontSize: 30,
          fontWeight: 500,
          color: '#FAFAFA',
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
