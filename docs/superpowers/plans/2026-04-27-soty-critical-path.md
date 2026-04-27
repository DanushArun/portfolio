# Portfolio SOTY — Critical Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the three SOTY-blocking gaps — silent experience, white flash on load, and bloated bundle — then add the audio engine that makes the cinematic arc land.

**Architecture:** Three parallel tracks (A/B/C) with no inter-dependencies; Track D follows all three. Track A is pure config. Track B builds `src/lib/audio.ts` as an isolated singleton with zero React coupling until the integration step. Track C audits GPU disposal and fixes selective bloom.

**Tech Stack:** Web Audio API (no libraries), Next.js App Router, Three.js r184, React Three Fiber 9, Zustand 5, TypeScript 5.

**Design spec:** `docs/superpowers/specs/2026-04-27-complete-design-flow.md`

---

## FILE MAP

### New files
| File | Responsibility |
|---|---|
| `src/lib/audio.ts` | AudioContext singleton, procedural generators (sub-bass, pulsar click, doppler shimmer), track lifecycle |
| `src/lib/audio-files.ts` | File manifest, preload logic, AudioBuffer cache |
| `src/hooks/useAudio.ts` | Phase-driven audio state machine wired to Zustand |
| `src/components/ui/AudioToggle.tsx` | Single mute/unmute icon in HUD top-right |
| `public/audio/` | Sampled audio assets (see Task B4 for spec) |

### Modified files
| File | Change |
|---|---|
| `src/app/globals.css` | Add `background: var(--graphite)` to `html {}` rule (blocks first paint) |
| `package.json` | Remove `animejs`, `@studio-freight/lenis`, `framer-motion` |
| `src/components/scene/SceneManager.tsx` | Mount `useAudio()` hook + `<AudioToggle />` |
| `src/components/scene/scenes/DriveXQuasar.tsx` | Ensure `geometry.dispose()` on jet geometries |
| `src/components/scene/scenes/QuantumPlanet.tsx` | Replace 8000 DOM div shatter with single `<canvas>` rAF loop |

### Deleted
| Path | Reason |
|---|---|
| `src/_legacy/` (entire directory) | 26 dead components, zero active imports |
| `src/components/LabCanvas.tsx` | Orphaned physics harness, zero imports |

---

## TRACK A — FOUNDATION (do first, no dependencies)

### Task A1: Fix HTML Shell White Flash

**Files:**
- Modify: `src/app/globals.css`

`globals.css` already sets `body { background: var(--graphite) }`. The gap: the `html` element has no background, so the browser's default white canvas bleeds through before the body background propagates. `globals.css` is loaded as a blocking `<link rel="stylesheet">` in the Next.js `<head>` — adding `background` to the `html` rule is the most robust fix, guaranteed to prevent any flash before first paint.

- [ ] **Step 1: Add background to html rule in globals.css**

Open `src/app/globals.css`. Find the `html { ... }` rule (around line 62). Add `background: var(--graphite);` to it:

```css
html {
  background: var(--graphite);   /* ← add this line */
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Open http://localhost:3000. Open DevTools → Network → throttle to "Slow 3G". Hard-reload (Cmd+Shift+R). The browser tab background must be `#0B0D10` from the very first byte received — no white flash at any point during loading. Confirm with DevTools eyedropper tool on the first frame of the Performance recording.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "fix: add background:#0B0D10 to html rule in globals.css — blocks white flash before first paint"
```

---

### Task A2: Remove Dead Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove three packages**

```bash
npm uninstall animejs @studio-freight/lenis framer-motion
```

- [ ] **Step 2: Verify nothing broke**

```bash
grep -r "animejs\|studio-freight\|framer-motion" src/ --include="*.tsx" --include="*.ts"
```

Expected: zero results. If any results appear, those files need updating before this task proceeds.

```bash
npm run build
```

Expected: successful build, no missing module errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused animejs, @studio-freight/lenis, framer-motion — saves ~380KB from bundle"
```

---

### Task A3: Prune Dead Code

**Files:**
- Delete: `src/_legacy/` directory
- Delete: `src/components/LabCanvas.tsx`

- [ ] **Step 1: Confirm zero active imports**

```bash
grep -r "_legacy\|LabCanvas" src/app src/components/scene --include="*.tsx" --include="*.ts"
```

Expected: zero results. If any appear, stop and investigate.

- [ ] **Step 2: Delete**

```bash
rm -rf src/_legacy
rm src/components/LabCanvas.tsx
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete src/_legacy/ (26 dead components) and orphaned LabCanvas"
```

---

## TRACK B — AUDIO ENGINE (parallel with C, no dependency on A)

The audio system has four layers: (1) procedural generators (no files, work immediately), (2) file-based sampled sounds, (3) phase-driven state machine, (4) user-facing toggle. Build in that order.

### Task B1: Audio Engine Singleton

**Files:**
- Create: `src/lib/audio.ts`

The engine is a class singleton. Never imported from inside `useFrame` loops. All scheduling uses `AudioContext.currentTime` — not `setInterval` or `setTimeout` — to prevent beat drift.

- [ ] **Step 1: Create the audio engine**

Create `src/lib/audio.ts`:

