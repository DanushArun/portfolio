// Job 003.5 — BH camera continuity regression.
//
// Asserts the viewer FALLS INTO the dark center across C03 → C04.
// Prior bug: the R3F Canvas mounted at C05_WARP with an idle camera at
// (0,0,30) while the BH canvas was at (0,0,-2). The crossfade read as
// the camera retreating outward — the founder saw the BH "shrink".
//
// Primary invariant (founder feedback: "BH becomes smaller" == retreat):
//   - BH camera length-from-origin is monotonically non-increasing while we
//     are OUTSIDE the event horizon (camera.z > -2).
//   - Once z <= -2 the camera is inside the wormhole tunnel; length grows
//     along -z as the fall continues, which is correct.
//
// We read window.__bhCameraPos (published each frame by BlackHoleMount in
// non-production builds) at three scroll positions spanning the approach.

import { test, expect } from '@playwright/test';

type Vec3 = { x: number; y: number; z: number };

declare global {
  interface Window {
    __setJourneyProgress?: (p: number) => void;
    __bhCameraPos?: Vec3;
  }
}

// p=0.16 mid-C03 STRETCH, p=0.22 C03/C04 boundary, p=0.26 mid-C04 HORIZON.
const SAMPLES = [0.16, 0.22, 0.26];
const SETTLE_MS = 800;

async function readCam(page: import('@playwright/test').Page, p: number): Promise<Vec3> {
  await page.evaluate((prog) => window.__setJourneyProgress?.(prog), p);
  await page.waitForTimeout(SETTLE_MS);
  // Two frames so the BH animate loop has published the latest position.
  const pos = await page.evaluate(() => new Promise<Vec3 | undefined>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve(window.__bhCameraPos));
    });
  }));
  expect(pos, `__bhCameraPos missing at progress=${p}`).toBeDefined();
  return pos as Vec3;
}

test('BH camera falls INTO the void across C03→C04 (no retreat)', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1500);

  const samples: Vec3[] = [];
  for (const p of SAMPLES) {
    samples.push(await readCam(page, p));
  }

  const lens = samples.map((s) => Math.hypot(s.x, s.y, s.z));
  // Diagnostic: log so a regression in the camera math is auditable.
  for (let i = 0; i < samples.length; i++) {
    test.info().annotations.push({
      type: 'sample',
      description:
        `p=${SAMPLES[i]} pos=(${samples[i].x.toFixed(2)}, ${samples[i].y.toFixed(2)}, ` +
        `${samples[i].z.toFixed(2)}) len=${lens[i].toFixed(3)}`,
    });
  }

  // Primary invariant: length-from-origin never grows while still outside the
  // event horizon. This is the precise inverse of "the BH becomes smaller".
  // Small slack (0.05) absorbs sub-frame jitter from autoRotate without
  // masking the 25+ unit jump that the bug produced.
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].z > -2) {
      expect(
        lens[i],
        `length grew from ${lens[i - 1].toFixed(3)} to ${lens[i].toFixed(3)} ` +
        `between p=${SAMPLES[i - 1]} and p=${SAMPLES[i]} — viewer retreated ` +
        `from the BH (z=${samples[i].z.toFixed(3)}).`,
      ).toBeLessThanOrEqual(lens[i - 1] + 0.05);
    }
  }

  // Secondary: once we're past the event horizon, z must keep decreasing
  // (forward fall down the tunnel). Bug regression would put us back at
  // z = 30 (R3F idle pose) — this guard catches that explicitly.
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1].z <= -2) {
      expect(
        samples[i].z,
        `z jumped from ${samples[i - 1].z.toFixed(3)} (inside tunnel) to ` +
        `${samples[i].z.toFixed(3)} — camera teleported outward.`,
      ).toBeLessThanOrEqual(samples[i - 1].z + 1e-3);
    }
  }

  // Sanity: at the deepest sample we must be measurably closer to the BH
  // than at the start — otherwise we're not falling in at all.
  expect(
    lens[lens.length - 1],
    `final length ${lens[lens.length - 1].toFixed(3)} is not less than ` +
    `start ${lens[0].toFixed(3)} — viewer never fell into the BH.`,
  ).toBeLessThan(lens[0]);
});
