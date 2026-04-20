import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const CTA = ({ ctaKeyword = 'PULSO' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const topOpacity = spring({ frame, fps, config: { damping: 14 } });
  const boxScale = spring({ frame: frame - fps * 0.3, fps, config: { damping: 12, stiffness: 90 } });
  const pulse = Math.sin((frame / fps) * Math.PI * 3) * 0.03 + 1;
  const logoOpacity = spring({ frame: frame - fps * 0.8, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 70px',
        color: '#FAFAFA',
        gap: 50
      }}
    >
      {/* Texto hook topo */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 58,
          fontWeight: 500,
          color: '#FAFAFA',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          lineHeight: 1.1,
          opacity: topOpacity
        }}
      >
        Receba <span style={{ color: '#FF5E1F' }}>+3.000 skills</span>
        <br />do Claude
      </div>

      {/* Box CTA */}
      <div
        style={{
          border: '3px solid #FF5E1F',
          borderRadius: 32,
          padding: '40px 56px',
          textAlign: 'center',
          transform: `scale(${boxScale * pulse})`,
          background: 'rgba(255, 94, 31, 0.08)'
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: 'rgba(250,250,250,0.6)',
            marginBottom: 12,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}
        >
          Comente
        </div>
        <div
          style={{
            fontFamily: 'Fraunces, Inter, serif',
            fontSize: 120,
            fontWeight: 600,
            color: '#FF5E1F',
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}
        >
          {ctaKeyword}
        </div>
      </div>

      {/* Simbolo + URL (sem logo full PNG que fica ilegivel no "da") */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: logoOpacity, marginTop: 10 }}>
        <Img src={staticFile('logo/pulso-symbol.png')} style={{ width: 64, height: 'auto' }} />
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: '#FAFAFA',
            letterSpacing: '0.02em'
          }}
        >
          pulsodaia.com.br
        </div>
      </div>
    </AbsoluteFill>
  );
};
