import { Tensor } from './types';

export function softmax(input: Float32Array): Float32Array {
  const maxVal = Math.max(...input);
  const exps = new Float32Array(input.length);
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    exps[i] = Math.exp(input[i] - maxVal);
    sum += exps[i];
  }
  const result = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    result[i] = exps[i] / sum;
  }
  return result;
}

export function matMul(a: Tensor, b: Tensor): Tensor {
  const [aRows, aCols] = a.shape;
  const [bRows, bCols] = b.shape;
  if (aCols !== bRows) throw new Error(`Matrix shape mismatch: ${aCols} !== ${bRows}`);
  const result = new Float32Array(aRows * bCols);
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += a.data[i * aCols + k] * b.data[k * bCols + j];
      }
      result[i * bCols + j] = sum;
    }
  }
  return { data: result, shape: [aRows, bCols] };
}

export function layerNorm(input: Float32Array, eps = 1e-8): Float32Array {
  const n = input.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += input[i];
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (input[i] - mean) ** 2;
  const std = Math.sqrt(varSum / n + eps);
  const result = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = (input[i] - mean) / std;
  }
  return result;
}

export function gelu(input: Float32Array): Float32Array {
  const result = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const x = input[i];
    result[i] = x * 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
  }
  return result;
}

export function addTensors(a: Float32Array, b: Float32Array): Float32Array {
  if (a.length !== b.length) throw new Error('Tensor length mismatch');
  const result = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] + b[i];
  }
  return result;
}
