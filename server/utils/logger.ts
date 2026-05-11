import { createConsola } from 'consola';

export const logger = createConsola({
  defaults: { tag: 'portal' },
  level: process.env.NODE_ENV === 'production' ? 3 : 4,
});