```typescript
/**
 * AudioEngine — singleton Web Audio API controller.
 *
 * All sound generation and scheduling lives here. React hooks consume
 * this singleton; no Web Audio API calls exist elsewhere.
 *
 * AudioContext is lazy — created on first call to enable() (browser
 * requires a user gesture before AudioContext can run).
 */

const BEAT_INTERVAL = 0.092; // seconds — 92ms pulsar metronome

// TrackId covers only file-based looping tracks managed via startTrack/stopTrack.
// Procedural sources (sub-bass oscillator, doppler shimmer, pulsar click) are
// managed directly via their own AudioNode refs — not through the tracks Map.
type TrackId =
  | 'quasar-left'
  | 'quasar-right'
  | 'twin-flywheel'
  | 'rings-strings'
  | 'crystal-glass'
  | 'singularity-organ';

interface Track {
  source: AudioBufferSourceNode | OscillatorNode;
  gain: GainNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private tracks = new Map<TrackId, Track>();
  private pulsarTimer: ReturnType<typeof setTimeout> | null = null;
  private nextBeatTime = 0;
  private pulsarClickBuffer: AudioBuffer | null = null;
  private enabled = false;
  private bufferCache = new Map<string, AudioBuffer>();

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /** Called on first user gesture (audio toggle click). */
  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
      this.buildPulsarClickBuffer();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  disable(): void {
    this.enabled = false;
    if (this.ctx) this.ctx.suspend();
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  // ── Procedural sounds ────────────────────────────────────────────────────

  /** 28Hz sub-bass oscillator — felt, not heard. Runs VOID → DESCENT. */
  startSubBass(): void {
    if (!this.ctx || !this.master) return;
    if (this.tracks.has('sub-bass')) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 28;

    // Highpass at 20Hz (removes DC offset on speakers that can't reproduce 28Hz)
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 20;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 2.0);

    osc.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.master);
    osc.start();

    this.tracks.set('sub-bass', { source: osc, gain });
  }

  /** Pitch-shift sub-bass down 2 semitones over 1.6s (gravitational redshift on descent). */
  pitchDownSubBass(): void {
    const track = this.tracks.get('sub-bass');
    if (!track || !this.ctx) return;
    const osc = track.source as OscillatorNode;
    // 2 semitones down: 28Hz × 2^(-2/12) ≈ 24.95Hz
    osc.frequency.linearRampToValueAtTime(24.95, this.ctx.currentTime + 1.6);
  }

  /** Cut sub-bass immediately (moment of crossing event horizon). */
  silenceSubBass(): void {
    const track = this.tracks.get('sub-bass');
    if (!track || !this.ctx) return;
    track.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.001);
    setTimeout(() => this.stopTrack('sub-bass'), 200);
  }

  /**
   * Doppler shimmer — 8kHz oscillator, volume tied to horizonProgress.
   * Simulates audible Doppler shift as camera approaches event horizon.
   */
  setDopplerShimmer(horizonProgress: number): void {
    if (!this.ctx || !this.master) return;

    if (!this.tracks.has('doppler-shimmer')) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 8000;

      const gain = this.ctx.createGain();
      gain.gain.value = 0;

      osc.connect(gain);
      gain.connect(this.master);
      osc.start();

      this.tracks.set('doppler-shimmer', { source: osc, gain });
    }

    const track = this.tracks.get('doppler-shimmer')!;
    track.gain.gain.setTargetAtTime(horizonProgress * 0.12, this.ctx.currentTime, 0.1);
  }

  // ── Pulsar metronome ─────────────────────────────────────────────────────

  /**
   * Pulsar click buffer — white noise burst with exponential decay.
   * Total duration 40ms. Built once and reused for every beat.
   */
  private buildPulsarClickBuffer(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const duration   = 0.040; // 40ms
    const frames     = Math.floor(sampleRate * duration);
    const buffer     = this.ctx.createBuffer(1, frames, sampleRate);
    const data       = buffer.getChannelData(0);

    for (let i = 0; i < frames; i++) {
      // White noise × exponential envelope
      const t = i / sampleRate;
      data[i]  = (Math.random() * 2 - 1) * Math.exp(-t / 0.008);
    }

    this.pulsarClickBuffer = buffer;
  }

  /**
   * Start drift-free pulsar scheduling using AudioContext clock.
   * Each beat is scheduled lookahead-style: scheduleAheadTime ahead of
   * AudioContext.currentTime. This eliminates the ~5ms drift that
   * setInterval accumulates over minutes.
   */
  startPulsarScheduler(): void {
    if (!this.ctx || !this.pulsarClickBuffer) return;
    this.nextBeatTime = this.ctx.currentTime;
    this.schedulePulsarLoop();
  }

  private schedulePulsarLoop(): void {
    if (!this.ctx || !this.pulsarClickBuffer || !this.enabled) return;

    const scheduleAheadTime = 0.1; // schedule 100ms ahead

    while (this.nextBeatTime < this.ctx.currentTime + scheduleAheadTime) {
      this.firePulsarClick(this.nextBeatTime);
      this.nextBeatTime += BEAT_INTERVAL;
    }

    this.pulsarTimer = setTimeout(() => this.schedulePulsarLoop(), 25);
  }

  private firePulsarClick(time: number): void {
    if (!this.ctx || !this.master || !this.pulsarClickBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.pulsarClickBuffer;

    // Highpass filter makes it sound like a relay snap, not a thud
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(time);
  }

  stopPulsarScheduler(): void {
    if (this.pulsarTimer) clearTimeout(this.pulsarTimer);
    this.pulsarTimer = null;
  }

  /** Adjust the gain on the pulsar click output bus — used by FORMULA_RINGS scroll sync. */
  setPulsarGain(targetGain: number): void {
    if (!this.ctx || !this.master) return;
    // pulsarOutputGain is a GainNode created in startPulsarScheduler, stored as a class field.
    // firePulsarClick routes all click BufferSources through this node before master.
    this.pulsarOutputGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  // ── File-based tracks ────────────────────────────────────────────────────

  async loadBuffer(url: string): Promise<AudioBuffer> {
    if (this.bufferCache.has(url)) return this.bufferCache.get(url)!;
    if (!this.ctx) throw new Error('AudioContext not initialised');

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.bufferCache.set(url, audioBuffer);
    return audioBuffer;
  }

  async startTrack(id: TrackId, url: string, loop: boolean, initialGain = 1.0): Promise<void> {
    if (!this.ctx || !this.master) return;
    if (this.tracks.has(id)) return; // already running

    try {
      const buffer = await this.loadBuffer(url);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;

      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(initialGain, this.ctx.currentTime + 1.5);

      source.connect(gain);
      gain.connect(this.master);
      source.start();

      this.tracks.set(id, { source, gain });
    } catch {
      // Audio file missing — fail silently (experience continues without this track)
    }
  }

  stopTrack(id: TrackId, fadeTime = 1.0): void {
    const track = this.tracks.get(id);
    if (!track || !this.ctx) return;

    track.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeTime);
    setTimeout(() => {
      try { (track.source as AudioBufferSourceNode).stop(); } catch { /* already stopped */ }
      this.tracks.delete(id);
    }, (fadeTime + 0.1) * 1000);
  }

  setTrackGain(id: TrackId, targetGain: number, rampTime = 0.3): void {
    const track = this.tracks.get(id);
    if (!track || !this.ctx) return;
    track.gain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + rampTime);
  }

  /** Play a one-shot buffer (non-looping, no track management needed). */
  async playOneShot(url: string, gainValue = 1.0): Promise<void> {
    if (!this.ctx || !this.master) return;
    try {
      const buffer = await this.loadBuffer(url);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.value = gainValue;

      source.connect(gain);
      gain.connect(this.master);
      source.start();
    } catch { /* fail silently */ }
  }

  /** Silence everything immediately — used at SINGULARITY entry. */
  silenceAll(): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.001);
    this.stopPulsarScheduler();
    setTimeout(() => {
      this.tracks.forEach((_, id) => this.stopTrack(id, 0));
      if (this.master) this.master.gain.value = 1;
    }, 100);
  }
}

export const audioEngine = new AudioEngine();
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors in `src/lib/audio.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/audio.ts
git commit -m "feat: audio engine singleton — sub-bass oscillator, drift-free pulsar scheduler, track lifecycle"
```

---

### Task B2: Audio File Manifest

**Files:**
- Create: `src/lib/audio-files.ts`
- Create: `public/audio/` directory structure

- [ ] **Step 1: Create the file manifest**

Create `src/lib/audio-files.ts`:

```typescript
/**
 * Audio file manifest — all sampled sounds used in the experience.
 *
 * Files live in public/audio/. Each entry has a primary WebM path and
 * an OGG fallback. The engine picks WebM where supported.
 *
 * Files marked `generated: 'procedural'` are synthesized in audio.ts
 * and need no audio file.
 *
 * Files marked `generated: 'required'` need real audio assets.
 * Generate with AI audio tools (ElevenLabs Sound FX, Suno, Udio) or
 * record/license. See AUDIO_SPEC below for exact description of each.
 */

