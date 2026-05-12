# File formats — jobs, decisions, retros

The COO writes and maintains these files. Specialists append reports.

---

## Job file: `.coo/jobs/<NNN>-<slug>.md`

`NNN` = zero-padded incrementing integer (001, 002, ...). `<slug>` = kebab-case of title.

```markdown
---
id: 001
title: Add cosmic-journey hero section
shape: feature              # feature | bugfix | spike | refactor | incident | rfc
status: spec                # spec | planned | in-progress | review | done | abandoned
owner: COO
opened: 2026-05-12
closed:
priority: P1                # P0 (drop everything) | P1 (this sprint) | P2 (next) | P3 (someday)
---

## Spec
<one paragraph: what we're building and why>

## Acceptance criteria
- [ ] AC1 — testable statement
- [ ] AC2 — testable statement
- [ ] AC3 — testable statement

## Out of scope
- <what we are explicitly not doing>

## Plan
1. <agent> — <task>
2. <agent> — <task>
3. ...

## Dispatches
### 2026-05-12 — spec-writer
<brief>
**Report:** <agent's report appended here>

### 2026-05-12 — frontend-engineer
<brief>
**Report:** <agent's report>

## Decisions
- <inline decision> — see .coo/decisions/<id>.md if escalated to RFC

## Risks / open questions
- <thing that could derail>

## Sign-off
<empty until COO signs off>
```

When signed off, COO appends:

```markdown
[COO-SIGNOFF] 2026-05-15 — feature delivered, all AC met
Evidence:
- code-reviewer: clean (report above)
- qa-engineer: 12 tests added, all pass (npm run test src/components/Hero)
- visual-verifier: screenshots at .coo/jobs/001/screenshots/
- accessibility-auditor: WCAG 2.2 AA pass
```

---

## Decision file: `.coo/decisions/<NNN>-<slug>.md`

ADR format. One file per significant architecture/library/pattern decision.

```markdown
---
id: 001
title: Use React Three Fiber over raw Three.js
date: 2026-05-12
status: accepted            # proposed | accepted | superseded | deprecated
supersedes:
superseded-by:
---

## Context
<what's the situation forcing a choice>

## Decision
<the choice, one sentence>

## Alternatives considered
1. <option A> — <why not>
2. <option B> — <why not>
3. <chosen> — <why yes>

## Consequences
- Positive: <what gets better>
- Negative: <what costs>
- Neutral: <what changes>

## Evidence
- <link, benchmark, citation>
```

---

## Retro file: `.coo/retros/<job-id>.md`

```markdown
---
job: 001
title: Cosmic-journey hero section
date: 2026-05-15
duration: 3 days
---

## What worked
- <thing>

## What didn't
- <thing>

## Surprises
- <thing nobody predicted>

## Lessons for the standards
- <update to .coo/standards.md, if any>

## Patterns to capture
- <reusable thing, e.g. new playbook step or agent>
```

---

## Specialist report shape

Every specialist returns a report with these sections (the COO rejects reports missing them):

```markdown
## Goal
<one line restating what was asked>

## Approach
<what I did, in 3-5 bullets>

## Findings / Changes
<concrete: file:line for code changes; named tests; command outputs;
screenshots. No prose like "implemented the feature">

## Evidence
- <test command + result>
- <screenshot path>
- <command output>

## Open questions / recommendations
<things the COO should decide next, or scope-creep items to file separately>
```
