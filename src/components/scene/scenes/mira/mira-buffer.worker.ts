import { mergePSets, type PSet } from './buffers';
import { generateHalos } from './generate-dust';
import { generateHubs } from './generate-hubs';
import { generateTendrils } from './generate-tendrils';
import { type Quality } from './knot-config';

interface WorkerRequest {
  readonly id: number;
  readonly quality: Quality;
}

interface WorkerPayload extends PSet {
  readonly count: number;
}

interface WorkerResponse {
  readonly id: number;
  readonly payload?: WorkerPayload;
  readonly error?: string;
}

function transferList(payload: WorkerPayload): Transferable[] {
  return [
    payload.color.buffer,
    payload.densityLevel.buffer,
    payload.isCore.buffer,
    payload.isHalo.buffer,
    payload.langIndex.buffer,
    payload.pos.buffer,
    payload.warpParams.buffer,
  ];
}

self.onmessage = ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    const merged = mergePSets([
      generateTendrils(data.quality),
      generateHalos(data.quality),
      generateHubs(data.quality),
    ]);
    const payload = { ...merged, count: merged.densityLevel.length };
    const response: WorkerResponse = { id: data.id, payload };
    self.postMessage(response, { transfer: transferList(payload) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MIRA buffer generation failed';
    const response: WorkerResponse = { id: data.id, error: message };
    self.postMessage(response);
  }
};
