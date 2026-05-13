export interface FileTypeMeta {
  icon: string;
  colorClass: string;
  label: string;
}

const META: Record<string, FileTypeMeta> = {
  pdf: { icon: 'i-ri-file-pdf-2-line', colorClass: 'text-red-500', label: 'PDF' },
  zip: { icon: 'i-ri-folder-zip-line', colorClass: 'text-amber-500', label: 'ZIP' },
  stl: { icon: 'i-ri-shapes-line', colorClass: 'text-violet-500', label: 'STL' },
  ply: { icon: 'i-ri-shapes-line', colorClass: 'text-violet-500', label: 'PLY' },
  dcm: { icon: 'i-ri-scan-line', colorClass: 'text-sky-500', label: 'DCM' },
  jpg: { icon: 'i-ri-image-line', colorClass: 'text-emerald-500', label: 'JPG' },
  jpeg: { icon: 'i-ri-image-line', colorClass: 'text-emerald-500', label: 'JPEG' },
  png: { icon: 'i-ri-image-line', colorClass: 'text-emerald-500', label: 'PNG' },
  webp: { icon: 'i-ri-image-line', colorClass: 'text-emerald-500', label: 'WEBP' },
  gif: { icon: 'i-ri-image-line', colorClass: 'text-emerald-500', label: 'GIF' },
  heic: { icon: 'i-ri-image-line', colorClass: 'text-emerald-500', label: 'HEIC' },
};

const FALLBACK: FileTypeMeta = { icon: 'i-ri-file-line', colorClass: 'text-muted', label: 'File' };

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic']);

export function getFileExtension(fileName: string): string {
  return fileName.toLowerCase().split('.').pop() ?? '';
}

export function getFileTypeMeta(fileName: string): FileTypeMeta {
  return META[getFileExtension(fileName)] ?? FALLBACK;
}

export function isImageExtension(ext: string): boolean {
  return IMAGE_EXTENSIONS.has(ext);
}

export function isPdfExtension(ext: string): boolean {
  return ext === 'pdf';
}
