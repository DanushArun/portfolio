'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * VoidPrologue — DOM overlay for the 3.5s autonomous opening.
 *
 * Timeline:
 *   0.0s  → absolute black (#000)
 *   0.8s  → stars begin crystallizing (CSS animation on canvas)
 *   2.0s  → terminal text starts typing character by character
 *   3.2s  → terminal complete, final cursor blink
 *   3.5s  → SceneManager transitions to EVENT_HORIZON (handled in scene-state)
 *
 * The black hole itself renders in the WebGL canvas underneath.
 * This component only handles the text/terminal overlay and the initial
 * black screen that fades to reveal the BH.
 */

const TERMINAL_LINES = [
  '> SCHWARZSCHILD METRIC — INITIALIZED',
  '> OBSERVER CONFIRMED AT r = 30 Rs',
  '> GRAVITY FIELD DETECTED',
  '> CAUTION: EVENT HORIZON AT r = 2GM/c²',
];

const CHAR_DELAY_MS = 28;   // ms per character
const LINE_GAP_MS  = 180;   // pause between lines

export default function VoidPrologue() {
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Fade black overlay out starting at 0.8s to reveal crystallizing stars + BH
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setOverlayOpacity(0);
    }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Terminal appears at 2.0s, types out lines
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setTerminalVisible(true);
      typeLines(0, 0);
    }, 2000);

    return () => clearTimeout(showTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const typeLines = (lineIdx: number, charIdx: number) => {
    if (lineIdx >= TERMINAL_LINES.length) return;

    const line = TERMINAL_LINES[lineIdx];

    if (charIdx < line.length) {
      setCurrentLine(line.slice(0, charIdx + 1));
      timerRef.current = setTimeout(() => typeLines(lineIdx, charIdx + 1), CHAR_DELAY_MS);
    } else {
      // Line complete — push to finished lines, start next
      setLines((prev) => [...prev, line]);
      setCurrentLine('');
      if (lineIdx + 1 < TERMINAL_LINES.length) {
        timerRef.current = setTimeout(() => typeLines(lineIdx + 1, 0), LINE_GAP_MS);
      }
    }
  };

  return (
    <>
      {/* Black overlay — fades to reveal BH underneath */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          opacity: overlayOpacity,
          transition: 'opacity 1.8s cubic-bezier(0.16,1,0.3,1)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

      {/* Terminal text */}
      {terminalVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: '12vh',
            left: '3vw',
            zIndex: 15,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'rgba(232,228,216,0.72)',
            lineHeight: 2.0,
            pointerEvents: 'none',
          }}
        >
          {lines.map((l, i) => (
            <div key={i} style={{ opacity: 0.55 + i * 0.12 }}>
              {l}
            </div>
          ))}
          {currentLine && (
            <div>
              {currentLine}
              <span style={{ opacity: cursorVisible ? 1 : 0, marginLeft: 2 }}>█</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
