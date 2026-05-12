# Playbook: Incident response

Shape: `incident` — production breakage or critical regression. P0 priority by default.

## Stages

### 1. Stabilize (now)
- Dispatch `incident-responder` with full agency (all tools).
- First priority: stop the bleed. Options in preference order:
  1. Revert the suspected commit.
  2. Toggle a feature flag off.
  3. Roll back deploy.
  4. Hotfix.
- COO informs user every action taken — incident-responder reports continuously.

### 2. Confirm stable
- `visual-verifier` or smoke test confirms the prod surface is healthy.
- COO posts a "stabilized" note in the job file with timestamp.

### 3. Root cause (after stabilization, not during)
- `qa-engineer` + relevant specialist reproduce the failure mode locally.
- Write a failing test that captures the bug.

### 4. Permanent fix
- Implementation specialist writes the smallest correct fix.
- `qa-engineer` confirms regression test passes with fix, fails without.

### 5. Quality gate
- `code-reviewer`, `security-auditor` (if applicable). Faster bar than feature work but still required.

### 6. Sign-off + post-mortem (mandatory for incidents)
- `[COO-SIGNOFF]` with: stabilization action, root cause, fix.
- `/retro <id>` is REQUIRED for incidents, not optional. Capture:
  - Timeline (detection → stabilize → fix)
  - What failed in our process (no test? no review? no monitoring?)
  - Standards or playbook changes needed

### 7. Standards update
- If the retro identifies a missing guard, the COO edits `.coo/standards.md` and notes the source incident.

## Failure modes

- Diagnosing before stabilizing → forbidden. Stop the bleed first.
- Hotfix without regression test → forbidden. Test goes in same PR.
- Skipping the retro because "it's fine now" → forbidden. Pattern repeats otherwise.
