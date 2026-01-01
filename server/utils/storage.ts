import { mkdir, writeFile, unlink, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export type StorageProvider = 'fs' | 's3' | 'box';

export interface StorageConfig {
  provider: StorageProvider;
  basePath?: string; // For FS provider
  s3Bucket?: string; // For S3 provider
  s3Region?: string;
  boxFolderId?: string; // For Box provider
}

export interface UploadedFile {
  path: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface StorageService {
  createCaseFolder(caseId: string, practiceId: string): Promise<string>;
  uploadFile(caseId: string, slotId: string, file: Buffer, fileName: string, mimeType?: string): Promise<UploadedFile>;
  deleteFile(caseId: string, filePath: string): Promise<void>;
  listFiles(caseId: string): Promise<UploadedFile[]>;
  getFileUrl(caseId: string, filePath: string): Promise<string>;
}

const config = useRuntimeConfig();

function getStorageConfig(): StorageConfig {
  const provider = (config.storageProvider as StorageProvider) || 'fs';
  return {
    provider,
    basePath: config.storagePath || './storage/cases',
    s3Bucket: config.s3Bucket,
    s3Region: config.s3Region,
    boxFolderId: config.boxRootFolderId,
  };
}

class FileSystemStorage implements StorageService {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

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

    // Ensure case folder exists
    if (!existsSync(casePath)) {
      await mkdir(casePath, { recursive: true });
    }

    // Create slot subfolder
    const slotPath = join(casePath, slotId);
    if (!existsSync(slotPath)) {
      await mkdir(slotPath, { recursive: true });
    }

    // Write file
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

    if (!existsSync(casePath)) {
      return files;
    }

    const slots = await readdir(casePath);
    for (const slotId of slots) {
      const slotPath = join(casePath, slotId);
      const slotStat = await stat(slotPath);

      if (slotStat.isDirectory()) {
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
    }

    return files;
  }

  async getFileUrl(caseId: string, filePath: string): Promise<string> {
    // For FS, return a relative path that can be served
    return `/api/cases/${caseId}/files/${filePath}`;
  }
}

class S3Storage implements StorageService {
  private bucket: string;
  private region: string;

  constructor(bucket: string, region: string) {
    this.bucket = bucket;
    this.region = region;
  }

  async createCaseFolder(caseId: string, _practiceId: string): Promise<string> {
    // S3 doesn't need explicit folder creation - folders are virtual
    return `s3://${this.bucket}/cases/${caseId}/`;
  }

  async uploadFile(
    caseId: string,
    slotId: string,
    _file: Buffer,
    fileName: string,
    mimeType?: string
  ): Promise<UploadedFile> {
    // TODO: Implement S3 upload using AWS SDK
    // const s3Client = new S3Client({ region: this.region });
    // await s3Client.send(new PutObjectCommand({
    //   Bucket: this.bucket,
    //   Key: `cases/${caseId}/${slotId}/${fileName}`,
    //   Body: file,
    //   ContentType: mimeType,
    // }));

    throw new Error('S3 storage not yet implemented');

    return {
      path: `${slotId}/${fileName}`,
      fileName,
      fileSize: 0,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };
  }

  async deleteFile(_caseId: string, _filePath: string): Promise<void> {
    // TODO: Implement S3 delete
    throw new Error('S3 storage not yet implemented');
  }

  async listFiles(_caseId: string): Promise<UploadedFile[]> {
    // TODO: Implement S3 list
    throw new Error('S3 storage not yet implemented');
  }

  async getFileUrl(caseId: string, filePath: string): Promise<string> {
    // TODO: Generate presigned URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/cases/${caseId}/${filePath}`;
  }
}

class BoxStorage implements StorageService {
  private rootFolderId: string;

  constructor(rootFolderId: string) {
    this.rootFolderId = rootFolderId;
  }

  async createCaseFolder(_caseId: string, _practiceId: string): Promise<string> {
    // TODO: Implement Box folder creation using Box SDK
    // 1. Check if practice folder exists under root, create if not
    // 2. Create case folder under practice folder
    throw new Error('Box storage not yet implemented');
  }

  async uploadFile(
    _caseId: string,
    _slotId: string,
    _file: Buffer,
    _fileName: string,
    _mimeType?: string
  ): Promise<UploadedFile> {
    // TODO: Implement Box upload
    throw new Error('Box storage not yet implemented');
  }

  async deleteFile(_caseId: string, _filePath: string): Promise<void> {
    // TODO: Implement Box delete
    throw new Error('Box storage not yet implemented');
  }

  async listFiles(_caseId: string): Promise<UploadedFile[]> {
    // TODO: Implement Box list
    throw new Error('Box storage not yet implemented');
  }

  async getFileUrl(_caseId: string, _filePath: string): Promise<string> {
    // TODO: Generate Box shared link or download URL
    throw new Error('Box storage not yet implemented');
  }
}

let storageInstance: StorageService | null = null;

export function getStorage(): StorageService {
  if (storageInstance) {
    return storageInstance;
  }

  const storageConfig = getStorageConfig();

  switch (storageConfig.provider) {
    case 'fs':
      storageInstance = new FileSystemStorage(storageConfig.basePath || './storage/cases');
      break;
    case 's3':
      if (!storageConfig.s3Bucket || !storageConfig.s3Region) {
        throw new Error('S3 storage requires s3Bucket and s3Region configuration');
      }
      storageInstance = new S3Storage(storageConfig.s3Bucket, storageConfig.s3Region);
      break;
    case 'box':
      if (!storageConfig.boxFolderId) {
        throw new Error('Box storage requires boxFolderId configuration');
      }
      storageInstance = new BoxStorage(storageConfig.boxFolderId);
      break;
    default:
      throw new Error(`Unknown storage provider: ${storageConfig.provider}`);
  }

  return storageInstance;
}

export function resetStorageInstance(): void {
  storageInstance = null;
}
