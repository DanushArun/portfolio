# Transformer Inference Pipeline — Scroll-Driven Visualization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the click-driven TransformerViz with a scroll-driven, split-screen visualization showing the complete transformer forward pass with live math panels.

**Architecture:** Split-screen layout (60/40) with isolated Lenis scroll instance, GSAP ScrollTrigger driving a Zustand store, which synchronizes a Three.js 3D scene (left) with an HTML math panel (right). 7 scroll sections, one per pipeline stage.

**Tech Stack:** Next.js 16, React 19, Three.js/R3F/drei, GSAP + ScrollTrigger, Lenis, Zustand, Tailwind CSS v4, vitest, playwright

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/transformer/types.ts` | CREATE | Type definitions for tensors, matrices, stage config |
| `src/lib/transformer/constants.ts` | CREATE | Pre-computed transformer data (embeddings, weights, intermediates) |
| `src/lib/transformer/math.test.ts` | CREATE | Unit tests for all math functions (TDD: write FIRST) |
| `src/lib/transformer/math.ts` | CREATE | Computation functions (softmax, attention, layerNorm, FFN) |
| `src/lib/transformer-store.ts` | CREATE | Zustand store for transformer page state |
| `src/components/transformer/TokenNode.tsx` | CREATE | Reusable 3D token node component |
| `src/components/transformer/TokenNode.test.tsx` | CREATE | Test for TokenNode |
| `src/components/transformer/ConnectionLine.tsx` | CREATE | Animated data flow lines between nodes |
| `src/components/transformer/BlueprintGrid.tsx` | CREATE | Blueprint grid floor for 3D scene |
| `src/components/transformer/CameraRig.tsx` | CREATE | Camera controller driven by scroll progress |
| `src/components/transformer/stages/TokenizeStage.tsx` | CREATE | Stage 1: Tokenization 3D content |
| `src/components/transformer/stages/EmbedStage.tsx` | CREATE | Stage 2: Embedding + Positional 3D content |
| `src/components/transformer/stages/AttentionStage.tsx` | CREATE | Stage 3: Multi-Head Attention 3D content |
| `src/components/transformer/stages/AttnOutputStage.tsx` | CREATE | Stage 4: Attention Output + Residual 3D content |
| `src/components/transformer/stages/LayerNormStage.tsx` | CREATE | Stage 5: Layer Normalization 3D content |
| `src/components/transformer/stages/FFNStage.tsx` | CREATE | Stage 6: Feed-Forward Network 3D content |
| `src/components/transformer/stages/OutputStage.tsx` | CREATE | Stage 7: Output Projection + Softmax 3D content |
| `src/components/transformer/TransformerScene.tsx` | CREATE | R3F Canvas wrapper with all stage components |
| `src/components/transformer/MathPanel.tsx` | CREATE | Right-side calculation panel with stage content |
| `src/components/transformer/StageIndicator.tsx` | CREATE | Progress indicator showing current stage |
| `src/components/transformer/TransformerPage.tsx` | CREATE | Main page component: scroll sections, split layout, Lenis init |
| `src/app/transformer/page.tsx` | REPLACE | New page rendering TransformerPage |
| `tests/transformer/transformer.e2e.ts` | CREATE | Playwright e2e tests for scroll flow |
| `src/components/transformer/TransformerViz.tsx` | DELETE | Old click-driven component (514 lines) |

---

### Task 1: Type Definitions

**Files:**
- Create: `src/lib/transformer/types.ts`

- [ ] **Step 1: Create types**

```typescript
// src/lib/transformer/types.ts
export type Matrix = Float32Array;

export interface Tensor {
  data: Float32Array;
  shape: [number, number];
}

export interface TokenInfo {
  text: string;
  id: number;
}

export interface AttentionHead {
  Q: Tensor;
  K: Tensor;
  V: Tensor;
  weights: Matrix;
}

