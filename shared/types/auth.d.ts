declare module '#auth-utils' {
  // Keep this in sync with server/types/user.ts
  interface User {
    id: string;
    name: string | null;
    email: string | null;
    pfp: string | null;
    role: 'USER' | 'ADMIN' | 'PRACTICE_STAFF' | 'PRACTICE_ADMIN' | null;
    practiceId: string | null;
    passwordExpiresAt: string | null;
  }
}
