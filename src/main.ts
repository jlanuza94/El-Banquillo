/**
 * Punto de entrada de la pantalla.
 * Carga los módulos del juego, conecta eventos, la vista 2D y la app instalable, y arranca.
 */
// @ts-ignore — módulos heredados sin tipos
import { S } from './state';
// @ts-ignore
import { start } from './boot';
// @ts-ignore
import { installSaveGuards } from './persist';
// @ts-ignore
import { setWorkerUrl } from './season';
// @ts-ignore
import { render } from './views/common';
// @ts-ignore
import { startAnim2d } from './match2d';
import './events';
import { setupPWA, promptInstall } from './pwa';

declare const __BUILD__: string;
declare global {
  interface Window {
    claude?: { hot?: { snapshot?: (fn: () => unknown) => void; ready?: (fn: (data: unknown) => void) => void; data?: unknown } };
  }
}

setWorkerUrl(`worker.js?v=${__BUILD__}`);
installSaveGuards();
startAnim2d();
setupPWA(() => render());
document.addEventListener('click', e => {
  const el = (e.target as HTMLElement | null)?.closest('[data-a="install-app"]');
  if (el) promptInstall();
});

// Recarga en caliente del visor de claude.ai: conserva la partida abierta al publicar una versión nueva.
try { window.claude?.hot?.snapshot?.(() => ({ S })); } catch { /* fuera del visor */ }
const hot = window.claude?.hot;
if (hot?.ready) hot.ready(start); else start(hot?.data ?? {});
