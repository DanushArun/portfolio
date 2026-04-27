'use client';

import { useEffect, useRef } from 'react';
import { useScene, type ScenePhase } from '@/lib/scene-state';
import { audioEngine } from '@/lib/audio';
import { audioUrl } from '@/lib/audio-files';

/**
 * useAudio — phase-driven audio state machine.
 *
 * Mount once in SceneManager. Does nothing until audioEngine.enable()
 * is called (requires user gesture per browser policy).
 *
 * Each phase transition fires its audio cue. horizonProgress drives
 * the continuous doppler shimmer during APPROACH and CROSSING.
 */
export function useAudio(): void {
  const phase           = useScene((s) => s.phase);
  const horizonProgress = useScene((s) => s.horizonProgress);
  const prevPhase       = useRef<ScenePhase | null>(null);

  // Continuous: doppler shimmer tracks horizonProgress during approach
  useEffect(() => {
    if (phase !== 'APPROACH' && phase !== 'CROSSING') return;
    audioEngine.setDopplerShimmer(horizonProgress);
  }, [horizonProgress, phase]);

  // Phase transitions
  useEffect(() => {
    if (prevPhase.current === phase) return;
    const prev = prevPhase.current;
    prevPhase.current = phase;

    switch (phase) {
      case 'COVER':
        audioEngine.startSubBass();
        break;

      case 'APPROACH':
        break;

      case 'CROSSING':
        audioEngine.pitchDownSubBass();
        setTimeout(() => audioEngine.silenceSubBass(), 1600);
        setTimeout(() => {
          const url = audioUrl('descent-piano');
          if (url) audioEngine.playOneShot(url, 0.8);
        }, 2600);
        break;

      case 'BOSON_STAR': {
        // Crystal-glass texture for the Quantum Lab scene.
        // Stops any leftover post-CROSSING piano residue.
        const url = audioUrl('crystal-glass');
        if (url) {
          audioEngine.startTrack('crystal-glass', url, true, 0);
          setTimeout(() => audioEngine.setTrackGain('crystal-glass', 0.6, 3.0), 100);
        }
        break;
      }

      case 'STRANGEON':
        audioEngine.stopTrack('crystal-glass', 1.0);
        audioEngine.setDopplerShimmer(0);
        audioEngine.startPulsarScheduler();
        break;

      case 'BINARY_MERGER': {
        const leftUrl  = audioUrl('quasar-left');
        const rightUrl = audioUrl('quasar-right');
        if (leftUrl)  audioEngine.startTrack('quasar-left',  leftUrl,  true, 0.7);
        if (rightUrl) audioEngine.startTrack('quasar-right', rightUrl, true, 0.7);
        break;
      }

      case 'EINSTEIN_CROSS': {
        audioEngine.stopTrack('quasar-left',  1.0);
        audioEngine.stopTrack('quasar-right', 1.0);
        const url = audioUrl('twin-flywheel');
        if (url) audioEngine.startTrack('twin-flywheel', url, true, 0.8);
        break;
      }

      case 'HAUMEA': {
        audioEngine.stopTrack('twin-flywheel', 0.8);
        const url = audioUrl('rings-strings');
        if (url) audioEngine.startTrack('rings-strings', url, false, 1.0);
        break;
      }

      case 'MANIFEST':
        audioEngine.stopTrack('rings-strings', 0.6);
        break;

      case 'CYGNUS_LOOP':
        audioEngine.silenceAll();
        setTimeout(() => {
          const pianoUrl = audioUrl('descent-piano');
          if (pianoUrl) audioEngine.playOneShot(pianoUrl, 0.4);
        }, 5500);
        setTimeout(() => {
          const organUrl = audioUrl('singularity-organ');
          if (organUrl) audioEngine.startTrack('singularity-organ', organUrl, false, 1.0);
        }, 10000);
        break;
    }

    void prev;
  }, [phase]);
}

/**
 * usePulsarScrollSync — mount inside HAUMEA (Formula Manipal rings)
 * to sync pulsar click volume with scroll velocity (EV motor rhythm = pulsar beat).
 */
export function usePulsarScrollSync(): void {
  useEffect(() => {
    const unsubscribe = useScene.subscribe((s) => {
      if (s.phase !== 'HAUMEA') return;
      const normalised = Math.min(Math.abs(s.scrollVelocity) / 80, 1);
      audioEngine.setPulsarGain(0.12 + normalised * 0.32);
    });
    return unsubscribe;
  }, []);
}
