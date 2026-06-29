# Option C Render System Design

## Decision

Use the supercluster as the abstract book/background, but stop representing projects as
literal planets. Each chapter gets a project-specific system artifact that behaves like a
premium product render: intentional geometry, controlled lighting, readable camera framing,
and proof-driven overlays.

Danush approved Option C on 2026-06-15.

## Problem

The current chapter-node treatment uses filled spheres and orbital rings. It reads as toy
astronomy, not a high-end product catalogue. It also weakens the MIRA story because the
visual object does not prove anything about the product. The next build must remove that
metaphor and use project-specific artifacts.

## Reference Principles

- Apple product pages use chaptered scroll narratives with close product cameras, concise
  metrics, and progressive disclosure. The page does not decorate features with unrelated
  objects.
- The Arktek realistic render guide maps cleanly to this portfolio: accurate geometry,
  real-world scale, bevel/detail fidelity, PBR material thinking, controlled lighting,
  camera composition, render passes, and post-processing discipline.
- Remotion 3D work should be deterministic: use `ThreeCanvas`, explicit width/height,
  explicit lighting, and animation driven from `useCurrentFrame()`. Do not use runtime
  `useFrame()` in render/export compositions.
- GSAP ScrollTrigger should drive labeled chapter/beat stops with `pin`, `scrub`, and
  eventual `snap`, not a vague one-speed scroll.

## Visual Direction

### Top-Level Book

The supercluster remains an abstract information field:

- particles, dust, tendrils, and thin traces are allowed;
- literal spheres, orbital rings, and planet-like objects are not allowed;
- project focus should be shown by density, light routing, camera parallax, and signal
  emphasis, not by dropping a mascot object into the scene.

### MIRA Prototype Artifact

MIRA becomes the first approved chapter prototype. It should visualize the system:

1. Lead signal arrives as a narrow waveform or call packet.
2. Voice intake splits into VAD, ASR, and language lanes.
3. Orchestration core shows model routing and response control.
4. Post-call intelligence compresses into structured intent data.
5. CRM and WhatsApp paths leave as operational outputs.

The artifact should feel like a precision instrument or neural signal processor, not a
solar system.

## Information Model

Keep the current chapter/beat data model. It is useful because it separates:

- chapter identity;
- subchapter beat order;
- proof line;
- metric;
- stack tags;
- scroll-local progress.

Replace only the visual representation and camera target strategy.

## Render Quality Gate

Before a chapter is shipped in the live scroll site, it must pass a render-board review:

- desktop still at 1440x900;
- mobile still at 393x852;
- one mid-beat frame and one transition frame;
- readable title, metric, and proof;
- no object that looks like a planet unless the project is actually about astronomy;
- no blurry low-poly model close to camera;
- no text/object overlap;
- visible relation between the artifact and the project claim.

## Remotion Role

Remotion is not the production scroll runtime. It is the deterministic preview/export
layer for stills and short camera beats.

The same artifact data should support:

- live R3F scroll runtime;
- Remotion render board;
- static screenshot review.

If a Remotion composition is added, it must use `@remotion/three` and frame-driven
animation. Runtime-only hooks such as R3F `useFrame()` stay out of Remotion compositions.

## Out Of Scope For First Pass

- Building all seven chapter artifacts.
- Installing a full Remotion pipeline before MIRA direction is visually approved.
- High-poly external model assets.
- Decorative 3D icons.

## First Deliverable

MIRA only:

- remove planet-node layer from the main scene;
- keep abstract supercluster background;
- add MIRA system artifact prototype;
- add a local render-board route or component for still review;
- verify desktop/mobile screenshots before expanding to AIDEN.