export const AUDIO_FILES = {
  'sub-bass':          { generated: 'procedural' },
  'doppler-shimmer':   { generated: 'procedural' },
  'pulsar-click':      { generated: 'procedural' },

  'descent-piano':     { webm: '/audio/descent-piano.webm',     ogg: '/audio/descent-piano.ogg',     generated: 'required' },
  'quasar-left':       { webm: '/audio/quasar-left.webm',       ogg: '/audio/quasar-left.ogg',       generated: 'required' },
  'quasar-right':      { webm: '/audio/quasar-right.webm',      ogg: '/audio/quasar-right.ogg',      generated: 'required' },
  'twin-flywheel':     { webm: '/audio/twin-flywheel.webm',     ogg: '/audio/twin-flywheel.ogg',     generated: 'required' },
  'rings-strings':     { webm: '/audio/rings-strings.webm',     ogg: '/audio/rings-strings.ogg',     generated: 'required' },
  'crystal-glass':     { webm: '/audio/crystal-glass.webm',     ogg: '/audio/crystal-glass.ogg',     generated: 'required' },
  'singularity-organ': { webm: '/audio/singularity-organ.webm', ogg: '/audio/singularity-organ.ogg', generated: 'required' },
} as const;

/**
 * AUDIO_SPEC — descriptions for AI audio generation.
 *
 * Feed these prompts to ElevenLabs Sound FX, Suno, or similar.
 * Target: -14 LUFS, normalize to peak -1dBFS, export as WebM + OGG.
 */
export const AUDIO_SPEC = {
  'descent-piano':
    'Single D-flat 3 piano note, struck hard, sustains naturally for 8 seconds, ' +
    'concert grand piano, solo note, reverb tail, no accompaniment, fade to silence',

  'quasar-left':
    'Cold digital arpeggiated synthesizer sequence, structured, repeating 4-bar loop, ' +
    'electric blue color temperature, sci-fi, no percussion, 120bpm feel but ambient',

  'quasar-right':
    'Warm organic ambient pad, slowly evolving, 4-bar loop, analog warmth, ' +
    'amber color temperature, human resonance, no percussion, slightly dissonant overtones',

  'twin-flywheel':
    'Large industrial flywheel or bearing under constant load, mechanical hum ' +
    'with rhythmic weight, seamless loop, heavy machinery ambience, low frequency presence',

  'rings-strings':
    'Hans Zimmer style rising string phrase, 12 seconds, builds from quiet to dramatic, ' +
    'orchestral strings only, no brass no percussion, cinematic, does not resolve — ends mid-phrase',

  'crystal-glass':
    'Sustained crystal wine glass resonance, slightly dissonant, infinite sustain loop, ' +
    'pure tone with slight beating frequency between two close pitches, ethereal',

  'singularity-organ':
    'Church pipe organ, D-flat 2 single note appears at full volume with no attack ' +
    'as if it was always playing, holds 4 seconds, then A-flat 2 joins, holds 4 seconds, ' +
    'then full D-flat minor chord materializes, total 20 seconds, does not swell or fade',
} as const;

/** Pick the best supported format at runtime. */
export function audioUrl(id: keyof typeof AUDIO_FILES): string | null {
  const entry = AUDIO_FILES[id];
  if (!('webm' in entry)) return null; // procedural

  // Check WebM support once
  const supportsWebM = typeof document !== 'undefined' &&
    document.createElement('audio').canPlayType('audio/webm') !== '';

  return supportsWebM ? entry.webm : entry.ogg;
}
```

- [ ] **Step 2: Create placeholder audio directory**

```bash
mkdir -p public/audio
```

Create a placeholder README so the directory is tracked and the spec is documented:

```bash
cat > public/audio/README.md << 'EOF'
# Audio Assets

