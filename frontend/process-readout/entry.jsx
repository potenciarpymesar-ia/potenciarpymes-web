import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';

// El texto de cada paso sale del HTML que ya existe (fuente única).
// Si no hay JavaScript, la lista estática sigue visible.
const DETAILS = [
  'Miramos tu web, tus canales y cómo te llegan hoy las consultas.',
  'Definimos qué importa primero, para no intentar arreglar todo a la vez.',
  'Unimos web, tienda, redes y WhatsApp para que trabajen como un sistema.',
  'Vemos de dónde vienen las consultas y las ventas, con datos y no con intuición.',
  'Con lo que mostró la medición, decidimos qué sigue y qué conviene dejar.'
];
const STEP_MS = 2800;

const CSS = `
.pr-row{width:100%;background:none;border:0;border-bottom:1px solid var(--line);color:inherit;font-family:inherit;text-align:left;cursor:pointer;position:relative;opacity:.62;transition:opacity .35s ease}
.pr-row[aria-current="step"]{opacity:1}
.pr-row::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--lime);transform:scaleX(0);transform-origin:left}
.pr-row[aria-current="step"]::after{transform:scaleX(1)}
.pr-row.is-auto[aria-current="step"]::after{animation:pr-fill ${STEP_MS}ms linear}
.pr-row:focus-visible{outline:2px solid var(--lime);outline-offset:3px}
.pr-panel{min-height:6.4em;margin-top:22px;font-size:.95rem;line-height:1.6;color:var(--paper);max-width:36ch}
.pr-panel p{animation:pr-in .45s cubic-bezier(.16,1,.3,1) both}
.pr-pause{margin-top:6px;background:none;border:0;padding:8px 0;color:var(--muted);font:inherit;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.pr-pause:hover,.pr-pause:focus-visible{color:var(--lime)}
.pr-pause:focus-visible{outline:2px solid var(--lime);outline-offset:3px}
@keyframes pr-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pr-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.pr-row{transition:none}.pr-panel p{animation:none}.pr-row.is-auto[aria-current="step"]::after{animation:none}}
`;

function ProcessReadout({steps, note}) {
  const root = useRef(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reduced, setReduced] = useState(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [stopped, setStopped] = useState(false); // la persona tocó, o pausó
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {threshold: 0.5});
    io.observe(root.current);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => setReduced(mq.matches);
    const onVis = () => setHidden(document.hidden);
    mq.addEventListener('change', onMq);
    document.addEventListener('visibilitychange', onVis);
    return () => { io.disconnect(); mq.removeEventListener('change', onMq); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const auto = inView && !hidden && !reduced && !stopped && !finished;

  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(() => {
      if (active >= steps.length - 1) setFinished(true); // una sola pasada, no es un bucle infinito
      else setActive(active + 1);
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [auto, active, steps.length]);

  const choose = (i) => { setStopped(true); setActive(i); };

  return (
    <div ref={root}>
      {steps.map((s, i) => (
        <button key={s.label} type="button" className={'readout-row pr-row' + (auto ? ' is-auto' : '')}
          aria-current={i === active ? 'step' : undefined}
          onClick={() => choose(i)}
          onMouseEnter={(e) => { if (e.nativeEvent.pointerType !== 'touch' && window.matchMedia('(hover:hover)').matches) choose(i); }}>
          <span>{s.label}</span><b>{s.title}</b>
        </button>
      ))}
      <div className="pr-panel"><p key={active}>{DETAILS[active]}</p></div>
      {!reduced && (
        <button type="button" className="pr-pause" aria-pressed={stopped}
          onClick={() => setStopped((v) => !v)}>
          {stopped ? 'Reanudar animación' : 'Pausar animación'}
        </button>
      )}
      <p className="readout-note">{note}</p>
    </div>
  );
}

const readout = document.querySelector('.system-read .readout');
if (readout && 'IntersectionObserver' in window) {
  const rows = [...readout.querySelectorAll('.readout-row')];
  const steps = rows.map((r) => ({label: r.querySelector('span').textContent.trim(), title: r.querySelector('b').textContent.trim()}));
  const note = readout.querySelector('.readout-note')?.textContent.trim() || '';
  if (steps.length === DETAILS.length) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    readout.replaceChildren();
    createRoot(readout).render(<ProcessReadout steps={steps} note={note} />);
  }
}
