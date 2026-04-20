import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const CTA = ({ articleUrl, ctaKeyword = 'PULSE' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 90 } });
  const pulse = Math.sin((frame / fps) * Math.PI * 3) * 0.04 + 1;

  const urlOpacity = spring({ frame: frame - fps * 0.7, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 70px',
        color: '#FAFAFA',
        gap: 60
      }}
    >
      {/* Badge marca topo */}
      <div
        style={{
          fontFamily: 'Fraunces, Inter, serif',
          fontSize: 36,
          fontWeight: 500,
          color: 'rgba(250,250,250,0.55)',
          transform: `scale(${scale})`
        }}
      >
        Pulso <span style={{ fontStyle: 'italic' }}>da IA</span>
      </div>

      {/* Box CTA Instagram */}
      <div
        style={{
          border: '3px solid #FF5E1F',
          borderRadius: 32,
          padding: '48px 56px',
          textAlign: 'center',
          transform: `scale(${scale * pulse})`,
          background: 'rgba(255, 94, 31, 0.08)'
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: 'rgba(250,250,250,0.75)',
            marginBottom: 16,
            letterSpacing: '-0.01em'
          }}
        >
          Quer 300+ skills de IA?
        </div>
        <div
          style={{
            fontFamily: 'Fraunces, Inter, serif',
            fontSize: 80,
            fontWeight: 600,
            color: '#FF5E1F',
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}
        >
          Comenta {ctaKeyword}
        </div>
      </div>

      {/* URL pro portal */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 500,
          color: '#FAFAFA',
          opacity: urlOpacity,
          textAlign: 'center'
        }}
      >
        <div style={{ color: 'rgba(250,250,250,0.5)', fontSize: 22, marginBottom: 8 }}>
          Leia a matéria completa
        </div>
        pulsodaia.com.br
      </div>
    </AbsoluteFill>
  );
};
