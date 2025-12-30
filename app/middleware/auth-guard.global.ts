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
    const passwordExpiresAt = user.value?.passwordExpiresAt ? new Date(user.value.passwordExpiresAt).getTime() : null;
    const isPasswordExpired = passwordExpiresAt !== null && passwordExpiresAt <= Date.now();

    if (to.path.startsWith('/portal')) {
      if (isPasswordExpired && to.path !== '/portal/password') {
        console.log('[Auth Guard] Password expired, redirecting to password change');
        return navigateTo('/portal/password');
      }

      if (!isPasswordExpired && to.path === '/portal/password') {
        console.log('[Auth Guard] Password not expired, redirecting away from password change');
        return navigateTo('/portal');
      }
    }

    // If trying to access login page, redirect to portal
    if (to.path === '/portal/login') {
      console.log('[Auth Guard] Redirecting logged-in user from login to portal');
      return navigateTo('/portal');
    }

    // Check for admin routes
    if (to.path.startsWith('/portal/admin')) {
      const role = user.value?.role;
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
