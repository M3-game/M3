// =============================================================================
// sim-worker.js — Web Worker for Monte Carlo sim runs (Session E-2a)
// =============================================================================
// Imports the same `_SIM` implementation as the main thread (from
// ./simCore.js) and exposes it over the Worker message interface. One
// game per message: main thread dispatches a `{type:'run', ...}` message,
// worker replies with `{type:'result', result}`. Workers are pooled and
// reused across a batch's games; the main thread terminates them on
// batch completion or cancel.
//
// Messages (main → worker):
//   { type: 'run', id, bot, target, moves, botParams }
//
// Messages (worker → main):
//   { type: 'result', id, result }   // result shape matches _SIM.runGame()
//   { type: 'error', id, message }   // on exception inside runGame
//
// The `id` lets the main thread match results back to specific dispatched
// games (since workers run concurrently and replies may arrive out of
// order). Must be loaded as a module worker:
//   new Worker(new URL('./sim-worker.js', import.meta.url), { type: 'module' })
// =============================================================================
import { _SIM } from './simCore.js';

self.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (msg?.type !== 'run') return;
  const { id, bot, target, moves, botParams } = msg;
  try {
    const result = _SIM.runGame({ bot, target, moves, botParams });
    self.postMessage({ type: 'result', id, result });
  } catch (err) {
    self.postMessage({
      type: 'error',
      id,
      message: (err && err.message) ? err.message : String(err),
    });
  }
});
