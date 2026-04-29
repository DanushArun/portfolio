// src/lib/copy.ts
// Locked copy from DRIVEX storyboard. Edit only via PR `chore: update copy`.

export const panelCopy = {
  W01_MIRA: {
    number: '01',
    eyebrow: 'MULTILINGUAL INTELLIGENT REAL-TIME AGENT',
    title: 'MIRA',
    body: 'Real-time voice AI agent that listens, understands and responds in 5 Indian languages at sub-100ms latency.',
    metric: { label: 'RESPONSE TIME', value: '482ms' },
    chips: ['REAL-TIME ASR', 'NLU', 'LLM ORCHESTRATION', 'MULTILINGUAL', 'PIPECAT', 'LOW LATENCY'],
    trail: ['NOISE', 'SIGNAL', 'UNDERSTANDING'],
    languages: ['தமிழ்', 'हिंदी', 'తెలుగు', 'ಕನ್ನಡ', 'বাংলা'],
  },
  W02_AIDEN: {
    number: '02',
    eyebrow: 'AI-DRIVEN ENGAGEMENT ANALYTICS',
    title: 'AIDEN',
    body: 'Conversation intelligence that turns every call into actionable insights across 8 SOP dimensions.',
    chips: ['DIARIZATION', 'SENTIMENT', 'SOP SCORING', 'LLM ANALYSIS', 'POST CALL INSIGHTS', 'ZOHO CRM'],
    trail: ['CONVERSATIONS', 'INSIGHTS', 'ACTION'],
    metricsAxes: ['Emotion', 'Intent Cluster', 'SOP Adherence', 'Engagement Score'],
  },
  W03_VANGUARD: {
    number: '03',
    eyebrow: 'AUTONOMOUS WEB TESTING AGENT',
    title: 'VANGUARD',
    body: 'AI agent that explores, tests and validates systems end-to-end without manual scripts.',
    chips: ['VLM + PLAYWRIGHT', 'AUTONOMOUS AGENT', 'SELF CORRECTION', 'VISUAL UNDERSTANDING', 'CONTINUOUS TESTING'],
    trail: ['EXPLORE', 'TEST', 'ADAPT', 'VALIDATE'],
    callouts: [
      { label: 'ISSUE DETECTED', sub: 'Element Overlap', tone: 'red' as const },
      { label: 'SELF HEALING', sub: 'Re-attempting…', tone: 'amber' as const },
      { label: 'TEST PASSED', sub: 'All Good', tone: 'green' as const },
    ],
  },
  W04_INSPECTION: {
    number: '04',
    eyebrow: 'AI POWERED VEHICLE INSPECTION',
    title: 'AI INSPECTION',
    body: 'Computer vision system that inspects 1000+ parts of a two wheeler with precision and consistency.',
    chips: ['COMPUTER VISION', 'DEFECT DETECTION', '3D RECONSTRUCTION', 'REAL-TIME SCAN', '1000+ PARTS', 'QUALITY ASSURANCE'],
    trail: ['SCAN', 'DETECT', 'ANALYZE', 'ASSURE'],
    layers: ['STRUCTURE', 'MECHANICAL', 'ELECTRICAL', 'COSMETIC', 'TYRES & WHEELS'],
  },
  W05_WAVEFIELD: {
    number: '05',
    eyebrow: 'WAVE FIELD LLM RESEARCH',
    title: 'WAVE FIELD',
    body: 'Breaking the quadratic barrier of attention with Wave Field Attention. O(n log n) complexity for massive scale.',
    chips: ['RESEARCH', 'ALGORITHM DESIGN', 'ATTENTION MECHANISM', 'O(n log n) COMPLEXITY', 'SCALABLE AI'],
    trail: ['RETHINK', 'RESEARCH', 'REDUCE COMPLEXITY'],
    comparison: {
      left: { label: 'STANDARD ATTENTION', complexity: 'O(n²)', metric: '1M tokens', sub: '~200,000× SLOWER' },
      right: { label: 'WAVE FIELD ATTENTION', complexity: 'O(n log n)', metric: '1M tokens', sub: 'STABLE & EFFICIENT' },
    },
  },
  W06_EMI: {
    number: '06',
    eyebrow: 'EMI SHIELDING DESIGNER & COMPUTATIONAL PHYSICS ENGINE',
    title: 'EMI ENGINE',
    body: 'Simulating electromagnetic fields to design smarter shielding solutions that perform in the real world.',
    chips: ['EM SIMULATION', 'MULTI-PHASE COMPOSITES', 'FREQUENCY SWEEP', 'JENKINS CI/CD', '20 YEAR LIFE PREDICTION'],
    trail: ['MODEL', 'SIMULATE', 'PREDICT', 'PROTECT'],
    sweepRange: '100 kHz – 10 GHz',
  },
  W07_FORMULA: {
    number: '07',
    eyebrow: 'FORMULA MANIPAL',
    title: 'FORMULA MANIPAL',
    body: 'Led autonomous path planning, controls and testing for FM23e EV. 1st in Cost & Manufacturing at Formula Bharat 2024.',
    chips: ['CONTROLS', 'PATH PLANNING', 'VEHICLE DYNAMICS', 'DATA LOGGING', 'SYSTEMS ENGINEERING'],
    trail: ['MODEL', 'OPTIMIZE', 'TEST', 'WIN'],
    legend: ['INITIAL PATH', 'OPTIMIZED PATH', 'TRACK BOUNDARY', 'BEST LINE'],
  },
  W08_ABOUT: {
    number: '08',
    eyebrow: 'ABOUT ME',
    title: 'SYSTEMS-FIRST ENGINEER',
    body: 'Systems-first engineer who loves building complex products that create real impact.',
    chips: ['SYSTEMS THINKER', 'FULL STACK BUILDER', 'PROBLEM SOLVER', 'RESEARCH DRIVEN', 'OWNERSHIP MINDSET'],
    trail: ['CURIOSITY', 'BUILD', 'IMPACT'],
    skills: ['AI SYSTEMS', 'SOFTWARE ENGINEERING', 'RESEARCH', 'PHYSICS & SIMULATION', 'PRODUCT THINKING', 'REAL WORLD IMPACT'],
  },
  W09_CONNECT: {
    number: '09',
    eyebrow: "LET'S CONNECT",
    title: "LET'S CONNECT",
    body: "Big problems need collaborative minds. Let's build the future together.",
    trail: ['CONNECT', 'COLLABORATE', 'CREATE IMPACT'],
    links: [
      { label: 'LINKEDIN', icon: 'linkedin', href: 'https://linkedin.com/in/danush-arun-5aa762267' },
      { label: 'GITHUB', icon: 'github', href: 'https://github.com/DanushArun' },
      { label: 'EMAIL', icon: 'mail', href: 'mailto:procx@partner.drivex.in' },
    ],
  },
} as const;

export type PanelCopy = typeof panelCopy;