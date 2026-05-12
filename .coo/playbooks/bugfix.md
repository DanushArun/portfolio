# Playbook: Bug fix

Shape: `bugfix` — observed defective behavior.

## Stages

### 1. Reproduce
- Demand a reproduction from the user: exact steps, expected vs actual, environment.
- If user can't reproduce reliably, this is a `spike`, not a `bugfix`. Switch playbook.

### 2. Diagnose (root cause, not symptom)
- Dispatch `qa-engineer` or relevant implementation specialist (depending on layer): "reproduce locally, write a FAILING test that asserts the correct behavior, identify root cause".
- Output must include: failing test, file:line of the bug, why this code is wrong.
- If 5 Whys reveals systemic cause, file separate job and reference it.

### 3. Fix
- Implementation specialist writes the smallest fix that makes the failing test pass.
- NO refactoring in the same job — file separate refactor job if smell uncovered.

### 4. Regression test
- The failing test from stage 2 stays. It becomes the regression test.
- `qa-engineer` reviews — does the test actually catch the bug? If you delete the fix, does the test fail?

### 5. Quality gate
- `code-reviewer` always.
- `security-auditor` if the bug had security implications.
- `visual-verifier` if UI bug.

### 6. Sign-off
- Append `[COO-SIGNOFF]` with: regression test name, root cause one-liner, files changed.

### 7. Retro (if bug was severe, recurring, or revealed a process gap)
- `/retro <id>` — what should change in `.coo/standards.md` to prevent recurrence?

## Failure modes

- Fixing symptom, not cause → forbid. Demand root cause file:line.
- Fix without regression test → forbid. The test must exist and have failed before the fix.
- Fix bundles unrelated cleanup → forbid. File separate refactor.
