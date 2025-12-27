import { z } from 'zod';
import { requireAdmin } from '~~/server/utils/admin';

const bodySchema = z.object({
  email: z.email(),
  role: z.enum(['PRACTICESTAFF', 'ADMIN']),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  try {
    const { email, role } = await readValidatedBody(event, bodySchema.parse);

    const newUser = await prisma.user.create({
      data: {
        email,
        role,
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
