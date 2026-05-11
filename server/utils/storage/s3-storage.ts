import { basename } from 'path';
import type { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import type { DownloadedFile, StorageService, UploadedFile, UploadedResource } from './types';
import { buildResourceKey, guessMimeType } from './helpers';

export class S3Storage implements StorageService {
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

  async uploadResource(file: Buffer, fileName: string, mimeType: string): Promise<UploadedResource> {
    const storageKey = buildResourceKey(fileName);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: file,
        ContentType: mimeType,
      })
    );
    return { storageKey, fileSize: file.length, mimeType };
  }

  async deleteResource(storageKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }

  async downloadResource(storageKey: string): Promise<DownloadedFile> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }));
    if (!result.Body) {
      throw createError({ statusCode: 404, statusMessage: 'File not found' });
    }
    const fileName = basename(storageKey);
    return {
      stream: result.Body as Readable,
      contentType: result.ContentType || guessMimeType(fileName),
      contentLength: result.ContentLength ?? 0,
      fileName,
    };
  }
}
