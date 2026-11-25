// Midnight Ramen — the whole game state in one plain object, plus reset.

import { SHIFT_SECONDS, START_LANTERNS } from './config.js';

export function createState() {
  return {
    mode: 'title', // 'title' | 'play' | 'pause' | 'over'
    overReason: '', // 'lanterns' | 'shift'
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    lost: 0,
    lanterns: START_LANTERNS,
    shiftLeft: SHIFT_SECONDS,
    elapsed: 0,
    tickets: [], // {id, toppings:[ids], timeLeft, timeTotal}
    nextTicketId: 1,
    spawnIn: 0, // seconds until the next ticket arrives
    bowl: { noodles: false, toppings: [] },
    pot: { phase: 'idle', progress: 0 }, // 'idle' | 'boiling' | 'ready'
    passFlash: 0, // seconds left on the "served!" flash animation
    shake: 0, // seconds left on the error shake
    lastServe: null, // {points, tip} for the floating score text
    floatText: null, // {text, t} floating feedback near the pass
  };
}

export function resetGame(state) {
  const fresh = createState();
  Object.assign(state, fresh);
  state.mode = 'play';
}
