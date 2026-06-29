import { panelCopy } from './copy';
import type { ScenePhase, WorkPhase } from './scene-state';
import { workPanelDetails } from './work-panel-data';

export type PortfolioChapterId =
  | 'MIRA'
  | 'AIDEN'
  | 'VANGUARD'
  | 'INSPECTION'
  | 'WAVEFIELD'
  | 'EMI'
  | 'FORMULA';

export type PortfolioProjectPhase = Exclude<WorkPhase, 'W08_ABOUT' | 'W09_CONNECT'>;
export type PortfolioVec3 = readonly [number, number, number];

export interface PortfolioBookNode {
  readonly anchor: PortfolioVec3;
  readonly color: string;
  readonly labelPosition: { readonly left: string; readonly top: string };
  readonly radius: number;
}

export interface PortfolioBeat {
  readonly id: string;
  readonly title: string;
  readonly question: string;
  readonly metric: string;
  readonly proof: string;
  readonly stack: readonly string[];
  readonly orbit: number;
  readonly lift: number;
  readonly distance: number;
  readonly fov: number;
}

export interface PortfolioChapter {
  readonly id: PortfolioChapterId;
  readonly phase: PortfolioProjectPhase;
  readonly number: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly body: string;
  readonly role: string;
  readonly trail: readonly string[];
  readonly node: PortfolioBookNode;
  readonly beats: readonly PortfolioBeat[];
}

export interface PortfolioBookSnapshot {
  readonly beat: PortfolioBeat;
  readonly beatIndex: number;
  readonly beatProgress: number;
  readonly chapter: PortfolioChapter;
  readonly chapterIndex: number;
  readonly completedBeats: readonly string[];
  readonly localProgress: number;
  readonly routeProgress: number;
}

const PROJECT_PHASES = [
  'W01_MIRA',
  'W02_AIDEN',
  'W03_VANGUARD',
  'W04_INSPECTION',
  'W05_WAVEFIELD',
  'W06_EMI',
  'W07_FORMULA',
] as const satisfies readonly PortfolioProjectPhase[];

function beat(
  id: string,
  title: string,
  question: string,
  metric: string,
  proof: string,
  camera: Pick<PortfolioBeat, 'distance' | 'fov' | 'lift' | 'orbit'>,
  stack: readonly string[],
): PortfolioBeat {
  return { id, title, question, metric, proof, stack, ...camera };
}

function camera(
  orbit: number,
  lift: number,
  distance: number,
  fov: number,
): Pick<PortfolioBeat, 'distance' | 'fov' | 'lift' | 'orbit'> {
  return { distance, fov, lift, orbit };
}

function chapter(config: {
  readonly id: PortfolioChapterId;
  readonly phase: PortfolioProjectPhase;
  readonly node: PortfolioBookNode;
  readonly beats: readonly PortfolioBeat[];
}): PortfolioChapter {
  const copy = panelCopy[config.phase];
  const detail = workPanelDetails[config.phase];
  return {
    id: config.id,
    phase: config.phase,
    number: copy.number,
    eyebrow: copy.eyebrow,
    title: copy.title,
    lead: detail.lead,
    body: copy.body,
    role: detail.role,
    trail: copy.trail,
    node: config.node,
    beats: config.beats,
  };
}

