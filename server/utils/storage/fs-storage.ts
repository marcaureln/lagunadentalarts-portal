import { createReadStream, createWriteStream, existsSync } from 'fs';
import { mkdir, writeFile, unlink, readdir, stat, rm } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { pipeline } from 'stream/promises';
import type {
  ChunkedUploadAbortParams,
  ChunkedUploadCompleteParams,
  ChunkedUploadInit,
  ChunkedUploadInitiateParams,
  ChunkedUploadProxyParams,
  DownloadedFile,
  StorageService,
  UploadedFile,
  UploadedResource,
} from './types';
import { buildResourceKey, guessMimeType } from './helpers';

const FS_CHUNK_SIZE = 8 * 1024 * 1024; // 8 MiB
const FS_MAX_CONCURRENCY = 4;

export class FileSystemStorage implements StorageService {
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

  private get resourcesPath(): string {
    return join(dirname(this.basePath), 'resources');
  }

  async uploadResource(file: Buffer, fileName: string, mimeType: string): Promise<UploadedResource> {
    if (!existsSync(this.resourcesPath)) await mkdir(this.resourcesPath, { recursive: true });
    const storageKey = buildResourceKey(fileName);
    await writeFile(join(this.resourcesPath, basename(storageKey)), file);
    return { storageKey, fileSize: file.length, mimeType };
  }

  async deleteResource(storageKey: string): Promise<void> {
    const filePath = join(this.resourcesPath, basename(storageKey));
    if (existsSync(filePath)) await unlink(filePath);
  }

  async downloadResource(storageKey: string): Promise<DownloadedFile> {
    const filePath = join(this.resourcesPath, basename(storageKey));
    if (!existsSync(filePath)) {
      throw createError({ statusCode: 404, statusMessage: 'File not found' });
    }
    const fileStat = await stat(filePath);
    const fileName = basename(storageKey);
    return {
      stream: createReadStream(filePath),
      contentType: guessMimeType(fileName),
      contentLength: fileStat.size,
      fileName,
    };
  }

  private uploadsRoot(): string {
    return join(this.basePath, '.uploads');
  }

  private sessionDir(externalUploadId: string): string {
    return join(this.uploadsRoot(), externalUploadId);
  }

  private partPath(externalUploadId: string, partNumber: number): string {
    return join(this.sessionDir(externalUploadId), `part-${partNumber.toString().padStart(6, '0')}`);
  }

  async initiateChunkedUpload(params: ChunkedUploadInitiateParams): Promise<ChunkedUploadInit> {
    const { caseId, fileSize } = params;
    const externalUploadId = `${caseId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await mkdir(this.sessionDir(externalUploadId), { recursive: true });
    const totalChunks = Math.max(1, Math.ceil(fileSize / FS_CHUNK_SIZE));

    const parts = Array.from({ length: totalChunks }, (_, i) => ({
      partNumber: i + 1,
      url: '',
      method: 'POST' as const,
    }));

    return {
      externalUploadId,
      chunkSize: FS_CHUNK_SIZE,
      totalChunks,
      maxConcurrency: FS_MAX_CONCURRENCY,
      parts,
    };
  }

  async proxyUploadChunk(params: ChunkedUploadProxyParams): Promise<{ etag: string | null }> {
    const { externalUploadId, partNumber, body } = params;
    const dir = this.sessionDir(externalUploadId);
    if (!existsSync(dir)) {
      throw createError({ statusCode: 404, statusMessage: 'Upload session not found' });
    }
    await pipeline(body, createWriteStream(this.partPath(externalUploadId, partNumber)));
    return { etag: null };
  }

  async completeChunkedUpload(params: ChunkedUploadCompleteParams): Promise<UploadedFile> {
    const { caseId, slotId, fileName, fileSize, mimeType, externalUploadId, parts } = params;
    const dir = this.sessionDir(externalUploadId);
    if (!existsSync(dir)) {
      throw createError({ statusCode: 404, statusMessage: 'Upload session not found' });
    }

    const casePath = this.getCasePath(caseId);
    const slotPath = join(casePath, slotId);
    if (!existsSync(slotPath)) await mkdir(slotPath, { recursive: true });
    const finalPath = join(slotPath, fileName);

    const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
    await writeFile(finalPath, '');
    for (const part of sorted) {
      const partFile = this.partPath(externalUploadId, part.partNumber);
      if (!existsSync(partFile)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Missing part ${part.partNumber}`,
        });
      }
      await pipeline(createReadStream(partFile), createWriteStream(finalPath, { flags: 'a' }));
    }

    await rm(dir, { recursive: true, force: true });

    return {
      path: join(slotId, fileName),
      fileName,
      fileSize,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };
  }

  async abortChunkedUpload(params: ChunkedUploadAbortParams): Promise<void> {
    await rm(this.sessionDir(params.externalUploadId), { recursive: true, force: true });
  }
}
