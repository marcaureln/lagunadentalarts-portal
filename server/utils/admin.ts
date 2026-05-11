import type { H3Event } from 'h3';
import type { User } from '../types/user';
import { permissions } from '~~/shared/utils/permissions';

export async function requireAdmin(event: H3Event): Promise<{ user: Pick<User, 'role'> }> {
  const { user } = await requireUserSession(event);

  if (!user || !permissions.isLabAdmin(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Admin access required',
    });
  }

  return { user };
}
