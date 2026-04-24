"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * CALIBRATE — boot sequence.
 *
 * Timeline (t in seconds, total ~2.9s before fade):
 *
 *   0.00  Lime flood sweeps in from the left         (0.70s, compute)
 *   0.10  Bottom-left build tag fades in             (0.40s, instrument)
 *   0.10  Progress bar grows from 0 → 1              (0.90s, precision)
 *   0.20  Letters rise from y=100%, still graphite   (0.80s, typeset, stagger)
 *   1.20  Lime flood retreats to the right           (0.50s, compute)
 *   1.25  Letters flip graphite → cream               (0.30s, precision)
 *   2.30  Overlay fades out, onComplete() fires       (0.50s, dismiss)
 *
 * The flood is a single div with a transform-origin swap at the
 * retreat boundary — cheaper than animating width, and it keeps the
 * letters riding a composited layer on the GPU.
 */

interface LoaderProps {
  onComplete: () => void;
}

const WORD = "CALIBRATE".split("");

export default function Loader({ onComplete }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const floodRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);
  const tagRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Stable setter so we can collect letter refs without allocating a
  // new function per letter per render.
  const setLetterRef = (index: number) => (el: HTMLSpanElement | null) => {
    if (el) lettersRef.current[index] = el;
  };

  useEffect(() => {
    const root = rootRef.current;
    const flood = floodRef.current;
    const bar = barRef.current;
    const tag = tagRef.current;
    const letters = lettersRef.current.filter(Boolean);

    if (!root || !flood || !bar || !tag || letters.length === 0) return;

    // Seed states with gsap.set — never Tailwind `invisible` or inline
    // visibility. Class-based visibility fights autoAlpha during
    // hydration and produces the well-known red-frame flash.
    gsap.set(flood, { scaleX: 0, transformOrigin: "left center" });
    gsap.set(letters, { yPercent: 100, autoAlpha: 0, color: "#0B0D10" });
    gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
    gsap.set(tag, { autoAlpha: 0, y: 6 });

    const tl = gsap.timeline({
      onComplete,
    });

    // 1. Lime flood — the slam.
    tl.to(
      flood,
      {
        scaleX: 1,
        duration: 0.7,
        ease: "cubic-bezier(0.65, 0.05, 0, 1)",
      },
      0,
    );

    // 2. Telemetry corners.
    tl.to(
      tag,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        ease: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      0.1,
    );

    tl.to(
      bar,
      {
        scaleX: 1,
        duration: 0.9,
        ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      0.1,
    );

    // 3. Letters ride up through the flood — graphite on lime reads
    //    as absence. The reveal is the retreat.
    tl.to(
      letters,
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.8,
        stagger: 0.04,
        ease: "cubic-bezier(0.19, 1, 0.22, 1)",
      },
      0.2,
    );

    // 4. Retreat. Swap the transform-origin at exactly this instant —
    //    setting it earlier would have collapsed the scale-in toward
    //    the right edge instead of sweeping left→right.
    tl.call(
      () => {
        gsap.set(flood, { transformOrigin: "right center" });
      },
      undefined,
      1.2,
    );

    tl.to(
      flood,
      {
        scaleX: 0,
        duration: 0.5,
        ease: "cubic-bezier(0.65, 0.05, 0, 1)",
      },
      1.2,
    );

    // 5. Cream flip — overlap with the retreat so the eye reads one
    //    continuous gesture, not two.
    tl.to(
      letters,
      {
        color: "#E8E4D8",
        duration: 0.3,
        ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      1.25,
    );

    // 6. Hold, then dismiss.
    tl.to(
      root,
      {
        autoAlpha: 0,
        duration: 0.5,
        ease: "cubic-bezier(0.4, 0, 1, 1)",
      },
      2.3,
    );

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0B0D10",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Lime flood — single composited plane, transform-origin
          flipped at the retreat frame. */}
      <div
        ref={floodRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "#B8FF3C",
          willChange: "transform",
        }}
      />

      {/* CALIBRATE — each glyph in a mask-clipping span so the vertical
          rise doesn't fight line-height descenders. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 6vw",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(4rem, 12vw, 10rem)",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
            display: "flex",
            overflow: "hidden",
            margin: 0,
          }}
        >
          {WORD.map((char, i) => (
            <span
              key={`${char}-${i}`}
              style={{
                display: "inline-block",
                overflow: "hidden",
                lineHeight: 1,
              }}
            >
              <span
                ref={setLetterRef(i)}
                style={{
                  display: "inline-block",
                  willChange: "transform, opacity, color",
                }}
              >
                {char}
              </span>
            </span>
          ))}
        </h1>
      </div>

      {/* Bottom-left build tag — Space Mono, 9px, telemetry voice. */}
      <div
        ref={tagRef}
        style={{
          position: "absolute",
          left: "2rem",
          bottom: "1.5rem",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          fontWeight: 400,
          letterSpacing: "0.12em",
          color: "#E8E4D8",
          textTransform: "uppercase",
        }}
      >
        DA · FIELD SYSTEM v2026.04
      </div>

      {/* Bottom-right progress track — 120px rail, lime fill. */}
      <div
        style={{
          position: "absolute",
          right: "2rem",
          bottom: "1.75rem",
          width: "120px",
          height: "1px",
          background: "rgba(232, 228, 216, 0.15)",
          overflow: "hidden",
        }}
      >
        <div
          ref={barRef}
          style={{
            width: "100%",
            height: "100%",
            background: "#B8FF3C",
            willChange: "transform",
          }}
        />
      </div>
    </div>
  );
}
