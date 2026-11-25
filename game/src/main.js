// Midnight Ramen — bootstrap and the game loop.

import { createState, resetGame } from './state.js';
import { render } from './render.js';
import { bindInput, startSound } from './input.js';
import { spawnTicket, updateOrders, serveBowl } from './orders.js';
import { updatePot } from './kitchen.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = createState();

const actions = {
  start() {
    resetGame(state);
    // The first customers are already waiting when the shift begins.
    spawnTicket(state);
    spawnTicket(state);
    state.spawnIn = 6;
    startSound();
  },
  restart() {
    actions.start();
  },
  togglePause() {
    if (state.mode === 'play') state.mode = 'pause';
    else if (state.mode === 'pause') state.mode = 'play';
  },
};

bindInput(canvas, state, actions);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.mode === 'play') {
    state.elapsed += dt;
    state.shiftLeft -= dt;
    updatePot(state, dt);
    updateOrders(state, dt);
    if (state.passFlash > 0) state.passFlash -= dt;
    if (state.shake > 0) state.shake -= dt;
    if (state.floatText) {
      state.floatText.t += dt;
      if (state.floatText.t > 1.1) state.floatText = null;
    }
    if (state.lanterns <= 0) {
      state.mode = 'over';
      state.overReason = 'lanterns';
    } else if (state.shiftLeft <= 0) {
      state.shiftLeft = 0;
      state.mode = 'over';
      state.overReason = 'shift';
    }
  }
  render(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// A small handle so the maker can drive the game in a browser when taking
// the entry screenshots (and so players can peek at the state in devtools).
window.__ramen = { state, spawnTicket, serveBowl, start: actions.start };
