/**
 * AudioEngine — singleton Web Audio API controller.
 *
 * All sound generation and scheduling lives here. React hooks consume
 * this singleton; no Web Audio API calls exist elsewhere.
 *
 * AudioContext is lazy — created on first call to enable() (browser
 * requires a user gesture before AudioContext can run).
 */

const BEAT_INTERVAL = 0.092; // 92ms pulsar metronome

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
  source: AudioBufferSourceNode;
  gain: GainNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private tracks = new Map<TrackId, Track>();
  private pulsarTimer: ReturnType<typeof setTimeout> | null = null;
  private nextBeatTime = 0;
  private pulsarClickBuffer: AudioBuffer | null = null;
  private pulsarOutputGain: GainNode | null = null;
  private enabled = false;
  private bufferCache = new Map<string, AudioBuffer>();

  // Procedural oscillator refs
  private subBassOsc: OscillatorNode | null = null;
  private subBassGain: GainNode | null = null;
  private dopplerOsc: OscillatorNode | null = null;
  private dopplerGain: GainNode | null = null;

  // ── Lifecycle ────────────────────────────────────────────────────────────

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
    this.ctx?.suspend();
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  // ── Sub-bass ─────────────────────────────────────────────────────────────

  startSubBass(): void {
    if (!this.ctx || !this.master || this.subBassOsc) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 28;

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

    this.subBassOsc = osc;
    this.subBassGain = gain;
  }

  pitchDownSubBass(): void {
    if (!this.subBassOsc || !this.ctx) return;
    // 2 semitones down: 28Hz × 2^(-2/12) ≈ 24.95Hz
    this.subBassOsc.frequency.linearRampToValueAtTime(24.95, this.ctx.currentTime + 1.6);
  }

  silenceSubBass(): void {
    if (!this.subBassGain || !this.ctx) return;
    this.subBassGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.001);
    setTimeout(() => {
      try { this.subBassOsc?.stop(); } catch { /* already stopped */ }
      this.subBassOsc = null;
      this.subBassGain = null;
    }, 200);
  }

  // ── Doppler shimmer ──────────────────────────────────────────────────────

  setDopplerShimmer(horizonProgress: number): void {
    if (!this.ctx || !this.master) return;

    if (!this.dopplerOsc) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 8000;

      const gain = this.ctx.createGain();
      gain.gain.value = 0;

      osc.connect(gain);
      gain.connect(this.master);
      osc.start();

      this.dopplerOsc = osc;
      this.dopplerGain = gain;
    }

    this.dopplerGain!.gain.setTargetAtTime(horizonProgress * 0.12, this.ctx.currentTime, 0.1);
  }

  // ── Pulsar metronome ─────────────────────────────────────────────────────

  private buildPulsarClickBuffer(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const frames = Math.floor(sampleRate * 0.040);
    const buffer = this.ctx.createBuffer(1, frames, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t / 0.008);
    }

    this.pulsarClickBuffer = buffer;
  }

  startPulsarScheduler(): void {
    if (!this.ctx || !this.pulsarClickBuffer) return;

    // Create a dedicated output gain for the pulsar bus
    if (!this.pulsarOutputGain) {
      this.pulsarOutputGain = this.ctx.createGain();
      this.pulsarOutputGain.gain.value = 0.5;
      this.pulsarOutputGain.connect(this.master!);
    }

    this.nextBeatTime = this.ctx.currentTime;
    this.schedulePulsarLoop();
  }

  private schedulePulsarLoop(): void {
    if (!this.ctx || !this.pulsarClickBuffer || !this.enabled) return;

    const scheduleAheadTime = 0.1;

    while (this.nextBeatTime < this.ctx.currentTime + scheduleAheadTime) {
      this.firePulsarClick(this.nextBeatTime);
      this.nextBeatTime += BEAT_INTERVAL;
    }

    this.pulsarTimer = setTimeout(() => this.schedulePulsarLoop(), 25);
  }

  private firePulsarClick(time: number): void {
    if (!this.ctx || !this.pulsarClickBuffer || !this.pulsarOutputGain) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.pulsarClickBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    source.connect(filter);
    filter.connect(this.pulsarOutputGain);
    source.start(time);
  }

  stopPulsarScheduler(): void {
    if (this.pulsarTimer) clearTimeout(this.pulsarTimer);
    this.pulsarTimer = null;
  }

  setPulsarGain(targetGain: number): void {
    if (!this.ctx || !this.pulsarOutputGain) return;
    this.pulsarOutputGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
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
    if (!this.ctx || !this.master || this.tracks.has(id)) return;

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
      // Audio file missing — fail silently
    }
  }

  stopTrack(id: TrackId, fadeTime = 1.0): void {
    const track = this.tracks.get(id);
    if (!track || !this.ctx) return;

    track.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeTime);
    setTimeout(() => {
      try { track.source.stop(); } catch { /* already stopped */ }
      this.tracks.delete(id);
    }, (fadeTime + 0.1) * 1000);
  }

  setTrackGain(id: TrackId, targetGain: number, rampTime = 0.3): void {
    const track = this.tracks.get(id);
    if (!track || !this.ctx) return;
    track.gain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + rampTime);
  }

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
