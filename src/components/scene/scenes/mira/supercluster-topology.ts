import { KNOT_TABLE, type MiraLang } from '@/lib/mira-state';
import { WORLD_SCALE, type Vec3 } from './buffers';

export interface TopologyHub {
  readonly lang: MiraLang;
  readonly position: Vec3;
  readonly radius: number;
}

export interface TopologyCorridor {
  readonly from: MiraLang;
  readonly to: MiraLang;
  readonly bow: Vec3;
  readonly weight: number;
}

export interface TopologyLoopSegment {
  readonly from: MiraLang;
  readonly a: Vec3;
  readonly b: Vec3;
  readonly bow: Vec3;
  readonly weight: number;
}

export interface TerminalBranch {
  readonly from: MiraLang;
  readonly angle: number;
  readonly length: number;
  readonly split: number;
}

const TAU = Math.PI * 2;

export const TOPOLOGY_HUBS: readonly TopologyHub[] = KNOT_TABLE.map((knot) => ({
  lang: knot.lang,
  position: [
    knot.position[0] * WORLD_SCALE,
    knot.position[1] * WORLD_SCALE,
    knot.position[2] * WORLD_SCALE,
  ],
  radius: 0.54 * knot.relativeScale,
}));

export const PRIMARY_CORRIDORS: readonly TopologyCorridor[] = [
  { from: 'EN', to: 'HI', weight: 1.22, bow: [0.28, 1.28, -0.22] },
  { from: 'EN', to: 'TA', weight: 0.98, bow: [-0.88, -0.18, 0.16] },
  { from: 'EN', to: 'TE', weight: 0.72, bow: [-0.12, -1.18, 0.44] },
  { from: 'TA', to: 'HI', weight: 0.86, bow: [0.18, -0.22, -0.40] },
  { from: 'TA', to: 'TE', weight: 1.06, bow: [-0.12, -0.94, 0.26] },
  { from: 'HI', to: 'KN', weight: 1.30, bow: [1.22, 0.18, -0.08] },
  { from: 'HI', to: 'TE', weight: 0.82, bow: [0.54, -0.88, 0.34] },
  { from: 'TE', to: 'KN', weight: 1.10, bow: [0.82, -0.18, -0.20] },
];

export const TERMINAL_BRANCHES: readonly TerminalBranch[] = makeTerminalBranches();
export const HI_LOOP_SEGMENTS: readonly TopologyLoopSegment[] = makeHiLoopSegments();

export function getTopologyHub(lang: MiraLang): TopologyHub {
  const hub = TOPOLOGY_HUBS.find((item) => item.lang === lang);
  if (!hub) throw new Error(`Missing topology hub ${lang}`);
  return hub;
}

function makeTerminalBranches(): readonly TerminalBranch[] {
  const angles: Record<MiraLang, readonly number[]> = {
    EN: [0.58, 0.72, 0.86, 1.02, 1.20, 1.38, 1.58, 1.78, 2.02, 2.28, 2.54],
    HI: [0.18, 0.34, 0.52, 0.72, 0.92, 1.14, 1.36, 1.58, 1.82, 2.06, 2.30],
    TA: [2.70, 2.94, 3.18, 3.42, 3.66, 3.90, 4.16, 4.42, 4.70, 5.00, 5.28],
    KN: [4.88, 5.10, 5.34, 5.58, 5.84, 6.08, 0.12, 0.34, 0.58, 0.82, 1.06],
    TE: [3.62, 3.88, 4.14, 4.40, 4.66, 4.92, 5.18, 5.44, 5.70, 5.96, 0.10],
  };
  return Object.entries(angles).flatMap(([lang, values]) => (
    values.map((angle, index) => ({
      from: lang as MiraLang,
      angle,
      length: 1.16 + (index % 4) * 0.32,
      split: 0.52 + (index % 3) * 0.12,
    }))
  ));
}

function makeHiLoopSegments(): readonly TopologyLoopSegment[] {
  const hub = getTopologyHub('HI');
  return Array.from({ length: 32 }, (_, index) => loopSegment(hub.position, index));
}

function loopSegment(center: Vec3, index: number): TopologyLoopSegment {
  const start = 0.08 + (index / 32) * TAU;
  const end = 0.08 + ((index + 1) / 32) * TAU;
  const a = loopPoint(center, start);
  const b = loopPoint(center, end);
  return {
    from: 'HI',
    a,
    b,
    bow: [0.18 * Math.cos(start), 0.38 * Math.sin(start), 0.08],
    weight: 1.12,
  };
}

function loopPoint(center: Vec3, angle: number): Vec3 {
  return [
    center[0] + 3.18 + Math.cos(angle) * 2.20,
    center[1] + 0.42 + Math.sin(angle) * 0.96,
    center[2] + Math.sin(angle * 1.4) * 0.20,
  ];
}
