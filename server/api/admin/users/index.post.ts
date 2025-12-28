import { z } from 'zod';
import { requireAdmin } from '~~/server/utils/admin';

const bodySchema = z.object({
  email: z.email(),
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'PRACTICE_STAFF', 'PRACTICE_ADMIN']),
  practiceId: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  try {
    const { email, name, role, practiceId } = await readValidatedBody(event, bodySchema.parse);

    // Validate practice assignment
    if (['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(role) && !practiceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Practice ID is required for practice roles',
      });
    }

    if (['USER', 'ADMIN'].includes(role) && practiceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'LDA roles cannot be assigned to a practice',
      });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        ...(practiceId && { practiceId }),
      },
    });
    return newUser;
  } catch (e: unknown) {
    if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'User already exists',
      });
    }
    throw e;
  }
});
