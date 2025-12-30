import crypto from 'node:crypto';

export function generateTemporaryPassword(): string {
  return crypto.randomBytes(12).toString('base64url');
}
