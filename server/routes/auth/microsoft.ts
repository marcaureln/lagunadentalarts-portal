import { extractEmailFromMicrosoftUser } from '../../utils/auth';
import { logger } from '../../utils/logger';
import { prisma } from '~~/server/utils/prisma';
import type { H3Event } from 'h3';

export default defineOAuthMicrosoftEventHandler({
  config: {
    scope: ['User.Read', 'email', 'profile', 'openid'],
  },
  async onSuccess(event: H3Event, { user, tokens: _tokens }: { user: Record<string, unknown>; tokens: unknown }) {
    const email = extractEmailFromMicrosoftUser(user);
    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MissingEmail',
        message: 'Unable to determine your email from Microsoft login.',
      });
    }

    // Check if user exists in the User table (Allowlist)
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!dbUser) {
      // Reject login if user is not pre-created
      throw createError({
        statusCode: 403,
        statusMessage: 'AccessDenied',
        message: 'You are not authorized to access this portal.',
      });
    }

    // Set user session
    await setUserSession(event, {
      user: {
        id: dbUser.id,
        email,
        name: dbUser.name,
        pfp: dbUser.pfp,
        role: dbUser.role,
        practiceId: dbUser.practiceId,
        passwordExpiresAt: null,
      },
    });

    return sendRedirect(event, '/');
  },
  onError(event: H3Event, error: unknown) {
    logger.error('Microsoft OAuth Error', { error });
    return sendRedirect(event, '/login?error=OAuthError');
  },
});
