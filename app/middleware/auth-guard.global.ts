const PUBLIC_PATHS = new Set(['/login']);

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.has(path) || path.startsWith('/auth/');
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession();

  await fetch();

  if (loggedIn.value) {
    const passwordExpiresAt = user.value?.passwordExpiresAt ? new Date(user.value.passwordExpiresAt).getTime() : null;
    const isPasswordExpired = passwordExpiresAt !== null && passwordExpiresAt <= Date.now();

    if (isPasswordExpired && to.path !== '/password') {
      return navigateTo('/password');
    }

    if (!isPasswordExpired && to.path === '/password') {
      return navigateTo('/');
    }

    if (to.path === '/login') {
      return navigateTo('/');
    }

    if (to.path.startsWith('/admin') && user.value?.role !== 'ADMIN') {
      return navigateTo('/');
    }
  } else if (!isPublicPath(to.path)) {
    return navigateTo('/login');
  }
});
