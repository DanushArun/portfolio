# HUD + cursor spec — Job 003

Date: 2026-05-12
Author: ux-researcher (via general-purpose fallback)

Supports AC9, AC10, AC11, AC12, AC14. Precedent: Lando Norris (norris.com), pawelgola.com (Awwwards SOTD 2024), Cartier loveisall (SOTM), Igloo (SOTM 2024).

## HUD scaffold

### Layout (text-first wireframe — principles only, no units)

Anchor positions:

- **Bottom-right cluster** (safe margin ~16px mobile / ~24px desktop):
  - Phase indicator (top of cluster)
  - Skip-to-next-phase button (directly below)
- **Bottom-left cluster** (mirrored margin):
  - Audio toggle slot — wired in Job 004
  - Reduced-motion toggle slot — visible only if OS-level RM is OFF (a second control would be noise when the OS already respects it)
  - Quality toggle slot — wired in Job 019

Wrapper has `pointer-events: none`; controls themselves have `pointer-events: auto` so the canvas stays scrubbable everywhere else (pawelgola.com pattern).

ASCII wireframe at 1440×900:
```
┌────────────────────────────────────────────────┐
│                                                │
│                                                │
│              (3D canvas fills)                 │
│                                                │
│                                                │
│                                                │
│                                       03 / 23  │ ← phase indicator
│  [audio] [rm] [quality]              ↓ next    │ ← skip below it
└────────────────────────────────────────────────┘
```

ASCII at 375×812 (mobile):
```
┌──────────────┐
│              │
│              │ 
│   (canvas)   │
│              │
│              │
│              │
│       03/23  │ ← phase indicator
│  [〰]   ↓    │ ← collapsed menu (L), skip glyph-only (R)
└──────────────┘
```

### Phase indicator

- **Format**: `01 / 23` through `23 / 23`. Zero-padded. Mono caps. Spaces around the slash; standard JetBrains Mono glyph (no fancy fraction char).
- **Type**: JetBrains Mono, 12–14px equivalent (mobile takes the lower bound). Cream `#F0E4D2` at 60% opacity default, 100% on hover.
- **Data binding**: subscribes to `useScene((s) => s.phase)`. Numerator = `ALL_PHASES.indexOf(phase) + 1` (1-indexed). L00 and E00 from the script will absorb into the 23-count once Job 005+ extends the store.
- **Update behaviour**: discrete tick — digit changes only when `phase` changes, NOT on every `localProgress` frame. A continuously-counting indicator would read as "load progress," which it isn't.
- **Animation**: digit swap in 200ms with `event-horizon` ease (`cubic-bezier(0.87,0,0.13,1)`). Old digit opacity 1→0 and translate up ~2px; new digit opacity 0→1 from ~2px below. Each glyph slides independently — only the place that changed animates.
- **Hover**: opacity 100%, nothing else. NOT interactive (no click action).
- **Reduced-motion**: instant digit swap. No translate, no opacity transition.
- **a11y**: container has `aria-live="polite"`, announces `"Phase {N} of 23"` on change. RM-pref users still hear it — it's content, not motion.

### Skip-to-next-phase button

- **Placement**: directly below phase indicator, right-aligned to its right edge so the arrow glyph sits under the slash.
- **Default copy**: `↓ next`. Down-arrow glyph (U+2193) + space + `next`, mono caps. Both cream at rest.
- **Active-state copy**: at `W09_CONNECT`, copy becomes `↓ outro` (next phase is E00). At E00 (or any final phase), `display: none`.
- **Click behaviour**: dispatches `useScene.getState().advanceScene()` at `src/lib/scene-state.ts:105-113`. AC11 keyboard handler dispatches the same action — one truthful path.
- **Visual states**:
  - Default: cream `#F0E4D2` at 50% opacity, no border, no background.
  - Hover: opacity 100%; arrow glyph only tints to accretion `#FFA85C` (word stays cream). 180ms `gravity-arrival`.
  - Focus-visible: 1px solid accretion `#FFA85C` outline at 2px offset (Lando Norris — never `outline: none`).
  - Active (Enter/mousedown): scale 0.96 for 100ms, returns on release.
- **Reduced-motion**: no scale; no ease — opacity flip instant.
- **a11y**: `<button>` with `aria-label="Skip to next phase"`. Tab-reachable. Enter and Space both trigger.

### Audio / RM / Quality toggle slots

