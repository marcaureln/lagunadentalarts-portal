import type { Readable } from 'stream';

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

export interface UploadedResource {
  storageKey: string;
  fileSize: number;
  mimeType: string;
}

export interface DownloadedFile {
  stream: Readable;
  contentType: string;
  contentLength: number;
  fileName: string;
}

export interface ChunkedUploadPart {
  partNumber: number;
  url: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
}

export interface ChunkedUploadInit {
  externalUploadId: string;
  chunkSize: number;
  totalChunks: number;
  maxConcurrency: number;
  parts: ChunkedUploadPart[];
}

export interface ChunkedUploadCompletePart {
  partNumber: number;
  etag?: string;
}

export interface ChunkedUploadInitiateParams {
  caseId: string;
  slotId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ChunkedUploadProxyParams {
  externalUploadId: string;
  partNumber: number;
  totalChunks: number;
  chunkSize: number;
  body: Readable;
  contentLength: number;
}

export interface ChunkedUploadCompleteParams {
  caseId: string;
  slotId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  externalUploadId: string;
  parts: ChunkedUploadCompletePart[];
}

export interface StorageService {
  createCaseFolder(caseId: string, practiceId: string): Promise<string>;
  uploadFile(caseId: string, slotId: string, file: Buffer, fileName: string, mimeType?: string): Promise<UploadedFile>;
  deleteFile(caseId: string, filePath: string): Promise<void>;
  listFiles(caseId: string): Promise<UploadedFile[]>;
  getFileUrl(caseId: string, filePath: string): Promise<string>;
  downloadFile(caseId: string, filePath: string): Promise<DownloadedFile>;
  uploadResource(file: Buffer, fileName: string, mimeType: string): Promise<UploadedResource>;
  deleteResource(storageKey: string): Promise<void>;
  downloadResource(storageKey: string): Promise<DownloadedFile>;

  initiateChunkedUpload(params: ChunkedUploadInitiateParams): Promise<ChunkedUploadInit>;
  proxyUploadChunk(params: ChunkedUploadProxyParams): Promise<{ etag: string | null }>;
  completeChunkedUpload(params: ChunkedUploadCompleteParams): Promise<UploadedFile>;
  abortChunkedUpload(params: ChunkedUploadAbortParams): Promise<void>;
}

export interface ChunkedUploadAbortParams {
  caseId: string;
  slotId: string;
  fileName: string;
  externalUploadId: string;
}
