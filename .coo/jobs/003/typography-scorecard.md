# Typography scorecard — Job 003

Date: 2026-05-12
Author: library-evaluator (via general-purpose fallback)

## Mono family (Q1)

### Scorecard
| Family | Awwwards (3x) | Bundle KB (3x) | Glyphs (2x) | Licence (2x) | Fit (1x) | Wired (1x) | Total | Notes |
|---|---|---|---|---|---|---|---|---|
| Berkeley Mono | 9 | 6 | 4 | 0 | 1 | 0 | 20 | Cited shorthand; ~$200 studio. Glyphs via docs only. |
| JetBrains Mono | 6 | 3 | 2 | 4 | 1 | 1 | 17 | Already in `layout.tsx:35`. 30.6 KB latin. |
| IBM Plex Mono | 3 | 9 | 2 | 4 | 1 | 0 | 19 | Smallest woff2 (9.8 KB latin). "Engineering report" register. |
| Geist Mono | 6 | 3 | 2 | 4 | 1 | 0 | 16 | JBM-adjacent geometry, 30.5 KB latin. |
| Commit Mono | 3 | n/a | n/a | 4 | 1 | 0 | 11 | NOT on Google Fonts (404). Requires `next/font/local`. |

Rubric: 3x criteria use 0-3-6-9; 2x use 0-2-4; 1x use 0-1. Glyph score is 2 if all script-required code points are in *some* Google subset, 1 if every glyph except U+2609/U+2076 is present (the universal gap — see below).

### Recommendation
**Ship JetBrains Mono now; revisit Berkeley Mono in Job 019.** JBM is already wired at `layout.tsx:35`, free OFL, has the imported weights (300/400/500), and its 30.6 KB latin woff2 sits in the same envelope as Geist Mono. Berkeley Mono is *correct* if the founder approves $200 — genuine Awwwards-shorthand mono, tighter letterfit fits the numerals register — but paid, off-Google-Fonts, forces `next/font/local`. IBM Plex Mono is the dark-horse free pick: smallest woff2 by 3× and an "engineering report" register matches the founder's postmortem voice — but swapping costs a re-tune of `voice-composer` letter-spacing in `globals.css:107-112`.

### Cost-of-being-wrong
- **Berkeley over JBM**: $200 + ~3h swap to `next/font/local`, re-tune `letter-spacing` from 0.18em (Berkeley is tighter). Reversible.
- **IBM Plex over JBM**: free, ~3h to re-confirm numeric specs sit on grid.
- **Geist over JBM**: zero practical delta; Vercel-on-Vercel reads as default not deliberate.
- **Commit Mono**: only material risk — `next/font/google` cannot load it. ~4h plus a self-run glyph audit.

## Display serif family (Q2)

### Scorecard
| Family | Awwwards (3x) | Bundle KB (3x) | Glyphs (2x) | Licence (2x) | Fit (1x) | Wired (1x) | Total | Notes |
|---|---|---|---|---|---|---|---|---|
| Instrument Serif | 9 | 9 | 2 | 4 | 1 | 1 | 26 | 14.7 KB normal + 15.3 KB italic latin. Already wired. |
| PP Editorial New | 9 | 3 | 4 | 0 | 1 | 0 | 17 | $40+/style. Heaviest bundle. |
| Cormorant Garamond | 3 | 6 | 2 | 4 | 0 | 1 | 16 | Already wired but very common — template-feel risk. |
| GT Sectra | 9 | 3 | 4 | 0 | 1 | 0 | 18 | Display-only; needs pairing with a body serif. |
| Tiempos Headline | 6 | 3 | 4 | 0 | 1 | 0 | 15 | Agency-portfolio cliche risk. |

