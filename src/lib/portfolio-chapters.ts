import { panelCopy } from './copy';
import type {
  PortfolioBeat,
  PortfolioBookNode,
  PortfolioChapter,
  PortfolioChapterId,
  PortfolioProjectPhase,
} from './portfolio-book';
import { stackTags } from './portfolio-stack-tags';
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
  description: string,
  camera: BeatCamera,
  stack: readonly string[],
];
type CaseStudyBeatConfig = Readonly<{
  camera: BeatCamera;
  description: string;
  id: string;
  metric: string;
  question: string;
  sectionLabel: string;
  stack: readonly string[];
  title: string;
}>;

const PARTICLE_LINE_MAX = 26;
function camera(orbit: number, lift: number, distance: number, fov: number): BeatCamera {
  return { distance, fov, lift, orbit };
}

function particleWordsFor(text: string): readonly string[] {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9(),²]+/g, ' ')
    .split(' ')
    .filter((word) => word.length > 0);
}

function particleLinesForDescription(description: string): readonly string[] {
  const words = particleWordsFor(description);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const safeWord = word.slice(0, PARTICLE_LINE_MAX);
    if (line.length === 0) {
      line = safeWord;
      return;
    }
    const next = `${line} ${safeWord}`;
    if (next.length <= PARTICLE_LINE_MAX) {
      line = next;
      return;
    }
    lines.push(line);
    line = safeWord;
  });

  if (line.length > 0) lines.push(line);
  return lines;
}

