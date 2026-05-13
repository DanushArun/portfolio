import { describe, it, expect } from 'vitest';
import { panelCopy } from '@/lib/copy';

describe('panelCopy.W01_MIRA', () => {
  it('lists the 5 product-supported languages in cycle order', () => {
    expect(panelCopy.W01_MIRA.languages).toEqual([
      'ENGLISH',
      'हिंदी',
      'தமிழ்',
      'ಕನ್ನಡ',
      'తెలుగు',
    ]);
  });

  it('describes the language coverage accurately in the body', () => {
    expect(panelCopy.W01_MIRA.body).toMatch(/English and 4 South Indian/);
  });
});
