// Midnight Ramen — order tickets: spawning, countdowns, matching, scoring.

import { TOPPINGS, MAX_TICKETS, difficulty } from './config.js';
import { sfx } from './audio.js';

function randomRecipe(state) {
  const d = difficulty(state.elapsed);
  const count = d.minToppings + Math.floor(Math.random() * (d.maxToppings - d.minToppings + 1));
  const pool = TOPPINGS.map((t) => t.id);
  const picks = [];
  while (picks.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  return picks;
}

export function spawnTicket(state) {
  if (state.tickets.length >= MAX_TICKETS) return null;
  const d = difficulty(state.elapsed);
  const ticket = {
    id: state.nextTicketId++,
    toppings: randomRecipe(state),
    timeTotal: d.ticketTime,
    timeLeft: d.ticketTime,
  };
  state.tickets.push(ticket);
  return ticket;
}

// A bowl matches a ticket when it has noodles and exactly the same set of
// toppings — no extras, none missing.
export function bowlMatches(state, ticket) {
  if (!state.bowl.noodles) return false;
  if (state.bowl.toppings.length !== ticket.toppings.length) return false;
  return ticket.toppings.every((id) => state.bowl.toppings.includes(id));
}

export function matchingTicket(state) {
  return state.tickets.find((t) => bowlMatches(state, t)) || null;
}

export function clearBowl(state) {
  state.bowl.noodles = false;
  state.bowl.toppings = [];
}

// Serve the current bowl if it matches a ticket. Returns true when served.
export function serveBowl(state) {
  const ticket = matchingTicket(state);
  if (!ticket) {
    state.shake = 0.3;
    sfx.buzz();
    return false;
  }
  const tip = Math.round(60 * (ticket.timeLeft / ticket.timeTotal));
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const points = 100 + tip + (state.combo - 1) * 10;
  state.score += points;
  state.served += 1;
  state.lastServe = { points, tip };
  state.floatText = { text: `+${points}`, t: 0 };
  state.passFlash = 0.5;
  state.tickets = state.tickets.filter((t) => t !== ticket);
  clearBowl(state);
  sfx.serve();
  return true;
}

// Advance ticket timers and the spawner. Expired tickets cost a lantern.
export function updateOrders(state, dt) {
  const d = difficulty(state.elapsed);
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    if (spawnTicket(state)) state.spawnIn = d.spawnEvery;
    else state.spawnIn = 1.0;
  }
  const expired = [];
  for (const t of state.tickets) {
    t.timeLeft -= dt;
    if (t.timeLeft <= 0) expired.push(t);
  }
  for (const t of expired) {
    state.tickets = state.tickets.filter((x) => x !== t);
    state.lost += 1;
    state.lanterns -= 1;
    state.combo = 0;
    sfx.expire();
  }
  return expired.length > 0;
}