export interface TransformerStage {
  id: string;
  label: string;
  title: string;
  description: string;
  formula: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/transformer/types.ts
git commit -m "feat: add transformer type definitions"
```

---

### Task 2: Pre-computed Constants

**Files:**
- Create: `src/lib/transformer/constants.ts`

- [ ] **Step 1: Create constants**

```typescript
// src/lib/transformer/constants.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/transformer/constants.ts
git commit -m "feat: add transformer pre-computed constants"
```

---

### Task 3: Math Functions (TDD — Tests First)

**Files:**
- Create: `src/lib/transformer/math.test.ts`
- Create: `src/lib/transformer/math.ts`

- [ ] **Step 1: Write tests FIRST**

```typescript
// src/lib/transformer/math.test.ts
import { describe, it, expect } from 'vitest';
import { softmax, matMul, layerNorm, gelu, addTensors } from './math';
import { Tensor } from './types';

describe('softmax', () => {
  it('returns probabilities that sum to 1', () => {
    const input = new Float32Array([1, 2, 3]);
    const result = softmax(input);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('is numerically stable with large values', () => {
    const input = new Float32Array([1000, 1001, 1002]);
    const result = softmax(input);
    expect(result.every(v => v >= 0 && v <= 1)).toBe(true);
    expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });

  it('preserves relative ordering', () => {
    const input = new Float32Array([1, 3, 2]);
    const result = softmax(input);
    expect(result[1]).toBeGreaterThan(result[2]);
    expect(result[2]).toBeGreaterThan(result[0]);
  });
});

describe('matMul', () => {
  it('multiplies 2x2 matrices correctly', () => {
    const a: Tensor = {
      data: new Float32Array([1, 2, 3, 4]),
      shape: [2, 2],
    };
    const b: Tensor = {
      data: new Float32Array([5, 6, 7, 8]),
      shape: [2, 2],
    };
    const result = matMul(a, b);
    expect(result.shape).toEqual([2, 2]);
    expect(result.data[0]).toBe(19);
    expect(result.data[3]).toBe(43);
  });

  it('throws on shape mismatch', () => {
    const a: Tensor = { data: new Float32Array([1, 2]), shape: [1, 2] };
    const b: Tensor = { data: new Float32Array([1, 2]), shape: [1, 2] };
    expect(() => matMul(a, b)).toThrow();
  });
});

describe('layerNorm', () => {
  it('normalizes to mean=0', () => {
    const input = new Float32Array([1, 2, 3, 4, 5]);
    const result = layerNorm(input);
    const mean = result.reduce((a, b) => a + b, 0) / result.length;
    expect(mean).toBeCloseTo(0, 5);
  });

  it('handles zero variance with eps', () => {
    const input = new Float32Array([5, 5, 5, 5]);
    const result = layerNorm(input);
    expect(result.every(v => !isNaN(v))).toBe(true);
  });
});

describe('gelu', () => {
  it('returns positive values for positive inputs', () => {
    const input = new Float32Array([1, 2, 3]);
    const result = gelu(input);
    expect(result.every(v => v > 0)).toBe(true);
  });

  it('returns near-zero for zero input', () => {
    const input = new Float32Array([0]);
    const result = gelu(input);
    expect(result[0]).toBeCloseTo(0, 3);
  });
});

describe('addTensors', () => {
  it('adds tensors element-wise', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const result = addTensors(a, b);
    expect(Array.from(result)).toEqual([5, 7, 9]);
  });

  it('throws on length mismatch', () => {
    const a = new Float32Array([1, 2]);
    const b = new Float32Array([1, 2, 3]);
    expect(() => addTensors(a, b)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- src/lib/transformer/math.test.ts
```

Expected: FAIL with "module not found" or "function not defined"

- [ ] **Step 3: Write implementation**

```typescript
// src/lib/transformer/math.ts
import { Tensor } from './types';

export function softmax(input: Float32Array): Float32Array {
  const maxVal = Math.max(...input);
  const exps = new Float32Array(input.length);
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    exps[i] = Math.exp(input[i] - maxVal);
    sum += exps[i];
  }
  const result = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    result[i] = exps[i] / sum;
  }
  return result;
}

export function matMul(a: Tensor, b: Tensor): Tensor {
  const [aRows, aCols] = a.shape;
  const [bRows, bCols] = b.shape;
  if (aCols !== bRows) throw new Error(`Matrix shape mismatch: ${aCols} !== ${bRows}`);
  const result = new Float32Array(aRows * bCols);
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += a.data[i * aCols + k] * b.data[k * bCols + j];
      }
      result[i * bCols + j] = sum;
    }
  }
  return { data: result, shape: [aRows, bCols] };
}

export function layerNorm(input: Float32Array, eps = 1e-8): Float32Array {
  const n = input.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += input[i];
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (input[i] - mean) ** 2;
  const std = Math.sqrt(varSum / n + eps);
  const result = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = (input[i] - mean) / std;
  }
  return result;
}

export function gelu(input: Float32Array): Float32Array {
  const result = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const x = input[i];
    result[i] = x * 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
  }
  return result;
}

