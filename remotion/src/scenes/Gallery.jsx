import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

// Resolve URL: absoluta (http) usa direto; relativa /path usa staticFile
function resolveSrc(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return staticFile(src.replace(/^\//, ''));
}

export const Gallery = ({ images = [] }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!images.length) {
    return <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }} />;
  }

  const perImage = durationInFrames / images.length;
  const transitionFrames = fps * 0.5;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      {images.map((rawSrc, i) => {
        const src = resolveSrc(rawSrc);
        const start = i * perImage;
        const end = start + perImage;
        const fadeIn = start;
        const fadeOut = end - transitionFrames;

        const opacity = interpolate(
          frame,
          [fadeIn - transitionFrames, fadeIn, fadeOut, end],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Ken Burns sutil
        const scale = interpolate(frame, [start, end], [1.0, 1.12]);

        return (
          <AbsoluteFill key={i} style={{ opacity }}>
            <Img
              src={src}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${scale})`
              }}
            />
            {/* Overlay gradiente inferior */}
            <AbsoluteFill
              style={{
                background: 'linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,0.8) 100%)'
              }}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
