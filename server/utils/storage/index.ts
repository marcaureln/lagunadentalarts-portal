import type { StorageService } from './types';
import { FileSystemStorage } from './fs-storage';
import { S3Storage } from './s3-storage';

export * from './types';

let storageInstance: StorageService | null = null;

function buildStorage(): StorageService {
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
    return new S3Storage(s3Bucket, (config.s3Region as string) || 'auto', s3Endpoint, s3AccessKeyId, s3SecretAccessKey);
  }

  return new FileSystemStorage(storagePath || './storage/cases');
}

export function getStorage(): StorageService {
  if (!storageInstance) {
    storageInstance = buildStorage();
  }
  return storageInstance;
}

export function resetStorageInstance(): void {
  storageInstance = null;
}
