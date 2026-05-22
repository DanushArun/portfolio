import type { WorkPhase } from './scene-state';

export type WorkPanelMetric = Readonly<{
  label: string;
  value: string;
}>;

export type WorkPanelDetail = Readonly<{
  lead: string;
  role: string;
  metrics: readonly WorkPanelMetric[];
  proof: readonly string[];
  stack: readonly string[];
}>;

export const workPanelDetails = {
  W01_MIRA: {
    lead: 'Production voice AI for live C2C and OLX lead conversion.',
    role: 'Sole architect across speech, orchestration, CRM sync and WhatsApp workflows.',
    metrics: [
      { label: 'Development', value: '68 days' },
      { label: 'First response', value: '482ms' },
      { label: 'Languages', value: '5' },
    ],
    proof: [
      'Streaming VAD, ASR, native-audio LLM and telephony WebSocket pipeline.',
      'Structured post-call intent extraction with confidence and ISO 8601 dates.',
      'Zoho CRM sync, WhatsApp group creation, reminders and seller retry logic.',
    ],
    stack: ['Python', 'FastAPI', 'Pipecat', 'Redis', 'PostgreSQL', 'Kubernetes'],
  },
  W02_AIDEN: {
    lead: 'Conversation intelligence for management visibility and call quality.',
    role: 'Built the full analytics pipeline, persistence layer and embedded React dashboard.',
    metrics: [
      { label: 'Development', value: '31 days' },
      { label: 'SOP scoring', value: '8 dimensions' },
      { label: 'Storage model', value: '8 tables' },
    ],
    proof: [
      'Speaker-diarized ASR with role detection and word-level transcript highlighting.',
      'Three parallel structured LLM calls for scoring, intelligence and opportunity data.',
      'Kubernetes deployment with health checks, logging middleware and Playwright tests.',
    ],
    stack: ['Django 5', 'Celery', 'PostgreSQL', 'Redis', 'React', 'TypeScript'],
  },
  W03_VANGUARD: {
    lead: 'Autonomous test exploration direction for visual and workflow regressions.',
    role: 'Connects QE practice with Playwright-driven validation and self-correction loops.',
    metrics: [
      { label: 'Mode', value: 'Agentic QA' },
      { label: 'Coverage style', value: 'Exploratory' },
      { label: 'Signal', value: 'Visual + DOM' },
    ],
    proof: [
      'Built from real QE work: Playwright E2E, Selenium automation and JMeter plans.',
      'Designed to detect overlap, broken state and interaction failures beyond scripts.',
      'Best used as a reliability layer for CRM, telephony and portfolio surfaces.',
    ],
    stack: ['Playwright', 'VLM', 'TypeScript', 'Regression Suites', 'Visual Checks'],
  },
  W04_INSPECTION: {
    lead: 'Computer vision inspection and showroom analytics for DriveX operations.',
    role: 'Built CV automation across vehicle inspection, people counting and dashboards.',
    metrics: [
      { label: 'Inspection scope', value: '1000+ parts' },
      { label: 'Detection model', value: 'YOLOv8m' },
      { label: 'Packaging', value: 'Electron' },
    ],
    proof: [
      'Vehicle inspection agent for part-level defect analysis and consistency.',
      'RTSP camera people counter with face recognition for showroom metrics.',
      'Streamlit analytics dashboard connected to Veronica API and cloud deployment.',
    ],
    stack: ['YOLOv8', 'Electron', 'Streamlit', 'RTSP', 'Python', 'Computer Vision'],
  },
  W05_WAVEFIELD: {
    lead: 'Original attention research aimed at breaking quadratic sequence cost.',
    role: 'Derived the mathematical framework and wrote the full research paper.',
    metrics: [
      { label: 'Complexity', value: 'O(n log n)' },
      { label: 'Framework', value: '9 stages' },
      { label: 'Scale target', value: '1M tokens' },
    ],
    proof: [
      'Decouples position-awareness from content-gating using Fourier and Green kernels.',
      'Grounded against the Alman-Yu lower bound for softmax attention limits.',
      'Frames a testable path for sub-quadratic long-context attention.',
    ],
    stack: ['Fourier Kernels', 'Green Functions', 'Attention', 'Math Research'],
  },
  W06_EMI: {
    lead: 'Computational physics engine for electromagnetic shielding design.',
    role: 'Built vectorized simulations, validation logic and product-facing workflows.',
    metrics: [
      { label: 'Sweep range', value: '100 kHz-10 GHz' },
      { label: 'Lifecycle', value: '20 years' },
      { label: 'Validation target', value: '+/-1.5 dB' },
    ],
    proof: [
      'Schelkunoff shielding model for reflection, absorption and correction terms.',
      'Multi-phase composite support with microstructure-aware conductivity effects.',
      'React Native UI, Jenkins CI/CD, SonarQube and integration test suites.',
    ],
    stack: ['Physics Simulation', 'React Native', 'Jenkins', 'SonarQube', 'CI/CD'],
  },
  W07_FORMULA: {
    lead: 'Formula Manipal systems leadership across autonomous EV development.',
    role: 'Led operations, testing, sponsorship and path-planning coordination.',
    metrics: [
      { label: 'Sponsorship', value: 'INR 60L' },
      { label: 'Control accuracy', value: '+40%' },
      { label: 'Formula Bharat', value: '1st place' },
    ],
    proof: [
      'Directed autonomous path planning and track-side system testing for FM23e.',
      'Converted engineering work into measurable competition and funding outcomes.',
      'Shows cross-functional leadership beyond software-only execution.',
    ],
    stack: ['Controls', 'Path Planning', 'Testing', 'Operations', 'Vehicle Dynamics'],
  },
  W08_ABOUT: {
    lead: 'Systems-first engineer with software, AI, physics and product execution range.',
    role: 'Ships from blank repo to production while keeping architecture explainable.',
    metrics: [
      { label: 'Primary lane', value: 'AI systems' },
      { label: 'Execution style', value: 'End-to-end' },
      { label: 'Interview focus', value: 'Defense-ready' },
    ],
    proof: [
      'Strongest signal: production AI systems at DriveX, not decorative demos.',
      'Portfolio should prove taste, engineering depth and recruiter readability.',
      'Current growth target is stronger fundamentals plus tighter project defense.',
    ],
    stack: ['Python', 'TypeScript', 'React', 'Kubernetes', 'PostgreSQL', 'ML Systems'],
  },
  W09_CONNECT: {
    lead: 'Best fit: teams building AI products with real operational consequences.',
    role: 'Open to software and AI systems roles where ownership and velocity matter.',
    metrics: [
      { label: 'Location', value: 'Bengaluru' },
      { label: 'Target', value: 'AI systems' },
      { label: 'Contact', value: 'Email' },
    ],
    proof: [
      'Resume, GitHub and LinkedIn are the primary recruiter handoff paths.',
      'Project defense is prepared around architecture, tradeoffs and bottlenecks.',
      'The fastest next step is a technical screen or systems walkthrough.',
    ],
    stack: ['LinkedIn', 'GitHub', 'Email', 'Portfolio', 'Resume'],
  },
} satisfies Record<WorkPhase, WorkPanelDetail>;
