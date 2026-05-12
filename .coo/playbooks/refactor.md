# Playbook: Refactor

Shape: `refactor` — change structure without changing behavior.

## Stages

### 1. Justify
- What's the pain (cite file:line)? What's the cost of NOT doing it?
- If you can't articulate the user-visible benefit (faster delivery, fewer bugs, perf, a11y), question whether this is worth doing.

### 2. Behavioral guardrail (mandatory)
- `qa-engineer` confirms test coverage for the area being changed. If coverage is thin: WRITE TESTS FIRST as a separate phase. Refactoring uncovered code is unsafe.
- Snapshot any UX or visual surface with `visual-verifier` BEFORE the refactor for comparison.

### 3. Architecture
- For non-trivial refactors: `principal-engineer` reviews the proposed approach in a short doc before any code moves.

### 4. Refactor in small commits
- Each commit must keep tests green.
- One concept per commit (e.g., "extract X", "rename Y", "move Z to module M").

### 5. Verify behavior unchanged
- `qa-engineer` reruns the full test suite.
- `visual-verifier` confirms screenshots match pre-refactor baseline.
- If anything changed in user-visible behavior, this was secretly a feature/bugfix — re-open as the right shape.

### 6. Quality gate
- `code-reviewer` — is the new structure actually better, or just different?
- `performance-engineer` if hot path — measure before and after.

### 7. Sign-off
- `[COO-SIGNOFF]` cites: tests pass, screenshots match, structural improvement (e.g., function count, file count, cyclomatic complexity delta).

## Failure modes

- Refactor that "fixes a small bug while we're there" → forbidden. Split into refactor job + bugfix job.
- Refactor without baseline tests → forbidden. Write tests first.
- Big-bang rewrite → forbidden. Incremental moves with green tests between each.
