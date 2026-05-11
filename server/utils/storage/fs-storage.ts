import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile, unlink, readdir, stat } from 'fs/promises';
import { basename, dirname, join } from 'path';
import type { DownloadedFile, StorageService, UploadedFile, UploadedResource } from './types';
import { buildResourceKey, guessMimeType } from './helpers';

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
}