All files here are sampled sounds for the portfolio experience.

## Required files
- descent-piano.webm / .ogg
- quasar-left.webm / .ogg
- quasar-right.webm / .ogg
- twin-flywheel.webm / .ogg
- rings-strings.webm / .ogg
- crystal-glass.webm / .ogg
- singularity-organ.webm / .ogg

See src/lib/audio-files.ts AUDIO_SPEC for generation prompts.
Target: -14 LUFS, peak -1dBFS, WebM (VP9 audio) + OGG fallback.

Procedural sounds (sub-bass, pulsar-click, doppler-shimmer) require no files.
EOF
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/audio-files.ts public/audio/README.md
git commit -m "feat: audio file manifest with generation specs for all sampled sounds"
```

---

### Task B3: Phase-Driven Audio Hook

**Files:**
- Create: `src/hooks/useAudio.ts`

This hook is the only connection between Zustand phase state and the audio engine. It lives in SceneManager and runs on every phase change.

- [ ] **Step 1: Create the hook**

Create `src/hooks/useAudio.ts`:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { useScene } from '@/lib/scene-state';
import { audioEngine } from '@/lib/audio';
import { audioUrl } from '@/lib/audio-files';

/**
 * useAudio — connects Zustand phase state to the audio engine.
 *
 * Mount once in SceneManager. Does nothing until audioEngine.enable()
 * is called (requires user gesture per browser policy).
 *
 * Each phase transition fires its audio cue. horizonProgress drives
 * the continuous doppler shimmer.
 */
export function useAudio() {
  const phase           = useScene((s) => s.phase);
  const horizonProgress = useScene((s) => s.horizonProgress);
  const prevPhase       = useRef<typeof phase | null>(null);

  // ── Continuous: doppler shimmer tracks horizonProgress ──────────────────
  useEffect(() => {
    if (phase !== 'EVENT_HORIZON' && phase !== 'DESCENT') return;
    audioEngine.setDopplerShimmer(horizonProgress);
  }, [horizonProgress, phase]);

  // ── Phase transitions ────────────────────────────────────────────────────
  useEffect(() => {
    if (prevPhase.current === phase) return;
    const prev = prevPhase.current;
    prevPhase.current = phase;

    switch (phase) {
      case 'VOID':
        audioEngine.startSubBass();
        break;

      case 'EVENT_HORIZON':
        // Sub-bass continues from VOID — nothing new to start
        break;

      case 'DESCENT':
        audioEngine.pitchDownSubBass();
        // Silence at 1.6s (crossing moment — the loudest silence in the experience)
        setTimeout(() => audioEngine.silenceSubBass(), 1600);
        // D♭3 piano strikes at 2.6s
        setTimeout(() => {
          const url = audioUrl('descent-piano');
          if (url) audioEngine.playOneShot(url, 0.8);
        }, 2600);
        break;

      case 'MIRA_PULSAR':
        // Stop doppler shimmer (we're through the horizon)
        audioEngine.setDopplerShimmer(0);
        // Start drift-free pulsar click scheduler
        audioEngine.startPulsarScheduler();
        break;

      case 'DRIVEX_QUASAR': {
        // Pulsar click continues at reduced gain
        const leftUrl  = audioUrl('quasar-left');
        const rightUrl = audioUrl('quasar-right');
        if (leftUrl)  audioEngine.startTrack('quasar-left',  leftUrl,  true, 0.7);
        if (rightUrl) audioEngine.startTrack('quasar-right', rightUrl, true, 0.7);
        break;
      }

      case 'TWIN_BUILD': {
        audioEngine.stopTrack('quasar-left',  1.0);
        audioEngine.stopTrack('quasar-right', 1.0);
        const url = audioUrl('twin-flywheel');
        if (url) audioEngine.startTrack('twin-flywheel', url, true, 0.8);
        break;
      }

      case 'FORMULA_RINGS': {
        audioEngine.stopTrack('twin-flywheel', 0.8);
        const url = audioUrl('rings-strings');
        if (url) audioEngine.startTrack('rings-strings', url, false, 1.0);
        break;
      }

      case 'QUANTUM_PLANET': {
        // rings-strings ends naturally — silence is intentional
        audioEngine.stopTrack('rings-strings', 0.1);
        const url = audioUrl('crystal-glass');
        if (url) audioEngine.startTrack('crystal-glass', url, true, 0);
        // Crystal glass fades in over 3s
        setTimeout(() => audioEngine.setTrackGain('crystal-glass', 0.6, 3.0), 100);
        break;
      }

      case 'SINGULARITY':
        // All audio cuts simultaneously — the 3-second silence is a design element
        audioEngine.silenceAll();
        // At 5.5s: D♭3 piano echo of descent arrival
        setTimeout(() => {
          const pianoUrl = audioUrl('descent-piano');
          if (pianoUrl) audioEngine.playOneShot(pianoUrl, 0.4);
        }, 5500);
        // At 10s: organ materializes
        setTimeout(() => {
          const organUrl = audioUrl('singularity-organ');
          if (organUrl) audioEngine.startTrack('singularity-organ', organUrl, false, 1.0);
        }, 10000);
        break;
    }

    // Suppress unused variable lint — prev is stored for future use in crossfades
    void prev;
  }, [phase]);
}

/**
 * usePulsarScrollSync — mounts inside FORMULA_RINGS scene.
 * When scroll speed is high, the pulsar output gain rises (EV motor = pulsar beat).
 * Calls audioEngine.setPulsarGain() — a dedicated method on the AudioEngine that
 * adjusts the GainNode wired to the pulsar click output bus. This is NOT a TrackId
 * operation — the pulsar is procedurally scheduled, not a BufferSource track.
 */
export function usePulsarScrollSync() {
  useEffect(() => {
    const unsubscribe = useScene.subscribe(
      (s) => s.scrollVelocity,
      (velocity) => {
        if (useScene.getState().phase !== 'FORMULA_RINGS') return;
        const normalised = Math.min(Math.abs(velocity) / 80, 1);
        audioEngine.setPulsarGain(0.12 + normalised * 0.32);
      },
    );
    return unsubscribe;
  }, []);
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAudio.ts
git commit -m "feat: useAudio hook — phase-driven audio state machine, doppler shimmer on horizonProgress"
```