export function addTensors(a: Float32Array, b: Float32Array): Float32Array {
  if (a.length !== b.length) throw new Error('Tensor length mismatch');
  const result = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] + b[i];
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- src/lib/transformer/math.test.ts
```

Expected: All 11 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/transformer/math.test.ts src/lib/transformer/math.ts
git commit -m "feat: add transformer math functions with TDD"
```

---

### Task 4: Zustand Store

**Files:**
- Create: `src/lib/transformer-store.ts`

- [ ] **Step 1: Create store**

```typescript
// src/lib/transformer-store.ts
import { create } from 'zustand';

export interface TransformerStore {
  currentStage: number;
  scrollProgress: number;
  globalProgress: number;
  setStage: (stage: number) => void;
  setScrollProgress: (progress: number) => void;
  setGlobalProgress: (progress: number) => void;
  reset: () => void;
}

export const useTransformer = create<TransformerStore>((set) => ({
  currentStage: 0,
  scrollProgress: 0,
  globalProgress: 0,
  setStage: (stage) => set({ currentStage: stage }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setGlobalProgress: (globalProgress) => set({
    globalProgress,
    currentStage: Math.min(6, Math.floor(globalProgress * 7)),
  }),
  reset: () => set({ currentStage: 0, scrollProgress: 0, globalProgress: 0 }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/transformer-store.ts
git commit -m "feat: add transformer Zustand store"
```

---

### Task 5: TokenNode + ConnectionLine + Tests

**Files:**
- Create: `src/components/transformer/TokenNode.tsx`
- Create: `src/components/transformer/TokenNode.test.tsx`
- Create: `src/components/transformer/ConnectionLine.tsx`

- [ ] **Step 1: Create TokenNode**

```typescript
// src/components/transformer/TokenNode.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export default function TokenNode({ position, token, hue, isActive }: {
  position: [number, number, number];
  token: string;
  hue: number;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={`hsl(${hue}, 60%, 50%)`}
          roughness={0.2}
          metalness={0.8}
          emissive={`hsl(${hue}, 60%, 30%)`}
          emissiveIntensity={isActive ? 0.5 : 0.1}
        />
      </mesh>
      <Text position={[0, 0.5, 0]} fontSize={0.15} color="#F0E4D2" anchorX="center" anchorY="middle">
        {token}
      </Text>
    </group>
  );
}
```

- [ ] **Step 2: Create TokenNode test**

```typescript
// src/components/transformer/TokenNode.test.tsx
import { describe, it, expect } from 'vitest';
import Renderer from '@react-three/test-renderer';
import TokenNode from './TokenNode';

describe('TokenNode', () => {
  it('renders with correct position and token label', async () => {
    const renderer = await Renderer.create(
      <TokenNode position={[1, 2, 3]} token="test" hue={30} isActive />
    );
    const scene = renderer.toScene();
    expect(scene).toBeDefined();
  });
});
```

- [ ] **Step 3: Create ConnectionLine**

```typescript
// src/components/transformer/ConnectionLine.tsx
'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function ConnectionLine({ from, to, weight, hue }: {
  from: [number, number, number];
  to: [number, number, number];
  weight: number;
  hue: number;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const points = [
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ];
    geo.setFromPoints(points);
    return geo;
  }, [from, to]);

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color={`hsl(${hue}, 70%, 60%)`}
        transparent
        opacity={weight * 0.5}
      />
    </line>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/transformer/TokenNode.tsx src/components/transformer/TokenNode.test.tsx src/components/transformer/ConnectionLine.tsx
git commit -m "feat: add TokenNode and ConnectionLine 3D components"
```

---

### Task 6: Blueprint Grid + Camera Rig

**Files:**
- Create: `src/components/transformer/BlueprintGrid.tsx`
- Create: `src/components/transformer/CameraRig.tsx`

- [ ] **Step 1: Create BlueprintGrid**

```typescript
// src/components/transformer/BlueprintGrid.tsx
'use client';

import * as THREE from 'three';

export default function BlueprintGrid() {
  return (
    <group>
      <gridHelper args={[20, 20, 0x222233, 0x111122]} position={[0, -3, 0]} />
      <line>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-10, -3, 0, 10, -3, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={0x334455} />
      </line>
      <line>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -3, -10, 0, -3, 10]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={0x334455} />
      </line>
    </group>
  );
}
```

- [ ] **Step 2: Create CameraRig**

