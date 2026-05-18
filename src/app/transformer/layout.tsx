import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transformer Probabilities — Visual Explanation · Danush Arun',
  description: 'Interactive visualization of how a transformer calculates token probabilities — the fundamental mechanism behind LLMs like GPT.',
};

export default function TransformerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
