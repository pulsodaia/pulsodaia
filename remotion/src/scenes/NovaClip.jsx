import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// Embeda MP4 da Nova (Veo 3) como scene. Path default: public/nova-clips/{slug}.mp4
// Se nao existir, exibe placeholder escuro.
export const NovaClip = ({ clipPath, label }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in/out 0.3s
  const opacity = interpolate(
    frame,
    [0, fps * 0.3, durationInFrames - fps * 0.3, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', opacity }}>
      {/* Muted: fala PT-BR do Veo nao esta precisa, usar so visual */}
      <OffthreadVideo
        src={staticFile(clipPath)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        muted
      />
      {/* Overlay badge inferior */}
      {label && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', paddingBottom: 120 }}>
          <div
            style={{
              background: 'rgba(10,10,10,0.75)',
              padding: '14px 28px',
              color: '#FF5E1F',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              alignSelf: 'center',
              borderRadius: 8,
              backdropFilter: 'blur(8px)'
            }}
          >
            {label}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
