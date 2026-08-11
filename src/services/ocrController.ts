/**
 * Single-flight OCR controller.
 *
 * OCR is the slow, costly step, so we run it exactly once per asset. It's kicked
 * off on the Conversion-Selection screen (so we can detect tables and recommend
 * Excel), and the Processing screen subscribes to the same in-flight job for
 * live progress and the final document — no duplicate API calls.
 */
import type { DocumentModel, PipelineProgress, SourceAsset } from '@/types';
import { runOcr } from './pipeline';
import { OcrError } from './groq';

export type JobStatus = 'running' | 'done' | 'error';
type Listener = (job: OcrJob) => void;

export interface OcrJob {
  assetId: string;
  asset: SourceAsset;
  status: JobStatus;
  progress: PipelineProgress;
  doc: DocumentModel | null;
  error: OcrError | null;
}

let currentJob: OcrJob | null = null;
let currentPromise: Promise<DocumentModel> | null = null;
let controller: AbortController | null = null;
const listeners = new Set<Listener>();

function emit() {
  if (!currentJob) return;
  const snapshot = currentJob;
  listeners.forEach((l) => l(snapshot));
}

export function subscribeOcr(listener: Listener): () => void {
  listeners.add(listener);
  if (currentJob) listener(currentJob);
  return () => listeners.delete(listener);
}

export function getOcrJob(assetId?: string): OcrJob | null {
  if (assetId && currentJob?.assetId !== assetId) return null;
  return currentJob;
}

/** Start (or reuse) the OCR job for an asset. Idempotent per asset id. */
export function startOcr(asset: SourceAsset): OcrJob {
  if (currentJob && currentJob.assetId === asset.id && currentJob.status !== 'error') {
    return currentJob;
  }
  controller?.abort();
  controller = new AbortController();

  currentJob = {
    assetId: asset.id,
    asset,
    status: 'running',
    progress: { stage: 'uploading', progress: 0.08, message: 'Preparing your document' },
    doc: null,
    error: null,
  };

  const signal = controller.signal;
  currentPromise = runOcr(
    asset,
    (p) => {
      if (currentJob && currentJob.assetId === asset.id) {
        currentJob.progress = p;
        emit();
      }
    },
    signal
  )
    .then((doc) => {
      if (currentJob && currentJob.assetId === asset.id) {
        currentJob.doc = doc;
        currentJob.status = 'done';
        currentJob.progress = { stage: 'layout', progress: 0.66, message: 'Text extracted' };
        emit();
      }
      return doc;
    })
    .catch((e) => {
      const err = e instanceof OcrError ? e : new OcrError('unknown', (e as Error).message);
      if (currentJob && currentJob.assetId === asset.id) {
        currentJob.error = err;
        currentJob.status = 'error';
        emit();
      }
      throw err;
    });

  emit();
  return currentJob;
}

/** Await the current job's document (throws OcrError on failure). */
export async function awaitOcr(asset: SourceAsset): Promise<DocumentModel> {
  if (!currentJob || currentJob.assetId !== asset.id || currentJob.status === 'error') {
    startOcr(asset);
  }
  if (!currentPromise) throw new OcrError('unknown', 'OCR job was not started.');
  return currentPromise;
}

export function retryOcr(asset: SourceAsset): OcrJob {
  currentJob = null;
  currentPromise = null;
  return startOcr(asset);
}

export function clearOcr() {
  controller?.abort();
  currentJob = null;
  currentPromise = null;
  controller = null;
}
