import { randomUUID } from 'crypto';

export const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

export const MIME_TYPES: Record<string, string> = {
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

export function guessMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return (ext && MIME_TYPES[ext]) || DEFAULT_CONTENT_TYPE;
}

export function buildResourceKey(fileName: string): string {
  const safe = fileName.replace(/[^\w.-]+/g, '_');
  return `resources/${randomUUID()}-${safe}`;
}
