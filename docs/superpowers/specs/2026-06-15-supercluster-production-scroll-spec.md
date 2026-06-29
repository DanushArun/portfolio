# Supercluster Production Scroll Spec

Source: `supercluster-production-script.pdf`.

Status: Canonical production foundation for implementation.

## Global Constants

- Desktop particle field: `800000`.
- Mobile particle field: `200000`.
- Chapter particle pool: `10-18%` of the total field per chapter.
- Ambient field: all remaining particles drift and form filaments through every chapter.
- Base particle color: deep cobalt `#0A1628`.
- Gold trace filament color: `#C9A84C`.
- Star points: about `0.1%` of field; fixed bright white; never recruited into artifacts.

## Particle Behaviors

- `Condense`: particles drift toward target positions and increase local density.
- `Route`: particles form directional filaments with visible flow direction.
- `Carve`: particles concentrate at silhouette boundary; interior remains void.
- `Pulse`: brightness oscillates at `1-3Hz`.
- `Shear`: particles accelerate outward from artifact center on chapter end.
- `Rejoin`: sheared particles decelerate and merge back into ambient field drift.

## Scroll Mechanics

- Each dot is one scroll snap unit.
- Standard particle morph duration: `800-1200ms`.
- Camera leads morph by `200ms`.
- Proof card fades in `400ms` after morph begins.
- Proof card fades out `200ms` before next beat begins.
- Chapter transition: `Camera Shear -> Rejoin -> travel -> arrive at next node`.

## Camera Rules

- Resting camera: oblique top-down, about `55deg` elevation, slow ambient drift.
- Chapter entry: camera drifts toward density node over `2-3s`.
- Beat transition: micro-adjustment of at most `15deg` rotation over `1s`.
- Chapter exit: pull back about `0.5 FOV`, then reorient toward next node.

## Chapter Colors

- MIRA: gold `#C9A84C`, warm amber `#FF9500`.
- AIDEN: cyan `#00D4FF`, ice blue `#A8D8FF`.
- VANGUARD: red-violet `#8B2FC9`, pass-green `#00FF7F`.
- INSPECTION: scan blue `#A8D8FF`, defect orange `#FF4500`.
- WAVEFIELD: violet `#7B2FBE`, deep purple `#4A0080`.
- EMI: green-gold `#9FE870`, frequency cyan `#00FFD1`.
- FORMULA: racing red `#FF2400`, gold `#FFD700`.

## Chapter Entry

Before dot 1 of every chapter:

1. Locate: camera drifts toward a bright density node for `2s`.
2. Pulse: density node brightens and pulses twice.
3. Extract: particle stream peels away from the node for `1s`.
4. Dot 1 begins.

## Chapter Exit

The final dot of every chapter except closing state ends:

1. Pulse: assembled artifact brightens uniformly for `0.5s`.
2. Shear: particles accelerate outward for `0.8s`.
3. Rejoin: particles merge into ambient field for `1.2s`.
4. Camera pulls back to wide view and travels to next node.

## Dot Counts

- MIRA: 8 dots.
- AIDEN: 6 dots.
- VANGUARD: 5 dots.
- INSPECTION: 5 dots.
- WAVEFIELD: 5 dots.
- EMI: 5 dots.
- FORMULA: 5 dots.
- Total: 39 dots.

## Chapter Dot Names

- MIRA: Production System, Latency Collapse, Language Bands, Voice Intake,
  Orchestration Core, Post-Call Output, Ops Loop, Ownership.
- AIDEN: Speaker Separation, Diarization, SOP Scoring, Parallel LLM,
  Dashboard Surface, Reliability.
- VANGUARD: Browser Graph, Agent Probe, Fail and Reroute, DOM Diagnostic,
  Release Risk Map.
- INSPECTION: Silhouette, Camera Sweep, Live Streams, Operations Output,
  Inspection Report.
- WAVEFIELD: Attention Wall, Wave Transform, Content Gates, Complexity Compression,
  Research Framework.
- EMI: Material Layers, Frequency Sweep, Output Curves, Microstructure,
  Validation Envelope.
- FORMULA: Track Path, Telemetry Stream, Racing Line, Operations Network,
  Competition Constellation.

## Particle Count Guidelines

- MIRA: about `15%`; high complexity; most demanding dot is `Voice Intake`.
- AIDEN: about `12%`; high complexity; most demanding dot is `Diarization`.
- VANGUARD: about `10%`; medium complexity; most demanding dot is `Fail and Reroute`.
- INSPECTION: about `8%`; medium complexity; most demanding dot is `Silhouette`.
- WAVEFIELD: about `18%`; very high complexity; most demanding dot is `Wave Transform`.
- EMI: about `10%`; medium complexity; most demanding dot is `Frequency Sweep`.
- FORMULA: about `12%`; medium complexity; most demanding dot is `Operations Network`.

`WAVEFIELD` dot 2 is the most computationally demanding moment in the portfolio and must be
optimized first if performance budgeting is required.

## Quality Gate

- Artifact shape is legible from the designated camera angle without labels.
- Every beat shows visible particle movement.
- Proof claim is visible in the particle state, not only in the proof card.
- Chapter color is traceable across all beats.
- Shear and Rejoin complete before camera travel.
- Ambient field particles remain active in the background.
- `WAVEFIELD` dot 2 morph duration is at least `1500ms`.
- `INSPECTION` dot 1 reads as a two-wheeler from the designated 3/4 front angle.

## Known Spec Conflict

MIRA dot 2 answer says `Sub-100ms`, while the body says first response dropped from `7s` to
under `500ms`. Until Danush resolves the metric, implementation should preserve the PDF answer
and carry the body text as written.
