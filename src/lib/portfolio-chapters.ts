import { panelCopy } from './copy';
import type {
  PortfolioBeat,
  PortfolioBookNode,
  PortfolioChapter,
  PortfolioChapterId,
  PortfolioProjectPhase,
} from './portfolio-book';
import { workPanelDetails } from './work-panel-data';

export const PROJECT_PHASES = [
  'W01_MIRA',
  'W02_AIDEN',
  'W03_VANGUARD',
  'W04_INSPECTION',
  'W05_WAVEFIELD',
  'W06_EMI',
  'W07_FORMULA',
] as const satisfies readonly PortfolioProjectPhase[];

type BeatCamera = Pick<PortfolioBeat, 'distance' | 'fov' | 'lift' | 'orbit'>;
type BeatTuple = readonly [
  id: string,
  title: string,
  question: string,
  metric: string,
  proof: string,
  camera: BeatCamera,
  stack: readonly string[],
];
type CaseStudyBeatConfig = Readonly<{
  camera: BeatCamera;
  id: string;
  metric: string;
  particleLines: readonly string[];
  proof: string;
  question: string;
  sectionLabel: string;
  stack: readonly string[];
  title: string;
}>;

function camera(orbit: number, lift: number, distance: number, fov: number): BeatCamera {
  return { distance, fov, lift, orbit };
}

function particleLinesFor(title: string): readonly string[] {
  const words = title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word.length > 0 && word !== 'THE' && word !== 'AND');
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    if (line.length === 0) {
      line = word.slice(0, 18);
      return;
    }
    const next = `${line} ${word}`;
    if (next.length <= 18) {
      line = next;
      return;
    }
    lines.push(line);
    line = word.slice(0, 18);
  });

  if (line.length > 0) lines.push(line);
  return lines.slice(0, 3);
}

function beat([id, title, question, metric, proof, beatCamera, stack]: BeatTuple): PortfolioBeat {
  return {
    id,
    title,
    question,
    metric,
    proof,
    stack,
    description: proof,
    particleLines: particleLinesFor(title),
    sectionLabel: title,
    ...beatCamera,
  };
}

