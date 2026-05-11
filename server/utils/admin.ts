import type { H3Event } from 'h3';
import type { User } from '../types/user';

export async function requireAdmin(event: H3Event): Promise<{ user: Pick<User, 'role'> }> {
  const { user } = await requireUserSession(event);

  if (!user || user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Admin access required',
    });
  }

  return { user };
}
