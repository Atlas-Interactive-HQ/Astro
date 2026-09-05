import { TOKENINFO, googleClientId, isStudioEmail } from './config';
import { writeSession, type StudioSession } from './session';

interface TokenInfo {
  aud?: string;
  iss?: string;
  email?: string;
  email_verified?: string | boolean;
  exp?: string;
  sub?: string;
  name?: string;
  hd?: string;
  error?: string;
}

const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

/**
 * Verifies a Google ID token with Google's tokeninfo endpoint.
 * Birth facts are never sent. Only the credential JWT goes to Google.
 */
export async function verifyGoogleCredential(credential: string): Promise<StudioSession> {
  const clientId = googleClientId();
  if (!clientId) throw new Error('Studio sign-in is not configured (missing PUBLIC_GOOGLE_CLIENT_ID).');

  const url = `${TOKENINFO}?id_token=${encodeURIComponent(credential)}`;
  const res = await fetch(url);
  const info = (await res.json()) as TokenInfo;
  if (!res.ok || info.error) {
    throw new Error('Google could not verify that sign-in. Try again.');
  }
  if (info.aud !== clientId) throw new Error('That sign-in was issued for a different application.');
  if (!info.iss || !ISSUERS.has(info.iss)) throw new Error('That sign-in did not come from Google.');
  const verified = info.email_verified === true || info.email_verified === 'true';
  if (!verified) throw new Error('That Google account’s email is not verified.');
  const email = (info.email ?? '').trim().toLowerCase();
  if (!isStudioEmail(email)) {
    throw new Error('Studio access is only for @atlas-interactive.com accounts. This address is not allowed.');
  }
  const exp = Number(info.exp);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) throw new Error('That sign-in has expired.');

  const session: StudioSession = {
    email,
    name: info.name?.trim() || email,
    exp,
    sub: info.sub ?? email,
  };
  writeSession(session);
  return session;
}