```typescript
// src/components/transformer/CameraRig.tsx
'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useTransformer } from '@/lib/transformer-store';

const CAMERA_POSITIONS: { pos: [number, number, number]; target: [number, number, number] }[] = [
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 3, 10], target: [0, 0, 0] },
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 2, 10], target: [0, 0, 0] },
];

export default function CameraRig() {
  const { camera } = useThree();
  const currentStage = useTransformer((s) => s.currentStage);
  const scrollProgress = useTransformer((s) => s.scrollProgress);

  useFrame(() => {
    const stageCam = CAMERA_POSITIONS[currentStage];
    const nextCam = CAMERA_POSITIONS[Math.min(currentStage + 1, 6)];
    const t = scrollProgress;

    const targetX = stageCam.pos[0] + (nextCam.pos[0] - stageCam.pos[0]) * t;
    const targetY = stageCam.pos[1] + (nextCam.pos[1] - stageCam.pos[1]) * t;
    const targetZ = stageCam.pos[2] + (nextCam.pos[2] - stageCam.pos[2]) * t;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/transformer/BlueprintGrid.tsx src/components/transformer/CameraRig.tsx
git commit -m "feat: add BlueprintGrid and CameraRig"
```

---

### Task 7: TokenizeStage

**Files:**
- Create: `src/components/transformer/stages/TokenizeStage.tsx`

- [ ] **Step 1: Create TokenizeStage**

```typescript
// src/components/transformer/stages/TokenizeStage.tsx
'use client';

import { useTransformer } from '@/lib/transformer-store';
import { TOKENS } from '@/lib/transformer/constants';
import TokenNode from '../TokenNode';

const HUES = [30, 170, 210, 340];

export default function TokenizeStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 0) return null;

  return (
    <group>
      {TOKENS.map((token, i) => (
        <TokenNode
          key={token.id}
          position={[i * 2 - 3, 0, 0]}
          token={token.text}
          hue={HUES[i]}
          isActive
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/stages/TokenizeStage.tsx
git commit -m "feat: add TokenizeStage component"
```

---

### Task 8: EmbedStage

**Files:**
- Create: `src/components/transformer/stages/EmbedStage.tsx`

- [ ] **Step 1: Create EmbedStage**

```typescript
// src/components/transformer/stages/EmbedStage.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useTransformer } from '@/lib/transformer-store';
import { TOKENS, EMBEDDINGS, EMBED_DIM_DISPLAY } from '@/lib/transformer/constants';

const HUES = [30, 170, 210, 340];

function EmbedBars({ position, hue, values }: {
  position: [number, number, number];
  hue: number;
  values: Float32Array;
}) {
  return (
    <group position={position}>
      {Array.from({ length: EMBED_DIM_DISPLAY }).map((_, i) => {
        const height = values[i] * 1.5 + 0.1;
        return (
          <mesh key={i} position={[(i - EMBED_DIM_DISPLAY / 2) * 0.15, height / 2, 0]}>
            <boxGeometry args={[0.08, height, 0.08]} />
            <meshStandardMaterial
              color={`hsl(${hue + i * 10}, 60%, 50%)`}
              emissive={`hsl(${hue + i * 10}, 60%, 20%)`}
              emissiveIntensity={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function EmbedStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 1) return null;

  return (
    <group>
      {TOKENS.map((token, i) => (
        <group key={token.id} position={[i * 2 - 3, 0, 0]}>
          <EmbedBars position={[0, 0, 0]} hue={HUES[i]} values={EMBEDDINGS[i].data} />
          <Text position={[0, -0.8, 0]} fontSize={0.12} color="#F0E4D2" anchorX="center" anchorY="middle">
            {token.text}
          </Text>
        </group>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/stages/EmbedStage.tsx
git commit -m "feat: add EmbedStage component"
```

---

### Task 9: AttentionStage

**Files:**
- Create: `src/components/transformer/stages/AttentionStage.tsx`

- [ ] **Step 1: Create AttentionStage**

