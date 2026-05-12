// Job 003 AC2 — typography variable names in layout / fonts / tokens agree.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { typography } from '@/lib/design-tokens';

const ROOT = resolve(__dirname, '../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('Job 003 typography wiring', () => {
  const fontsSource = read('src/lib/fonts.ts');
  const layoutSource = read('src/app/layout.tsx');
  const globalsSource = read('src/app/globals.css');

  it('exports the three NextFont instances', () => {
    expect(fontsSource).toMatch(/composerMono/);
    expect(fontsSource).toMatch(/dopSerif/);
    expect(fontsSource).toMatch(/directorMonoFull/);
  });

  it('uses --font-composer, --font-dop, --font-director as CSS variable names', () => {
    expect(fontsSource).toMatch(/--font-composer/);
    expect(fontsSource).toMatch(/--font-dop/);
    expect(fontsSource).toMatch(/--font-director/);
  });

  it('layout.tsx wires those three font instances', () => {
    expect(layoutSource).toMatch(/composerMono/);
    expect(layoutSource).toMatch(/dopSerif/);
    expect(layoutSource).toMatch(/directorMonoFull/);
  });

  it('design-tokens.ts references the same CSS variables', () => {
    expect(typography.cssVar.composer).toBe('--font-composer');
    expect(typography.cssVar.dop).toBe('--font-dop');
    expect(typography.cssVar.director).toBe('--font-director');
  });

  it('globals.css exposes the three variables through @theme inline', () => {
    expect(globalsSource).toMatch(/--font-composer:\s*var\(--font-composer\)/);
    expect(globalsSource).toMatch(/--font-dop:\s*var\(--font-dop\)/);
    expect(globalsSource).toMatch(/--font-director:\s*var\(--font-director\)/);
  });

  it('every next/font/google call sets display: swap and adjustFontFallback', () => {
    expect(fontsSource).toMatch(/display:\s*'swap'/);
    const adjustMatches = fontsSource.match(/adjustFontFallback/g) ?? [];
    expect(adjustMatches.length).toBeGreaterThanOrEqual(3);
  });
});
