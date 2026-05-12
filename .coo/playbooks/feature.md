# Playbook: Feature delivery

Shape: `feature` — new user-visible capability or significant enhancement.

## Stages

### 1. Discovery (skip if user already specified)
- Dispatch `product-strategist` — what user value? what's the smallest cut? what's out of scope? 200-word brief.
- Show conclusions to user. Get buy-in before moving on.

### 2. Spec
- Dispatch `spec-writer` with discovery output + user requirements.
- Output: spec + AC + out-of-scope list in `.coo/jobs/<id>-<slug>.md`.
- User approves AC explicitly before plan stage.

### 3. Design (only if non-trivial)
- For architecture-level decisions: `principal-engineer` + `system-architect` in parallel; if they disagree, escalate to user via `/rfc`.
- For UI: `ux-researcher` produces flow + wireframe-level structure.
- For external libs needed: `library-evaluator` proposes options with tradeoffs.
- For security-touching: `security-architect` produces threat model.

### 4. Implementation plan
- COO breaks AC into concrete tasks per specialist.
- Identify dependencies (DB schema before backend before frontend, etc.).
- Identify parallel tracks. Dispatch parallel ones in one Task batch.

### 5. Implementation
- Specialists in dependency order:
  - `database-engineer` (schema/migrations)
  - `backend-engineer` (API + business logic)
  - `frontend-engineer` (UI + state)
  - `3d-graphics-engineer` (if 3D)
  - `animation-engineer` (if motion)
  - `devops-engineer` (if infra/build/deploy)
- Each gets a brief with: AC slice, file paths, deliverable shape.

### 6. Test
- `qa-engineer` — test plan + writes tests for each AC.
- Tests must run in CI. Failures block sign-off.

### 7. Quality gate (all run before sign-off)
- `code-reviewer` — standards compliance, design.
- `security-auditor` — only if touched auth/data/secrets/external IO.
- `accessibility-auditor` — for UI changes.
- `performance-engineer` — for hot paths or perceived-performance changes.
- `visual-verifier` — Playwright screenshots at relevant breakpoints/scroll positions.

### 8. Sign-off
- COO verifies every AC checked, every report's evidence holds up.
- Append `[COO-SIGNOFF]` block per `.coo/formats.md`.

### 9. Retro (non-trivial only)
- Suggest `/retro <id>` to user. Capture surprises, what we'd do differently.

## Failure modes to watch

- Frontend started before AC finalized → forces rework. Refuse.
- Tests after code, written by the same agent → catches less. Have `qa-engineer` separate from implementer.
- "Just a small addition" mid-feature → file as a new job. No silent expansion.
- 3+ rounds of revision on the same task → stop, run mini-retro, narrow scope.