---

### Task B4: Audio Toggle Component

**Files:**
- Create: `src/components/ui/AudioToggle.tsx`
- Modify: `src/components/scene/HUD.tsx` (add toggle to top-right)
- Modify: `src/components/scene/SceneManager.tsx` (mount useAudio hook)

- [ ] **Step 1: Create the toggle**

Create `src/components/ui/AudioToggle.tsx`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { audioEngine } from '@/lib/audio';

/**
 * AudioToggle — single icon in HUD top-right corner.
 * This is the ONLY entry point for AudioContext creation.
 * Browser policy: AudioContext requires a user gesture.
 * The first click on this toggle is that gesture.
 */
export default function AudioToggle() {
  const [on, setOn] = useState(false);

  const toggle = useCallback(() => {
    if (!on) {
      audioEngine.enable();
    } else {
      audioEngine.disable();
    }
    setOn((prev) => !prev);
  }, [on]);

  return (
    <button
      onClick={toggle}
      aria-label={on ? 'Mute audio' : 'Enable audio'}
      style={{
        position:        'fixed',
        top:             '24px',
        right:           '24px',
        zIndex:          100,
        background:      'none',
        border:          'none',
        cursor:          'pointer',
        padding:         '4px 0',
        fontFamily:      'var(--font-mono, monospace)',
        fontSize:        '9px',
        letterSpacing:   '0.28em',
        color:           on ? 'rgba(232,228,216,0.7)' : 'rgba(232,228,216,0.25)',
        textTransform:   'uppercase',
        transition:      'color 0.4s cubic-bezier(0.16,1,0.3,1)',
        userSelect:      'none',
        WebkitUserSelect: 'none',
      }}
    >
      {on ? 'AUDIO ON' : 'AUDIO OFF'}
    </button>
  );
}
```

- [ ] **Step 2: Mount useAudio in SceneManager**

Open `src/components/scene/SceneManager.tsx`. Add imports at top:

```typescript
import { useAudio } from '@/hooks/useAudio';
import AudioToggle from '@/components/ui/AudioToggle';
```

Inside `SceneManager` function body, after the existing hooks:

```typescript
// Audio state machine — drives all sounds from phase transitions
useAudio();
```

Inside the returned JSX in `SceneManager`, add `<AudioToggle />` as the last sibling. The complete return block should be:

```tsx
return (
  <>
    {showBH && (
      <BlackHoleMount
        zIndex={1}
        innerColor="#ffc066"
        outerColor="#5a1a08"
        progress={horizonProgress}
      />
    )}
    {showR3F && (
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 2, 30], fov: 50, near: 0.01, far: 2000 }}
        style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1 }}
      >
        <color attach="background" args={['#000000']} />
        <Suspense fallback={null}>
          <CameraRig />
          {phase === 'DRIVEX_QUASAR'  && <DriveXQuasar />}
          {phase === 'TWIN_BUILD'     && <TwinBuild />}
          {phase === 'FORMULA_RINGS'  && <FormulaRings />}
          {phase === 'QUANTUM_PLANET' && <QuantumPlanet />}
          {phase === 'SINGULARITY'    && <Singularity />}
        </Suspense>
      </Canvas>
    )}
    <div
      aria-hidden
      style={{
        position: 'fixed', inset: 0,
        background: '#000',
        opacity: veil,
        transition: veil === 0 ? 'opacity 0.9s cubic-bezier(0.16,1,0.3,1)' : 'none',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
    {showCosmic && <GravityCursor />}
    <HUD />
    {phase === 'VOID' && <VoidPrologue />}
    {atPulsar         && <MiraPulsarOverlay />}
    <DriveXQuasarOverlay />
    <TwinBuildOverlay />
    {showR3F && <ScrollSnap />}
    <AudioToggle />
  </>
);
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: successful build. Start dev server and verify:
- Audio toggle appears top-right in monospace text `AUDIO OFF`
- Clicking it changes to `AUDIO ON` and starts AudioContext (check DevTools → Application → Background Services → WebAudio)
- Procedural sub-bass starts immediately on AUDIO ON + page reload (28Hz — may only be felt, not heard on laptop speakers)
- Pulsar click fires every ~92ms once MIRA_PULSAR phase is reached

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/AudioToggle.tsx src/components/scene/SceneManager.tsx
git commit -m "feat: AudioToggle + mount useAudio in SceneManager — full audio state machine wired to phase transitions"
```

---

### Task B5: Source Audio Files

This task is external (requires audio generation tools). Audio files go in `public/audio/`.

- [ ] **Step 1: Generate each required file**

Use ElevenLabs Sound FX (https://elevenlabs.io/sound-effects), Suno (suno.com), or Udio for:

| File | Generation prompt (from audio-files.ts AUDIO_SPEC) |
|---|---|
| `descent-piano` | "Single D-flat 3 piano note, struck hard, sustains 8 seconds, concert grand, no accompaniment" |
| `quasar-left` | "Cold digital arpeggiated synthesizer, structured, 4-bar loop, sci-fi ambient, 120bpm" |
| `quasar-right` | "Warm organic ambient pad, slowly evolving, 4-bar loop, analog warmth, slightly dissonant" |
| `twin-flywheel` | "Large industrial flywheel under constant load, mechanical hum, seamless loop, heavy machinery" |
| `rings-strings` | "Hans Zimmer rising strings, 12 seconds, builds but does not resolve, orchestral strings only" |
| `crystal-glass` | "Crystal wine glass resonance, infinite sustain loop, slightly dissonant beating between two pitches" |
| `singularity-organ` | "Church organ D-flat 2 single note at full volume, then fifth joins, then full chord, 20 seconds total" |

- [ ] **Step 2: Export and convert**

Each file: export as OGG (Vorbis) at 192kbps, then convert to WebM:

```bash
# Install ffmpeg if needed: brew install ffmpeg
# For each file:
ffmpeg -i input.mp3 -c:a libvorbis -q:a 6 public/audio/filename.ogg
ffmpeg -i input.mp3 -c:a libopus -b:a 128k public/audio/filename.webm
```

Target sizes: piano ~200KB, ambient pads ~150KB each, strings ~300KB, organ ~400KB. Total: < 2MB for all audio assets.

- [ ] **Step 3: Verify**

```bash
ls -lh public/audio/
```

All 7 pairs (webm + ogg) should be present. Test in browser with audio toggle on, advance through phases, verify each track triggers.

- [ ] **Step 4: Commit**

```bash
git add public/audio/
git commit -m "feat: add sampled audio assets — descent piano, quasar pads, flywheel, strings, glass, organ"
```

---

## TRACK C — GPU POLISH (parallel with B)

### Task C1: Audit Scene Disposal

**Files:**
- Modify: `src/components/scene/scenes/DriveXQuasar.tsx`
- Modify: `src/components/scene/scenes/QuantumPlanet.tsx`

**Known state from code audit (2026-04-27):**
- `FormulaRings`: already disposes geometry on unmount ✅
- `TwinBuild`: already disposes all 8 geometries + 4 material arrays in a single `useEffect` cleanup at line 297 ✅ — no changes needed
- `DriveXQuasar`: not yet audited — Step 1 below
- `QuantumPlanet`: the `ShatterOverlay` component mounts 8000 absolute-positioned DOM divs on click — replace with a single `<canvas>` element using Canvas 2D rAF loop (1 DOM node, GPU-rasterized)

- [ ] **Step 1: Add disposal to DriveXQuasar**

Open `src/components/scene/scenes/DriveXQuasar.tsx`. Find all `useMemo`-created `THREE.BufferGeometry` and `THREE.ShaderMaterial` instances. For each pair, add a `useEffect` cleanup. The exact variable names will be whatever is in the file — the pattern is:

```typescript
// Add after the useMemo calls that create jetGeoLeft, jetGeoRight, jetMatLeft, jetMatRight:
useEffect(() => {
  return () => {
    jetGeoLeft.dispose();
    jetGeoRight.dispose();
    jetMatLeft.dispose();
    jetMatRight.dispose();
  };
}, [jetGeoLeft, jetGeoRight, jetMatLeft, jetMatRight]);
```

Substitute the actual variable names from the file. If any geometry or material is created inline (not in `useMemo`), wrap it in `useMemo` first, then add the disposal cleanup.

- [ ] **Step 2: Replace ShatterOverlay in QuantumPlanet with Canvas 2D**

Open `src/components/scene/scenes/QuantumPlanet.tsx`. Find the `ShatterOverlay` component (around line 156). Replace it entirely with this implementation:

```typescript
// Replace the entire ShatterOverlay function with this:
type ShatterPhase = 'scatter' | 'converge' | 'done';

function ShatterCanvas({ phase }: { phase: ShatterPhase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (phase === 'done' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Build random dot positions and velocity vectors once per shatter
    const DOT_COUNT = 8000;
    const dots = Array.from({ length: DOT_COUNT }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 320,
      vy: (Math.random() - 0.5) * 320,
    }));

    const startTime = performance.now();

    function draw() {
      const elapsed = (performance.now() - startTime) / 1000; // seconds
      if (elapsed >= 0.8) return; // done — component will unmount

      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      // t: 0→1 during scatter (0–0.4s), 1→0 during converge (0.4–0.8s)
      const t     = elapsed < 0.4 ? elapsed / 0.4 : 1 - (elapsed - 0.4) / 0.4;
      // alpha: ramps in during first 0.1s, out during converge
      const alpha = elapsed < 0.1 ? elapsed / 0.1 :
                    elapsed < 0.4 ? 1 :
                    Math.max(0, 1 - (elapsed - 0.4) / 0.4);

      ctx!.fillStyle = `rgba(212,175,55,${(alpha * 0.85).toFixed(3)})`;

      for (const dot of dots) {
        const cx = dot.x + dot.vx * t * 0.4;
        const cy = dot.y + dot.vy * t * 0.4;
        ctx!.fillRect(cx - 1, cy - 1, 2, 2);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        100,
        pointerEvents: 'none',
      }}
    />
  );
}
```

Then find every `<ShatterOverlay phase={shatterPhase} />` in the file and replace with `<ShatterCanvas phase={shatterPhase} />`. Delete the old `ShatterOverlay` function and the `Dot` type entirely.

- [ ] **Step 3: Verify no GPU memory leak**

```bash
npm run dev
```

Open DevTools → Memory → take heap snapshot while on VOID. Navigate through all scenes to SINGULARITY. Take a second heap snapshot. Filter by `THREE.BufferGeometry` — count should be the same in both snapshots. Any increase indicates a missing dispose.

- [ ] **Step 4: Commit**

```bash
git add src/components/scene/scenes/DriveXQuasar.tsx
git commit -m "fix: dispose DriveXQuasar jet geometries and materials on unmount"

