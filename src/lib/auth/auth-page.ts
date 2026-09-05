import { googleClientId } from './config';
import { verifyGoogleCredential } from './google';
import { isSignedIn } from './session';

function nextPath(): string {
  const raw = new URLSearchParams(window.location.search).get('next') || '/chart';
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/chart';
}

export function mountAuthPage(root: HTMLElement): void {
  if (isSignedIn()) {
    window.location.replace(nextPath());
    return;
  }

  const clientId = googleClientId();
  const status = root.querySelector<HTMLElement>('[data-auth-status]');
  const buttonHost = root.querySelector<HTMLElement>('[data-google-button]');
  if (!status || !buttonHost) return;

  if (!clientId) {
    status.textContent =
      'Studio sign-in is not configured. Add PUBLIC_GOOGLE_CLIENT_ID as described in the README, then restart the dev server.';
    return;
  }

  const start = () => {
    if (!window.google?.accounts?.id) return false;
    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: 'popup',
      auto_select: false,
      callback: async (res) => {
        status.textContent = 'Checking that account…';
        try {
          await verifyGoogleCredential(res.credential);
          window.location.replace(nextPath());
        } catch (err) {
          status.textContent = err instanceof Error ? err.message : 'Sign-in was refused.';
        }
      },
    });
    window.google.accounts.id.renderButton(buttonHost, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      logo_alignment: 'left',
    });
    status.textContent = 'Use an @atlas-interactive.com Google account. Other domains are refused.';
    return true;
  };

  if (start()) return;
  const begun = Date.now();
  const tick = window.setInterval(() => {
    if (start()) {
      window.clearInterval(tick);
      return;
    }
    if (Date.now() - begun > 8000) {
      window.clearInterval(tick);
      status.textContent = 'The Google sign-in script did not load. Check the network, then refresh.';
    }
  }, 50);
}
