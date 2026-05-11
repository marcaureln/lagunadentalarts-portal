import crypto from 'node:crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { prisma } from './prisma';

export function generateTemporaryPassword(): string {
  return crypto.randomBytes(12).toString('base64url');
}

export async function resetUserPassword(userId: string): Promise<string> {
  const temporaryPassword = generateTemporaryPassword();
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(temporaryPassword),
        passwordExpiresAt: new Date(),
      },
    });
    return temporaryPassword;
  } catch (e: unknown) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }
    throw e;
  }
}
