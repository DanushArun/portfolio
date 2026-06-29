# Supercluster Production Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the PDF production script the typed source of truth for the scroll journey.

**Architecture:** Add a canonical markdown summary for the PDF and a typed data module for
production constants, colors, behaviors, and 39 scroll dots. Keep the current runtime stable by
aligning existing portfolio chapter beat counts, without modelling the visual artifacts yet.

**Tech Stack:** Next.js, TypeScript, Vitest, existing R3F/Remotion architecture.

---

## File Map

- Create: `docs/superpowers/specs/2026-06-15-supercluster-production-scroll-spec.md`
- Create: `src/lib/supercluster-script/types.ts`
- Create: `src/lib/supercluster-script/constants.ts`
- Create: `src/lib/supercluster-script/chapters.ts`
- Create: `src/lib/supercluster-script/index.ts`
- Create: `tests/unit/supercluster-production-script.test.ts`
- Modify: `src/lib/portfolio-book.ts`
- Modify: `tests/unit/portfolio-book.test.ts`

## Task 1: Canonical Spec

- [ ] Write a repo markdown summary of the PDF production requirements.
- [ ] Include particle budgets, timings, chapter colors, 39 dots, and quality gates.
- [ ] Check line width.

## Task 2: Typed Production Script

- [ ] Add TypeScript types for behaviors, timings, chapters, and dots.
- [ ] Add constants from the PDF.
- [ ] Add chapter/dot data for all 39 dots.
- [ ] Add unit tests for counts, timing constants, and key dot requirements.

## Task 3: Runtime Beat Alignment

- [ ] Update `portfolio-book.ts` so VANGUARD and FORMULA have five beats each.
- [ ] Align MIRA labels/metrics with the production PDF where possible.
- [ ] Update portfolio tests to enforce the 39-dot total.

## Task 4: Verification

- [ ] Run `npm run test -- tests/unit/supercluster-production-script.test.ts`.
- [ ] Run `npm run test -- tests/unit/portfolio-book.test.ts`.
- [ ] Run `npm run typecheck`.
- [ ] Run line-width scan on touched files.
