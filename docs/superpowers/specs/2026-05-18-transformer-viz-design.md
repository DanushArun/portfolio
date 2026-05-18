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
- 8 heads, d_k = 64 per head
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
- FFN(x) = max(0, xW_1 + b_1)W_2 + b_2
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

### Camera Behavior

- Camera position driven by scroll progress
- Smooth transitions between stage viewpoints
- Subtle orbit around focal point per stage
- Zoom level adjusts to show relevant detail

### Animation

- Particles flow along connection lines
- Matrix values animate from 0 to final value
- Token nodes pulse when active
- Residual connections shown as dashed parallel paths

## Performance

- Lenis smooth scroll at 60fps
- GSAP ScrollTrigger with scrub: 1 for smooth interpolation
- Three.js instanced meshes for repeated elements
- Calculation panel uses React state, not re-renders entire scene
- Mobile: stack vertically, simplify 3D to 2D canvas

## Accessibility

- Calculation panel is plain HTML — fully accessible without WebGL
- `prefers-reduced-motion` disables 3D animations, keeps scroll progression
- Keyboard navigation between stages
- ARIA labels on all interactive elements
- Color contrast meets WCAG AA

## Implementation Order

1. Math library with actual transformer computations
2. MathPanel component with stage transitions
3. Basic 3D scene with blueprint grid
4. Individual stage components
5. Scroll orchestration with GSAP
6. Polish: animations, tooltips, responsive
7. Testing and accessibility audit
