import { requireAdmin } from '~~/server/utils/admin';
import { resetUserPassword } from '~~/server/utils/password';
import { requireUserId } from '~~/server/utils/routeParams';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { user: adminUser } = await requireUserSession(event);
  const id = requireUserId(event);

  if (id === adminUser.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot reset your own password — use /password to change it instead',
    });
  }

  const temporaryPassword = await resetUserPassword(id);
  return { temporaryPassword };
});
