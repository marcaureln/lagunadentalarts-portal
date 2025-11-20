export function extractEmailFromMicrosoftUser(rawUser: any): string | null {
  // 1. Try direct email fields first
  if (rawUser.email) return rawUser.email;
  if (rawUser.mail) return rawUser.mail;
  if (Array.isArray(rawUser.otherMails) && rawUser.otherMails.length > 0) {
    return rawUser.otherMails[0];
  }

  // 2. Fallback: parse from userPrincipalName for guest accounts
  if (rawUser.userPrincipalName?.includes('#EXT#@')) {
    const upn = rawUser.userPrincipalName; // alexmarcaureln_gmail.com#EXT#@tenant.onmicrosoft.com
    const beforeExt = upn.split('#EXT#@')[0]; // "alexmarcaureln_gmail.com"
    // handle common pattern "<local>_gmail.com"
    if (beforeExt.endsWith('_gmail.com')) {
      return beforeExt.replace('_gmail.com', '@gmail.com');
    }
    // If they later have other domains, you can expand this logic
  }

  return null;
}