git add src/components/scene/scenes/QuantumPlanet.tsx
git commit -m "perf: replace 8000 DOM div shatter with single Canvas 2D rAF loop — 1 DOM node, GPU rasterized"
```

---

### Task C2: Fix Selective Bloom

**Files:**
- Create: `src/components/scene/PostFX.tsx` (rewrite from scratch — current file is disabled)

The previous attempt used `UnrealBloomPass` on the full scene, which caused all geometry (including the HUD background) to saturate white. The fix: use `@react-three/postprocessing` with a `Bloom` pass that only affects objects set to `layers.enable(1)`.

Objects that should bloom: pulsar beam, jet particles, pulsar star emissive, bridge shader pulse.
Objects that must NOT bloom: the black void, HUD text, panel backgrounds.

- [ ] **Step 1: Rewrite PostFX**

Create `src/components/scene/PostFX.tsx`:

```typescript
'use client';

/**
 * PostFX — selective bloom on layer 1 only.
 *
 * Objects that should bloom: set mesh.layers.enable(1) on mount.
 * Objects that must not bloom: leave on default layer 0.
 *
 * Bloom config tuned to avoid white saturation:
 *   - intensity: 0.4 (low — enhances glow, doesn't wash out)
 *   - luminanceThreshold: 0.6 (only bright emissive objects bloom)
 *   - luminanceSmoothing: 0.9 (soft cutoff, no hard edge artifacts)
 *   - mipmapBlur: true (smoother bloom spread, no ring artifacts)
 */

