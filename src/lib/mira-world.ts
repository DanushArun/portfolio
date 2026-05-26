import { KNOT_TABLE, type MiraFocusId, type MiraLang } from './mira-state';

export type MiraVec3 = readonly [number, number, number];

export type MiraWorldKind =
  | 'language'
  | 'asr'
  | 'router'
  | 'memory'
  | 'tools'
  | 'crm'
  | 'whatsapp'
  | 'learning';

export interface MiraWorldNode {
  readonly id: Exclude<MiraFocusId, 'OVERVIEW'>;
  readonly kind: MiraWorldKind;
  readonly position: MiraVec3;
  readonly color: string;
  readonly scale: number;
}

export interface MiraWorldEdge {
  readonly from: Exclude<MiraFocusId, 'OVERVIEW'>;
  readonly to: Exclude<MiraFocusId, 'OVERVIEW'>;
  readonly bow: MiraVec3;
  readonly color: string;
  readonly energy: number;
}

export interface MiraCameraStop {
  readonly position: MiraVec3;
  readonly lookAt: MiraVec3;
  readonly fov: number;
}

const WORLD_SCALE = 2.35;
const DEFAULT_STOP: MiraCameraStop = {
  position: [0, 0, 16.2],
  lookAt: [0, 0, 0],
  fov: 46,
};

function scaleKnotPosition(position: readonly [number, number, number]): MiraVec3 {
  return [position[0] * WORLD_SCALE, position[1] * WORLD_SCALE, position[2] * WORLD_SCALE];
}

function languageNode(lang: MiraLang): MiraWorldNode {
  const knot = KNOT_TABLE.find((item) => item.lang === lang);
  if (!knot) throw new Error(`Missing MIRA knot for ${lang}`);
  return {
    id: lang,
    kind: 'language',
    position: scaleKnotPosition(knot.position),
    color: knot.hue,
    scale: knot.relativeScale,
  };
}

export const MIRA_WORLD_NODES: readonly MiraWorldNode[] = [
  languageNode('EN'),
  languageNode('HI'),
  languageNode('TA'),
  languageNode('KN'),
  languageNode('TE'),
  { id: 'ASR', kind: 'asr', position: [-2.95, 2.18, 1.60], color: '#7bdcff', scale: 1.00 },
  { id: 'ROUTER', kind: 'router', position: [-0.10, 0.24, 1.16], color: '#d8b5ff', scale: 1.12 },
  { id: 'MEMORY', kind: 'memory', position: [-1.12, -0.92, 1.82], color: '#9fb7ff', scale: 0.92 },
  { id: 'TOOLS', kind: 'tools', position: [1.18, -0.44, 1.34], color: '#ffd36a', scale: 0.88 },
  { id: 'CRM', kind: 'crm', position: [3.22, 0.58, 0.34], color: '#7dff9a', scale: 0.82 },
  {
    id: 'WHATSAPP',
    kind: 'whatsapp',
    position: [3.34, -1.36, 0.74],
    color: '#b6ff34',
    scale: 0.82,
  },
  {
    id: 'LEARNING',
    kind: 'learning',
    position: [0.72, -2.52, 1.62],
    color: '#ffd15c',
    scale: 0.96,
  },
] as const;

export const MIRA_WORLD_EDGES: readonly MiraWorldEdge[] = [
  { from: 'EN', to: 'ASR', bow: [-0.18, 0.54, 0.42], color: '#ffbd62', energy: 1.22 },
  { from: 'HI', to: 'ASR', bow: [0.34, 0.72, 0.56], color: '#f8c76a', energy: 0.84 },
  { from: 'TA', to: 'ASR', bow: [-0.40, -0.26, 0.52], color: '#b879ff', energy: 0.78 },
  { from: 'KN', to: 'ASR', bow: [0.72, -0.16, 0.36], color: '#e08bff', energy: 0.72 },
  { from: 'TE', to: 'ASR', bow: [0.10, -0.62, 0.62], color: '#58b9ff', energy: 0.78 },
  { from: 'ASR', to: 'ROUTER', bow: [-0.22, 0.36, 0.60], color: '#80e2ff', energy: 1.16 },
  { from: 'ROUTER', to: 'MEMORY', bow: [-0.46, -0.36, 0.52], color: '#9fb7ff', energy: 0.90 },
  { from: 'ROUTER', to: 'TOOLS', bow: [0.48, -0.18, 0.44], color: '#d8b5ff', energy: 1.04 },
  { from: 'TOOLS', to: 'CRM', bow: [0.44, 0.42, 0.26], color: '#7dff9a', energy: 0.86 },
  { from: 'TOOLS', to: 'WHATSAPP', bow: [0.70, -0.34, 0.34], color: '#b6ff34', energy: 0.94 },
  { from: 'CRM', to: 'LEARNING', bow: [0.02, -0.94, 0.58], color: '#ffd15c', energy: 1.02 },
  { from: 'WHATSAPP', to: 'LEARNING', bow: [0.10, -0.58, 0.70], color: '#ffe08a', energy: 1.10 },
  { from: 'LEARNING', to: 'EN', bow: [-1.20, 0.20, 0.82], color: '#ffbd62', energy: 1.28 },
] as const;

export function getMiraWorldNode(id: Exclude<MiraFocusId, 'OVERVIEW'>): MiraWorldNode {
  const node = MIRA_WORLD_NODES.find((item) => item.id === id);
  if (!node) throw new Error(`Missing MIRA world node ${id}`);
  return node;
}

export function getMiraCameraStop(id: MiraFocusId): MiraCameraStop {
  if (id === 'OVERVIEW') return DEFAULT_STOP;
  const node = getMiraWorldNode(id);
  const [x, y, z] = node.position;
  return {
    position: [x * 0.74, y * 0.74, 6.2 + z * 0.36],
    lookAt: node.position,
    fov: node.kind === 'language' ? 38 : 34,
  };
}
