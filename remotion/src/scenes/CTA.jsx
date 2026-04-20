import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const CTA = ({ ctaKeyword = 'PULSO' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 90 } });
  const pulse = Math.sin((frame / fps) * Math.PI * 3) * 0.03 + 1;

  const subOpacity = spring({ frame: frame - fps * 0.6, fps, config: { damping: 14 } });

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
      {/* Logo topo pequeno */}
      <Img
        src={staticFile('logo/pulso-full.png')}
        style={{
          width: 380,
          height: 'auto',
          opacity: subOpacity,
          marginBottom: -20
        }}
      />

      {/* Texto hook */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 52,
          fontWeight: 600,
          color: '#FAFAFA',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          lineHeight: 1.1,
          opacity: subOpacity
        }}
      >
        Receba <span style={{ color: '#FF5E1F' }}>+3.000 skills</span>
        <br />
        de IA
      </div>

      {/* Box CTA PULSO */}
      <div
        style={{
          border: '3px solid #FF5E1F',
          borderRadius: 32,
          padding: '40px 56px',
          textAlign: 'center',
          transform: `scale(${scale * pulse})`,
          background: 'rgba(255, 94, 31, 0.08)'
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'rgba(250,250,250,0.6)',
            marginBottom: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}
        >
          Comente
        </div>
        <div
          style={{
            fontFamily: 'Fraunces, Inter, serif',
            fontSize: 110,
            fontWeight: 600,
            color: '#FF5E1F',
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}
        >
          {ctaKeyword}
        </div>
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 500,
          color: 'rgba(250,250,250,0.55)',
          opacity: subOpacity,
          textAlign: 'center'
        }}
      >
        aqui no post
      </div>
    </AbsoluteFill>
  );
};