### Recommendation
**Single family: Instrument Serif (italic for L00 + normal for C04, C09, W09, E00).** Both styles at latin subset = 30.7 KB — smaller than a single JBM weight. Script locks italic at L00; reusing the same family's normal for the four "earned moments" gives typographic unity without a second display family. PP Editorial New is the upgrade if the founder wants the heavier "couture" italic — Active Theory tier — but it costs money, ships ~3-4× the bytes, and the earned moments are ≤ 8 words so the extra detail is wasted at display size.

### Pairing note
JBM + Instrument Serif is coherent — both humanist, both calm against `#08070a`, contrast intentional. No anti-pairing flags. L00→Instrument-italic handoff should hold ~120ms quiet (motion-brief, not type-brief).

## Glyph verification
Downloaded each woff2 at the `latin` + `latin-ext` Google Fonts subset URLs and parsed cmap with Python `fontTools` on 2026-05-12. Raw files at `/tmp/jb*.woff2`, `/tmp/ipm*.woff2`, `/tmp/gm*.woff2`, `/tmp/is-*.woff2`, `/tmp/cg-*.woff2`.

- **JetBrains Mono** (w=400, latin+latin-ext): `×` U+00D7 yes, `–` `—` `…` yes, smart quotes yes, math italic M yes, `²` yes. **MISSING: U+2609 ☉ and U+2076 ⁶.** Source: `fonts.gstatic.com/s/jetbrainsmono/v24/...woff2`.
- **IBM Plex Mono** (w=400): identical Google subsets. **MISSING: U+2609, U+2076.** Source: `fonts.gstatic.com/s/ibmplexmono/v20/...woff2`.
- **Geist Mono** (w=400): identical subsets. **MISSING: U+2609, U+2076.** Source: `fonts.gstatic.com/s/geistmono/v4/...woff2`.
- **Commit Mono**: NOT on Google Fonts. `https://fonts.googleapis.com/css2?family=Commit+Mono` returns HTTP 400 "Font family not found". Coverage undocumented at the Google level.
- **Instrument Serif** (normal+italic): `×`, `–`, `—`, `…`, smart quotes, math italic M all present. **MISSING: U+2609, U+2076, U+00B2** (no superscripts at all).
- **Cormorant Garamond** (normal+italic): all standard punctuation present. **MISSING: U+2609, U+2076.**

**Decisive finding:** the L00 line `MASS = 4.3 × 10⁶ M☉` (script.md:35) uses U+2609 ☉ and U+2076 ⁶ which **no Google-hosted candidate ships** in `latin`/`latin-ext`. `next/font/google` does **not** support a custom `text` param (verified at `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md:146-158` — only the documented subsets are loadable). Options:
1. Render those two glyphs via CSS font-stack fallback (macOS covers ☉ via Apple Symbols; Windows/Linux patchy).
2. Self-host the full unsubsetted JBM Regular woff2 via `next/font/local` for L00 only.
3. Rewrite the script line to drop ☉ (`MASS = 4.3 × 10⁶ SOLAR`) — founder sign-off required.

Recommendation for frontend-engineer: option 2. ~70-90 KB local file used by L00 only; ☉ and ⁶ render correctly without script rewrites.

## Bundle calculations
Measured `curl -A <browser-UA>` → `wc -c` on 2026-05-12:

Recommended pair (JBM 400+500 latin+latin-ext; Instrument normal+italic latin+latin-ext):
- JBM 400 latin: 30.6 KB · JBM 400 latin-ext: 11.3 KB
- JBM 500 latin: 30.6 KB · JBM 500 latin-ext: 11.3 KB
- Instrument normal latin: 14.7 KB · latin-ext: 7.6 KB
- Instrument italic latin: 15.3 KB · latin-ext: 8.2 KB
- Optional local JBM 400 unsubsetted (L00 only, for `M☉`): ~70-90 KB estimate.

**Total at `subsets: ['latin','latin-ext']`: 129.6 KB** across 8 files. With browser unicode-range, first paint loads ~45.3 KB (the two `latin` files); rest stream lazily.

