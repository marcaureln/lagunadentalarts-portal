import { ref } from 'vue';
import type { Ref } from 'vue';
import { getErrorMessage } from '~~/app/utils/errors';

interface UploadPartPlan {
  partNumber: number;
  url: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
}

interface UploadSessionPlan {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
  maxConcurrency: number;
  parts: UploadPartPlan[];
}

interface UseChunkedUploadOptions {
  caseId: string;
  slotId: string;
  file: File;
}

export type ChunkedUploadState = 'idle' | 'initiating' | 'uploading' | 'completing' | 'done' | 'error' | 'aborted';

interface UseChunkedUploadReturn {
  start: () => Promise<{ path: string } | null>;
  cancel: () => Promise<void>;
  progress: Ref<number>;
  error: Ref<string | null>;
  state: Ref<ChunkedUploadState>;
}

const MAX_PART_ATTEMPTS = 3;
const RETRY_BACKOFF_BASE_MS = 400;

export function useChunkedUpload(opts: UseChunkedUploadOptions): UseChunkedUploadReturn {
  const progress = ref(0);
  const error = ref<string | null>(null);
  const state = ref<ChunkedUploadState>('idle');

  const abortController = new AbortController();
  let activeSession: UploadSessionPlan | null = null;

  const start = async (): Promise<{ path: string } | null> => {
    state.value = 'initiating';
    error.value = null;
    progress.value = 0;

    try {
      const plan = await $fetch<UploadSessionPlan>(`/api/cases/${opts.caseId}/files/upload-sessions`, {
        method: 'POST',
        body: {
          slotId: opts.slotId,
          fileName: opts.file.name,
          fileSize: opts.file.size,
          mimeType: opts.file.type || undefined,
        },
      });
      activeSession = plan;

      state.value = 'uploading';
      const bytesAcked = new Array<number>(plan.totalChunks).fill(0);
      const totalBytes = Math.max(opts.file.size, 1);

      const sem = new Semaphore(plan.maxConcurrency);

      await Promise.all(
        plan.parts.map((part) =>
          sem.run(async () => {
            const offset = (part.partNumber - 1) * plan.chunkSize;
            const blob = opts.file.slice(offset, offset + plan.chunkSize);
            await uploadChunkWithRetry({ part, blob, signal: abortController.signal });
            bytesAcked[part.partNumber - 1] = blob.size;
            progress.value = bytesAcked.reduce((a, b) => a + b, 0) / totalBytes;
          })
        )
      );

      state.value = 'completing';
      const result = await $fetch<{ file: { path: string } }>(
        `/api/cases/${opts.caseId}/files/upload-sessions/${plan.uploadId}/complete`,
        {
          method: 'POST',
          body: { parts: plan.parts.map((p) => ({ partNumber: p.partNumber })) },
        }
      );

      state.value = 'done';
      progress.value = 1;
      return { path: result.file.path };
    } catch (e) {
      if (abortController.signal.aborted) {
        state.value = 'aborted';
        return null;
      }
      error.value = getErrorMessage(e, 'Upload failed');
      state.value = 'error';
      // Best-effort: abort the server-side session so backend storage doesn't leak.
      if (activeSession) {
        await cancelSession(opts.caseId, activeSession.uploadId).catch(() => {});
      }
      return null;
    }
  };

  const cancel = async (): Promise<void> => {
    if (state.value === 'done' || state.value === 'aborted') return;
    abortController.abort();
    state.value = 'aborted';
    if (activeSession) {
      await cancelSession(opts.caseId, activeSession.uploadId).catch(() => {});
    }
  };

  return { start, cancel, progress, error, state };
}

async function cancelSession(caseId: string, uploadId: string): Promise<void> {
  await $fetch(`/api/cases/${caseId}/files/upload-sessions/${uploadId}`, { method: 'DELETE' });
}

async function uploadChunkWithRetry(args: { part: UploadPartPlan; blob: Blob; signal: AbortSignal }): Promise<void> {
  const { part, blob, signal } = args;
  let attempt = 0;
  let lastError: unknown;
  while (attempt < MAX_PART_ATTEMPTS) {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    try {
      await uploadOneChunk(part, blob, signal);
      return;
    } catch (e) {
      if (signal.aborted) throw e;
      lastError = e;
      attempt += 1;
      if (attempt >= MAX_PART_ATTEMPTS) break;
      const backoff = RETRY_BACKOFF_BASE_MS * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastError;
}

async function uploadOneChunk(part: UploadPartPlan, blob: Blob, signal: AbortSignal): Promise<void> {
  const res = await fetch(part.url, {
    method: part.method,
    body: blob,
    headers: { ...(part.headers ?? {}) },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Chunk upload failed (HTTP ${res.status})`);
  }
}

class Semaphore {
  private active = 0;
  private queue: (() => void)[] = [];
  constructor(private readonly max: number) {}
  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active += 1;
    try {
      return await task();
    } finally {
      this.active -= 1;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}
