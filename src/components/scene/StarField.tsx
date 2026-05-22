'use client';

import { useState, useEffect } from 'react';
import * as THREE from 'three';

/**
 * StarField — persistent background point cloud for the R3F canvas.
 *
 * Mounted from CROSSING onward so the wormhole reveal beat hands off to a
 * standing starfield instead of fading into pure black void. Without this,
 * the cosmic scenes (QuantumPlanet etc.) have no ambient sky behind them.
 *
 * 6000 points distributed on a r=600 sphere shell. Far enough that the
 * camera traversal (lookZ 0..-540) never clips through.
 */
const COUNT = 6000;

export default function StarField() {
  const [{ geo, mat }] = useState(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 600;
      pos[i * 3]     = Math.cos(theta) * Math.sin(phi) * r;
      pos[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * r;
      pos[i * 3 + 2] = Math.cos(phi) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    // Manual bounding sphere — tight to actual radius so frustum culling
    // doesn't drop the whole cloud when camera looks parallel to a tangent.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 700);

    // Plain PointsMaterial keeps the implementation tight. Size is in world
    // units with sizeAttenuation so distant stars look small.
    const m = new THREE.PointsMaterial({
      size:            1.5,
      sizeAttenuation: true,
      color:           0xeaf2ff,
      transparent:     true,
      opacity:         0.85,
      depthWrite:      false,
    });
    return { geo: g, mat: m };
  });

  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={-1} />;
}
