import { TokenInfo, TransformerStage, AttentionHead, Tensor } from './types';

export const D_MODEL = 512;
export const N_HEADS = 8;
export const D_K = D_MODEL / N_HEADS;
export const D_FF = 2048;
export const VOCAB_SIZE = 50257;
export const INPUT_TEXT = 'The quick brown fox';
export const EMBED_DIM_DISPLAY = 8;

export const TOKENS: TokenInfo[] = [
  { text: 'The', id: 464 },
  { text: 'quick', id: 3285 },
  { text: 'brown', id: 1639 },
  { text: 'fox', id: 8746 },
];

export const N_TOKENS = TOKENS.length;

export const EMBEDDINGS: Tensor[] = TOKENS.map((_, i) => {
  const data = new Float32Array(EMBED_DIM_DISPLAY);
  for (let j = 0; j < EMBED_DIM_DISPLAY; j++) {
    data[j] = Math.sin(i * 0.8 + j * 0.5) * 0.5 + 0.5;
  }
  return { data, shape: [1, EMBED_DIM_DISPLAY] };
});

export const POSITIONAL_ENCODINGS: Tensor[] = TOKENS.map((_, pos) => {
  const data = new Float32Array(EMBED_DIM_DISPLAY);
  for (let i = 0; i < EMBED_DIM_DISPLAY; i++) {
    const divTerm = Math.pow(10000, (2 * i) / EMBED_DIM_DISPLAY);
    data[i] = pos % 2 === 0
      ? Math.sin(pos / divTerm)
      : Math.cos(pos / divTerm);
  }
  return { data, shape: [1, EMBED_DIM_DISPLAY] };
});

export const ATTENTION_HEADS: AttentionHead[] = Array.from({ length: N_HEADS }, (_, h) => {
  const weights = new Float32Array(N_TOKENS * N_TOKENS);
  for (let i = 0; i < N_TOKENS; i++) {
    let sum = 0;
    for (let j = 0; j < N_TOKENS; j++) {
      const val = Math.exp((i === j ? 2.0 : -0.5) + (h * 0.1));
      weights[i * N_TOKENS + j] = val;
      sum += val;
    }
    for (let j = 0; j < N_TOKENS; j++) {
      weights[i * N_TOKENS + j] /= sum;
    }
  }
  return {
    Q: { data: new Float32Array(N_TOKENS * D_K), shape: [N_TOKENS, D_K] },
    K: { data: new Float32Array(N_TOKENS * D_K), shape: [N_TOKENS, D_K] },
    V: { data: new Float32Array(N_TOKENS * D_K), shape: [N_TOKENS, D_K] },
    weights,
  };
});

export const OUTPUT_PROBS = [
  { word: 'jumps', prob: 0.31 },
  { word: 'runs', prob: 0.18 },
  { word: 'sleeps', prob: 0.12 },
  { word: 'hides', prob: 0.08 },
  { word: 'leaps', prob: 0.06 },
];

export const STAGES: TransformerStage[] = [
  {
    id: 'tokenize',
    label: '01',
    title: 'TOKENIZE',
    description: 'Split text into discrete tokens with unique IDs',
    formula: 'input → [token₁, token₂, ..., tokenₙ]',
  },
  {
    id: 'embed',
    label: '02',
    title: 'EMBED + POSITION',
    description: 'Map tokens to dense vectors, add positional encoding',
    formula: 'X = E[token] + PE(position)',
  },
  {
    id: 'attention',
    label: '03',
    title: 'MULTI-HEAD ATTENTION',
    description: 'Tokens communicate via Q·K·V across 8 attention heads',
    formula: 'Attention(Q,K,V) = softmax(QKᵀ/√dₖ)V',
  },
  {
    id: 'attn-output',
    label: '04',
    title: 'ATTENTION OUTPUT',
    description: 'Combine head outputs, add residual connection',
    formula: "X' = X + MultiHead(X)",
  },
  {
    id: 'layer-norm',
    label: '05',
    title: 'LAYER NORMALIZATION',
    description: 'Normalize distribution for stable training',
    formula: 'X_ln = γ·(X\'-μ)/σ + β',
  },
  {
    id: 'ffn',
    label: '06',
    title: 'FEED-FORWARD NETWORK',
    description: 'Independent MLP transformation per token',
    formula: 'FFN(x) = GELU(xW₁+b₁)W₂+b₂',
  },
  {
    id: 'output',
    label: '07',
    title: 'OUTPUT PROJECTION',
    description: 'Project to vocabulary, compute next-token probabilities',
    formula: 'P(token) = softmax(X\'\'·Eᵀ)',
  },
];