```typescript
// src/components/transformer/stages/AttentionStage.tsx
'use client';

import { useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useTransformer } from '@/lib/transformer-store';
import { TOKENS, ATTENTION_HEADS, N_TOKENS } from '@/lib/transformer/constants';
import TokenNode from '../TokenNode';
import ConnectionLine from '../ConnectionLine';

const HUES = [30, 170, 210, 340];

export default function AttentionStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 2) return null;

  const weights = ATTENTION_HEADS[0].weights;

  return (
    <group>
      {/* Q, K, V labels */}
      <Text position={[-3, 2, 0]} fontSize={0.15} color="#FFA85C" anchorX="center" anchorY="middle">Q</Text>
      <Text position={[-3, 0, 0]} fontSize={0.15} color="#4ECDC4" anchorX="center" anchorY="middle">K</Text>
      <Text position={[-3, -2, 0]} fontSize={0.15} color="#45B7D1" anchorX="center" anchorY="middle">V</Text>

      {/* Token nodes */}
      {TOKENS.map((token, i) => (
        <TokenNode
          key={token.id}
          position={[i * 2 - 3, -3.5, 0]}
          token={token.text}
          hue={HUES[i]}
          isActive
        />
      ))}

      {/* Attention connections */}
      {Array.from({ length: N_TOKENS }).map((_, i) =>
        Array.from({ length: N_TOKENS }).map((_, j) => (
          <ConnectionLine
            key={`${i}-${j}`}
            from={[i * 2 - 3, -3.5, 0]}
            to={[j * 2 - 3, -3.5, 0]}
            weight={weights[i * N_TOKENS + j]}
            hue={HUES[i]}
          />
        ))
      )}

      {/* Formula label */}
      <Text position={[0, 3.5, 0]} fontSize={0.12} color="#F0E4D2/60" anchorX="center" anchorY="middle">
        A = softmax(Q·Kᵀ / √d)
      </Text>
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/stages/AttentionStage.tsx
git commit -m "feat: add AttentionStage component"
```

---

### Task 10: AttnOutputStage

**Files:**
- Create: `src/components/transformer/stages/AttnOutputStage.tsx`

- [ ] **Step 1: Create AttnOutputStage**

```typescript
// src/components/transformer/stages/AttnOutputStage.tsx
'use client';

import { Text } from '@react-three/drei';
import { useTransformer } from '@/lib/transformer-store';
import { TOKENS } from '@/lib/transformer/constants';
import TokenNode from '../TokenNode';

const HUES = [30, 170, 210, 340];

export default function AttnOutputStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 3) return null;

  return (
    <group>
      {TOKENS.map((token, i) => (
        <TokenNode
          key={token.id}
          position={[i * 2 - 3, 0, 0]}
          token={token.text}
          hue={HUES[i]}
          isActive
        />
      ))}
      <Text position={[0, -2, 0]} fontSize={0.12} color="#F0E4D2/60" anchorX="center" anchorY="middle">
        X&apos; = X + MultiHeadOutput
      </Text>
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/stages/AttnOutputStage.tsx
git commit -m "feat: add AttnOutputStage component"
```

---

### Task 11: LayerNormStage

**Files:**
- Create: `src/components/transformer/stages/LayerNormStage.tsx`

- [ ] **Step 1: Create LayerNormStage**

```typescript
// src/components/transformer/stages/LayerNormStage.tsx
'use client';

import { Text } from '@react-three/drei';
import { useTransformer } from '@/lib/transformer-store';
import { TOKENS } from '@/lib/transformer/constants';
import TokenNode from '../TokenNode';

const HUES = [30, 170, 210, 340];

export default function LayerNormStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 4) return null;

  return (
    <group>
      {TOKENS.map((token, i) => (
        <TokenNode
          key={token.id}
          position={[i * 2 - 3, 0, 0]}
          token={token.text}
          hue={HUES[i]}
          isActive
        />
      ))}
      <Text position={[0, -2, 0]} fontSize={0.12} color="#F0E4D2/60" anchorX="center" anchorY="middle">
        μ = 0, σ = 1
      </Text>
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/stages/LayerNormStage.tsx
git commit -m "feat: add LayerNormStage component"
```

---

### Task 12: FFNStage

**Files:**
- Create: `src/components/transformer/stages/FFNStage.tsx`

- [ ] **Step 1: Create FFNStage**

```typescript
// src/components/transformer/stages/FFNStage.tsx
'use client';

import { Text } from '@react-three/drei';
import { useTransformer } from '@/lib/transformer-store';
import { TOKENS } from '@/lib/transformer/constants';
import TokenNode from '../TokenNode';

const HUES = [60, 200, 240, 370];

export default function FFNStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 5) return null;

  return (
    <group>
      {TOKENS.map((token, i) => (
        <TokenNode
          key={token.id}
          position={[i * 2 - 3, 0, 0]}
          token={token.text}
          hue={HUES[i]}
          isActive
        />
      ))}
      <Text position={[0, -2, 0]} fontSize={0.12} color="#F0E4D2/60" anchorX="center" anchorY="middle">
        Linear → GELU → Linear
      </Text>
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/stages/FFNStage.tsx
git commit -m "feat: add FFNStage component"
```

---

### Task 13: OutputStage

