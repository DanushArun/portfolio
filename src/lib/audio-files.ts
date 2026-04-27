/**
 * Audio file manifest — all sampled sounds used in the experience.
 *
 * Files live in public/audio/. Each entry has a primary WebM path and
 * an OGG fallback. The engine picks WebM where supported.
 *
 * Files marked generated:'procedural' are synthesized in audio.ts
 * and need no audio file on disk.
 *
 * Files marked generated:'required' need real audio assets.
 * See AUDIO_SPEC for AI generation prompts.
 */

type ProceduralEntry = { generated: 'procedural' };
type FileEntry = { webm: string; ogg: string; generated: 'required' };

export const AUDIO_FILES = {
  'sub-bass':        { generated: 'procedural' } as ProceduralEntry,
  'doppler-shimmer': { generated: 'procedural' } as ProceduralEntry,
  'pulsar-click':    { generated: 'procedural' } as ProceduralEntry,

  'descent-piano':     { webm: '/audio/descent-piano.webm',     ogg: '/audio/descent-piano.ogg',     generated: 'required' } as FileEntry,
  'quasar-left':       { webm: '/audio/quasar-left.webm',       ogg: '/audio/quasar-left.ogg',       generated: 'required' } as FileEntry,
  'quasar-right':      { webm: '/audio/quasar-right.webm',      ogg: '/audio/quasar-right.ogg',      generated: 'required' } as FileEntry,
  'twin-flywheel':     { webm: '/audio/twin-flywheel.webm',     ogg: '/audio/twin-flywheel.ogg',     generated: 'required' } as FileEntry,
  'rings-strings':     { webm: '/audio/rings-strings.webm',     ogg: '/audio/rings-strings.ogg',     generated: 'required' } as FileEntry,
  'crystal-glass':     { webm: '/audio/crystal-glass.webm',     ogg: '/audio/crystal-glass.ogg',     generated: 'required' } as FileEntry,
  'singularity-organ': { webm: '/audio/singularity-organ.webm', ogg: '/audio/singularity-organ.ogg', generated: 'required' } as FileEntry,
} as const;

/**
 * AUDIO_SPEC — prompts for AI audio generation tools (ElevenLabs Sound FX, Suno, Udio).
 * Target: -14 LUFS, normalize to peak -1dBFS, export as WebM + OGG.
 */
export const AUDIO_SPEC: Record<string, string> = {
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
};

/** Pick the best supported format at runtime. Returns null for procedural sounds. */
export function audioUrl(id: keyof typeof AUDIO_FILES): string | null {
  const entry = AUDIO_FILES[id];
  if (!('webm' in entry)) return null;

  const supportsWebM =
    typeof document !== 'undefined' &&
    document.createElement('audio').canPlayType('audio/webm') !== '';

  return supportsWebM ? entry.webm : entry.ogg;
}
