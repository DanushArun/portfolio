'use client';

import { useTransformer } from '@/lib/transformer-store';
import { STAGES, TOKENS, EMBEDDINGS, ATTENTION_HEADS, OUTPUT_PROBS, EMBED_DIM_DISPLAY } from '@/lib/transformer/constants';

function MatrixDisplay({ values, rows, cols, label }: {
  values: Float32Array;
  rows: number;
  cols: number;
  label: string;
}) {
  const displayRows = Math.min(rows, 4);
  const displayCols = Math.min(cols, 8);

  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2 font-[var(--font-composer)]">
        {label}
      </div>
      <div className="font-[var(--font-composer)] text-xs space-y-1">
        {Array.from({ length: displayRows }).map((_, i) => (
          <div key={i} className="flex gap-1">
            {Array.from({ length: displayCols }).map((_, j) => {
              const val = values[i * cols + j];
              return (
                <span
                  key={j}
                  className="px-1.5 py-0.5 rounded bg-[#F0E4D2]/5 text-[#F0E4D2]/80"
                  title={val.toFixed(4)}
                >
                  {val.toFixed(2)}
                </span>
              );
            })}
            {cols > displayCols && <span className="text-[#F0E4D2]/30">...</span>}
          </div>
        ))}
        {rows > displayRows && <div className="text-[#F0E4D2]/30">...</div>}
      </div>
    </div>
  );
}

export default function MathPanel() {
  const currentStage = useTransformer((s) => s.currentStage);
  const stage = STAGES[currentStage];

  return (
    <div className="p-6 font-[var(--font-composer)]">
      <div className="mb-6 pb-4 border-b border-[#F0E4D2]/10">
        <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-1">
          {stage.label}
        </div>
        <h2 className="text-lg text-[#F0E4D2] mb-2">{stage.title}</h2>
        <p className="text-sm text-[#F0E4D2]/60">{stage.description}</p>
      </div>

      <div className="mb-6 p-4 rounded bg-[#F0E4D2]/5 border border-[#F0E4D2]/10">
        <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2">
          Formula
        </div>
        <code className="text-sm text-[#9FB3C8]">{stage.formula}</code>
      </div>

      {currentStage === 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2">Input Text</div>
          <div className="text-sm text-[#F0E4D2] mb-4">&quot;The quick brown fox&quot;</div>
          <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2">Token IDs</div>
          <div className="space-y-1">
            {TOKENS.map((t) => (
              <div key={t.id} className="flex justify-between text-xs">
                <span className="text-[#F0E4D2]">{t.text}</span>
                <span className="text-[#9FB3C8]">{t.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStage === 1 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2">
            Embeddings (d_model={EMBED_DIM_DISPLAY} for display)
          </div>
          {TOKENS.map((token, i) => (
            <MatrixDisplay
              key={token.id}
              values={EMBEDDINGS[i].data}
              rows={1}
              cols={EMBED_DIM_DISPLAY}
              label={token.text}
            />
          ))}
        </div>
      )}

      {currentStage === 2 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2">
            Attention Weights (Head 1)
          </div>
          <MatrixDisplay
            values={ATTENTION_HEADS[0].weights}
            rows={4}
            cols={4}
            label="softmax(QKᵀ/√dₖ)"
          />
          <div className="text-xs text-[#F0E4D2]/40 mt-2">8 heads total, dₖ = 64 per head</div>
        </div>
      )}

      {currentStage === 3 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2">Residual Connection</div>
          <div className="text-xs text-[#F0E4D2]/60 mb-2">X&apos; = X + MultiHeadOutput</div>
          <div className="text-xs text-[#F0E4D2]/40">Attention output added to original embedding</div>
        </div>
      )}

      {currentStage === 4 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2">Layer Normalization</div>
          <div className="text-xs text-[#F0E4D2]/60 mb-2">μ = mean(X&apos;), σ = std(X&apos;)</div>
          <div className="text-xs text-[#F0E4D2]/60 mb-2">X_ln = γ · (X&apos; - μ) / σ + β</div>
          <div className="text-xs text-[#F0E4D2]/40">Normalizes to mean=0, std=1 with learnable γ, β</div>
        </div>
      )}

      {currentStage === 5 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2">Feed-Forward Network</div>
          <div className="text-xs text-[#F0E4D2]/60 mb-2">FFN(x) = GELU(xW₁ + b₁)W₂ + b₂</div>
          <div className="text-xs text-[#F0E4D2]/40">W₁: 512 → 2048, W₂: 2048 → 512</div>
        </div>
      )}

      {currentStage === 6 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#9FB3C8]/60 mb-2">Output Probabilities</div>
          <div className="space-y-2">
            {OUTPUT_PROBS.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[#F0E4D2] w-16">{p.word}</span>
                <div className="flex-1 h-4 bg-[#F0E4D2]/5 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#9FB3C8]/60 rounded"
                    style={{ width: `${p.prob * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#9FB3C8] w-12 text-right">
                  {(p.prob * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