**Files:**
- Create: `src/components/transformer/stages/OutputStage.tsx`

- [ ] **Step 1: Create OutputStage**

```typescript
// src/components/transformer/stages/OutputStage.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useTransformer } from '@/lib/transformer-store';
import { OUTPUT_PROBS } from '@/lib/transformer/constants';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

export default function OutputStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 6) return null;

  return (
    <group>
      {OUTPUT_PROBS.map((p, i) => (
        <group key={i} position={[(i - OUTPUT_PROBS.length / 2) * 0.6, 0, 0]}>
          <mesh position={[0, p.prob * 1.5, 0]}>
            <boxGeometry args={[0.35, p.prob * 3, 0.35]} />
            <meshStandardMaterial
              color={COLORS[i]}
              emissive={COLORS[i]}
              emissiveIntensity={0.3}
            />
          </mesh>
          <Text position={[0, -0.5, 0]} fontSize={0.1} color="#F0E4D2" anchorX="center" anchorY="middle">
            {p.word}
          </Text>
          <Text position={[0, p.prob * 3 + 0.25, 0]} fontSize={0.1} color={COLORS[i]} anchorX="center" anchorY="middle">
            {(p.prob * 100).toFixed(0)}%
          </Text>
        </group>
      ))}
      <Text position={[0, -2.5, 0]} fontSize={0.12} color="#F0E4D2/60" anchorX="center" anchorY="middle">
        softmax(logits) → probabilities
      </Text>
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/stages/OutputStage.tsx
git commit -m "feat: add OutputStage component"
```

---

### Task 14: TransformerScene (assembles all stages)

**Files:**
- Create: `src/components/transformer/TransformerScene.tsx`

- [ ] **Step 1: Create TransformerScene**

```typescript
// src/components/transformer/TransformerScene.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import BlueprintGrid from './BlueprintGrid';
import CameraRig from './CameraRig';
import TokenizeStage from './stages/TokenizeStage';
import EmbedStage from './stages/EmbedStage';
import AttentionStage from './stages/AttentionStage';
import AttnOutputStage from './stages/AttnOutputStage';
import LayerNormStage from './stages/LayerNormStage';
import FFNStage from './stages/FFNStage';
import OutputStage from './stages/OutputStage';

export default function TransformerScene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 50 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />

      <BlueprintGrid />
      <CameraRig />

      <TokenizeStage />
      <EmbedStage />
      <AttentionStage />
      <AttnOutputStage />
      <LayerNormStage />
      <FFNStage />
      <OutputStage />
    </Canvas>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/TransformerScene.tsx
git commit -m "feat: add TransformerScene orchestrator"
```

---

### Task 15: MathPanel

**Files:**
- Create: `src/components/transformer/MathPanel.tsx`

- [ ] **Step 1: Create MathPanel**

