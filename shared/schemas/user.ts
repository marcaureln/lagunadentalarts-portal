import { z } from 'zod';

export const ldaRoleSchema = z.enum(['ADMIN', 'USER']);
export const practiceRoleSchema = z.enum(['PRACTICE_STAFF', 'PRACTICE_ADMIN']);
export const userRoleSchema = z.enum(['ADMIN', 'USER', 'PRACTICE_STAFF', 'PRACTICE_ADMIN']);

export const updateUserBody = <T extends z.ZodTypeAny>(roleSchema: T) =>
  z
    .object({
      name: z.string().min(1).optional(),
      email: z.email().optional(),
      role: roleSchema.optional(),
    })
    .refine((d) => d.name !== undefined || d.email !== undefined || d.role !== undefined, {
      message: 'At least one field must be provided',
    });
