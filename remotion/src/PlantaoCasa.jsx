import {AbsoluteFill, Video, useCurrentFrame, useVideoConfig, interpolate, staticFile, spring} from 'remotion';
import words from './plantao-words.json';

const VERDE='#0F3D2E', LARANJA='#FF6B1A';

const Legenda = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const t = frame / fps;
  // agrupa em blocos de ate 4 palavras
  const grupos = []; let g = [];
  for (const w of words) {
    g.push(w);
    if (g.length === 4 || /[.?!]$/.test(w.w)) { grupos.push(g); g = []; }
  }
  if (g.length) grupos.push(g);
  const atual = grupos.find(gr => t >= gr[0].t - 0.08 && t <= gr[gr.length-1].e + 0.18);
  if (!atual) return null;
  return (
    <AbsoluteFill style={{justifyContent:'flex-end', alignItems:'center', paddingBottom:230}}>
      <div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'10px 14px',
                   maxWidth:620, padding:'0 30px'}}>
        {atual.map((w,i) => {
          const ativa = t >= w.t - 0.05 && t <= w.e + 0.05;
          return (
            <span key={i} style={{
              fontFamily:'Archivo, Inter, sans-serif', fontWeight:900, fontSize:46,
              letterSpacing:-1, lineHeight:1.15, textTransform:'uppercase',
              color: ativa ? '#fff' : 'rgba(255,255,255,.72)',
              background: ativa ? LARANJA : 'rgba(0,0,0,.72)',
              padding:'7px 15px', borderRadius:10,
              transform: ativa ? 'scale(1.06)' : 'scale(1)',
              boxShadow: ativa ? '0 8px 22px rgba(255,107,26,.45)' : 'none',
            }}>{w.w}</span>);
        })}
      </div>
    </AbsoluteFill>
  );
};

const Marca = () => {
  const frame=useCurrentFrame(); const {fps}=useVideoConfig();
  const ent = spring({frame: frame-8, fps, config:{damping:200}});
  const op = interpolate(frame,[0,10,70,85],[0,1,1,0],{extrapolateRight:'clamp'});
  return (
    <AbsoluteFill style={{justifyContent:'flex-start', alignItems:'center', paddingTop:58, opacity:op}}>
      <div style={{background:VERDE, color:'#fff', padding:'15px 30px', borderRadius:999,
        fontFamily:'Archivo, Inter, sans-serif', fontWeight:800, fontSize:31, letterSpacing:-.5,
        transform:`translateY(${(1-ent)*-40}px)`, boxShadow:'0 10px 30px rgba(0,0,0,.4)'}}>
        Plantão da Casa
      </div>
    </AbsoluteFill>);
};

const CTAFinal = () => {
  const frame=useCurrentFrame(); const {fps, durationInFrames}=useVideoConfig();
  const ini = durationInFrames - 3.2*fps;
  if (frame < ini) return null;
  const s = spring({frame: frame-ini, fps, config:{damping:14, stiffness:110}});
  const pulso = 1 + Math.sin((frame-ini)/4)*0.022;
  return (
    <AbsoluteFill style={{justifyContent:'flex-end', alignItems:'center', paddingBottom:70}}>
      <div style={{background:LARANJA, color:'#fff', padding:'24px 50px', borderRadius:999,
        fontFamily:'Archivo, Inter, sans-serif', fontWeight:900, fontSize:38, letterSpacing:-.6,
        transform:`scale(${s*pulso})`, boxShadow:'0 14px 40px rgba(255,107,26,.55)'}}>
        Chamar no WhatsApp
      </div>
      <div style={{marginTop:14, color:'#fff', fontFamily:'Inter, sans-serif', fontSize:25,
        fontWeight:600, opacity:s, textShadow:'0 2px 10px rgba(0,0,0,.8)'}}>
        Eusébio e Fortaleza · segunda a segunda
      </div>
    </AbsoluteFill>);
};

export const PlantaoCasa = () => (
  <AbsoluteFill style={{backgroundColor:'#000'}}>
    <Video src={staticFile('plantao/base.mp4')} />
    <Marca />
    <Legenda />
    <CTAFinal />
  </AbsoluteFill>
);
