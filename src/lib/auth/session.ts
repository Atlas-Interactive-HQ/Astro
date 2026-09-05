import { STUDIO_SESSION_KEY, isStudioEmail } from './config';

export interface StudioSession {
  email: string;
  name: string;
  exp: number;
  sub: string;
}

export function readSession(): StudioSession | null {
  try {
    const raw = sessionStorage.getItem(STUDIO_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StudioSession;
    if (!s.email || !isStudioEmail(s.email)) return null;
    if (typeof s.exp !== 'number' || s.exp * 1000 < Date.now() + 30_000) return null;
    return s;
  } catch {
    return null;
  }
}

export function writeSession(s: StudioSession): void {
  sessionStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(s));
}

export function clearSession(): void {
  sessionStorage.removeItem(STUDIO_SESSION_KEY);
}

export function isSignedIn(): boolean {
  return readSession() !== null;
}