export const PORTFOLIO_CHAPTERS: readonly PortfolioChapter[] = [
  chapter({
    id: 'MIRA',
    phase: 'W01_MIRA',
    node: {
      anchor: [-0.45, 0.08, 1.35],
      color: '#ffe2a6',
      labelPosition: { left: '62%', top: '48%' },
      radius: 3.2,
    },
    beats: [
      beat('shipped', 'Production system', 'Did this ship?', 'Production voice agent',
        'Production outbound voice AI for sales-call conversion.',
        camera(0.20, 0.72, 6.2, 39), ['FastAPI', 'Kubernetes']),
      beat('latency', 'Latency collapse', 'Did it improve?', '7s -> 482ms',
        'First response fell from a seven second delay to sub-second response.',
        camera(0.78, 0.35, 5.2, 34), ['Pipecat', 'Redis']),
      beat('languages', 'Language intelligence', 'Could it work across users?', '5 languages',
        'English, Hindi, Tamil, Kannada and Telugu are handled in one flow.',
        camera(1.42, 0.95, 6.6, 37), ['ASR', 'NLU']),
      beat('voice', 'Realtime voice intake', 'What was technically hard?', 'speech pipeline',
        'VAD, streaming ASR, telephony WebSockets and native-audio LLM response.',
        camera(2.05, 0.20, 5.5, 34), ['VAD', 'WebSockets']),
      beat('orchestration', 'Orchestration core', 'Was this systems architecture?', 'multi-model',
        'Distributed call orchestration controls response timing and model handoff.',
        camera(2.68, 0.62, 5.0, 33), ['LLM', 'FastAPI']),
      beat('post-call', 'Post-call intelligence', 'Did it produce business data?', 'intent data',
        'Post-call classification returns intent, confidence and ISO 8601 dates.',
        camera(3.31, -0.05, 5.4, 34), ['PostgreSQL', 'JSON']),
      beat('ops', 'Ops automation loop', 'Did it connect to operations?', 'CRM + WhatsApp',
        'Zoho sync, WhatsApp groups, reminders and seller retry logic are automated.',
        camera(3.94, 0.46, 5.8, 35), ['Zoho', 'WhatsApp']),
      beat('ownership', 'End-to-end ownership', 'Was this fully owned?', 'repo -> Kubernetes',
        'Owned architecture, implementation, testing and Kubernetes deployment.',
        camera(4.57, 0.78, 6.0, 38), ['Testing', 'Kubernetes']),
    ],
  }),
  chapter({
    id: 'AIDEN',
    phase: 'W02_AIDEN',
    node: {
      anchor: [7.1, 2.8, -0.65],
      color: '#8ee7ff',
      labelPosition: { left: '66%', top: '34%' },
      radius: 1.9,
    },
    beats: [
      beat('problem', 'Management visibility', 'What problem is solved?', 'call intelligence',
        'Every call becomes searchable quality, engagement and opportunity data.',
        camera(0.35, 0.55, 4.6, 38), ['Django', 'React']),
      beat('diarization', 'Diarized intake', 'Is the transcript usable?', 'speaker roles',
        'Speaker diarization, role detection and word-level highlighting anchor review.',
        camera(0.98, 0.18, 4.2, 35), ['ASR', 'PostgreSQL']),
      beat('sop', 'SOP scoring', 'Can quality be measured?', '8 dimensions',
        'Call quality is scored across eight SOP dimensions for coaching loops.',
        camera(1.61, 0.72, 4.1, 35), ['Celery', 'LLM']),
      beat('parallel', 'Parallel intelligence', 'Is analysis slow?', '3 LLM tracks',
        'Scoring, intelligence and opportunity extraction run as parallel jobs.',
        camera(2.24, 0.38, 4.5, 36), ['Redis', 'Workers']),
      beat('dashboard', 'Embedded dashboard', 'Can teams act on it?', 'CRM-ready',
        'The React dashboard packages findings for operators and managers.',
        camera(2.87, 0.62, 4.4, 37), ['TypeScript', 'Zoho']),
      beat('reliability', 'Production reliability', 'Will it stay up?', 'health checks',
        'Kubernetes health checks, middleware logs and Playwright tests cover releases.',
        camera(3.50, 0.30, 4.8, 38), ['Kubernetes', 'Playwright']),
    ],
  }),
  chapter({
    id: 'VANGUARD',
    phase: 'W03_VANGUARD',
    node: {
      anchor: [-7.2, 2.55, -0.95],
      color: '#a48cff',
      labelPosition: { left: '22%', top: '34%' },
      radius: 1.6,
    },
    beats: [
      beat('browser-graph', 'Browser Graph', 'What does Vanguard do?', 'autonomous QA',
        'Browser states condense into a directed graph of pages and navigation paths.',
        camera(0.45, 0.42, 4.5, 38), ['Playwright', 'VLM']),
      beat('agent-probe', 'Agent Probe', 'How does it test?', 'VLM + Playwright',
        'A vision-guided probe traverses the graph and leaves a luminous decision trail.',
        camera(1.30, 0.62, 4.0, 35), ['TypeScript', 'DOM']),
      beat('fail-reroute', 'Fail and Reroute', 'What happens when it fails?', 'reroute',
        'Failed paths stay red-violet while the successful alternate route turns green.',
        camera(2.15, 0.25, 4.2, 35), ['Agents', 'Retries']),
      beat('dom-diagnostic', 'DOM Diagnostic', 'What does it see?', 'DOM + screenshot',
        'DOM sub-lattices and screenshot planes reveal structure plus visual state.',
        camera(2.78, 0.40, 4.4, 36), ['DOM', 'Visual diff']),
      beat('release-risk', 'Release Risk Map', "What's the output?", 'release confidence',
        'The full graph becomes a continuous deployment-risk heat map.',
        camera(3.00, 0.55, 4.7, 38), ['Regression', 'Visual checks']),
    ],
  }),
  chapter({
    id: 'INSPECTION',
    phase: 'W04_INSPECTION',
    node: {
      anchor: [6.0, -2.9, 0.72],
      color: '#78b8ff',
      labelPosition: { left: '63%', top: '62%' },
      radius: 1.75,
    },
    beats: [
      beat('scope', 'Vehicle scope', 'How broad is the inspection?', '1000+ parts',
        'The inspection agent targets part-level two-wheeler defect consistency.',
        camera(0.15, 0.25, 4.5, 38), ['YOLOv8', 'Python']),
      beat('defects', 'Defect detection', 'What is detected?', 'YOLOv8m',
        'Computer vision classifies visible damage and inspection states.',
        camera(0.95, 0.70, 4.0, 35), ['CV', 'Inference']),
      beat('analytics', 'Showroom analytics', 'Does it watch operations?', 'RTSP metrics',
        'RTSP people counting and face recognition feed showroom visibility.',
        camera(1.75, 0.32, 4.3, 35), ['RTSP', 'Analytics']),
      beat('packaging', 'Packaged workflow', 'Could staff use it?', 'Electron app',
        'Electron packaging and Streamlit dashboards connect models to workflows.',
        camera(2.55, 0.58, 4.5, 37), ['Electron', 'Streamlit']),
      beat('operations', 'Operations value', 'Why does it matter?', 'consistent QA',
        'Automation creates repeatable inspections and cleaner operational reporting.',
        camera(3.35, 0.20, 4.8, 38), ['Dashboards', 'Cloud']),
    ],
  }),
  chapter({
    id: 'WAVEFIELD',
    phase: 'W05_WAVEFIELD',
    node: {
      anchor: [-5.55, -3.85, 1.18],
      color: '#d6b6ff',
      labelPosition: { left: '27%', top: '68%' },
      radius: 1.7,
    },
    beats: [
      beat('bottleneck', 'Attention bottleneck', 'What limit is attacked?', 'O(n²)',
        'The research targets the scaling wall of standard softmax attention.',
        camera(0.25, 0.60, 4.8, 39), ['Attention', 'Research']),
      beat('kernel', 'Wave-field kernel', 'What is the core idea?', 'Fourier + Green',
        'Position awareness and content gating are separated with wave kernels.',
        camera(1.05, 0.22, 4.2, 35), ['Fourier', 'Green']),
      beat('complexity', 'Complexity path', 'What is the target cost?', 'O(n log n)',
        'The paper frames a route toward sub-quadratic long-context computation.',
        camera(1.85, 0.72, 4.4, 35), ['Algorithms', 'Bounds']),
      beat('scale', 'Long-context target', 'Why does it matter?', '1M tokens',
        'The target is million-token context without quadratic memory pressure.',
        camera(2.65, 0.30, 4.6, 37), ['Long context', 'Math']),
      beat('artifact', 'Research artifact', 'What can be defended?', '9-stage framework',
        'The written framework is defense-ready around assumptions and tests.',
        camera(3.45, 0.52, 4.9, 39), ['Paper', 'Validation']),
    ],
  }),
  chapter({
    id: 'EMI',
    phase: 'W06_EMI',
    node: {
      anchor: [1.55, -6.15, -0.36],
      color: '#ffc56f',
      labelPosition: { left: '51%', top: '79%' },
      radius: 1.7,
    },
    beats: [
      beat('model', 'Shielding model', 'What physics is modeled?', 'Schelkunoff',
        'Reflection, absorption and correction terms model shielding effectiveness.',
        camera(0.10, 0.35, 4.6, 38), ['Physics', 'Simulation']),
      beat('sweep', 'Sweep engine', 'How much is simulated?', '100 kHz-10 GHz',
        'Vectorized frequency sweeps explore broad design behavior quickly.',
        camera(0.90, 0.64, 4.2, 35), ['Vectorization', 'Python']),
      beat('materials', 'Composite materials', 'Is material structure captured?', 'multi-phase',
        'Composite conductivity and microstructure-aware effects feed the model.',
        camera(1.70, 0.20, 4.5, 36), ['Composites', 'Conductivity']),
      beat('validation', 'Validation target', 'How accurate should it be?', '+/-1.5 dB',
        'The engine is built around measurable validation against shielding data.',
        camera(2.50, 0.55, 4.4, 36), ['Validation', 'Tests']),
      beat('product', 'Product workflow', 'How was it shipped?', 'CI + mobile UI',
        'React Native workflows, Jenkins CI and SonarQube turn it into product surface.',
        camera(3.30, 0.30, 4.8, 38), ['React Native', 'Jenkins']),
    ],
  }),
  chapter({
    id: 'FORMULA',
    phase: 'W07_FORMULA',
    node: {
      anchor: [0.12, 5.85, 0.10],
      color: '#ffe8bc',
      labelPosition: { left: '49%', top: '20%' },
      radius: 1.65,
    },
    beats: [
      beat('track-path', 'Track Path', "What's the context?", 'Formula Manipal',
        'A racing-red circuit filament traces the Formula Manipal system context.',
        camera(0.50, 0.70, 4.7, 39), ['Leadership', 'Testing']),
      beat('telemetry', 'Telemetry Stream', 'What did the car produce?', 'live telemetry',
        'A vehicle particle laps the circuit with speed, braking and apex telemetry.',
        camera(1.35, 0.35, 4.2, 35), ['Controls', 'Path planning']),
      beat('racing-line', 'Racing Line', 'What improved?', '40% control accuracy',
        'Gold improved lines separate from dim original paths at the corners.',
        camera(2.20, 0.55, 4.3, 36), ['Data logging', 'EV']),
      beat('operations-network', 'Operations Network', 'What else?', 'INR 60L sponsors',
        'Six operations nodes connect engineering, strategy, sponsorship and logistics.',
        camera(2.70, 0.45, 4.5, 36), ['Operations', 'Sponsorship']),
      beat('competition', 'Competition Constellation', "What's the result?", '1st place',
        'The full track, telemetry and operations system pulses as one delivered result.',
        camera(3.05, 0.30, 4.8, 38), ['Operations', 'Vehicle dynamics']),
    ],
  }),
] as const;

