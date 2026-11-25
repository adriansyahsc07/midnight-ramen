// Midnight Ramen — mouse and keyboard input, mapped onto layout regions.

import { LAYOUT, TOPPINGS, stationRect } from './config.js';
import { clickPot, addTopping, trashBowl } from './kitchen.js';
import { serveBowl } from './orders.js';
import { ensureAudio, sfx } from './audio.js';

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function inCircle(x, y, c) {
  const dx = x - c.cx;
  const dy = y - c.cy;
  return dx * dx + dy * dy <= (c.r + 10) * (c.r + 10);
}

// actions: {start(), togglePause(), restart()} supplied by main.js.
export function bindInput(canvas, state, actions) {
  function canvasPos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (canvas.width / rect.width),
      y: (evt.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('mousedown', (evt) => {
    ensureAudio();
    const { x, y } = canvasPos(evt);
    if (state.mode === 'title') { actions.start(); return; }
    if (state.mode === 'over') { actions.restart(); return; }
    if (state.mode === 'pause') {
      if (inRect(x, y, LAYOUT.hint)) actions.togglePause();
      return;
    }
    // mode === 'play'
    if (inCircle(x, y, LAYOUT.pot)) { clickPot(state); return; }
    for (let i = 0; i < TOPPINGS.length; i++) {
      if (inRect(x, y, stationRect(i))) { addTopping(state, TOPPINGS[i].id); return; }
    }
    if (inRect(x, y, LAYOUT.pass)) { serveBowl(state); return; }
    if (inRect(x, y, LAYOUT.trash)) { trashBowl(state); return; }
    if (inRect(x, y, LAYOUT.hint)) { actions.togglePause(); }
  });

  window.addEventListener('keydown', (evt) => {
    ensureAudio();
    const k = evt.key;
    if (state.mode === 'title') {
      if (k === 'Enter' || k === ' ') { evt.preventDefault(); actions.start(); }
      return;
    }
    if (state.mode === 'over') {
      if (k === 'r' || k === 'R' || k === 'Enter') actions.restart();
      return;
    }
    if (k === 'p' || k === 'P') { actions.togglePause(); return; }
    if (state.mode !== 'play') return;
    if (k === ' ') { evt.preventDefault(); serveBowl(state); return; }
    if (k === 'n' || k === 'N' || k === '0') { clickPot(state); return; }
    if (k === 't' || k === 'T') { trashBowl(state); return; }
    const topping = TOPPINGS.find((t) => t.key === k);
    if (topping) addTopping(state, topping.id);
  });
}

export function startSound() {
  sfx.start();
}