function beat([
  id,
  title,
  question,
  metric,
  description,
  beatCamera,
  stack,
]: BeatTuple): PortfolioBeat {
  const config = { description, metric, title };
  return {
    id,
    title,
    question,
    metric,
    stack: stackTags(stack, config),
    description,
    particleLines: particleLinesForDescription(description),
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
    stack: stackTags(config.stack, config),
    description: config.description,
    particleLines: particleLinesForDescription(config.description),
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
        sectionLabel: 'Overview',
        title: 'MIRA',
        question: 'What is this project?',
        metric: 'Autonomous Voice Agent',
        description: 'An AI that calls new leads instantly, qualifies them in five languages, and syncs data.',
        camera: camera(0.20, 0.72, 6.2, 39),
        stack: ['Voice AI', 'Multilingual', 'CRM Sync'],
      }),
      caseStudyBeat({
        id: 'problem',
        sectionLabel: 'Problem',
        title: 'The Bottleneck',
        question: 'Why did this need to exist?',
        metric: 'Zero-delay qualification',
        description: 'High intent leads were going cold due to delayed manual follow-ups by sales teams.',
        camera: camera(0.72, 0.52, 5.8, 37),
        stack: ['Lead decay', 'Manual ops'],
      }),
      caseStudyBeat({
        id: 'system',
        sectionLabel: 'Architecture',
        title: 'The Pipeline',
        question: 'How does it work?',
        metric: 'Sub-500ms latency',
        description: 'A low-latency streaming pipeline orchestrates telephony, speech-to-text, and the LLM.',
        camera: camera(1.24, 0.35, 5.2, 34),
        stack: ['Streaming audio', 'LLM routing'],
      }),
      caseStudyBeat({
        id: 'build',
        sectionLabel: 'Engineering',
        title: 'Core Engine',
        question: 'What runs the logic?',
        metric: 'Asynchronous event loop',
        description: 'FastAPI and Redis manage concurrent calls, state, and webhook events flawlessly.',
        camera: camera(1.95, 0.95, 6.6, 37),
        stack: ['FastAPI', 'Redis', 'WebSockets'],
      }),
      caseStudyBeat({
        id: 'challenge',
        sectionLabel: 'Optimization',
        title: 'The Hardest Constraint',
        question: 'What was the toughest technical hurdle?',
        metric: 'Voice Activity Detection',
        description: 'Tuning VAD and pre-warming sessions was critical to make the AI feel instantly responsive.',
        camera: camera(2.80, 0.20, 5.5, 34),
        stack: ['VAD tuning', 'Pre-warming'],
      }),
      caseStudyBeat({
        id: 'proof',
        sectionLabel: 'Impact',
        title: 'Production Reality',
        question: 'Did it actually ship?',
        metric: '68 days to launch',
        description: 'Deployed to live traffic in two months, handling thousands of real customer conversations.',
        camera: camera(3.70, 0.62, 5.0, 33),
        stack: ['Live traffic', 'Shipped'],
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
      caseStudyBeat({
        id: 'problem',
        sectionLabel: 'Overview',
        title: 'AIDEN',
        question: 'What is this platform?',
        metric: 'Call intelligence',
        description: 'An analytics engine that transforms raw sales calls into actionable coaching metrics.',
        camera: camera(0.35, 0.55, 4.6, 38),
        stack: ['Audio processing', 'Analytics'],
      }),
      beat(['diarization', 'Diarization', 'How is the audio parsed?', 'Speaker separation',
        'Advanced models isolate customer and agent voices to generate role-aware transcripts.',
        camera(0.98, 0.18, 4.2, 35), ['Speaker roles', 'Timestamps']]),
      beat(['sop', 'Automated Scoring', 'How is performance measured?', '8-dimension rubric',
        'Agents are automatically graded on compliance, objection handling, and pitch delivery.',
        camera(1.61, 0.72, 4.1, 35), ['SOP grading', 'LLM evaluation']]),
      beat(['parallel', 'Parallel Processing', 'How does it scale?', 'Concurrent tracks',
        'Distributed workers execute multiple analysis tracks simultaneously for rapid insights.',
        camera(2.24, 0.38, 4.5, 36), ['Distributed processing', 'High throughput']]),
      beat(['dashboard', 'Manager Dashboard', 'How is data consumed?', 'Embedded workflow',
        'Granular scores and coaching alerts are injected directly into the sales manager CRM.',
        camera(2.87, 0.62, 4.4, 37), ['Embedded UI', 'CRM Integration']]),
      beat(['reliability', 'System Reliability', 'Does it stay online?', 'Production hardened',
        'Robust schemas and automated end-to-end tests guarantee zero data loss and high uptime.',
        camera(3.50, 0.30, 4.8, 38), ['E2E testing', 'Data integrity']]),
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
      caseStudyBeat({
        id: 'browser-graph',
        sectionLabel: 'Overview',
        title: 'VANGUARD',
        question: 'What is VANGUARD?',
        metric: 'Autonomous QA',
        description: 'An AI testing agent that visually crawls web apps to catch regressions before they ship.',
        camera: camera(0.45, 0.42, 4.5, 38),
        stack: ['Visual QA', 'Agentic testing'],
      }),
      beat(['agent-probe', 'Agent Loop', 'How does it interact?', 'Observe & act',
        'The agent continuously observes the DOM, plans its next interaction, and verifies state.',
        camera(1.30, 0.62, 4.0, 35), ['Action loop', 'Verification']]),
      beat(['fail-reroute', 'Resilience', 'What if a page breaks?', 'Intelligent rerouting',
        'It intelligently handles dead ends and timeouts so a single error never kills a test run.',
        camera(2.15, 0.25, 4.2, 35), ['Fault tolerance', 'State recovery']]),
      beat(['dom-diagnostic', 'Deep Diagnostics', 'What does it look for?', 'Structural flaws',
        'It deeply scans for accessibility violations, hidden network errors, and layout shifts.',
        camera(2.78, 0.40, 4.4, 36), ['A11y audits', 'Network traps']]),
      beat(['release-risk', 'Release Confidence', 'What is the final output?', 'Definitive reports',
        'It compiles verifiable visual evidence into a clear go or no-go release dashboard.',
        camera(3.00, 0.55, 4.7, 38), ['Automated reporting', 'Evidence']]),
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
      caseStudyBeat({
        id: 'scope',
        sectionLabel: 'Overview',
        title: 'AI INSPECTION',
        question: 'What is this system?',
        metric: 'Automated QC',
        description: 'A computer vision pipeline that analyzes live feeds to detect vehicle defects instantly.',
        camera: camera(0.15, 0.25, 4.5, 38),
        stack: ['Computer Vision', 'Live streaming'],
      }),
      beat(['defects', 'Defect Detection', 'How are issues found?', 'Real-time inference',
        'Deep learning models process high-resolution frames to isolate and classify damage.',
        camera(0.95, 0.70, 4.0, 35), ['Inference', 'Classification']]),
      beat(['analytics', 'Stream Stability', 'How do feeds stay up?', 'Aggressive watchdogs',
        'Custom watchdogs and auto-reconnect logic maintain stability across volatile networks.',
        camera(1.75, 0.32, 4.3, 35), ['Network resilience', 'Watchdogs']]),
      beat(['packaging', 'Staff Workflow', 'How is it used on site?', 'Desktop client',
        'A streamlined desktop application gives showroom staff immediate access to diagnostics.',
        camera(2.55, 0.58, 4.5, 37), ['Local deployment', 'UX']]),
      beat(['operations', 'Business Value', 'Why does it matter?', 'Operational efficiency',
        'It standardizes quality control and aggregates crucial floor metrics for management.',
        camera(3.35, 0.20, 4.8, 38), ['Metrics tracking', 'Standardization']]),
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
      caseStudyBeat({
        id: 'bottleneck',
        sectionLabel: 'Overview',
        title: 'WAVE FIELD',
        question: 'What is the research?',
        metric: 'O(n log n) Scaling',
        description: 'Fundamental AI research to process massive text contexts far faster than standard models.',
        camera: camera(0.25, 0.60, 4.8, 39),
        stack: ['AI Architecture', 'Theoretical Math'],
      }),
      beat(['kernel', 'The Core Mechanism', 'What replaces attention?', 'Wave transform',
        'A causal wave kernel handles long-range word relationships via fast Fourier transforms.',
        camera(1.05, 0.22, 4.2, 35), ['Wave kernels', 'Fourier']]),
      beat(['complexity', 'Context Retention', 'Does it lose meaning?', 'Content gates',
        'Signal gating ensures the network retains precise contextual meaning over huge distances.',
        camera(1.85, 0.72, 4.4, 35), ['Information gating', 'Context']]),
      beat(['scale', 'Computational Target', 'What is the speedup?', 'Breaking quadratic limits',
        'Reducing Transformer Attention from O(n²) to O(n log n).',
        camera(2.65, 0.30, 4.6, 37), ['Algorithm scaling', 'Efficiency']]),
      beat(['artifact', 'The Artifact', 'What was delivered?', 'Comprehensive paper',
        'Defended the architecture through a rigorous framework proving theoretical viability.',
        camera(3.45, 0.52, 4.9, 39), ['Academic defense', 'Proof']]),
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
      caseStudyBeat({
        id: 'model',
        sectionLabel: 'Overview',
        title: 'EMI ENGINE',
        question: 'What does it do?',
        metric: 'Physics Simulation',
        description: 'A computational engine that simulates and optimizes electromagnetic shielding materials.',
        camera: camera(0.10, 0.35, 4.6, 38),
        stack: ['Computational Physics', 'Optimization'],
      }),
      beat(['sweep', 'Core Solver', 'What does it calculate?', 'Wave attenuation',
        'It computes precise reflection and absorption metrics across massive frequency sweeps.',
        camera(0.90, 0.64, 4.2, 35), ['Frequency sweeps', 'Attenuation']]),
      beat(['materials', 'Material Models', 'How accurate is it?', 'Microstructure aware',
        'It accurately models real-world variables like alloy composition and grain-size effects.',
        camera(1.70, 0.20, 4.5, 36), ['Material science', 'Microstructure']]),
      beat(['validation', 'Layered Stacks', 'Can it handle complexity?', 'Transfer matrices',
        'Advanced mathematics simulate the combined performance of multi-layered shielding stacks.',
        camera(2.50, 0.55, 4.4, 36), ['Layered composites', 'Matrices']]),
      beat(['product', 'Engineering Value', 'How do engineers use it?', 'Automated targeting',
        'It automatically ranks and recommends the optimal material combinations for specific targets.',
        camera(3.30, 0.30, 4.8, 38), ['Recommendation engine', 'Targeting']]),
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
      caseStudyBeat({
        id: 'track-path',
        sectionLabel: 'Overview',
        title: 'FORMULA MANIPAL',
        question: 'What was your role?',
        metric: 'Championship Engineering',
        description: 'Hands-on race engineering and vehicle manufacturing for a competitive student formula team.',
        camera: camera(0.50, 0.70, 4.7, 39),
        stack: ['Race Engineering', 'Manufacturing'],
      }),
      beat(['telemetry', 'The Shop Floor', 'What did you build?', 'Drivetrain assembly',
        'Executed hands-on engine assembly, transmission tuning, and complex structural welding.',
        camera(1.35, 0.35, 4.2, 35), ['Powertrain', 'Fabrication']]),
      beat(['racing-line', 'Aerodynamics', 'How was weight reduced?', 'Carbon composites',
        'Engineered and infused custom carbon fiber body panels to cut mass and drag.',
        camera(2.20, 0.55, 4.3, 36), ['Carbon fiber', 'Composites']]),
      beat(['operations-network', 'Team Operations', 'How was it funded?', 'Corporate backing',
        'Secured massive sponsorships and managed budget allocation across critical R&D tracks.',
        camera(2.70, 0.45, 4.5, 36), ['Funding', 'Budget management']]),
      beat(['competition', 'The Result', 'Did the car win?', 'National dominance',
        'Delivered a highly competitive vehicle that dominated national manufacturing and cost events.',
        camera(3.05, 0.30, 4.8, 38), ['Podiums', 'Design awards']]),
    ],
  }),
] as const;
