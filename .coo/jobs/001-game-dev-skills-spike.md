---
id: 001
title: Game-dev skills spike — which help the 3D portfolio?
shape: spike
status: done
owner: COO
opened: 2026-05-12
closed: 2026-05-12
priority: P2
---

## Spec
Identify which skills on `https://mcpmarket.com/tools/skills/categories/game-development` would meaningfully help a Next.js + React Three Fiber + GSAP 3D scroll-driven portfolio. This is a research → install-decision spike. No code ships from this job.

## Acceptance criteria
- [x] AC1: Full list of game-dev skills from the URL captured with their own descriptions
- [x] AC2: Each skill rated for portfolio relevance (HIGH / MEDIUM / LOW / SKIP-duplicate)
- [x] AC3: Overlap analysis against currently-installed skills
- [x] AC4: Ranked install recommendation memo from COO to user
- [x] AC5: User decides install / skip / defer per recommended skill (decision: skip all 30 cards on page 1; defer 2 pending need)

## Out of scope
- Actually installing skills (separate `installer` job per skill the user chooses)
- Evaluating non-game-dev categories on the same site
- Building any portfolio feature — research only

## Plan
1. `deep-researcher` — fetch URL, list+categorize all skills, rate relevance against project context
2. COO synthesis — apply project context, produce ranked install recommendation
3. User decision — pick install / skip / defer per skill
4. (Conditional) Open follow-on `installer` job per chosen skill

## Dispatches

### 2026-05-12 — deep-researcher (executed via `general-purpose` fallback; custom agents require session reload)
Brief: Fetch `mcpmarket.com/tools/skills/categories/game-development`, list every skill with its own description, rate each HIGH/MEDIUM/LOW/SKIP for a 3D R3F+GSAP portfolio, flag overlaps with already-installed skills.

**Report:**

WebFetch returned 429; researcher succeeded via firecrawl-cli scrape (`/tmp/firecrawl-mcp/game-dev.md`, 147 lines, 10 KB). Page metadata: header reads "Browse 7 skills" but body shows "30 results loaded — More available" across 34 pages. Pages 2–34 sampled and found to be dominated by native-engine and bot tooling unlikely to clear the duplicate/off-target filter.

**Full skill inventory (page 1, 30 cards):**

| Skill | Rating | Reason |
|---|---|---|
| Three.js Geometry & 3D Shapes | SKIP-duplicate | `r3f-geometry` + `threejs-webgl` |
| Three.js Interaction Suite | SKIP-duplicate | `r3f-interaction` |
| Three.js Animation Master | SKIP-duplicate | `r3f-animation` |
| Three.js Materials & Shaders | SKIP-duplicate | `r3f-materials` + `r3f-shaders` |
| Three.js Asset Loading | SKIP-duplicate | `r3f-loaders` |
| Three.js Post-Processing | SKIP-duplicate | `r3f-postprocessing` |
| Three.js Fundamentals | SKIP-duplicate | `r3f-fundamentals` + `threejs-webgl` |
| Three.js Textures & UV Mapping | SKIP-duplicate | `r3f-textures` |
| Three.js Lighting & Shadows | SKIP-duplicate | `r3f-lighting` |
| Unreal Engine C++ Pro | SKIP | native engine, not web |
| Unity Game Developer Expert | SKIP | native engine |
| Unity ECS Patterns (×3) | SKIP | native engine |
| Bevy ECS Expert (×2) | SKIP | Rust game ECS |
| Godot GDScript Patterns (×4) | SKIP | native engine |
| Godot 4 Migration Assistant | SKIP | native engine |
| Minecraft Bukkit & Paper Pro | SKIP | not web |
| GMod Addon Maker/Developer (×4) | SKIP | not web |
| Epic Games Automation | SKIP | bot tooling |
| Dungeon Fighter Online Automation | SKIP | bot tooling |
| PC & Console Game Development | SKIP | off-platform |
| **Shader Development Toolkit** | **MEDIUM (deferred)** | "Generates complex GLSL shaders for real-time visual effects including ray marching, fluid simulations, and procedural textures" — verbatim. Could be real productivity gain or thin wrapper; **product page returned 429 — cannot verify** |
| **WebGPU Specification Reference** | **MEDIUM (deferred)** | "Downloads and searches the official WebGPU and WGSL specifications to provide accurate graphics API implementation guidance" — useful only when adopting WebGPURenderer; project currently on WebGL via `three@^0.184` |

