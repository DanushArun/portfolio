'use client';

import { useTransformer } from '@/lib/transformer-store';
import { STAGES } from '@/lib/transformer/constants';

export default function StageIndicator() {
  const currentStage = useTransformer((s) => s.currentStage);
  const globalProgress = useTransformer((s) => s.globalProgress);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#08070a]/85 backdrop-blur-sm border border-[#F0E4D2]/15">
        {STAGES.map((stage, i) => (
          <div
            key={stage.id}
            className={`flex items-center gap-2 ${i <= currentStage ? 'opacity-100' : 'opacity-30'}`}
          >
            <div className={`w-2 h-2 rounded-full transition-colors ${i === currentStage ? 'bg-[#9FB3C8]' : 'bg-[#F0E4D2]/30'}`} />
            <span className="text-[10px] uppercase tracking-widest font-[var(--font-composer)] text-[#F0E4D2]/60">
              {stage.label}
            </span>
            {i < STAGES.length - 1 && <div className="w-4 h-px bg-[#F0E4D2]/15" />}
          </div>
        ))}
        <div className="ml-3 text-[10px] font-[var(--font-composer)] text-[#9FB3C8]/60">
          {(globalProgress * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
