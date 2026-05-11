import { logger } from '~~/server/utils/logger';

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    if (status < 500) return;
    logger.error('Unhandled server error', {
      url: event?.path,
      method: event?.method,
      statusCode: status,
      message: error.message,
      stack: error.stack,
    });
  });
});
