export default defineEventHandler(async (event) => {
  await clearUserSession(event);

  const query = getQuery(event);
  const redirectTo = typeof query.redirectTo === 'string' ? query.redirectTo : null;

  if (redirectTo && redirectTo.startsWith('/')) {
    return sendRedirect(event, redirectTo);
  }

  return sendRedirect(event, '/login');
});
