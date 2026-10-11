// Prepara un navegador simulado (jsdom + IndexedDB en memoria) antes de cargar el juego.
// Debe importarse lo primero en tests/run.ts.
import 'fake-indexeddb/auto';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url: 'https://localhost/' });
const g = globalThis as any;
for (const k of ['window', 'document', 'HTMLElement', 'Node', 'NodeFilter', 'Event', 'localStorage']) {
  Object.defineProperty(g, k, { value: k === 'window' ? dom.window : (dom.window as any)[k], configurable: true, writable: true });
}
dom.window.scrollTo = () => {};
dom.window.matchMedia = (() => ({ matches: false, addEventListener() {} })) as any;
// Sin requestAnimationFrame: la animación 2D no se usa en la prueba.
