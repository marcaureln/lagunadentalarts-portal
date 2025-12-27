import type { H3Event } from 'h3';
import type { UserRole } from '../types/user';

interface User {
  role: UserRole | null;
}

interface UserSession {
  user: User;
}

/**
 * Ensures the current user is an admin
 * @throws {Error} If user is not authenticated or not an admin
 */
export async function requireAdmin(event: H3Event): Promise<UserSession> {
  const { user } = await requireUserSession(event);

  if (!user || user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Admin access required',
    });
  }

  return { user } as UserSession;
}

/**
 * Type guard to check if a role is admin
 */
export function isAdmin(role: UserRole | null | undefined): role is 'ADMIN' {
  return role === 'ADMIN';
}

/**
 * Simple admin check for non-API contexts
 */
export function checkAdminRole(user: unknown): boolean {
  return (user as User)?.role === 'ADMIN';
}
