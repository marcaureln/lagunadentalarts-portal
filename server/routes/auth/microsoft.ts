import { extractEmailFromMicrosoftUser } from '../../utils/auth';

export default defineOAuthMicrosoftEventHandler({
  config: {
    scope: ['User.Read', 'email', 'profile', 'openid'],
  },
  async onSuccess(event, { user, tokens }) {
    console.log('Microsoft OAuth Success:', user, tokens);
    console.log('Raw User Object:', JSON.stringify(user, null, 2));

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
        email,
        name: user.name || user.displayName || dbUser.name || '',
        role: dbUser.role || 'PRACTICESTAFF',
      },
    });

    return sendRedirect(event, '/portal');
  },
  onError(event, error) {
    console.error('Microsoft OAuth Error:', error);
    return sendRedirect(event, '/portal/login?error=OAuthError');
  },
});
