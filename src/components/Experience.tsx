'use client';

import { useEffect, useState } from 'react';
import BlackHoleMount from './scene/BlackHoleMount';
import PanelHost from './panels/PanelHost';

// 900vh for the full cosmic journey, 100vh per work panel
const COSMIC_VH  = 900;
const PANEL_VH   = 100;
const PANEL_COUNT = 9;
const TOTAL_VH   = COSMIC_VH + PANEL_COUNT * PANEL_VH;

export default function Experience() {
  const [bhProgress, setBhProgress] = useState(0);
  const [activePanel, setActivePanel] = useState(-1);

  useEffect(() => {
    const onScroll = () => {
      const y         = window.scrollY;
      const cosmicPx  = (COSMIC_VH  / 100) * window.innerHeight;
      const panelPx   = (PANEL_VH   / 100) * window.innerHeight;

      if (y <= cosmicPx) {
        setBhProgress(y / cosmicPx);
        setActivePanel(-1);
      } else {
        setBhProgress(1);
        const idx = Math.min(Math.floor((y - cosmicPx) / panelPx), PANEL_COUNT - 1);
        setActivePanel(idx);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const inPanels = activePanel >= 0;

  // Event horizon crossing veil:
  // p 0.55-0.65 → fades to black (Phase B: camera at horizon)
  // p 0.65-0.72 → holds black   (Phase C hidden: camera jumps to tunnel)
  // p 0.72-0.80 → fades out     (Phase C/D reveal: warp tunnel appears)
  const crossingVeil =
    bhProgress < 0.55 ? 0 :
    bhProgress < 0.65 ? (bhProgress - 0.55) / 0.10 :
    bhProgress < 0.72 ? 1 :
    bhProgress < 0.80 ? 1 - (bhProgress - 0.72) / 0.08 :
    0;

  return (
    <>
      <div style={{ height: `${TOTAL_VH}vh`, pointerEvents: 'none' }} />

      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1,
          opacity: inPanels ? 0 : 1,
          transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: inPanels ? 'none' : 'auto',
        }}
      >
        <BlackHoleMount innerColor="#ffc066" outerColor="#5a1a08" progress={bhProgress} />
      </div>

      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 2,
          opacity: inPanels ? 1 : 0,
          transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: inPanels ? 'auto' : 'none',
        }}
      >
        <PanelHost activeIndex={activePanel} />
      </div>

      {/* Event horizon darkness veil — fades in at Phase B, out at Phase C/D reveal */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: '#000',
          opacity: crossingVeil,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
