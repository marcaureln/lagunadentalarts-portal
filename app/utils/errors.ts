export function getErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'statusMessage' in e) {
    return String((e as { statusMessage?: unknown }).statusMessage || fallback);
  }
  return fallback;
}
