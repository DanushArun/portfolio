# Transformer Inference Pipeline — Scroll-Driven Visualization

## Overview

A scroll-driven, split-screen visualization of the complete transformer forward pass. Left side: 3D blueprint-style scene showing tokens flowing through the pipeline. Right side: live calculation panel showing actual matrix operations step-by-step.

## User Selections

- **Design Direction**: Story-Driven Journey (C)
- **Visual Style**: Technical / Blueprint (B)
- **Narrative Structure**: Scroll-Driven (C)
- **Calculation Visibility**: Side Panel Math (B) — clear and accessible
- **Scope**: Full Inference Pipeline (C)

## Architecture

### Layout

- Split-screen: 60% left (3D scene), 40% right (calculation panel)
- Full viewport height per stage
- 7 scroll sections total
- Lenis smooth scroll + GSAP ScrollTrigger for orchestration

### Tech Stack

- Next.js 16 (existing)
- Three.js / @react-three/fiber / @react-three/drei (existing)
- GSAP + ScrollTrigger (existing)
- Lenis (existing)
- Tailwind CSS v4 (existing)

### Type Definitions

```typescript
type Matrix = Float32Array;  // Row-major, shape tracked separately
type Vector = Float32Array;

interface Tensor {
  data: Float32Array;
  shape: [number, number];  // [rows, cols]
}

interface TransformerStage {
  id: string;
  label: string;
  title: string;
  description: string;
  formula: string;
}
```

### File Structure

```
src/
  app/
    transformer/
      page.tsx              # Main page with scroll sections
      layout.tsx            # Existing metadata
  components/
    transformer/
      TransformerScene.tsx  # Main 3D scene orchestrator
      stages/
        TokenizeStage.tsx   # Stage 1: Tokenization
        EmbedStage.tsx      # Stage 2: Embedding + Positional
        AttentionStage.tsx  # Stage 3: Multi-Head Attention
        AttnOutputStage.tsx # Stage 4: Attention Output + Residual
        LayerNormStage.tsx  # Stage 5: Layer Normalization
        FFNStage.tsx        # Stage 6: Feed-Forward Network
        OutputStage.tsx     # Stage 7: Output Projection + Softmax
      MathPanel.tsx         # Right-side calculation panel
      StageIndicator.tsx    # Progress indicator
      BlueprintGrid.tsx     # Blueprint grid floor
      TokenNode.tsx         # Reusable token node component
      ConnectionLine.tsx    # Animated data flow lines
  hooks/
    useScrollProgress.ts    # Scroll position tracking
  lib/
    transformer/
      math.ts               # Actual computation functions
      types.ts              # Type definitions
      constants.ts          # Pipeline constants (d_model, n_heads, etc.)
```

## Pipeline Stages

### Stage 1: Input & Tokenization

**3D Scene**: Input text "The quick brown fox" appears, splits into 4 token nodes with IDs.

**Math Panel**:
- Input: "The quick brown fox"
- Token IDs: [464, 3285, 1639, 8746]
- Vocabulary size: 50,257

### Stage 2: Embedding & Positional Encoding

**3D Scene**: Token nodes expand into vector bars. Positional encoding waves overlay.

**Math Panel**:
- Embedding lookup: token_id → E[token_id] ∈ ℝ^(d_model)
- d_model = 512
- Positional encoding: PE(pos, 2i) = sin(pos/10000^(2i/d_model))
- Final: X = E + PE

### Stage 3: Multi-Head Attention

**3D Scene**: 4 token nodes connect to Q, K, V projection matrices. 8 attention heads shown as parallel computation streams.

**Math Panel**:
- Q = XW^Q, K = XW^K, V = XW^V
- W^Q, W^K, W^V ∈ ℝ^(d_model × d_k)
- Attention(Q,K,V) = softmax(QK^T / √d_k)V
- 8 heads, d_k = d_model / n_heads = 512 / 8 = 64 per head
- Show actual 4×4 attention weight matrix per head

