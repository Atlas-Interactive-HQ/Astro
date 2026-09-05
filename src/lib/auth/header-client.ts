import { clearSession, readSession } from './session';

export function mountStudioSlot(root: HTMLElement): void {
  const session = readSession();
  root.hidden = false;
  if (!session) {
    const next = `${window.location.pathname}${window.location.search}` || '/chart';
    root.innerHTML = `<a class="studio-link" href="/auth?next=${encodeURIComponent(next)}">Studio sign-in</a>`;
    return;
  }
  const who = session.email;
  root.innerHTML = `<span class="studio-who">${who}</span><button type="button" class="studio-out">Sign out</button>`;
  root.querySelector('.studio-out')?.addEventListener('click', () => {
    clearSession();
    window.location.href = '/';
  });
}