Job 003 ships these as **labelled slots** — finalised API + a11y so Jobs 004 / 019 plug in without re-architecture.

- **Slot API contract** (text-form, for frontend-engineer):
  - Each slot is a `<button>` with `aria-label`, focus-visible outline, glyph, and props `state: 'on' | 'off' | 'unavailable'`, `onToggle: () => void`.
  - Glyph pairs (placeholder, replaceable in owning job):
    - Audio: `♪` on / `⌀` off. aria-label `"Toggle audio (off)"`.
    - Reduced motion: `~` on / `=` off. aria-label `"Toggle reduced motion (off)"`.
    - Quality: `●` high / `◐` low. aria-label `"Toggle quality (high)"`.
  - In Job 003: every slot renders `state="unavailable"`, opacity 40%, `aria-disabled="true"`, `title="Wires up in Job {004|019}"`.
  - When the parent system installs, consumer flips `state` and supplies real `onToggle`. No HUD changes.
- **Layout**: horizontal row in bottom-left cluster, 8–12px gap. ≥44×44 touch target per slot regardless of visual size.

### HUD entrance

- First paint at scroll=0: HUD container opacity 0 → 1 over 400ms, delayed 600ms after L00's "the universe is ready when you are." resolves. HUD is absent during the loader.
- Reduced-motion: HUD appears at the 600ms mark with no fade.

## Cursor system

### States

State machine driven by `data-cursor` body attribute + CSS-only visuals (no React re-renders during follow). One DOM node; dot + ring transition via CSS keyed off `[data-cursor]` on `<body>`.

| State | Trigger | Visual |
|---|---|---|
| `default` | No interactive target under pointer | Dot 4px cream `#F0E4D2` (filled) + ring 16px 1px stroke cream at 40% opacity. |
| `interactive` | Pointer over `cursor: pointer`, `role="button"`, `<a>`, `<button>`, or `[data-cursor-interactive]` | Dot unchanged. Ring grows to 24px in 180ms (`gravity-arrival` ease) and tints accretion `#FFA85C` at 80% opacity. |
| `dragging` | `mousedown` held on `[data-cursor-draggable]` (W04 timeline scrub, W05 token slider, W06 EMI dial) | Dot becomes accretion `#FFA85C`. Ring shrinks to 8px solid accretion. Lerp accelerates (see follow physics). |
| `text` | Pointer over `[data-cursor-text]` (any selectable text region, e.g. E00 contact links) | Dot becomes vertical line 1px wide × 14px tall, cream. Ring hidden. |
| `disabled` | Pointer is `(pointer: coarse)` (touch device) | Entire custom cursor hidden. System cursor takes over. |

State precedence: `disabled` > body data-attribute override (C04 / W09) > `dragging` > `text` > `interactive` > `default`.

### C04 override (preserve)

When `phase === 'C04_HORIZON'` (scroll band 0.16–0.20), `GravityCursor` at `src/components/scene/GravityCursor.tsx:16-19` keeps precedence. Mechanism for Job 003: extend the existing effect to set `document.body.dataset.cursor = 'gravity'` while active. New `CustomCursor` reads `document.body.dataset.cursor` — if non-empty, it hides itself. This replaces `document.body.style.cursor = 'none'` (conflicted with AC8) and is the same hook Job 017 will use for W09 antenna.

### W09 (deferred to Job 017)

Job 017 sets `dataset.cursor = 'antenna'` and provides its own renderer. Job 003 only contracts the mechanism.

### Cursor follow physics

- **Default**: lerp α = 0.18 (≈ 6-frame lag at 60fps — the universe has weight). Matches existing `GravityCursor:53`.
- **Interactive**: lerp accelerates to α = 0.32 (≈ 3-frame lag — viewer feels control).
- **Dragging**: lerp α = 0.5 (no perceptible lag).
- **Reduced-motion**: lerp disabled, cursor pinned to real mouse.
- **Implementation**: direct DOM mutation in one `requestAnimationFrame` loop, never `setState`. Reference: `GravityCursor:54-61`.

## Keyboard nav

### Phase navigation (supports AC11)

