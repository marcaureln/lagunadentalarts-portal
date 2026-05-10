import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile, unlink, readdir, stat } from 'fs/promises';
import { basename, join } from 'path';
import type { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

export type StorageProvider = 'fs' | 's3';

export interface StorageConfig {
  provider: StorageProvider;
  basePath?: string;
  s3Bucket?: string;
  s3Region?: string;
  s3Endpoint?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
}

export interface UploadedFile {
  path: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface DownloadedFile {
  stream: Readable;
  contentType: string;
  contentLength: number;
  fileName: string;
}

export interface StorageService {
  createCaseFolder(caseId: string, practiceId: string): Promise<string>;
  uploadFile(caseId: string, slotId: string, file: Buffer, fileName: string, mimeType?: string): Promise<UploadedFile>;
  deleteFile(caseId: string, filePath: string): Promise<void>;
  listFiles(caseId: string): Promise<UploadedFile[]>;
  getFileUrl(caseId: string, filePath: string): Promise<string>;
  downloadFile(caseId: string, filePath: string): Promise<DownloadedFile>;
}

const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

const MIME_TYPES: Record<string, string> = {
  zip: 'application/zip',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  stl: 'application/sla',
  ply: 'application/octet-stream',
  obj: 'application/octet-stream',
  txt: 'text/plain',
};

function guessMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return (ext && MIME_TYPES[ext]) || DEFAULT_CONTENT_TYPE;
}

class FileSystemStorage implements StorageService {
  constructor(private basePath: string) {}

  private getCasePath(caseId: string): string {
    return join(this.basePath, caseId);
  }

  async createCaseFolder(caseId: string, _practiceId: string): Promise<string> {
    const casePath = this.getCasePath(caseId);
    if (!existsSync(casePath)) {
      await mkdir(casePath, { recursive: true });
    }
    return casePath;
  }

  async uploadFile(
    caseId: string,
    slotId: string,
    file: Buffer,
    fileName: string,
    mimeType?: string
  ): Promise<UploadedFile> {
    const casePath = this.getCasePath(caseId);
    if (!existsSync(casePath)) await mkdir(casePath, { recursive: true });

    const slotPath = join(casePath, slotId);
    if (!existsSync(slotPath)) await mkdir(slotPath, { recursive: true });

    const filePath = join(slotPath, fileName);
    await writeFile(filePath, file);

    return {
      path: join(slotId, fileName),
      fileName,
      fileSize: file.length,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };
  }

  async deleteFile(caseId: string, filePath: string): Promise<void> {
    const fullPath = join(this.getCasePath(caseId), filePath);
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }
  }

  async listFiles(caseId: string): Promise<UploadedFile[]> {
    const casePath = this.getCasePath(caseId);
    const files: UploadedFile[] = [];
    if (!existsSync(casePath)) return files;

    const slots = await readdir(casePath);
    for (const slotId of slots) {
      const slotPath = join(casePath, slotId);
      const slotStat = await stat(slotPath);
      if (!slotStat.isDirectory()) continue;

      const slotFiles = await readdir(slotPath);
      for (const fileName of slotFiles) {
        const filePath = join(slotPath, fileName);
        const fileStat = await stat(filePath);
        if (fileStat.isFile()) {
          files.push({
            path: join(slotId, fileName),
            fileName,
            fileSize: fileStat.size,
            uploadedAt: fileStat.mtime.toISOString(),
          });
        }
      }
    }
    return files;
  }

  async getFileUrl(caseId: string, filePath: string): Promise<string> {
    return `/api/cases/${caseId}/files/${filePath}`;
  }

  async downloadFile(caseId: string, filePath: string): Promise<DownloadedFile> {
    const fullPath = join(this.getCasePath(caseId), filePath);
    if (!existsSync(fullPath)) {
      throw createError({ statusCode: 404, statusMessage: 'File not found' });
    }
    const fileStat = await stat(fullPath);
    const fileName = basename(filePath);
    return {
      stream: createReadStream(fullPath),
      contentType: guessMimeType(fileName),
      contentLength: fileStat.size,
      fileName,
    };
  }
}

class S3Storage implements StorageService {
  private client: S3Client;

  constructor(
    private bucket: string,
    region: string,
    endpoint: string | undefined,
    accessKeyId: string,
    secretAccessKey: string
  ) {
    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: !!endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  private key(caseId: string, filePath: string): string {
    return `${caseId}/${filePath}`;
  }

  async createCaseFolder(caseId: string, _practiceId: string): Promise<string> {
    return `${caseId}/`;
  }

  async uploadFile(
    caseId: string,
    slotId: string,
    file: Buffer,
    fileName: string,
    mimeType?: string
  ): Promise<UploadedFile> {
    const path = `${slotId}/${fileName}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(caseId, path),
        Body: file,
        ContentType: mimeType || guessMimeType(fileName),
      })
    );
    return {
      path,
      fileName,
      fileSize: file.length,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };
  }

  async deleteFile(caseId: string, filePath: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key(caseId, filePath) }));
  }

  async listFiles(caseId: string): Promise<UploadedFile[]> {
    const prefix = `${caseId}/`;
    const result = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }));
    const files: UploadedFile[] = [];
    for (const obj of result.Contents ?? []) {
      if (!obj.Key) continue;
      const relPath = obj.Key.slice(prefix.length);
      const fileName = basename(relPath);
      files.push({
        path: relPath,
        fileName,
        fileSize: obj.Size ?? 0,
        uploadedAt: (obj.LastModified ?? new Date()).toISOString(),
      });
    }
    return files;
  }

  async getFileUrl(caseId: string, filePath: string): Promise<string> {
    return `/api/cases/${caseId}/files/${filePath}`;
  }

  async downloadFile(caseId: string, filePath: string): Promise<DownloadedFile> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.key(caseId, filePath) })
    );
    if (!result.Body) {
      throw createError({ statusCode: 404, statusMessage: 'File not found' });
    }
    const fileName = basename(filePath);
    return {
      stream: result.Body as Readable,
      contentType: result.ContentType || guessMimeType(fileName),
      contentLength: result.ContentLength ?? 0,
      fileName,
    };
  }
}

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