### Stage 4: Attention Output & Residual

**3D Scene**: Attention-weighted values flow back to token positions. Residual connection shown as parallel path.

**Math Panel**:
- MultiHeadOutput = Concat(head_1, ..., head_8)W^O
- Residual: X' = X + MultiHeadOutput
- Show before/after values

### Stage 5: Layer Normalization

**3D Scene**: Distribution visualization — histogram normalizing to mean=0, std=1.

**Math Panel**:
- μ = mean(X'), σ = std(X')
- X_norm = (X' - μ) / σ
- Learnable: X_ln = γ · X_norm + β
- Show γ, β parameters

### Stage 6: Feed-Forward Network

**3D Scene**: Each token passes through independent MLP. Two linear layers with GELU activation between.

**Math Panel**:
- FFN(x) = GELU(xW_1 + b_1)W_2 + b_2
- W_1 ∈ ℝ^(d_model × d_ff), W_2 ∈ ℝ^(d_ff × d_model)
- d_ff = 2048
- Residual: X'' = X_ln + FFN(X_ln)

### Stage 7: Output Projection & Softmax

**3D Scene**: Final token representation projects to vocabulary space. Top-5 predictions shown as bars.

**Math Panel**:
- logits = X'' · E^T (unembedding)
- softmax(logits)_i = exp(logits_i) / Σ exp(logits_j)
- Top-5 predictions with probabilities
- Temperature parameter shown

## Math Panel Design

### Structure per Stage

1. **Formula header** — The key equation for this stage
2. **Input values** — What goes into this computation
3. **Step-by-step** — Each operation shown with actual numbers
4. **Output** — Result that feeds the next stage

### Interactivity

- Hover any matrix cell → tooltip shows its contribution
- Click "Expand" → see full matrix (default shows truncated)
- Stage progress indicator on left edge
- Smooth transitions between stages via GSAP

## 3D Scene Design

### Blueprint Aesthetic

- Grid floor with subtle axis lines
- Wireframe geometric structures for matrices
- Monospace typography for all labels
- Color palette: void (#08070A), cream (#F0E4D2), accretion (#FFA85C)
- Additional colors: Q=#FFA85C, K=#4ECDC4, V=#45B7D1, Output=#96CEB4

### Data Source

All transformer weights and intermediate values are **pre-computed constants**, not runtime calculations. This ensures:
- Deterministic, reproducible visualization
- No performance overhead from computing 512-dim embeddings in-browser
- Exact values can be verified and audited

Pre-computed values stored in `lib/transformer/constants.ts`:
- Token IDs and embeddings for "The quick brown fox"
- Q, K, V weight matrices (8 heads × 64 dims)
- FFN weight matrices
- All intermediate computation results

A generation script `scripts/generate-transformer-data.mjs` (Node.js, no PyTorch dependency) produces these constants using a minimal reference implementation. Output is pasted into `constants.ts`. Run once to regenerate if token input changes.

### Font Specification

All labels use `var(--font-composer)` — the existing JetBrains Mono variant already configured in the project. No additional font loading required.

### Responsive Breakpoints

- `lg: 1024px`: Split → vertical stack
- `md: 768px`: Reduce 3D particle count, simplify geometry
- `sm: 640px`: Hide 3D scene entirely, show Math panel only with "3D unavailable" notice

### Animation

- Particles flow along connection lines
- Matrix values animate from 0 to final value
- Token nodes pulse when active
- Residual connections shown as dashed parallel paths

### Performance Budget

- Target: 60fps on M1 MacBook Air
- Cap visible matrix cells at 16×16 for display (full 512-dim vectors truncated)
- At `md: 768px`: Reduce 3D particle count by 70%, disable post-processing
- At `sm: 640px`: Hide 3D scene entirely, Math panel only

## Integration with Existing Codebase

### Scroll Orchestration

The transformer page **does not reuse** the global `ScrollOrchestrator.tsx` from the main portfolio. It creates its own isolated scroll context to avoid conflicts with the main site's Lenis instance and Zustand scene state.

- The transformer page renders its own Lenis instance scoped to the page container
- GSAP ScrollTrigger is already registered globally via `ScrollOrchestrator.tsx:11` — no re-registration needed
- Scroll sections are direct children of the transformer page, not nested inside the global scroll container
- The page unmounts cleanly, destroying its Lenis instance on navigation away

### State Management

Create a new Zustand store `useTransformerState` (separate from `useScene`):

```typescript
interface TransformerState {
  currentStage: number;        // 0-6
  scrollProgress: number;      // 0-1 within stage
  globalProgress: number;      // 0-1 across all stages
  setStage: (stage: number) => void;
  setScrollProgress: (progress: number) => void;
}
```

This store is the single source of truth. Both the 3D scene and MathPanel subscribe to it. No prop drilling between panels.

### Data Flow

```
Scroll Event → Lenis → GSAP ScrollTrigger → useTransformerState
                                                    ↓
                                          ┌─────────┴─────────┐
                                          ↓                   ↓
                                     3D Scene            MathPanel
                                 (camera position)    (stage content)
```

### Mobile Strategy

At `lg: 1024px` breakpoint:
- Layout switches from horizontal split to vertical stack
- 3D scene simplifies: reduces particle count by 70%, disables post-processing effects
- Math panel moves below the 3D scene, becomes full-width
- No Canvas2D fallback — Three.js renders at lower complexity instead

## Error Handling

### WebGL Context Loss

- Detect `webglcontextlost` event on the Canvas
- Show fallback message: "3D visualization unavailable. Math panel remains accessible."
- Math panel continues to function independently
- Attempt recovery on `webglcontextrestored`

### Math Computation Safety

- All matrix operations include bounds checking
- Softmax uses numerically stable implementation: `softmax(x) = exp(x - max(x)) / sum(exp(x - max(x)))`
- Division by zero protection in layer normalization: `σ = max(σ, 1e-8)`
- Invalid results (NaN, Infinity) trigger fallback to pre-computed constants

### Scroll State Desync

- If scroll position jumps (e.g., browser back/forward), GSAP ScrollTrigger automatically syncs
- Stage transitions use `scrub: 1` for smooth interpolation, preventing jarring jumps
- On mount, initialize scroll position to top of page

## Testing Strategy

### Unit Tests (vitest)

- `lib/transformer/math.ts`: All computation functions
  - `tokenize()`: String → token ID mapping
  - `computeAttention()`: Q, K, V → attention weights
  - `softmax()`: Numerical stability, edge cases
  - `layerNorm()`: Mean=0, std=1 verification
  - `feedForward()`: Dimension preservation

### 3D Component Tests (@react-three/test-renderer)

- Each stage component renders without errors
- TokenNode accepts and displays correct props
- ConnectionLine draws between specified points

### E2E Tests (playwright)

- Scroll through all 7 stages, verify MathPanel updates
- Verify 3D scene camera position changes with scroll
- Test responsive layout at mobile breakpoint
- Verify accessibility: keyboard navigation, ARIA labels

## Accessibility

- Calculation panel is plain HTML — fully accessible without WebGL
- `prefers-reduced-motion` disables 3D animations, keeps scroll progression
- Keyboard navigation: Arrow keys advance/rewind stages
- ARIA labels on all interactive elements
- Color contrast meets WCAG AA (accretion #FFA85C on void #08070A = 9.8:1)
- Screen reader announces stage changes via `aria-live="polite"`

## Implementation Order

1. Math library with actual transformer computations + unit tests
2. Zustand store for transformer state
3. MathPanel component with stage transitions
4. Basic 3D scene with blueprint grid
5. Individual stage components + 3D tests
6. Scroll orchestration with GSAP + e2e tests
7. Error handling, responsive, polish
8. Accessibility audit and fixes
