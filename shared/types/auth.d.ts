declare module '#auth-utils' {
  // Keep this in sync with server/types/user.ts
  interface User {
    id: string;
    name: string | null;
    email: string | null;
    pfp: string | null;
    role: 'ADMIN' | 'PRACTICESTAFF' | null;
    createdAt: string;
    updatedAt: string;
  }
}
