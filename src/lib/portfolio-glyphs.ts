export interface PortfolioGlyphCell {
  readonly x: number;
  readonly y: number;
}

export interface PortfolioGlyphLayout {
  readonly cells: readonly PortfolioGlyphCell[];
  readonly height: number;
  readonly width: number;
}

const GLYPH_HEIGHT = 7;
const GLYPH_WIDTH = 5;
const CHAR_GAP = 1;
const LINE_GAP = 2;
const MAX_GLYPH_LINE_LENGTH = 26;
const SOLID_SAMPLES = 3;
const SAMPLE_SPACING = 0.26;
const EMPTY = ['00000', '00000', '00000', '00000', '00000', '00000', '00000'];

const GLYPHS: Record<string, readonly string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['10010', '10010', '10010', '11111', '00010', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ',': ['00000', '00000', '00000', '00000', '00000', '00110', '00100'],
};

function normalizeLine(value: string): string {
  const normalized = value
    .toUpperCase()
    .replace(/[^A-Z0-9 ,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.length > 0 ? normalized.slice(0, MAX_GLYPH_LINE_LENGTH) : 'PROJECT';
}

function lineWidth(line: string): number {
  return line.length * (GLYPH_WIDTH + CHAR_GAP) - CHAR_GAP;
}

function glyphFor(char: string): readonly string[] {
  if (char === ' ') return EMPTY;
  return GLYPHS[char] ?? EMPTY;
}

function addGlyphCells(config: {
  readonly cells: PortfolioGlyphCell[];
  readonly line: string;
  readonly lineOffsetX: number;
  readonly lineOffsetY: number;
}): void {
  const middle = (SOLID_SAMPLES - 1) * 0.5;
  Array.from(config.line).forEach((char, charIndex) => {
    const glyph = glyphFor(char);
    glyph.forEach((rowValue, row) => {
      Array.from(rowValue).forEach((value, col) => {
        if (value !== '1') return;
        for (let sampleY = 0; sampleY < SOLID_SAMPLES; sampleY += 1) {
          for (let sampleX = 0; sampleX < SOLID_SAMPLES; sampleX += 1) {
            config.cells.push({
              x: config.lineOffsetX + charIndex * (GLYPH_WIDTH + CHAR_GAP) +
                col + (sampleX - middle) * SAMPLE_SPACING,
              y: config.lineOffsetY + row + (sampleY - middle) * SAMPLE_SPACING,
            });
          }
        }
      });
    });
  });
}

export function buildPortfolioGlyphLayout(lines: readonly string[]): PortfolioGlyphLayout {
  const normalized = lines.map(normalizeLine);
  const width = Math.max(...normalized.map(lineWidth));
  const height = normalized.length * GLYPH_HEIGHT + (normalized.length - 1) * LINE_GAP;
  const cells: PortfolioGlyphCell[] = [];

  normalized.forEach((line, lineIndex) => {
    addGlyphCells({
      cells,
      line,
      lineOffsetX: Math.floor((width - lineWidth(line)) / 2),
      lineOffsetY: lineIndex * (GLYPH_HEIGHT + LINE_GAP),
    });
  });

  return { cells, height, width };
}