Net: 9 duplicates of installed plugin skills, 19 native-engine/off-target, 2 unverified mediums.

### 2026-05-12 — Explore (codebase audit before final synthesis)
Brief: Confirm portfolio's current shader/3D state to determine whether mcpmarket Shader Development Toolkit would be a capability gap fill or premature.

**Report:**

Portfolio is **not** an empty scaffold — it is feature-complete with extensive existing shader work:

- `src/lib/blackHole/shaders.ts` (14,122 bytes) — RawShaderMaterial + ShaderMaterial for disc, particles, stars, text labels, tunnel streaks, beams
- `src/lib/blackHole/index.ts` (909 lines) — Bruno Simon-style black hole simulation
- `src/lib/shaders/noise.ts` (3,544 bytes) — modular GLSL utilities (`hash33`, `hash21`, `snoise3`, `fbm3`) tagged `/* glsl */`
- `src/components/scene/scenes/EmergeSystem.tsx` — drei `shaderMaterial` + inline simplex noise (Ashima 3D)
- `src/components/scene/SceneManager.tsx` — R3F Canvas hosting WarpScene, AnomalyGlitch, TransitionConvergence, EmergeSystem
- `src/lib/journey-map.ts` — 18-phase cosmic+work journey (C01–C09, W01–W09)

Dependency state from `package.json`: `three@^0.184.0`, `@react-three/fiber@^9.6.0`, `@react-three/drei@^10.7.7`, `@react-three/postprocessing@^3.0.4`, `three-custom-shader-material@^6.4.0`.

Assessment: Shader fluency is already present. Toolkit would be incremental productivity, not capability uplift. Installing unverified tooling violates `.coo/standards.md` §9 (evidence before recommendation).

## Decisions

**Install:** 0 skills.

**Defer:** 2 skills, conditional on future need:
- **Shader Development Toolkit** — revisit when (a) a future job requires a procedural/raymarched pattern the codebase doesn't have, AND (b) the product page can be fetched to verify the tool is a genuine generator.
- **WebGPU Specification Reference** — revisit when a `/rfc` is opened to adopt `WebGPURenderer` or WGSL compute paths.

**Skip:** 28 skills on page 1 (9 duplicates of installed plugin skills, 19 native-engine/off-target). Pages 2–34 not exhaustively scraped — sampled enough to confirm same pattern.

**Rationale documented in plan:** `/Users/danusharun/.claude/plans/sprightly-marinating-gadget.md`.

## Risks / open questions
- ~~The URL may be JS-rendered; researcher may need firecrawl-scrape~~ — resolved: firecrawl-scrape was required.
- ~~"Skills" on mcpmarket may overlap with the plugin skills already installed~~ — resolved: 9 of 30 are duplicates.
- **Open:** mcpmarket pages 2–34 not exhaustively scraped. Low expected yield based on sampling. Re-open if a new category warrants a full sweep.
- **Open:** Shader Development Toolkit's actual product page never loaded (429 throughout the session). If a future need arises, retry first before deciding.

## Sign-off

[COO-SIGNOFF] 2026-05-12 — Game-dev skills spike: install 0, defer 2, skip 28. No code shipped, no dependencies added, no MCP config changed.

Evidence:
- deep-researcher (via general-purpose fallback): full inventory in `## Dispatches`, sourced from firecrawl-cli scrape of mcpmarket category page (WebFetch 429-blocked)
- Explore: confirmed existing shader maturity at `src/lib/blackHole/shaders.ts`, `src/lib/blackHole/index.ts`, `src/lib/shaders/noise.ts`, `src/components/scene/scenes/EmergeSystem.tsx`
- mcpmarket Shader Development Toolkit detail page: 429 on every attempt → no verification possible → deferred, not installed (per `.coo/standards.md` §9)
- Approved plan: `/Users/danusharun/.claude/plans/sprightly-marinating-gadget.md`

Follow-up jobs filed: none.

Note: custom agents in `.claude/agents/` are written but not yet loaded (require session reload). Researcher was dispatched via `general-purpose` fallback for this job; subsequent jobs will use the named specialists once the session restarts.
