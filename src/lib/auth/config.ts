export const STUDIO_DOMAIN = 'atlas-interactive.com';
export const STUDIO_SESSION_KEY = 'atlas-astro.studio-v1';
export const TOKENINFO = 'https://oauth2.googleapis.com/tokeninfo';

export function googleClientId(): string {
  const id = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;
  return typeof id === 'string' ? id.trim() : '';
}

export function isStudioEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return e.endsWith(`@${STUDIO_DOMAIN}`);
}
