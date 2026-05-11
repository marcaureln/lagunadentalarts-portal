import type { StorageService } from './types';
import { FileSystemStorage } from './fs-storage';
import { S3Storage } from './s3-storage';

export * from './types';

export type StorageBackend = 's3' | 'fs';

let storageInstance: StorageService | null = null;
let backendName: StorageBackend | null = null;

function buildStorage(): { storage: StorageService; backend: StorageBackend } {
  const config = useRuntimeConfig();
  const s3Bucket = config.s3Bucket as string | undefined;
  const s3AccessKeyId = config.s3AccessKeyId as string | undefined;
  const s3SecretAccessKey = config.s3SecretAccessKey as string | undefined;
  const s3Endpoint = config.s3Endpoint as string | undefined;
  const storagePath = config.storagePath as string | undefined;

  const hasS3 = !!(s3Bucket || s3AccessKeyId || s3SecretAccessKey || s3Endpoint);
  const hasFsPath = !!storagePath;

  if (hasS3 && hasFsPath) {
    throw new Error(
      'Ambiguous storage configuration: both S3_* and STORAGE_PATH are set. Configure only one storage backend.'
    );
  }

  if (hasS3) {
    if (!s3Bucket || !s3AccessKeyId || !s3SecretAccessKey) {
      throw new Error(
        'Incomplete S3 storage configuration: S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are all required.'
      );
    }
    return {
      storage: new S3Storage(
        s3Bucket,
        (config.s3Region as string) || 'auto',
        s3Endpoint,
        s3AccessKeyId,
        s3SecretAccessKey
      ),
      backend: 's3',
    };
  }

  return { storage: new FileSystemStorage(storagePath || './storage/cases'), backend: 'fs' };
}

export function getStorage(): StorageService {
  if (!storageInstance) {
    const built = buildStorage();
    storageInstance = built.storage;
    backendName = built.backend;
  }
  return storageInstance;
}

export function getStorageBackend(): StorageBackend {
  if (!backendName) {
    getStorage();
  }
  return backendName as StorageBackend;
}

export function resetStorageInstance(): void {
  storageInstance = null;
  backendName = null;
}