```typescript
// src/components/transformer/MathPanel.tsx
'use client';

import { useTransformer } from '@/lib/transformer-store';
import { STAGES, TOKENS, EMBEDDINGS, ATTENTION_HEADS, OUTPUT_PROBS, EMBED_DIM_DISPLAY } from '@/lib/transformer/constants';

function MatrixDisplay({ values, rows, cols, label }: {
  values: Float32Array;
  rows: number;
  cols: number;
  label: string;
}) {
  const displayRows = Math.min(rows, 4);
  const displayCols = Math.min(cols, 8);

  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2 font-[var(--font-composer)]">
        {label}
      </div>
      <div className="font-[var(--font-composer)] text-xs space-y-1">
        {Array.from({ length: displayRows }).map((_, i) => (
          <div key={i} className="flex gap-1">
            {Array.from({ length: displayCols }).map((_, j) => {
              const val = values[i * cols + j];
              return (
                <span
                  key={j}
                  className="px-1.5 py-0.5 rounded bg-[#F0E4D2]/5 text-[#F0E4D2]/80"
                  title={val.toFixed(4)}
                >
                  {val.toFixed(2)}
                </span>
              );
            })}
            {cols > displayCols && <span className="text-[#F0E4D2]/30">...</span>}
          </div>
        ))}
        {rows > displayRows && <div className="text-[#F0E4D2]/30">...</div>}
      </div>
    </div>
  );
}

export default function MathPanel() {
  const currentStage = useTransformer((s) => s.currentStage);
  const stage = STAGES[currentStage];

  return (
    <div className="p-6 font-[var(--font-composer)]">
      <div className="mb-6 pb-4 border-b border-[#F0E4D2]/10">
        <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-1">
          {stage.label}
        </div>
        <h2 className="text-lg text-[#F0E4D2] mb-2">{stage.title}</h2>
        <p className="text-sm text-[#F0E4D2]/60">{stage.description}</p>
      </div>

      <div className="mb-6 p-4 rounded bg-[#F0E4D2]/5 border border-[#F0E4D2]/10">
        <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2">
          Formula
        </div>
        <code className="text-sm text-[#FFA85C]">{stage.formula}</code>
      </div>

      {currentStage === 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2">Input Text</div>
          <div className="text-sm text-[#F0E4D2] mb-4">&quot;The quick brown fox&quot;</div>
          <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2">Token IDs</div>
          <div className="space-y-1">
            {TOKENS.map((t) => (
              <div key={t.id} className="flex justify-between text-xs">
                <span className="text-[#F0E4D2]">{t.text}</span>
                <span className="text-[#FFA85C]">{t.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStage === 1 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2">
            Embeddings (d_model={EMBED_DIM_DISPLAY} for display)
          </div>
          {TOKENS.map((token, i) => (
            <MatrixDisplay
              key={token.id}
              values={EMBEDDINGS[i].data}
              rows={1}
              cols={EMBED_DIM_DISPLAY}
              label={token.text}
            />
          ))}
        </div>
      )}

      {currentStage === 2 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2">
            Attention Weights (Head 1)
          </div>
          <MatrixDisplay
            values={ATTENTION_HEADS[0].weights}
            rows={4}
            cols={4}
            label="softmax(QKᵀ/√dₖ)"
          />
          <div className="text-xs text-[#F0E4D2]/40 mt-2">8 heads total, dₖ = 64 per head</div>
        </div>
      )}

      {currentStage === 3 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2">Residual Connection</div>
          <div className="text-xs text-[#F0E4D2]/60 mb-2">X&apos; = X + MultiHeadOutput</div>
          <div className="text-xs text-[#F0E4D2]/40">Attention output added to original embedding</div>
        </div>
      )}

      {currentStage === 4 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2">Layer Normalization</div>
          <div className="text-xs text-[#F0E4D2]/60 mb-2">μ = mean(X&apos;), σ = std(X&apos;)</div>
          <div className="text-xs text-[#F0E4D2]/60 mb-2">X_ln = γ · (X&apos; - μ) / σ + β</div>
          <div className="text-xs text-[#F0E4D2]/40">Normalizes to mean=0, std=1 with learnable γ, β</div>
        </div>
      )}

      {currentStage === 5 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2">Feed-Forward Network</div>
          <div className="text-xs text-[#F0E4D2]/60 mb-2">FFN(x) = GELU(xW₁ + b₁)W₂ + b₂</div>
          <div className="text-xs text-[#F0E4D2]/40">W₁: 512 → 2048, W₂: 2048 → 512</div>
        </div>
      )}

      {currentStage === 6 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#FFA85C]/60 mb-2">Output Probabilities</div>
          <div className="space-y-2">
            {OUTPUT_PROBS.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[#F0E4D2] w-16">{p.word}</span>
                <div className="flex-1 h-4 bg-[#F0E4D2]/5 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#FFA85C]/60 rounded"
                    style={{ width: `${p.prob * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#FFA85C] w-12 text-right">
                  {(p.prob * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/MathPanel.tsx
git commit -m "feat: add MathPanel component with stage-specific content"
```

---

### Task 16: StageIndicator

**Files:**
- Create: `src/components/transformer/StageIndicator.tsx`

- [ ] **Step 1: Create StageIndicator**

```typescript
// src/components/transformer/StageIndicator.tsx
'use client';

import { useTransformer } from '@/lib/transformer-store';
import { STAGES } from '@/lib/transformer/constants';

export default function StageIndicator() {
  const currentStage = useTransformer((s) => s.currentStage);
  const globalProgress = useTransformer((s) => s.globalProgress);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#08070a]/85 backdrop-blur-sm border border-[#F0E4D2]/15">
        {STAGES.map((stage, i) => (
          <div
            key={stage.id}
            className={`flex items-center gap-2 ${i <= currentStage ? 'opacity-100' : 'opacity-30'}`}
          >
            <div className={`w-2 h-2 rounded-full transition-colors ${i === currentStage ? 'bg-[#FFA85C]' : 'bg-[#F0E4D2]/30'}`} />
            <span className="text-[10px] uppercase tracking-widest font-[var(--font-composer)] text-[#F0E4D2]/60">
              {stage.label}
            </span>
            {i < STAGES.length - 1 && <div className="w-4 h-px bg-[#F0E4D2]/15" />}
          </div>
        ))}
        <div className="ml-3 text-[10px] font-[var(--font-composer)] text-[#FFA85C]/60">
          {(globalProgress * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transformer/StageIndicator.tsx
git commit -m "feat: add StageIndicator component"
```

---

### Task 17: TransformerPage (assembles everything + scroll orchestration)

**Files:**
- Create: `src/components/transformer/TransformerPage.tsx`
- Modify: `src/app/transformer/page.tsx`

- [ ] **Step 1: Create TransformerPage**

```typescript
// src/components/transformer/TransformerPage.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTransformer } from '@/lib/transformer-store';
import { STAGES } from '@/lib/transformer/constants';
import TransformerScene from './TransformerScene';
import MathPanel from './MathPanel';
import StageIndicator from './StageIndicator';

gsap.registerPlugin(ScrollTrigger);

export default function TransformerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const setGlobalProgress = useTransformer((s) => s.setGlobalProgress);
  const reset = useTransformer((s) => s.reset);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const sectionHeight = window.innerHeight;

    if (containerRef.current) {
      const trigger = ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${sectionHeight * STAGES.length}`,
        scrub: 1,
        pin: true,
        onUpdate: (self) => {
          setGlobalProgress(self.progress);
        },
      });
      triggerRef.current = trigger;
    }

    return () => {
      lenis.destroy();
      triggerRef.current?.kill();
      reset();
    };
  }, [setGlobalProgress, reset]);

  return (
    <div ref={containerRef} className="relative bg-[#08070a]">
      <div style={{ height: `${STAGES.length * 100}vh` }}>
        <div className="fixed inset-0 flex flex-col lg:flex-row">
          <div className="w-full lg:w-[60%] h-[50vh] lg:h-full relative">
            <TransformerScene />
          </div>
          <div className="w-full lg:w-[40%] h-[50vh] lg:h-full overflow-y-auto border-l border-[#F0E4D2]/10">
            <MathPanel />
          </div>
        </div>
        <StageIndicator />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update page.tsx**

```typescript
// src/app/transformer/page.tsx
import TransformerPage from '@/components/transformer/TransformerPage';

export default function Page() {
  return <TransformerPage />;
}
```

- [ ] **Step 3: Delete old TransformerViz.tsx**

```bash
rm src/components/transformer/TransformerViz.tsx
```

- [ ] **Step 4: Run typecheck and lint**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 5: Run dev server to verify**

```bash
npm run dev
```

Navigate to http://localhost:3000/transformer and verify scroll drives stages.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: assemble transformer page with scroll orchestration, remove old component"
```

---

### Task 18: E2E Tests

**Files:**
- Create: `tests/transformer/transformer.e2e.ts`

- [ ] **Step 1: Create e2e test**

```typescript
// tests/transformer/transformer.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Transformer Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transformer');
    await page.waitForTimeout(1000);
  });

  test('loads the transformer page', async ({ page }) => {
    await expect(page).toHaveTitle(/Transformer/);
  });

  test('shows initial stage content', async ({ page }) => {
    const stageLabel = page.locator('text=01');
    await expect(stageLabel).toBeVisible();
  });

  test('math panel shows formula', async ({ page }) => {
    const formula = page.locator('text=Formula');
    await expect(formula).toBeVisible();
  });

  test('scroll progression updates stage indicator', async ({ page }) => {
    const progressText = page.locator('text=/\\d+%/');
    await expect(progressText).toHaveText('0%');

    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await page.waitForTimeout(500);

    const newProgress = page.locator('text=/\\d+%/');
    await expect(newProgress).not.toHaveText('0%');
  });

  test('responsive layout at mobile breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const splitLayout = page.locator('.flex-col');
    await expect(splitLayout).toBeVisible();
  });
});
```

- [ ] **Step 2: Run e2e tests**

```bash
npm run test:e2e -- tests/transformer/transformer.e2e.ts
```

- [ ] **Step 3: Commit**

```bash
git add tests/transformer/transformer.e2e.ts
git commit -m "test: add transformer e2e tests"
```

---

### Task 19: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npm run test && npm run test:e2e && npm run typecheck && npm run lint
```

- [ ] **Step 2: Manual verification**

Navigate to http://localhost:3000/transformer and verify:
- All 7 stages render correctly on scroll
- Math panel updates with stage data
- 3D scene performs smoothly
- Mobile layout stacks vertically at lg breakpoint
- Stage indicator shows progress

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final verification pass"
```