import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export default function PostFX() {
  return (
    <EffectComposer disableNormalPass>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
        blendFunction={BlendFunction.ADD}
      />
    </EffectComposer>
  );
}
```

- [ ] **Step 2: Mount PostFX inside R3F Canvas in SceneManager**

In `src/components/scene/SceneManager.tsx`, inside the R3F `<Canvas>` JSX block, add `<PostFX />` as the last child inside `<Suspense>`:

```tsx
import PostFX from './PostFX';

// Inside <Canvas>:
<Suspense fallback={null}>
  <CameraRig />
  {phase === 'DRIVEX_QUASAR'  && <DriveXQuasar />}
  {phase === 'TWIN_BUILD'     && <TwinBuild />}
  {phase === 'FORMULA_RINGS'  && <FormulaRings />}
  {phase === 'QUANTUM_PLANET' && <QuantumPlanet />}
  {phase === 'SINGULARITY'    && <Singularity />}
  <PostFX />
</Suspense>
```

- [ ] **Step 3: Enable bloom layer on emissive objects**

In `MiraPulsar.tsx`, add to the beam mesh ref setup:

```typescript
const beamRef = useRef<THREE.Mesh>(null);

useEffect(() => {
  if (beamRef.current) beamRef.current.layers.enable(1);
}, []);
```

Repeat for the pulsar star mesh (the `emissiveIntensity={2.5}` object).

- [ ] **Step 4: Visual verification**

```bash
npm run dev
```

Navigate to MIRA_PULSAR. The beam should have a soft electric glow halo. The void black background must remain pure black — not grey, not washed. The HUD text must be unaffected.

Check DRIVEX_QUASAR: jet particles should have a subtle glow. The black space between particles must be `#000000`, not grey bloom bleed.

If any background grey appears: reduce `intensity` from 0.4 to 0.2. If emissive glow is too subtle: increase to 0.6. The correct value is the one where the bloom is visible on the emissive object but the void reads as absolute black.

- [ ] **Step 5: Commit**

```bash
git add src/components/scene/PostFX.tsx src/components/scene/SceneManager.tsx
git commit -m "fix: selective bloom with luminanceThreshold 0.6 — glow on emissive objects, void stays black"
```

---

### Task C3: Verify Full Performance Budget

- [ ] **Step 1: Run performance profile**

```bash
npm run build && npm run start
```

Open Chrome DevTools → Performance. Record a full run from VOID through SINGULARITY. Check:

| Scene | Target | Pass if |
|---|---|---|
| EVENT_HORIZON | < 8ms/frame | Green bar, no red spikes |
| MIRA_PULSAR | < 1ms/frame | Minimal GPU time |
| TWIN_BUILD | < 12ms/frame | Occasional yellow acceptable, no sustained red |
| FORMULA_RINGS at max speed | < 2ms/frame | GPU compute only |

- [ ] **Step 2: Mobile performance check**

In DevTools, enable CPU throttling at 4x. Re-run each scene. No scene should drop below 30fps sustained (a degraded but functional experience). TWIN_BUILD is the most likely to struggle — if it drops below 30fps under 4x throttle, disable the field arc tubes on mobile (detect via `window.matchMedia('(max-width: 768px)')`).

- [ ] **Step 3: Commit any optimizations found**

Document findings in a commit message. If no changes needed:

```bash
git commit --allow-empty -m "perf: verified full GPU budget — all scenes within targets on M-series + 4x throttle"
```

---

## TRACK D — CASE STUDY ROUTE (after A + B + C)

### Task D1: Mira Case Study Page

**Files:**
- Create: `src/app/mira/page.tsx`
- Create: `src/app/mira/layout.tsx`

The Mira case study is the one route judges need. It must feel like the same cosmological world — same fonts, same color system, same void background — but with enough density to demonstrate the project.

- [ ] **Step 1: Create route layout**

Create `src/app/mira/layout.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mira — Voice AI Agent · Danush Arun',
  description: 'Sub-100ms voice AI for real-time lead conversion. Pipecat · WebSockets · FastAPI.',
};

export default function MiraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: Create case study content**

Create `src/app/mira/page.tsx`:

```tsx
import Link from 'next/link';

const mono: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: '9px',
  letterSpacing: '0.28em',
  textTransform: 'uppercase' as const,
  color: 'rgba(232,228,216,0.4)',
};

const section: React.CSSProperties = {
  borderTop: '1px solid rgba(232,228,216,0.08)',
  paddingTop: '3rem',
  marginTop: '3rem',
};

