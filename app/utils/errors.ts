export function getErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object') {
    const obj = e as { statusMessage?: unknown; data?: { statusMessage?: unknown } };
    if (typeof obj.statusMessage === 'string' && obj.statusMessage) return obj.statusMessage;
    if (typeof obj.data?.statusMessage === 'string' && obj.data.statusMessage) return obj.data.statusMessage;
  }
  return fallback;
}