Runner-ups:
- **IBM Plex Mono + Instrument Serif**: ~115 KB, ~14 KB lighter than the recommendation.
- **Berkeley Mono + Instrument Serif**: ~127 KB per studio spec. Cost delta is $200, not KB.

## Awwwards precedent verification
- **Linear / Vercel / shadcn/ui use Berkeley Mono**: claim from `.coo/jobs/003-system-foundations.md:67`. I could not re-verify on 2026-05-12 — `linear.app` ships fonts via JS-rendered CSS-in-JS (invisible to plain WebFetch), and `vercel.com/font` returned 403. **Flagged** — true in my training but not freshly attested. Visual-verifier should DevTools-confirm before approving $200 spend.
- **Igloo SOTM 2024 uses Instrument Serif**: spec line 68. Awwwards entry markup did not surface fonts credit. **Flagged** — plausible given Instrument's 2023-2025 ubiquity but not independently confirmed.
- **bruno-simon.com uses PP Editorial New**: spec line 68. Not re-fetched.
- **Geist Mono is JBM-adjacent on Vercel-hosted sites**: verifiable via `vercel/geist` repo. Trust: high.

**Honest summary:** the Job 003 spec's precedents are credible. None of my rankings depend on a claim I haven't either personally verified or flagged.

## Migration plan
Recommendation (JBM + Instrument Serif) is mostly **subtractive** from the current state:

- **Remove**: `Cormorant_Garamond` import (`layout.tsx:2,19-25`) and `--font-director` (Cormorant). Display role moves to Instrument Serif normal.
- **Remove**: `Syncopate` import (`layout.tsx:2,12-17`) and the unused `--font-syncopate` (`layout.tsx:60`).
- **Reassign**: `--font-director` → Instrument Serif **normal** (C04/C09/W09/E00); `--font-dop` → Instrument Serif **italic** (L00 + all body). Same family, two styles.
- **Add**: a `next/font/local` declaration for `JetBrainsMono-Regular.woff2` (full glyph coverage including U+2609 + U+2076) exposed as `--font-composer-l00`, used only by the L00 loader. Source from `github.com/JetBrains/JetBrainsMono/releases`; check into `/public/fonts/`. OFL — attribute in `src/lib/blackHole/README.md`.

CSS variable rename mapping:

| Old (`layout.tsx`) | New | Used in `globals.css` |
|---|---|---|
| `--font-syncopate` | (removed) | drop |
| `--font-director` (Cormorant) | `--font-director` (Instrument normal) | `:24, :48, :94-99` |
| `--font-dop` (Instrument) | `--font-dop` (Instrument italic) | `:25, :49, :101-105` |
| `--font-composer` (JBM) | `--font-composer` (JBM) — unchanged | `:26, :50, :107-112` |
| (none) | `--font-composer-l00` (local JBM full) | new — L00 loader only |

- **`design-tokens.ts` rewrite**: `lines 33-38` currently name `--font-syne`/`--font-grotesk`/`--font-space-mono` — none wired. Replace with `--font-director`/`--font-dop`/`--font-composer` to satisfy AC2.
- **`npm install` deltas**: none — all Google families already in `next/font/google`; local woff2 is a static asset, not a package.
- **`globals.css:84-85`**: `font-family: var(--font-dop) + font-style: italic` keeps all body italic. No change.
- **AC3 reminder**: every `next/font/google` call must add `adjustFontFallback: true`. Current `layout.tsx:12-40` omits this flag on all three. Verify via Lighthouse layout-shift after wiring.

## Open questions
1. **L00 `M☉` rendering** — founder accepts option 2 (local woff2, ~80 KB added) or prefers option 3 (script rewrite to drop ☉)? Recommend option 2 for fidelity.
2. **Berkeley Mono budget** — defer to Job 019 polish per spec line 67, or commit $200 now? Recommend defer.
3. **`adjustFontFallback`** — confirm AC3 flag is added to all three remaining `next/font/google` calls in the migration.
