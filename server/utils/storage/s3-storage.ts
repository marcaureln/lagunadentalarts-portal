import { basename } from 'path';
import type { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  UploadPartCommand,
  ListPartsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

const S3_CHUNK_SIZE = 8 * 1024 * 1024; // 8 MiB
const S3_PRESIGN_EXPIRES_SECONDS = 3600;
const S3_MAX_CONCURRENCY = 4;

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

  private chunkedKey(caseId: string, slotId: string, fileName: string): string {
    return this.key(caseId, `${slotId}/${fileName}`);
  }

  async initiateChunkedUpload(params: ChunkedUploadInitiateParams): Promise<ChunkedUploadInit> {
    const { caseId, slotId, fileName, fileSize, mimeType } = params;
    const key = this.chunkedKey(caseId, slotId, fileName);
    const totalChunks = Math.max(1, Math.ceil(fileSize / S3_CHUNK_SIZE));

    const created = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType || guessMimeType(fileName),
      })
    );
    if (!created.UploadId) {
      throw createError({ statusCode: 502, statusMessage: 'S3 did not return an UploadId' });
    }

    const parts = await Promise.all(
      Array.from({ length: totalChunks }, (_, i) => i + 1).map(async (partNumber) => {
        const command = new UploadPartCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: created.UploadId,
          PartNumber: partNumber,
        });
        const url = await getSignedUrl(this.client, command, { expiresIn: S3_PRESIGN_EXPIRES_SECONDS });
        return { partNumber, url, method: 'PUT' as const };
      })
    );

    return {
      externalUploadId: created.UploadId,
      chunkSize: S3_CHUNK_SIZE,
      totalChunks,
      maxConcurrency: S3_MAX_CONCURRENCY,
      parts,
    };
  }

  async proxyUploadChunk(_params: ChunkedUploadProxyParams): Promise<{ etag: string | null }> {
    throw createError({
      statusCode: 410,
      statusMessage: 'S3 chunked uploads are direct-to-backend; proxy endpoint is not used',
    });
  }

  async completeChunkedUpload(params: ChunkedUploadCompleteParams): Promise<UploadedFile> {
    const { caseId, slotId, fileName, fileSize, mimeType, externalUploadId } = params;
    const key = this.chunkedKey(caseId, slotId, fileName);

    // Read ETags from S3 directly via ListParts. The browser can't be relied on to surface them
    // (requires bucket CORS to ExposeHeader: ETag), so we ignore client-supplied etags entirely.
    const collected: { PartNumber: number; ETag: string }[] = [];
    let partNumberMarker: string | undefined;
    do {
      const listed = await this.client.send(
        new ListPartsCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: externalUploadId,
          PartNumberMarker: partNumberMarker,
        })
      );
      for (const p of listed.Parts ?? []) {
        if (p.PartNumber != null && p.ETag) {
          collected.push({ PartNumber: p.PartNumber, ETag: p.ETag });
        }
      }
      partNumberMarker = listed.IsTruncated ? listed.NextPartNumberMarker : undefined;
    } while (partNumberMarker);

    collected.sort((a, b) => a.PartNumber - b.PartNumber);

    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: externalUploadId,
        MultipartUpload: { Parts: collected },
      })
    );

    return {
      path: `${slotId}/${fileName}`,
      fileName,
      fileSize,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };
  }

  async abortChunkedUpload(params: ChunkedUploadAbortParams): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.chunkedKey(params.caseId, params.slotId, params.fileName),
        UploadId: params.externalUploadId,
      })
    );
  }
}