const LAST_CHAPTER_INDEX = PORTFOLIO_CHAPTERS.length - 1;
const ENTRY_SPAN = 0.14;
const EXIT_START = 0.88;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function isPortfolioChapterPhase(phase: ScenePhase): phase is PortfolioProjectPhase {
  return PROJECT_PHASES.includes(phase as PortfolioProjectPhase);
}

export function getPortfolioChapter(id: PortfolioChapterId): PortfolioChapter {
  const chapterMatch = PORTFOLIO_CHAPTERS.find((item) => item.id === id);
  if (!chapterMatch) throw new Error(`Missing portfolio chapter ${id}`);
  return chapterMatch;
}

export function getPortfolioChapterByPhase(phase: PortfolioProjectPhase): PortfolioChapter {
  const chapterMatch = PORTFOLIO_CHAPTERS.find((item) => item.phase === phase);
  if (!chapterMatch) throw new Error(`Missing portfolio chapter for ${phase}`);
  return chapterMatch;
}

export function getPortfolioChapterIndex(id: PortfolioChapterId): number {
  return PORTFOLIO_CHAPTERS.findIndex((item) => item.id === id);
}

function routeFor(index: number, localProgress: number): number {
  if (LAST_CHAPTER_INDEX === 0) return 0;
  const local = clamp01(localProgress);
  if (index > 0 && local < ENTRY_SPAN) return index - 1 + local / ENTRY_SPAN;
  if (index < LAST_CHAPTER_INDEX && local > EXIT_START) {
    return index + (local - EXIT_START) / (1 - EXIT_START);
  }
  return index;
}

