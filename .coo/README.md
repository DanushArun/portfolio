# `.coo/` — the engineering org

This directory is the source of truth for how this project is built. The main Claude Code session is primed as the COO (see `COO.md`). It dispatches 24 specialist agents in `.claude/agents/` and runs playbooks from `.coo/playbooks/`.

## Layout

```
.coo/
├── COO.md            # COO persona (loaded via root CLAUDE.md)
├── README.md         # this file
├── standards.md      # engineering bar — code, tests, security, docs
├── formats.md        # file shapes — jobs, decisions, retros
├── playbooks/        # how each kind of work flows
│   ├── feature.md
│   ├── bugfix.md
│   ├── spike.md
│   ├── refactor.md
│   └── incident.md
├── jobs/             # one .md per substantial job, lifecycle-tracked
├── decisions/        # ADRs from /rfc
└── retros/           # post-mortems from /retro
```

## Lifecycle

1. User describes a need → COO triages → spec-writer drafts → user approves → job file persists in `.coo/jobs/`.
2. COO dispatches specialists in parallel/series. Reports append to the job file.
3. Quality agents (code-reviewer, qa-engineer, etc.) run before sign-off.
4. COO signs off with evidence summary. Optional `/retro` captures lessons.

## Where to look

- "What's open?" → `ls .coo/jobs/` or `/job-status`
- "What's the bar?" → `.coo/standards.md`
- "How do features flow?" → `.coo/playbooks/feature.md`
- "Who does what?" → `.coo/COO.md` (roster) or `.claude/agents/`
- "What decisions were made?" → `.coo/decisions/`
- "What did we learn?" → `.coo/retros/`

## Bootstrap

In a fresh session, the COO loads automatically via `CLAUDE.md`. To start work, say what you want or run `/job-new "<title>"`. Casual questions don't open jobs — keep that conversational.
