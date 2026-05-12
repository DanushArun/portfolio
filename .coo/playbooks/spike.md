# Playbook: Spike (time-boxed research)

Shape: `spike` — investigation with a definite end. Outputs a decision or a written finding, not shipping code.

## Stages

### 1. Frame
- COO + user agree on:
  - The question (one sentence)
  - The time-box (e.g., "2 hours of agent work", "by end of day")
  - The deliverable shape (memo? prototype? benchmark? library comparison?)
  - The decision this enables

### 2. Research
- For library/approach questions: `library-evaluator` + `deep-researcher` in parallel.
- For "is this even possible": one implementation specialist builds a throwaway prototype in `wormhole-lab/` or similar.
- For UX questions: `ux-researcher`.
- For perf questions: `performance-engineer` benchmarks options.

### 3. Synthesis
- COO reads all reports, drafts a memo to user:
  - Question
  - What we tried
  - What we found (with citations / numbers)
  - Recommendation
  - What we'd do next if we proceed

### 4. Decision
- User picks. If it's an architecture choice, open an `/rfc` to capture the ADR.

### 5. Close
- Spikes don't ship code. Delete throwaway code. Move findings into `.coo/jobs/<id>` + optionally `.coo/decisions/`.
- `[COO-SIGNOFF]` notes the decision recorded and what follow-on jobs (if any) are now open.

## Failure modes

- Spike with no time-box → becomes infinite exploration. Forbidden.
- Spike that ships → it stopped being a spike. Switch to feature playbook and add tests/QA.
- Spike output is "it's complicated, more research needed" → escalate to user, don't recurse silently.
