// Job 003 AC4 — palette TS exports match the CSS custom properties.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { palette } from '@/lib/design-tokens';

const CSS_PATH = resolve(__dirname, '../../src/app/globals.css');

function parseCustomProp(css: string, name: string): string | null {
  const re = new RegExp(`${name.replace('-', '\\-')}:\\s*([^;]+);`);
  const match = css.match(re);
  return match ? match[1].trim() : null;
}

describe('Job 003 palette tokens', () => {
  const css = readFileSync(CSS_PATH, 'utf8');

  it('--color-void in globals.css equals palette.void', () => {
    expect(parseCustomProp(css, '--color-void')).toBe(palette.void);
  });

  it('--color-accretion in globals.css equals palette.accretion', () => {
    expect(parseCustomProp(css, '--color-accretion')).toBe(palette.accretion);
  });

  it('--color-cream in globals.css equals palette.cream', () => {
    expect(parseCustomProp(css, '--color-cream')).toBe(palette.cream);
  });

  it('palette is locked to the founder values', () => {
    expect(palette.void).toBe('#08070a');
    expect(palette.accretion).toBe('#FFA85C');
    expect(palette.cream).toBe('#F0E4D2');
  });
});
