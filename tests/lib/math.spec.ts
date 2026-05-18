import { describe, it, expect } from 'vitest';
import { softmax, matMul, layerNorm, gelu, addTensors } from '@/lib/transformer/math';
import { Tensor } from '@/lib/transformer/types';

describe('softmax', () => {
  it('returns probabilities that sum to 1', () => {
    const input = new Float32Array([1, 2, 3]);
    const result = softmax(input);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('is numerically stable with large values', () => {
    const input = new Float32Array([1000, 1001, 1002]);
    const result = softmax(input);
    expect(result.every(v => v >= 0 && v <= 1)).toBe(true);
    expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });

  it('preserves relative ordering', () => {
    const input = new Float32Array([1, 3, 2]);
    const result = softmax(input);
    expect(result[1]).toBeGreaterThan(result[2]);
    expect(result[2]).toBeGreaterThan(result[0]);
  });
});

describe('matMul', () => {
  it('multiplies 2x2 matrices correctly', () => {
    const a: Tensor = {
      data: new Float32Array([1, 2, 3, 4]),
      shape: [2, 2],
    };
    const b: Tensor = {
      data: new Float32Array([5, 6, 7, 8]),
      shape: [2, 2],
    };
    const result = matMul(a, b);
    expect(result.shape).toEqual([2, 2]);
    expect(result.data[0]).toBe(19);
    expect(result.data[3]).toBe(50);
  });

  it('throws on shape mismatch', () => {
    const a: Tensor = { data: new Float32Array([1, 2]), shape: [1, 2] };
    const b: Tensor = { data: new Float32Array([1, 2]), shape: [1, 2] };
    expect(() => matMul(a, b)).toThrow();
  });
});

describe('layerNorm', () => {
  it('normalizes to mean=0', () => {
    const input = new Float32Array([1, 2, 3, 4, 5]);
    const result = layerNorm(input);
    const mean = result.reduce((a, b) => a + b, 0) / result.length;
    expect(mean).toBeCloseTo(0, 5);
  });

  it('handles zero variance with eps', () => {
    const input = new Float32Array([5, 5, 5, 5]);
    const result = layerNorm(input);
    expect(result.every(v => !isNaN(v))).toBe(true);
  });
});

describe('gelu', () => {
  it('returns positive values for positive inputs', () => {
    const input = new Float32Array([1, 2, 3]);
    const result = gelu(input);
    expect(result.every(v => v > 0)).toBe(true);
  });

  it('returns near-zero for zero input', () => {
    const input = new Float32Array([0]);
    const result = gelu(input);
    expect(result[0]).toBeCloseTo(0, 3);
  });
});

describe('addTensors', () => {
  it('adds tensors element-wise', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const result = addTensors(a, b);
    expect(Array.from(result)).toEqual([5, 7, 9]);
  });

  it('throws on length mismatch', () => {
    const a = new Float32Array([1, 2]);
    const b = new Float32Array([1, 2, 3]);
    expect(() => addTensors(a, b)).toThrow();
  });
});
