"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once at module scope — gsap.registerPlugin is idempotent but
// calling it inside useEffect would delay ScrollTrigger availability
// for any child component that reads it during its own mount.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Global smooth-scroll + GSAP ScrollTrigger bridge.
 *
 * The engineer's number: lerp = 0.085. Every pixel of motion on this
 * site inherits that cadence. Do not tune without replacing it in the
 * design system.
 *
 * Lenis runs its own RAF loop; we forward every `scroll` event into
 * ScrollTrigger.update so triggers resolve against the interpolated
 * position instead of the native scrollTop that never actually moves.
 */
export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => {
      // Lenis expects milliseconds; rAF already hands us a DOMHighResTimestamp
      // in ms, so no conversion needed.
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lenis.off("scroll", onScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
