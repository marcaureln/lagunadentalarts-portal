import { z } from 'zod';

export const caseTypeFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'select', 'textarea']),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

export const caseTypeFileSlotSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean(),
  accept: z.string().optional(),
});

export const caseFileSchema = z.object({
  slotId: z.string(),
  fileName: z.string(),
  fileSize: z.number().optional(),
  path: z.string().optional(),
  uploadedAt: z.string().optional(),
  mimeType: z.string().optional(),
});

export const caseTypeFieldsArraySchema = z.array(caseTypeFieldSchema);
export const caseTypeFileSlotsArraySchema = z.array(caseTypeFileSlotSchema);
export const caseFilesArraySchema = z.array(caseFileSchema);