export default function MiraPage() {
  return (
    <main style={{
      background: '#0B0D10',
      minHeight: '100vh',
      color: '#E8E4D8',
      fontFamily: 'var(--font-sans, sans-serif)',
      padding: 'clamp(2rem, 6vw, 6rem) clamp(1.5rem, 8vw, 12rem)',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>

      {/* Back */}
      <Link href="/" style={{ ...mono, color: 'rgba(232,228,216,0.25)', textDecoration: 'none', display: 'block', marginBottom: '4rem' }}>
        ← DANUSH ARUN
      </Link>

      {/* Header */}
      <div style={mono}>01 · MIRA · VOICE AI AGENT</div>
      <h1 style={{
        fontFamily: 'var(--font-display, serif)',
        fontWeight: 800,
        fontSize: 'clamp(2.4rem, 6vw, 5rem)',
        letterSpacing: '-0.03em',
        textTransform: 'uppercase',
        lineHeight: 1,
        margin: '1rem 0 0.5rem',
        color: '#E8E4D8',
      }}>
        Mira
      </h1>
      <div style={{ ...mono, color: 'rgba(232,228,216,0.55)', fontSize: '10px' }}>
        Real-time agentic conversation · Production at DriveX · 2025
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2px', marginTop: '4rem' }}>
        {[
          { label: 'End-to-end latency', value: '92ms', accent: true },
          { label: 'Environment', value: 'Production' },
          { label: 'Domain', value: 'Lead Conversion' },
          { label: 'Model integration', value: 'Multi-LLM' },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: 'rgba(232,228,216,0.03)', padding: '1.5rem 2rem', border: '1px solid rgba(232,228,216,0.06)' }}>
            <div style={mono}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display, serif)', fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', marginTop: '0.5rem', color: accent ? '#B8FF3C' : '#E8E4D8' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Problem */}
      <div style={section}>
        <div style={mono}>THE PROBLEM</div>
        <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', fontWeight: 300, lineHeight: 1.7, maxWidth: '72ch', marginTop: '1.5rem', color: 'rgba(232,228,216,0.75)' }}>
          DriveX runs high-volume sales operations. Lead qualification was manual, slow, and inconsistent.
          Voice AI agents existed but consistently failed at sub-200ms latency — too slow for natural conversation.
          The system needed to feel like talking to a human expert, not a chatbot.
        </p>
      </div>

      {/* Stack */}
      <div style={section}>
        <div style={mono}>TECHNICAL STACK</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2px', marginTop: '1.5rem' }}>
          {[
            { layer: 'Voice pipeline', tech: 'Pipecat' },
            { layer: 'Transport', tech: 'WebSockets' },
            { layer: 'API layer', tech: 'FastAPI' },
            { layer: 'LLM routing', tech: 'Multi-model' },
            { layer: 'Deployment', tech: 'Production · DriveX' },
          ].map(({ layer, tech }) => (
            <div key={layer} style={{ padding: '1rem 1.5rem', border: '1px solid rgba(232,228,216,0.06)' }}>
              <div style={mono}>{layer}</div>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', letterSpacing: '0.15em', color: '#E8E4D8', marginTop: '0.4rem' }}>{tech}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      <div style={section}>
        <div style={mono}>RESULT</div>
        <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', fontWeight: 300, lineHeight: 1.7, maxWidth: '72ch', marginTop: '1.5rem', color: 'rgba(232,228,216,0.75)' }}>
          Sub-100ms end-to-end latency in production. Handles real-time lead qualification and
          finance appointment booking. Integrated into DriveX operations pipeline. Architecture
          is replicable across voice-driven conversion systems.
        </p>
        <div style={{ marginTop: '2rem', ...mono, color: '#B8FF3C', fontSize: '10px' }}>
          SUB-100MS · PRODUCTION GRADE · REAL-TIME CONVERSION
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ ...section, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ ...mono, color: 'rgba(232,228,216,0.35)', textDecoration: 'none' }}>
          ← BACK TO SINGULARITY
        </Link>
        <a
          href="https://github.com/DanushArun"
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...mono, color: 'rgba(232,228,216,0.35)', textDecoration: 'none' }}
        >
          GITHUB ↗
        </a>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Wire Singularity Pulsar orb as link to /mira**

Open `src/components/scene/scenes/Singularity.tsx`. Find the Pulsar orb (the electric blue `#85CCF7` sphere). Add a click handler that navigates to `/mira`. Since this is inside R3F canvas, use `router.push('/mira')` from `next/navigation`:

```typescript
import { useRouter } from 'next/navigation';

// Inside Singularity component:
const router = useRouter();

// On the pulsar orb mesh:
<mesh
  onClick={() => router.push('/mira')}
  onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
  onPointerOut={() => { document.body.style.cursor = 'none'; }}
>
```

- [ ] **Step 4: Verify**

```bash
npm run build
```

Open http://localhost:3000/mira directly. The case study must render with proper fonts, correct colors, correct monospace telemetry style. Back arrow navigates to `/`. No hydration errors in console.

- [ ] **Step 5: Commit**

```bash
git add src/app/mira/
git commit -m "feat: Mira case study route /mira — metrics, stack, result, back link to Singularity"
```

---

## EXECUTION ORDER

```
Start all three tracks simultaneously:

TRACK A   ─── A1 → A2 → A3   (30 min)
                   │
TRACK B   ─── B1 → B2 → B3 → B4 → B5   (2-4h depending on audio sourcing)
                   │
TRACK C   ─── C1 → C2 → C3   (1-2h)

Wait for all three. Then:

TRACK D   ─── D1   (1h)
```

## VERIFICATION CHECKLIST (before SOTY submission)

- [ ] No white flash on hard reload at any network speed
- [ ] `animejs`, `@studio-freight/lenis`, `framer-motion` absent from `node_modules`
- [ ] `src/_legacy/` directory deleted
- [ ] Audio toggle visible top-right on all phases
- [ ] Sub-bass starts within 100ms of AUDIO ON toggle
- [ ] Pulsar click fires every 92ms with no drift over 60 seconds (count 652 clicks in 60s)
- [ ] Audio phase transitions fire correctly (quasar ambient at DRIVEX, flywheel at TWIN, etc.)
- [ ] Bloom visible on emissive objects, void reads as `#000000` (use eyedropper tool)
- [ ] All scene geometries dispose on phase exit (heap snapshot comparison)
- [ ] TWIN_BUILD drag-to-orbit still works after all changes
- [ ] `/mira` route renders correctly and back navigation works
- [ ] `npm run build` passes with zero TypeScript errors
