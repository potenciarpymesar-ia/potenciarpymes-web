import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import Threads from './Threads.jsx';
import {canAnimateThreads} from './motion-policy.mjs';

const hero = document.querySelector('[data-cinematic-hero]');
const mount = document.getElementById('hero-threads-root');

function HeroThreads() {
  const [running, setRunning] = useState(false);
  const [small, setSmall] = useState(window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 767px)');
    const sync = () => setRunning(canAnimateThreads(hero.dataset.motion, reduced.matches, document.hidden));
    const resize = () => setSmall(mobile.matches);
    const observer = new MutationObserver(sync);
    observer.observe(hero, {attributes:true, attributeFilter:['data-motion']});
    reduced.addEventListener('change', sync);
    mobile.addEventListener('change', resize);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      observer.disconnect();
      reduced.removeEventListener('change', sync);
      mobile.removeEventListener('change', resize);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return <Threads color="#D7FF3F" accentColor="#71804c" amplitude={1.5}
    distance={0.32} enableMouseInteraction={!small && running} lineCount={small ? 36 : 64}
    thickness={0.45} softness={0.8} speed={0.32} waves={1.05} angle={-14}
    split={0.05} fray={0.7} parting={0.25} taper={0.65} brightness={1.6}
    fade={0.15} opacity={0.85} paused={!running} />;
}

if (hero && mount && 'ResizeObserver' in window && 'IntersectionObserver' in window) {
  createRoot(mount).render(<HeroThreads />);
}
