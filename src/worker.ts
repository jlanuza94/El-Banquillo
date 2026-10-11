/**
 * Web Worker de simulación.
 *
 * Recibe la partida empaquetada, simula las fechas pedidas sin bloquear la pantalla y devuelve
 * la partida actualizada. Comparte la lógica del juego con la pantalla (los mismos módulos).
 */
import type { WorkerRequest, WorkerResponse } from './types';
// @ts-ignore — módulos heredados sin tipos
import { setS, dirty } from './state';
// @ts-ignore
import { pack, unpack } from './persist';
// @ts-ignore
import { simLoop } from './season';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let stopRequested = false;
const send = (msg: WorkerResponse) => ctx.postMessage(msg);

ctx.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  if (req.cmd === 'stop') { stopRequested = true; return; }
  if (req.cmd !== 'sim') return;
  stopRequested = false;
  try {
    setS(unpack(req.state));
    dirty();
    const result = await simLoop(req.mode, req.stopOnNews, {
      stopped: () => stopRequested,
      progress: (n: number, txt: string) => send({ type: 'progress', n, txt }),
      // Cede el control un momento para poder recibir «stop» entre partidos.
      yield: () => new Promise<void>(r => setTimeout(r, 0)),
    });
    send({ type: 'done', state: pack(), res: result.res, stopReason: result.stopReason });
  } catch (err) {
    send({ type: 'error', msg: err instanceof Error ? err.message : String(err) });
  }
};
