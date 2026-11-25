// Midnight Ramen — the kitchen side of play: the noodle pot and assembly.

import { BOIL_SECONDS, toppingById } from './config.js';
import { sfx } from './audio.js';

// Clicking the pot starts the boil; clicking again once it is ready drops
// the noodles into the bowl. Clicking mid-boil does nothing.
export function clickPot(state) {
  if (state.pot.phase === 'idle') {
    state.pot.phase = 'boiling';
    state.pot.progress = 0;
    sfx.splash();
  } else if (state.pot.phase === 'ready') {
    if (!state.bowl.noodles) {
      state.bowl.noodles = true;
      sfx.pop();
    }
    state.pot.phase = 'idle';
    state.pot.progress = 0;
  }
}

export function updatePot(state, dt) {
  if (state.pot.phase === 'boiling') {
    state.pot.progress += dt / BOIL_SECONDS;
    if (state.pot.progress >= 1) {
      state.pot.progress = 1;
      state.pot.phase = 'ready';
      sfx.ready();
    }
  }
}

// Add a topping from a station. Duplicates are refused with a buzz, and the
// bowl holds at most five toppings plus noodles.
export function addTopping(state, id) {
  if (!toppingById(id)) return;
  if (state.bowl.toppings.includes(id)) {
    state.shake = 0.2;
    sfx.buzz();
    return;
  }
  if (state.bowl.toppings.length >= 5) {
    state.shake = 0.2;
    sfx.buzz();
    return;
  }
  state.bowl.toppings.push(id);
  sfx.pop();
}

export function trashBowl(state) {
  if (!state.bowl.noodles && state.bowl.toppings.length === 0) return;
  state.bowl.noodles = false;
  state.bowl.toppings = [];
  sfx.trash();
}
