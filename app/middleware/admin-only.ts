import { permissions } from '~~/shared/utils/permissions';

export default defineNuxtRouteMiddleware(() => {
  const { user } = useUserSession();
  if (!permissions.canManageAllUsers(user.value?.role)) {
    return navigateTo('/');
  }
});