| Key | Action |
|---|---|
| `PageDown` | Next phase (`advanceScene()`) |
| `PageUp` | Previous phase |
| `Home` | Jump to first phase (L00 once present; `C01_ORBIT` today) |
| `End` | Jump to last phase (E00 once present; `W09_CONNECT` today) |
| `ArrowDown` | Advance `localProgress` by 0.33 within current phase (3 presses = next phase) |
| `ArrowUp` | Rewind `localProgress` by 0.33 |
| `Space` | Toggle pause (no-op in Job 003; wired in Job 004 for audio sync) |
| `Tab` | Standard focus traversal |
| `Enter` / `Space` on focused element | Activate (matches platform default) |

All key handlers respect `prefers-reduced-motion` — when reduced, phase jumps are instant.

### Focus order on `/` at scroll=0 (AC12)

1. Skip-to-next-phase (bottom-right)
2. Audio toggle slot (bottom-left, leftmost)
3. Reduced-motion toggle slot
4. Quality toggle slot

No other focusables ship in Job 003. Future W-interactives inject at their `localProgress` band — each W-job's problem.

### Focus-visible rule (AC14)

ALL focusables: 1px solid accretion `#FFA85C` outline at 2px offset. No `box-shadow` glow, no appearance transition — focus must read in the first frame. Replaces `globals.css:150-153` (currently `--color-sodium`, retired by AC4). On future light-accent W-phases (motion-brief OQ1), outline switches to cream `#F0E4D2` — accessibility-auditor verifies per W-job. Job 003 is dark everywhere; accretion-on-void at 9.8:1 passes.

## Mobile / touch

Three adaptations:

1. **Cursor**: hidden entirely on `(pointer: coarse)`. iOS shows no cursor; Android shows its touch ripple. No CustomCursor render on mobile — saves a RAF loop.
2. **Bottom-left cluster collapses** to a single 〰 (U+3030) menu icon. Tap expands a small popover above the icon, three toggles vertical. Dismisses on outside-tap or `Escape`. Mobile chrome stays at two visible elements (Igloo / Cartier mobile pattern).
3. **Skip-to-next**: persistent bottom-right text button, smaller and glyph-prioritised (word `next` may drop in tight viewports — `↓` alone). Swipe-up gesture also triggers `advanceScene()` — animation-engineer adds in AC11 sub-step. Long-press reserved (see OQ below).

Phase indicator: same format, smaller (10–11px), sits above the skip glyph.

## Accessibility (AC14)

- Cream `#F0E4D2` on void `#08070a` = 14.6:1 (WCAG 2.2 AAA, all sizes).
- Accretion `#FFA85C` on void `#08070a` = 9.8:1 (AA + AAA, normal + large).
- Focus outline (1px accretion, 2px offset) reads on every dark-background phase shipped in Job 003.
- Skip-to-next: visible `next` + `aria-label="Skip to next phase"`. Arrow span `aria-hidden="true"`.
- Phase indicator: `aria-live="polite"`, announces `"Phase {N} of 23"` on change. Polite, not assertive — doesn't interrupt mid-sentence.

## Reduced-motion contract

When `prefers-reduced-motion: reduce`:

- Phase digit swap: instant (no translate, no opacity transition).
- Skip button active scale: disabled.
- Skip button hover tint: instant colour swap.
- Cursor lerp: disabled — pinned to real mouse.
- Cursor ring grow on `interactive`: instant.
- HUD entrance: appears at 600ms mark, no fade.

Tightens motion-brief §"Reduced-motion" rule 1 ("scrubbed motion → end-state + 0.2s fade") for HUD chrome — 0.2s fades remain noise at this scale.

## C04 special case — HUD fade during horizon crossing

Recommend: **HUD opacity 1→0 over 120ms at scroll 0.155, 0→1 over 200ms at scroll 0.205.** Rationale: C04 is the single most important second of the page; mono-caps `03 / 23` would visually compete with the display-serif `event horizon` title. Phase indicator returns immediately after the crossing — viewer never wonders if it's gone. Reduced-motion: HUD stays put (motion-brief treats this band as beat, not motion).

## Open questions for founder

1. **C04 HUD fade-out (RECOMMEND: yes, 0.155 → 0.205).** Hides chrome during the only display-serif beat in cosmic. Alternative: leave HUD up for consistency. Affects animation-engineer keyframes in AC13.
2. **Mobile skip-to-next gestures (RECOMMEND: swipe-up + tap, no long-press).** Long-press adds a third trigger for one action and collides with iOS context-menu defaults. Confirm before gesture handlers ship.

Resolved by recommendation: phase indicator does NOT show phase name on hover (e.g. `01 / 23 — L00 GLITCH LOADER`). Names are for engineers; keeps register clean.
