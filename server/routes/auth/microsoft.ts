export default defineOAuthMicrosoftEventHandler({
  config: {
    scope: ['User.Read'],
  },
  async onSuccess(event, { user, tokens }) {
    // Check if user exists in the User table (Allowlist)
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
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
        email: dbUser.email!,
        name: user.name || dbUser.name || '',
        role: dbUser.role || 'PRACTICESTAFF',
        // practiceId: dbUser.practiceId,
      },
    });

    return sendRedirect(event, '/app');
  },
  onError(event, error) {
    console.error('Microsoft OAuth Error:', error);
    return sendRedirect(event, '/login?error=OAuthError');
  },
});
