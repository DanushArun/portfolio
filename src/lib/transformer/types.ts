export type Matrix = Float32Array;

export interface Tensor {
  data: Float32Array;
  shape: [number, number];
}

export interface TokenInfo {
  text: string;
  id: number;
}

export interface AttentionHead {
  Q: Tensor;
  K: Tensor;
  V: Tensor;
  weights: Matrix;
}

export interface TransformerStage {
  id: string;
  label: string;
  title: string;
  description: string;
  formula: string;
}
