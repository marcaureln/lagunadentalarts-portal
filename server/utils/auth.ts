interface MicrosoftRawUser {
  email?: string | null;
  mail?: string | null;
  otherMails?: string[] | null;
  userPrincipalName?: string | null;
}

export function extractEmailFromMicrosoftUser(rawUser: MicrosoftRawUser): string | null {
  if (rawUser.email) return rawUser.email;
  if (rawUser.mail) return rawUser.mail;
  if (Array.isArray(rawUser.otherMails) && rawUser.otherMails.length > 0) {
    return rawUser.otherMails[0] ?? null;
  }

  // Guest accounts (#EXT#@) have the real email embedded in userPrincipalName
  // as "<local>_<domain>#EXT#@tenant.onmicrosoft.com" with `.` in the original domain replaced by `_`.
  const upn = rawUser.userPrincipalName;
  if (upn?.includes('#EXT#@')) {
    const beforeExt = upn.split('#EXT#@')[0];
    if (beforeExt?.endsWith('_gmail.com')) {
      return beforeExt.replace('_gmail.com', '@gmail.com');
    }
  }

  return null;
}
