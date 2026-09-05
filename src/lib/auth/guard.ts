import { isSignedIn } from './session';

export function requireStudio(returnPath: string): boolean {
  if (isSignedIn()) return true;
  const next = returnPath.startsWith('/') ? returnPath : '/chart';
  window.location.replace(`/auth?next=${encodeURIComponent(next)}`);
  return false;
}
