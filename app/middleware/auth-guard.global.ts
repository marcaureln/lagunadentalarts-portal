export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession();

  // Ensure we have fresh session data
  await fetch();

  console.log('[Auth Guard]', {
    path: to.path,
    loggedIn: loggedIn.value,
    user: user.value,
  });

  // If user is authenticated
  if (loggedIn.value) {
    // If trying to access login page, redirect to portal
    if (to.path === '/portal/login') {
      console.log('[Auth Guard] Redirecting logged-in user from login to portal');
      return navigateTo('/portal');
    }

    // Check for admin routes
    if (to.path.startsWith('/portal/admin')) {
      const role = (user.value as any)?.role;
      if (role !== 'ADMIN') {
        // Redirect to portal if not admin
        console.log('[Auth Guard] Non-admin trying to access admin route');
        return navigateTo('/portal');
      }
    }
  } else {
    // If user is NOT authenticated
    // Protect /portal routes, but allow /portal/login
    if (to.path.startsWith('/portal') && to.path !== '/portal/login') {
      console.log('[Auth Guard] Unauthenticated user trying to access protected route, redirecting to login');
      return navigateTo('/portal/login');
    }
  }
});
