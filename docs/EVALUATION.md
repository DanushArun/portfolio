# Danush Arun — Evaluation guide

Start with the smallest path that exercises the project. Distinguish source inspection,
syntax/build checks, functional behavior and domain validation when recording a result.

## Guided reading and demonstration

1. **Enter the experience.** The client page mounts a loader, cursor and navigation before the
portfolio sections. Inspect the initial loading state before evaluating the full journey.

2. **Follow the narrative.** Move through Hero, Manifesto, Mira, Projects, Numbers and Formula.
Each section is a separate component; their ordering is defined by the page rather than a content
service.

3. **Inspect interaction.** ScrollTrigger and Lenis coordinate movement. Check the page at a
narrow viewport and with keyboard navigation; visual animation alone does not establish usability.

4. **Reach contact.** The final contact component completes the journey. Verify its links and
actions directly; this repository does not show a separate contact API.

## Declared checks

These commands/checks describe the intended verification path. Their presence in this
guide does not claim that they passed. See the dated evidence below and the README for setup.

```text
npm run lint
npm run build
```

## Evidence levels

| Level | What it establishes | What it does not establish |
| --- | --- | --- |
| Source review | A path exists in tracked code | Successful runtime behavior |
| Syntax/build | Parser/compiler accepts that path | End-to-end correctness |
| Behavioral check | A specific input/output case passed | Generalization beyond cases |
| Domain evaluation | Performance on a stated target setting | Other users/data/environments |

## What to record

- Commit, environment, dependency versions and date.
- Input provenance and whether data is synthetic, public or privately supplied.
- Absolute pass/fail/skip counts; keep failed cases and their root causes.
- Whether external services, hardware or a production deployment were actually exercised.
- Expected output and an artifact showing the observation.

## Review scenarios

- **Client-only sections:** Browser APIs drive the sections; the page disables SSR for them.

- **Separate section components:** Narrative ordering stays visible in the page while section
behavior has its own source.

- **Source-first evidence:** Dependency presence does not prove every animation library is active
in the shipped page.

## Documentation inspection — 7 October 2026

The documentation was traced to committed source and checked for local links, balanced
code fences and supported implementation claims. Historical notebook outputs remain labeled
as historical. Live provider access, private databases and hardware behavior are not inferred
from configuration or dependency files. Any fresh run is recorded separately in the README.

## Next evidence to collect

- Capture desktop and mobile acceptance evidence.
- Verify reduced-motion and keyboard paths.
- Record deployment and contact behavior against the published site.

## Fresh checks

The README records fresh checks on 7 October 2026, including commands and absolute results.
Those measured checks supersede an inspection-only description for the paths they cover.
