/**
 * App instalable (PWA).
 *
 * Registra el service worker para jugar sin conexión e instalar el juego como una app.
 * Solo funciona cuando el juego se sirve desde un sitio propio (por ejemplo GitHub Pages);
 * dentro de la vista de claude.ai los service workers no están permitidos y se ignora sin errores.
 */

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installEvent: InstallPromptEvent | null = null;
let onChange: () => void = () => {};

const canUseServiceWorker = (): boolean =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) &&
  !/(^|\.)claude\.ai$|claudeusercontent|anthropic/.test(location.hostname);

export function setupPWA(rerender: () => void): void {
  onChange = rerender;
  if (!canUseServiceWorker()) return;
  navigator.serviceWorker.register('sw.js').catch(() => { /* sin conexión o no permitido: el juego funciona igual */ });
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installEvent = e as InstallPromptEvent;
    onChange();
  });
  window.addEventListener('appinstalled', () => { installEvent = null; onChange(); });
}

export const isStandalone = (): boolean =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches ?? false);

/** Botón «Instalar como app», solo cuando el navegador lo permite. */
export function installBtn(): string {
  return installEvent && !isStandalone() ? '<button class="btn primary" data-a="install-app">Instalar como app</button>' : '';
}

export async function promptInstall(): Promise<void> {
  if (!installEvent) return;
  await installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  onChange();
}
