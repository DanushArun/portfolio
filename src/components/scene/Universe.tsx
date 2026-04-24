'use client';

import { Stars } from '@react-three/drei';
import Pulsar from './bodies/Pulsar';
import BinaryMagnetar from './bodies/BinaryMagnetar';
import RingedGiant from './bodies/RingedGiant';
import QuasarPair from './bodies/QuasarPair';
import RacingPlanet from './bodies/RacingPlanet';
import Assembly from './Assembly';
import UniverseDust from './UniverseDust';
import DeepNebula from './DeepNebula';
import BodyInteractions from './BodyInteractions';
import { useScene } from '@/lib/scene-state';

/**
 * Universe — the free-exploration phase scene.
 *
 * Fraser-grade treatment:
 *   - Compositional depth across Z: bodies stretch from -12 to +18 so camera
 *     translation produces real parallax (was previously clustered near origin).
 *   - Directional key + fill: warm 5500K key from [40,30,-20] and cool 9000K
 *     fill from [-30,10,15]. Ambient dropped to a deep-blue trace.
 *   - Atmospheric background via DeepNebula (skybox + parallaxing gas planes).
 *   - Foreground particulate via UniverseDust (3 parallax layers).
 *   - Physical interactions via BodyInteractions (sweep light, beams, shock).
 *
 * Each body orbits the scene origin on its own radius/speed, treating the
 * scene as a solar system where the user is floating at centre.
 */
export default function Universe() {
  const phase = useScene((s) => s.phase);

  return (
    <>
      {/* Background starfield — richer, deeper than the default */}
      <Stars radius={400} depth={120} count={12000} factor={5} fade speed={0.4} />

      {/* Atmospheric ambient — deep blue trace, almost black */}
      <ambientLight intensity={0.02} color="#0F1623" />

      {/* KEY: warm 5500K directional from upper-right-front.
          This is the "off-camera sun" that rim-lights every body. */}
      <directionalLight
        position={[40, 30, -20]}
        color="#FFF2D5"
        intensity={1.2}
        castShadow={false}
      />

      {/* FILL: cool 9000K directional from lower-left-back. Creates the
          classic Fraser warm/cool split on spherical subjects. */}
      <directionalLight
        position={[-30, 10, 15]}
        color="#3A5C8A"
        intensity={0.35}
        castShadow={false}
      />

      {/* Deep background — must render first (skybox inverted sphere
          should sit behind everything else). */}
      <DeepNebula />

      {/* Bodies spread across Z: -12 to +18 for parallax depth.
          Each orbits scene origin at its own radius/speed. */}
      <Pulsar
        position={[14, 2, -8]}
        orbit={{ radius: 16, speed: 0.08, phase: 0 }}
        receiveRim
      />
      <BinaryMagnetar
        position={[-16, 4, -12]}
        orbit={{ radius: 20, speed: 0.05, phase: 1.2 }}
        receiveRim
      />
      <RingedGiant
        position={[22, -2, 4]}
        orbit={{ radius: 22, speed: 0.04, phase: 2.5 }}
        receiveRim
      />
      <QuasarPair
        position={[-10, -5, 10]}
        orbit={{ radius: 14, speed: 0.06, phase: 3.4 }}
        receiveRim
      />
      <RacingPlanet
        position={[6, 5, 18]}
        orbit={{ radius: 19, speed: 0.07, phase: 4.1 }}
        receiveRim
      />

      {/* Atmospheric dust — three parallax layers */}
      <UniverseDust />

      {/* Cross-body physical interactions — spotlight sweeps, beams, shocks */}
      <BodyInteractions />

      {(phase === 'ASSEMBLY' || phase === 'FINAL') && <Assembly />}
    </>
  );
}
