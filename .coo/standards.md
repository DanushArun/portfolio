# Engineering standards — the bar

The COO enforces this bar. Specialists must comply. Cite line numbers when rejecting work.

The user's global standards (in `~/.claude/CLAUDE.md`) also apply — those are non-negotiable.

---

## 1. Code

1.1 Functions ≤ 40 lines. Files ≤ 400 lines. Nesting ≤ 3 levels. Line width ≤ 100 chars. Args ≤ 4. Cyclomatic complexity ≤ 10.
1.2 Type annotations on every function signature. Strict mode in TypeScript. No `any` without a `// reason:` comment.
1.3 No placeholder code. No `TODO` without a linked issue. No commented-out code.
1.4 Early return over nested conditionals.
1.5 Prefer composition over inheritance. Prefer pure functions over stateful classes.
1.6 No swallowed exceptions. Catch specific types, handle or re-raise.
1.7 Names carry meaning — if a function needs a comment to explain what it does, rename it.

## 2. Comments

2.1 Default to no comments. Write one only when WHY is non-obvious (constraint, invariant, workaround, surprising behavior).
2.2 Never narrate the code (`// loop through items`). Never reference the current task (`// added for issue #42`).
2.3 No multi-paragraph docstrings. One short line max in inline comments.

## 3. Tests

3.1 Test behavior, not implementation. Tests must survive refactors.
3.2 One assert per test unless testing a single logical operation.
3.3 Test names: `test_<what>_<when>_<expected>`.
3.4 No mocking the database — use real ephemeral test DB. Real I/O at boundaries.
3.5 Tests run on every PR. Failures block merge.
3.6 New behavior requires new tests. Bug fixes require a regression test.

## 4. Security

4.1 No secrets in code, logs, or commits. Use env vars, gated through a typed config module.
4.2 All user input validated at the boundary (Zod / Pydantic schemas).
4.3 SQL via parameterized queries or query builder only. No string concatenation.
4.4 `security-auditor` runs on any change touching: auth, sessions, crypto, user data, secrets, external network, file I/O, deserialization.
4.5 Dependencies audited via `npm audit` / equivalent before adding.

## 5. Performance

5.1 Measure before optimizing. Cite the profiler output when proposing a perf change.
5.2 Hot paths require benchmarks. Regressions > 10% block merge.
5.3 Frontend: LCP < 2.5s, INP < 200ms, CLS < 0.1 on the slowest target device.
5.4 3D scenes: 60 FPS on mid-tier mobile or document the floor and add a quality toggle.

## 6. Accessibility

6.1 WCAG 2.2 AA baseline. `accessibility-auditor` runs on all UI changes.
6.2 Keyboard navigable. Focus visible. Skip links on routes with > 1 nav.
6.3 Color contrast ≥ 4.5:1 text, ≥ 3:1 large text and UI components.
6.4 No motion that violates `prefers-reduced-motion`. See `src/lib/motion/contract.md` for the project's reduced-motion contract (4 rules + black-hole exception).

## 7. Git & PRs

7.1 Feature branches only. Never commit to `main`.
7.2 Commit messages: imperative, < 72 chars subject. Body explains why, not what.
7.3 One logical change per commit. No bundling.
7.4 PR body: spec link, AC checklist, evidence (test names, screenshots).

## 8. Definition of done

A job is done when ALL apply:
1. Acceptance criteria all checked.
2. Tests pass locally and in CI.
3. `code-reviewer` approved.
4. Domain quality agent(s) approved (qa-engineer for behavior changes, visual-verifier for UI, security-auditor for sensitive areas, etc.).
5. No `TODO`, `FIXME`, `XXX`, `placeholder`, or commented-out code introduced.
6. Documentation updated if public API or user-facing behavior changed.
7. COO signed off in the job file with evidence summary.

## 9. Evidence

9.1 Any claim of "passes" / "works" / "done" must cite:
- Test name(s) and the command that ran them, OR
- Screenshot path with the URL + scroll position, OR
- Command output (the actual output, not "it ran"), OR
- File:line of the relevant assertion.
9.2 Specialists who claim without evidence get rejected and re-dispatched.