function getBeatProgress(localProgress: number): number {
  return clamp01((localProgress - ENTRY_SPAN) / (EXIT_START - ENTRY_SPAN));
}

export function getPortfolioBookSnapshot(
  phase: PortfolioProjectPhase,
  localProgress: number,
): PortfolioBookSnapshot {
  const chapterItem = getPortfolioChapterByPhase(phase);
  const chapterIndex = getPortfolioChapterIndex(chapterItem.id);
  const beatProgress = getBeatProgress(localProgress);
  const rawBeat = beatProgress * chapterItem.beats.length;
  const beatIndex = Math.min(chapterItem.beats.length - 1, Math.floor(rawBeat));
  const completedBeats = chapterItem.beats.slice(0, beatIndex).map((item) => item.id);
  return {
    beat: chapterItem.beats[beatIndex],
    beatIndex,
    beatProgress: rawBeat - beatIndex,
    chapter: chapterItem,
    chapterIndex,
    completedBeats,
    localProgress: clamp01(localProgress),
    routeProgress: routeFor(chapterIndex, localProgress) / LAST_CHAPTER_INDEX,
  };
}

export function getPreludePortfolioSnapshot(): PortfolioBookSnapshot {
  return getPortfolioBookSnapshot('W01_MIRA', 0);
}

export function getClosingPortfolioSnapshot(): PortfolioBookSnapshot {
  return getPortfolioBookSnapshot('W07_FORMULA', 1);
}