function caseStudyBeat(config: CaseStudyBeatConfig): PortfolioBeat {
  return {
    id: config.id,
    title: config.title,
    question: config.question,
    metric: config.metric,
    proof: config.proof,
    stack: config.stack,
    description: config.proof,
    particleLines: config.particleLines,
    sectionLabel: config.sectionLabel,
    ...config.camera,
  };
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
      caseStudyBeat({
        id: 'hero',
        sectionLabel: 'Hero',
        title: 'MIRA',
        question: 'What is the project?',
        metric: 'Production voice AI',
        proof: 'Built a production voice AI intake system for multilingual lead qualification, ' +
          'with CRM and WhatsApp handoffs after each call.',
        camera: camera(0.20, 0.72, 6.2, 39),
        particleLines: ['MIRA', 'VOICE INTAKE'],
        stack: ['FastAPI', 'Pipecat', 'WebSockets', 'ASR/TTS', 'LLM', 'Zoho', 'WhatsApp'],
      }),
      caseStudyBeat({
        id: 'problem',
        sectionLabel: 'Problem',
        title: 'Operational Problem',
        question: 'What bottleneck did operations have?',
        metric: 'Manual qualification delay',
        proof: 'Live C2C and OLX leads needed rapid first-touch in five languages; sales teams ' +
          'were still reconciling calls, CRM fields and WhatsApp follow-ups by hand.',
        camera: camera(0.72, 0.52, 5.8, 37),
        particleLines: ['LEAD INTAKE', 'MANUAL HANDOFF'],
        stack: ['Lead intake', 'Sales ops', 'CRM'],
      }),
      caseStudyBeat({
        id: 'system',
        sectionLabel: 'System',
        title: 'System I Built',
        question: 'How is the system built?',
        metric: 'WebSocket -> VAD -> ASR -> LLM',
        proof: 'Lead context enters FastAPI call services, streams through telephony ' +
          'WebSockets, VAD, ASR, language routing, LLM orchestration, TTS, then writes ' +
          'outcomes to Zoho and WhatsApp.',
        camera: camera(1.24, 0.35, 5.2, 34),
        particleLines: ['VOICE PIPELINE', 'OPS HANDOFF'],
        stack: ['WebSockets', 'VAD', 'ASR', 'TTS', 'LLM'],
      }),
      caseStudyBeat({
        id: 'build',
        sectionLabel: 'Build',
        title: 'Build',
        question: 'What components run the pipeline?',
        metric: 'FastAPI, Redis, Kubernetes',
        proof: 'FastAPI services coordinate call jobs, conversation state, retry paths, ' +
          'worker handoffs, CRM sync and WhatsApp follow-up; Redis backs queue/state and ' +
          'Kubernetes runs deployment.',
        camera: camera(1.95, 0.95, 6.6, 37),
        particleLines: ['BACKEND', 'SERVICES'],
        stack: ['FastAPI', 'Redis', 'Workers', 'Kubernetes'],
      }),
      caseStudyBeat({
        id: 'challenge',
        sectionLabel: 'Challenge',
        title: 'Hard Technical Challenge',
        question: 'What was the hardest engineering constraint?',
        metric: '7s -> <500ms TTFB',
        proof: 'The hard constraint was turn latency: the first design waited on sequential ' +
          'audio and model calls, so I moved the path to streamed, parallel execution and ' +
          'cut first response from 7s to <500ms.',
        camera: camera(2.80, 0.20, 5.5, 34),
        particleLines: ['LATENCY', 'COLLAPSE'],
        stack: ['Streaming', 'Pipecat', '<500ms', 'Parallel I/O'],
      }),
      caseStudyBeat({
        id: 'proof',
        sectionLabel: 'Proof',
        title: 'Proof of Execution',
        question: 'What proves it shipped?',
        metric: '68 Days, 5 Languages',
        proof: 'Shipped in 68 days to production lead qualification across English, Hindi, ' +
          'Tamil, Kannada and Telugu, with structured call outcomes synced into CRM and ' +
          'WhatsApp workflows.',
        camera: camera(3.70, 0.62, 5.0, 33),
        particleLines: ['68 DAYS', '5 LANGUAGES'],
        stack: ['Production', '68 days', '5 languages', 'CRM sync', 'WhatsApp'],
      }),
      caseStudyBeat({
        id: 'reflection',
        sectionLabel: 'Reflection',
        title: 'Reflection',
        question: 'What changed and what would improve next?',
        metric: 'Operational actions, not transcripts',
        proof: 'The system changed calls from isolated transcripts into operational actions; ' +
          'the next pass is stage-level p50/p95 telemetry, replay tests and language-specific ' +
          'failure tracking.',
        camera: camera(4.57, 0.46, 5.8, 35),
        particleLines: ['TELEMETRY', 'NEXT PASS'],
        stack: ['Observability', 'Replay tests', 'Latency telemetry'],
      }),
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
      beat(['problem', 'Management visibility', 'What problem is solved?', 'call intelligence',
        'Every call becomes searchable quality, engagement and opportunity data.',
        camera(0.35, 0.55, 4.6, 38), ['Django', 'React']]),
      beat(['diarization', 'Diarized intake', 'Is the transcript usable?', 'speaker roles',
        'Speaker diarization, role detection and word-level highlighting anchor review.',
        camera(0.98, 0.18, 4.2, 35), ['ASR', 'PostgreSQL']]),
      beat(['sop', 'SOP scoring', 'Can quality be measured?', '8 dimensions',
        'Call quality is scored across eight SOP dimensions for coaching loops.',
        camera(1.61, 0.72, 4.1, 35), ['Celery', 'LLM']]),
      beat(['parallel', 'Parallel intelligence', 'Is analysis slow?', '3 LLM tracks',
        'Scoring, intelligence and opportunity extraction run as parallel jobs.',
        camera(2.24, 0.38, 4.5, 36), ['Redis', 'Workers']]),
      beat(['dashboard', 'Embedded dashboard', 'Can teams act on it?', 'CRM-ready',
        'The React dashboard packages findings for operators and managers.',
        camera(2.87, 0.62, 4.4, 37), ['TypeScript', 'Zoho']]),
      beat(['reliability', 'Production reliability', 'Will it stay up?', 'health checks',
        'Kubernetes health checks, middleware logs and Playwright tests cover releases.',
        camera(3.50, 0.30, 4.8, 38), ['Kubernetes', 'Playwright']]),
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
      beat(['browser-graph', 'Browser Graph', 'What does Vanguard do?', 'autonomous QA',
        'Browser states condense into a directed graph of pages and navigation paths.',
        camera(0.45, 0.42, 4.5, 38), ['Playwright', 'VLM']]),
      beat(['agent-probe', 'Agent Probe', 'How does it test?', 'VLM + Playwright',
        'A vision-guided probe traverses the graph and leaves a luminous decision trail.',
        camera(1.30, 0.62, 4.0, 35), ['TypeScript', 'DOM']]),
      beat(['fail-reroute', 'Fail and Reroute', 'What happens when it fails?', 'reroute',
        'Failed paths stay red-violet while the successful alternate route turns green.',
        camera(2.15, 0.25, 4.2, 35), ['Agents', 'Retries']]),
      beat(['dom-diagnostic', 'DOM Diagnostic', 'What does it see?', 'DOM + screenshot',
        'DOM sub-lattices and screenshot planes reveal structure plus visual state.',
        camera(2.78, 0.40, 4.4, 36), ['DOM', 'Visual diff']]),
      beat(['release-risk', 'Release Risk Map', "What's the output?", 'release confidence',
        'The full graph becomes a continuous deployment-risk heat map.',
        camera(3.00, 0.55, 4.7, 38), ['Regression', 'Visual checks']]),
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
      beat(['scope', 'Vehicle scope', 'How broad is the inspection?', '1000+ parts',
        'The inspection agent targets part-level two-wheeler defect consistency.',
        camera(0.15, 0.25, 4.5, 38), ['YOLOv8', 'Python']]),
      beat(['defects', 'Defect detection', 'What is detected?', 'YOLOv8m',
        'Computer vision classifies visible damage and inspection states.',
        camera(0.95, 0.70, 4.0, 35), ['CV', 'Inference']]),
      beat(['analytics', 'Showroom analytics', 'Does it watch operations?', 'RTSP metrics',
        'RTSP people counting and face recognition feed showroom visibility.',
        camera(1.75, 0.32, 4.3, 35), ['RTSP', 'Analytics']]),
      beat(['packaging', 'Packaged workflow', 'Could staff use it?', 'Electron app',
        'Electron packaging and Streamlit dashboards connect models to workflows.',
        camera(2.55, 0.58, 4.5, 37), ['Electron', 'Streamlit']]),
      beat(['operations', 'Operations value', 'Why does it matter?', 'consistent QA',
        'Automation creates repeatable inspections and cleaner operational reporting.',
        camera(3.35, 0.20, 4.8, 38), ['Dashboards', 'Cloud']]),
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
      beat(['bottleneck', 'Attention bottleneck', 'What limit is attacked?', 'O(n²)',
        'The research targets the scaling wall of standard softmax attention.',
        camera(0.25, 0.60, 4.8, 39), ['Attention', 'Research']]),
      beat(['kernel', 'Wave-field kernel', 'What is the core idea?', 'Fourier + Green',
        'Position awareness and content gating are separated with wave kernels.',
        camera(1.05, 0.22, 4.2, 35), ['Fourier', 'Green']]),
      beat(['complexity', 'Complexity path', 'What is the target cost?', 'O(n log n)',
        'The paper frames a route toward sub-quadratic long-context computation.',
        camera(1.85, 0.72, 4.4, 35), ['Algorithms', 'Bounds']]),
      beat(['scale', 'Long-context target', 'Why does it matter?', '1M tokens',
        'The target is million-token context without quadratic memory pressure.',
        camera(2.65, 0.30, 4.6, 37), ['Long context', 'Math']]),
      beat(['artifact', 'Research artifact', 'What can be defended?', '9-stage framework',
        'The written framework is defense-ready around assumptions and tests.',
        camera(3.45, 0.52, 4.9, 39), ['Paper', 'Validation']]),
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
      beat(['model', 'Shielding model', 'What physics is modeled?', 'Schelkunoff',
        'Reflection, absorption and correction terms model shielding effectiveness.',
        camera(0.10, 0.35, 4.6, 38), ['Physics', 'Simulation']]),
      beat(['sweep', 'Sweep engine', 'How much is simulated?', '100 kHz-10 GHz',
        'Vectorized frequency sweeps explore broad design behavior quickly.',
        camera(0.90, 0.64, 4.2, 35), ['Vectorization', 'Python']]),
      beat(['materials', 'Composite materials', 'Is material structure captured?', 'multi-phase',
        'Composite conductivity and microstructure-aware effects feed the model.',
        camera(1.70, 0.20, 4.5, 36), ['Composites', 'Conductivity']]),
      beat(['validation', 'Validation target', 'How accurate should it be?', '+/-1.5 dB',
        'The engine is built around measurable validation against shielding data.',
        camera(2.50, 0.55, 4.4, 36), ['Validation', 'Tests']]),
      beat(['product', 'Product workflow', 'How was it shipped?', 'CI + mobile UI',
        'React Native workflows, Jenkins CI and SonarQube turn it into product surface.',
        camera(3.30, 0.30, 4.8, 38), ['React Native', 'Jenkins']]),
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
      beat(['track-path', 'Track Path', "What's the context?", 'Formula Manipal',
        'A racing-red circuit filament traces the Formula Manipal system context.',
        camera(0.50, 0.70, 4.7, 39), ['Leadership', 'Testing']]),
      beat(['telemetry', 'Telemetry Stream', 'What did the car produce?', 'live telemetry',
        'A vehicle particle laps the circuit with speed, braking and apex telemetry.',
        camera(1.35, 0.35, 4.2, 35), ['Controls', 'Path planning']]),
      beat(['racing-line', 'Racing Line', 'What improved?', '40% control accuracy',
        'Gold improved lines separate from dim original paths at the corners.',
        camera(2.20, 0.55, 4.3, 36), ['Data logging', 'EV']]),
      beat(['operations-network', 'Operations Network', 'What else?', 'INR 60L sponsors',
        'Six operations nodes connect engineering, strategy, sponsorship and logistics.',
        camera(2.70, 0.45, 4.5, 36), ['Operations', 'Sponsorship']]),
      beat(['competition', 'Competition Constellation', "What's the result?", '1st place',
        'The full track, telemetry and operations system pulses as one delivered result.',
        camera(3.05, 0.30, 4.8, 38), ['Operations', 'Vehicle dynamics']]),
    ],
  }),
] as const;
