export interface CaseTypeField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

export interface CaseTypeFileSlot {
  id: string;
  label: string;
  required: boolean;
  accept?: string;
}

export interface CaseFile {
  slotId: string;
  fileName: string;
  fileSize?: number;
  path?: string;
  uploadedAt?: string;
  mimeType?: string;
}

export interface CaseType {
  id: string;
  key: string;
  label: string;
  fields: CaseTypeField[];
  fileSlots: CaseTypeFileSlot[];
  instructions: string | null;
}

export type CaseData = Record<string, unknown>;
