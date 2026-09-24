import {
  AbsoluteFill, Video, useCurrentFrame, useVideoConfig,
  interpolate, staticFile, spring, delayRender, continueRender,
} from 'remotion';
import {useEffect, useState} from 'react';

/**
 * Template de edicao para peca UGC vertical.
 * O video base sai do Veo (ou qualquer motor); aqui entra so a pos-producao:
 * marca na abertura, legenda cinetica palavra a palavra e CTA no final.
 *
 * Tudo vem por props, entao a mesma composicao serve qualquer cliente:
 *   npx remotion render src/index.jsx ugc-reel saida.mp4 \
 *     --props='{"videoBase":"cleaning/base.mp4","wordsFile":"cleaning/words.json", ...}' \
 *     --browser-executable="$CH"
 *
 * `words` e uma lista de {w, t, e} (palavra, inicio e fim em segundos), do
 * faster_whisper com word_timestamps=True. A palavra escrita aqui NAO precisa
 * ser a que a IA falou: se o motor pronunciou errado, escreva o certo na
 * legenda que ninguem percebe.
 */

const usePalavras = (wordsFile, wordsInline) => {
  const [words, setWords] = useState(wordsInline || null);
  const [handle] = useState(() => (wordsInline ? null : delayRender('carregando words.json')));

  useEffect(() => {
    if (wordsInline || !wordsFile) return;
    fetch(staticFile(wordsFile))
      .then((r) => r.json())
      .then((j) => {
        setWords(j);
        continueRender(handle);
      })
      .catch((e) => {
        throw new Error(`Falha ao ler ${wordsFile}: ${e.message}`);
      });
  }, [wordsFile, wordsInline, handle]);

  return words;
};

const Legenda = ({words, corAtiva, maxPalavras, paddingBottom, fontSize}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (!words || !words.length) return null;

  // Agrupa por frase. Quebrar em virgula estilhaca lista de servicos
  // ("eletrica, hidraulica, chuveiro") em uma palavra por tela.
  const grupos = [];
  let g = [];
  for (const w of words) {
    g.push(w);
    if (g.length === maxPalavras || /[.?!]$/.test(w.w)) {
      grupos.push(g);
      g = [];
    }
  }
  if (g.length) grupos.push(g);

  const atual = grupos.find(
    (gr) => t >= gr[0].t - 0.08 && t <= gr[gr.length - 1].e + 0.18
  );
  if (!atual) return null;

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom}}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        gap: '10px 14px', maxWidth: 620, padding: '0 30px',
      }}>
        {atual.map((w, i) => {
          const ativa = t >= w.t - 0.05 && t <= w.e + 0.05;
          return (
            <span key={i} style={{
              fontFamily: 'Archivo, Inter, sans-serif', fontWeight: 900, fontSize,
              letterSpacing: -1, lineHeight: 1.15, textTransform: 'uppercase',
              color: ativa ? '#fff' : 'rgba(255,255,255,.72)',
              background: ativa ? corAtiva : 'rgba(0,0,0,.72)',
              padding: '7px 15px', borderRadius: 10,
              transform: ativa ? 'scale(1.06)' : 'scale(1)',
              boxShadow: ativa ? `0 8px 22px ${corAtiva}73` : 'none',
            }}>{w.w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Marca = ({marca, corMarca, segundos}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!marca) return null;
  const fim = segundos * fps;
  const ent = spring({frame: frame - 8, fps, config: {damping: 200}});
  const op = interpolate(frame, [0, 10, fim - 15, fim], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 58, opacity: op}}>
      <div style={{
        background: corMarca, color: '#fff', padding: '15px 30px', borderRadius: 999,
        fontFamily: 'Archivo, Inter, sans-serif', fontWeight: 800, fontSize: 31, letterSpacing: -.5,
        transform: `translateY(${(1 - ent) * -40}px)`, boxShadow: '0 10px 30px rgba(0,0,0,.4)',
      }}>{marca}</div>
    </AbsoluteFill>
  );
};

const CTAFinal = ({cta, ctaSub, corAtiva, segundos}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  if (!cta) return null;
  const ini = durationInFrames - segundos * fps;
  if (frame < ini) return null;
  const s = spring({frame: frame - ini, fps, config: {damping: 14, stiffness: 110}});
  const pulso = 1 + Math.sin((frame - ini) / 4) * 0.022;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70}}>
      <div style={{
        background: corAtiva, color: '#fff', padding: '24px 50px', borderRadius: 999,
        fontFamily: 'Archivo, Inter, sans-serif', fontWeight: 900, fontSize: 38, letterSpacing: -.6,
        transform: `scale(${s * pulso})`, boxShadow: `0 14px 40px ${corAtiva}8c`,
      }}>{cta}</div>
      {ctaSub ? (
        <div style={{
          marginTop: 14, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 25,
          fontWeight: 600, opacity: s, textShadow: '0 2px 10px rgba(0,0,0,.8)',
        }}>{ctaSub}</div>
      ) : null}
    </AbsoluteFill>
  );
};

// Selo fixo (ex.: "Personagem gerada por IA"). Opcional: sem a prop, nada aparece.
const Aviso = ({aviso}) => {
  if (!aviso) return null;
  return (
    <div style={{position: 'absolute', top: 70, right: 40, background: 'rgba(0,0,0,.6)', color: '#fff',
      padding: '10px 18px', borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: 26, fontWeight: 600}}>
      {aviso}
    </div>
  );
};

export const UgcReel = ({
  videoBase,
  wordsFile,
  words: wordsInline,
  marca,
  cta,
  ctaSub,
  corMarca = '#0F3D2E',
  corAtiva = '#FF6B1A',
  maxPalavras = 4,
  legendaFontSize = 46,
  legendaPaddingBottom = 230,
  marcaSegundos = 2.8,
  ctaSegundos = 3.2,
  aviso,
}) => {
  const words = usePalavras(wordsFile, wordsInline);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Video src={staticFile(videoBase)} />
      <Marca marca={marca} corMarca={corMarca} segundos={marcaSegundos} />
      <Legenda
        words={words}
        corAtiva={corAtiva}
        maxPalavras={maxPalavras}
        fontSize={legendaFontSize}
        paddingBottom={legendaPaddingBottom}
      />
      <CTAFinal cta={cta} ctaSub={ctaSub} corAtiva={corAtiva} segundos={ctaSegundos} />
      <Aviso aviso={aviso} />
    </AbsoluteFill>
  );
};
