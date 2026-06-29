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
    lead: 'An autonomous voice AI that instantly calls and qualifies high-intent sales leads.',
    role: 'Architected the end-to-end streaming pipeline, dropping system latency below 500ms.',
    metrics: [
      { label: 'Development', value: '68 days' },
      { label: 'First response', value: '482ms' },
      { label: 'Languages', value: '5' },
    ],
    proof: [
      'Engineered an aggressive, low-latency audio streaming pipeline across five languages.',
      'Tuned VAD models and pre-warmed sessions to guarantee instantaneous conversational responses.',
      'Shipped to live production in 68 days, completely automating manual CRM data entry.',
    ],
    stack: ['Python', 'FastAPI', 'Pipecat', 'WebSockets', 'ASR/TTS', 'LLM'],
  },
  W02_AIDEN: {
    lead: 'An analytics engine that transforms raw audio into actionable sales intelligence.',
    role: 'Built the parallel processing pipeline, automated scoring models, and manager dashboard.',
    metrics: [
      { label: 'Development', value: '31 days' },
      { label: 'SOP scoring', value: '8 dimensions' },
      { label: 'Storage model', value: '8 tables' },
    ],
    proof: [
      'Implemented precise diarization to isolate speakers and generate role-aware transcripts.',
      'Engineered concurrent analysis tracks to instantly grade agents on 8 critical performance dimensions.',
      'Delivered granular scoring and coaching alerts directly into the embedded CRM workflow.',
    ],
    stack: ['Django 5', 'Celery', 'PostgreSQL', 'Sarvam', 'Gemini', 'React'],
  },
  W03_VANGUARD: {
    lead: 'An autonomous AI testing agent that enforces UI quality and workflow stability.',
    role: 'Developed the continuous agent loop, intelligent rerouting, and reporting pipeline.',
    metrics: [
      { label: 'Mode', value: 'Agentic E2E' },
      { label: 'Scale model', value: 'Templates' },
      { label: 'Signal', value: 'DOM + A11y' },
    ],
    proof: [
      'Built an observe-plan-verify action loop that navigates complex, unpredictable web interfaces.',
      'Engineered robust fault tolerance to ensure single page failures never kill test runs.',
      'Automated the aggregation of visual evidence and DOM diagnostics into definitive release reports.',
    ],
    stack: ['Playwright', 'MCP', 'SQLite', 'A11y Snapshots', 'Reports'],
  },
  W04_INSPECTION: {
    lead: 'A real-time computer vision system automating vehicle quality assurance.',
    role: 'Developed the RTSP stream architecture, defect detection logic, and desktop client.',
    metrics: [
      { label: 'Inspection scope', value: '1000+ parts' },
      { label: 'Detection model', value: 'YOLOv8m' },
      { label: 'Packaging', value: 'Electron' },
    ],
    proof: [
      'Deployed deep learning models to process high-resolution frames and classify defects instantly.',
      'Implemented aggressive network watchdogs to maintain stable feeds across volatile connections.',
      'Packaged the diagnostics into a streamlined desktop application for immediate showroom floor access.',
    ],
    stack: ['YOLOv8', 'RTSP', 'Electron', 'Django REST', 'Python', 'Dashboards'],
  },
  W05_WAVEFIELD: {
    lead: 'Research breaking the O(n²) attention bottleneck for infinite-context language models.',
    role: 'Derived the core mathematics, gating mechanisms, and established the validation framework.',
    metrics: [
      { label: 'Complexity', value: 'O(n log n)' },
      { label: 'Framework', value: '9 stages' },
      { label: 'Scale target', value: '1M tokens' },
    ],
    proof: [
      'Replaced standard attention with a causal wave kernel evaluated via fast Fourier transforms.',
      'Designed signal gating to ensure the network retains precise contextual meaning over vast distances.',
      'Defended the architecture through a rigorous 9-stage framework proving viability and theoretical limits.',
    ],
    stack: ['Fourier Kernels', 'Green Functions', 'Content Gates', 'Attention'],
  },
  W06_EMI: {
    lead: 'A deterministic physics engine for engineering and optimizing electromagnetic shields.',
    role: 'Built the core physics solver, material microstructure models, and recommendation logic.',
    metrics: [
      { label: 'Sweep range', value: '1 MHz-10 GHz' },
      { label: 'Core model', value: 'R + A + B' },
      { label: 'Validation', value: 'Benchmarks' },
    ],
    proof: [
      'Computed precise reflection and absorption metrics across massive frequency sweeps.',
      'Modeled complex real-world variables, including alloy composition and grain-size conductivity.',
      'Automated the ranking of viable material combinations to hit specific engineering targets.',
    ],
    stack: ['Python', 'Schelkunoff', 'Transfer Matrix', 'Materials', 'Validation'],
  },
  W07_FORMULA: {
    lead: 'End-to-end race engineering and operations for a championship-winning student formula team.',
    role: 'Manufactured drivetrain components, laid custom carbon fiber, and secured corporate sponsorships.',
    metrics: [
      { label: 'Sponsorship', value: 'INR 60L' },
      { label: 'Carbon fiber', value: '3K twill' },
      { label: 'Formula Bharat', value: '1st + 2nd' },
    ],
    proof: [
      'Executed hands-on engine assembly, transmission tuning, and complex structural welding.',
      'Engineered and infused custom 3K twill carbon panels to optimize aerodynamics and vehicle mass.',
      'Secured massive sponsorships and delivered a vehicle that dominated national manufacturing events.',
    ],
    stack: [
      'Engine Assembly',
      'Transmission',
      'Carbon Fiber',
      'Sponsorship',
      'Formula Bharat',
    ],
  },
  W08_ABOUT: {
    lead: 'Systems-first engineer with software, AI, physics and product execution range.',
    role: 'I am strongest when the work needs architecture, implementation and defense.',
    metrics: [
      { label: 'Primary lane', value: 'AI systems' },
      { label: 'Execution style', value: 'End-to-end' },
      { label: 'Interview focus', value: 'Defense-ready' },
    ],
    proof: [
      'Production signal: multilingual voice AI, call intelligence and CV workflows.',
      'Engineering range: Python services, TypeScript surfaces, infra and testing loops.',
      'Defense posture: clear tradeoffs, bottlenecks, failure modes and next iterations.',
    ],
    stack: ['Python', 'TypeScript', 'React', 'Kubernetes', 'PostgreSQL', 'ML Systems'],
  },
  W09_CONNECT: {
    lead: 'Best fit: teams building AI products with real operational consequences.',
    role: 'The fastest next step is a technical screen or systems walkthrough.',
    metrics: [
      { label: 'Location', value: 'Bengaluru' },
      { label: 'Target', value: 'AI systems' },
      { label: 'Contact', value: 'Email' },
    ],
    proof: [
      'Email is the primary handoff path for role fit, interview loops and walkthroughs.',
      'GitHub shows build range; LinkedIn gives the recruiter context trail.',
      'Project defense is prepared around architecture, tradeoffs and bottlenecks.',
    ],
    stack: ['LinkedIn', 'GitHub', 'Email', 'Portfolio'],
  },
} satisfies Record<WorkPhase, WorkPanelDetail>;
