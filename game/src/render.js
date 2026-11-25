// Midnight Ramen — every pixel the game draws, in one module. All art is
// canvas shapes and emoji glyphs: no image files, no network.

import {
  W, H, LAYOUT, TOPPINGS, NOODLE, COLORS, stationRect, ticketRect, toppingById,
} from './config.js';
import { matchingTicket } from './orders.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px 'Segoe UI', system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawHeader(ctx, state) {
  ctx.fillStyle = '#0d0d22';
  ctx.fillRect(0, 0, W, LAYOUT.headerH);
  ctx.fillStyle = COLORS.amberDeep;
  ctx.fillRect(0, LAYOUT.headerH - 3, W, 3);
  text(ctx, '🍜 MIDNIGHT RAMEN', 20, 30, 26, COLORS.amber);
  // Shift clock, big and central.
  const urgent = state.shiftLeft <= 30 && state.mode === 'play';
  text(ctx, `SHIFT ${fmtTime(state.shiftLeft)}`, 480, 30, 30, urgent ? COLORS.red : COLORS.cream, 'center');
  text(ctx, `SCORE ${state.score}`, 800, 30, 26, COLORS.cream, 'center');
  text(ctx, state.combo > 1 ? `COMBO x${state.combo}` : 'COMBO —', 985, 30, 20,
    state.combo > 1 ? COLORS.green : COLORS.muted, 'center');
  // Lanterns are lives.
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = i < state.lanterns ? 1 : 0.22;
    text(ctx, '🏮', 1150 + i * 38, 30, 26, COLORS.cream, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawTicket(ctx, state, ticket, i) {
  const r = ticketRect(i);
  const frac = Math.max(0, ticket.timeLeft / ticket.timeTotal);
  const danger = ticket.timeLeft < 8;
  ctx.fillStyle = danger ? '#4a2436' : '#2c2c55';
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = danger ? COLORS.red : COLORS.amberDeep;
  ctx.lineWidth = danger ? 3 : 2;
  ctx.stroke();
  text(ctx, `ORDER #${ticket.id}`, r.x + 14, r.y + 20, 17, COLORS.amber);
  text(ctx, `${Math.ceil(ticket.timeLeft)}s`, r.x + r.w - 14, r.y + 20, 17,
    danger ? COLORS.red : COLORS.muted, 'right');
  // Recipe: noodle icon first, then one chip per topping. Long recipes
  // (up to six items) shrink their chips so nothing spills off the card.
  const items = [NOODLE, ...ticket.toppings.map(toppingById)];
  const n = items.length;
  const spacing = n > 1 ? Math.min(52, (r.w - 72) / (n - 1)) : 0;
  const chipR = n > 5 ? 19 : 23;
  items.forEach((item, j) => {
    const cx = r.x + 36 + j * spacing;
    const cy = r.y + 62;
    ctx.fillStyle = '#1a1a38';
    ctx.beginPath();
    ctx.arc(cx, cy, chipR, chipR, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, item.icon, cx, cy + 1, n > 5 ? 21 : 26, COLORS.cream, 'center');
    text(ctx, item.name, cx, cy + 34, n > 5 ? 10 : 11, COLORS.cream, 'center', 'normal');
  });
  // Countdown bar.
  ctx.fillStyle = '#14142c';
  roundRect(ctx, r.x + 12, r.y + r.h - 22, r.w - 24, 10, 5);
  ctx.fill();
  ctx.fillStyle = danger ? COLORS.red : COLORS.green;
  roundRect(ctx, r.x + 12, r.y + r.h - 22, Math.max(6, (r.w - 24) * frac), 10, 5);
  ctx.fill();
}

function drawBoard(ctx, state) {
  const b = LAYOUT.board;
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', b.x + 16, b.y + 16, 13, COLORS.muted);
  if (state.tickets.length === 0) {
    text(ctx, 'Waiting for the first customer…', W / 2, b.y + b.h / 2 + 8, 22, COLORS.muted, 'center');
  }
  state.tickets.forEach((t, i) => drawTicket(ctx, state, t, i));
}

function drawPot(ctx, state) {
  const p = LAYOUT.pot;
  text(ctx, 'NOODLE POT', p.cx, p.cy - p.r - 26, 18, COLORS.amber, 'center');
  // Pot body.
  ctx.fillStyle = '#26262e';
  ctx.beginPath();
  ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#55556a';
  ctx.lineWidth = 5;
  ctx.stroke();
  // Broth surface.
  ctx.fillStyle = state.pot.phase === 'idle' ? '#6b4a26' : COLORS.broth;
  ctx.beginPath();
  ctx.arc(p.cx, p.cy, p.r - 14, 0, Math.PI * 2);
  ctx.fill();
  if (state.pot.phase === 'boiling') {
    // Bubbles.
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 5; i++) {
      const a = (state.elapsed * 2 + i * 1.7) % (Math.PI * 2);
      const bx = p.cx + Math.cos(a) * 38;
      const by = p.cy + Math.sin(a * 1.3) * 30;
      ctx.beginPath();
      ctx.arc(bx, by, 6 + (i % 3) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Progress ring.
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r + 8, -Math.PI / 2, -Math.PI / 2 + state.pot.progress * Math.PI * 2);
    ctx.stroke();
    text(ctx, 'BOILING…', p.cx, p.cy + p.r + 24, 16, COLORS.cream, 'center');
  } else if (state.pot.phase === 'ready') {
    text(ctx, '🍜', p.cx, p.cy, 52, COLORS.cream, 'center');
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r + 6, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, 'READY — click to add noodles!', p.cx, p.cy + p.r + 24, 16, COLORS.green, 'center');
  } else {
    text(ctx, '🍜', p.cx, p.cy, 44, COLORS.cream, 'center');
    text(ctx, 'Click to boil (N)', p.cx, p.cy + p.r + 24, 16, COLORS.muted, 'center');
  }
}

function drawBowl(ctx, state) {
  const b = LAYOUT.bowl;
  const shakeX = state.shake > 0 ? Math.sin(state.elapsed * 60) * 5 : 0;
  const cx = b.cx + shakeX;
  text(ctx, 'ASSEMBLY BOWL', cx, b.cy - b.r - 26, 18, COLORS.amber, 'center');
  // Bowl body: a wide half-dome under the broth disc.
  ctx.fillStyle = COLORS.bowlBlue;
  ctx.beginPath();
  ctx.arc(cx, b.cy, b.r, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1d3557';
  ctx.fillRect(cx - b.r, b.cy + b.r - 6, b.r * 2, 10);
  // Broth / empty interior.
  ctx.fillStyle = state.bowl.noodles || state.bowl.toppings.length ? COLORS.broth : '#3d3d5c';
  ctx.beginPath();
  ctx.ellipse(cx, b.cy, b.r - 8, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  if (state.bowl.noodles) {
    // Noodle squiggles.
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const y = b.cy - 14 + i * 9;
      ctx.moveTo(cx - 62, y);
      for (let x = -62; x <= 62; x += 12) {
        ctx.lineTo(cx + x, y + Math.sin((x + i * 20) * 0.3) * 3);
      }
      ctx.stroke();
    }
  }
  // Toppings sit on top of the broth.
  state.bowl.toppings.forEach((id, i) => {
    const item = toppingById(id);
    const a = (i / Math.max(1, state.bowl.toppings.length)) * Math.PI * 1.5 - Math.PI * 0.75;
    const tx = cx + Math.cos(a) * 52;
    const ty = b.cy + Math.sin(a) * 16;
    text(ctx, item.icon, tx, ty, 34, COLORS.cream, 'center');
  });
  // Contents label under the bowl.
  const parts = [];
  if (state.bowl.noodles) parts.push('Noodles');
  for (const id of state.bowl.toppings) parts.push(toppingById(id).name);
  text(ctx, parts.length ? `Bowl: ${parts.join(' + ')}` : 'Bowl: empty — boil noodles, add toppings',
    cx, b.cy + b.r + 34, 17, parts.length ? COLORS.cream : COLORS.muted, 'center');
}

function drawPass(ctx, state) {
  const p = LAYOUT.pass;
  const match = matchingTicket(state);
  ctx.fillStyle = state.passFlash > 0 ? '#2e5e3a' : '#26264a';
  roundRect(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  ctx.strokeStyle = match ? COLORS.green : '#44446e';
  ctx.lineWidth = match ? 3 : 2;
  ctx.stroke();
  text(ctx, 'SERVING PASS', p.x + p.w / 2, p.y + 24, 18, COLORS.amber, 'center');
  // The plate.
  ctx.fillStyle = '#e8e4da';
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, p.y + 108, 96, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cfc9ba';
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, p.y + 108, 66, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  const hasBowl = state.bowl.noodles || state.bowl.toppings.length > 0;
  if (hasBowl) {
    ctx.fillStyle = COLORS.broth;
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + 104, 52, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    const icons = [state.bowl.noodles ? '🍜' : '', ...state.bowl.toppings.map((id) => toppingById(id).icon)]
      .filter(Boolean);
    icons.slice(0, 6).forEach((icon, i) => {
      text(ctx, icon, p.x + p.w / 2 - (icons.length - 1) * 17 + i * 34, p.y + 100, 24, COLORS.cream, 'center');
    });
  }
  if (state.passFlash > 0 && state.lastServe) {
    text(ctx, `SERVED! +${state.lastServe.points} (tip ${state.lastServe.tip})`,
      p.x + p.w / 2, p.y + 168, 20, COLORS.green, 'center');
  } else if (match) {
    text(ctx, `READY — matches ORDER #${match.id}!`, p.x + p.w / 2, p.y + 162, 19, COLORS.green, 'center');
    text(ctx, 'Click here or press SPACE', p.x + p.w / 2, p.y + 188, 15, COLORS.cream, 'center');
  } else if (hasBowl) {
    text(ctx, 'No ticket matches this bowl yet', p.x + p.w / 2, p.y + 168, 16, COLORS.muted, 'center');
  } else {
    text(ctx, 'A finished bowl lands here to serve', p.x + p.w / 2, p.y + 168, 15, COLORS.muted, 'center');
  }
  // Trash and hint buttons.
  const t = LAYOUT.trash;
  ctx.fillStyle = '#4a2436';
  roundRect(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fill();
  text(ctx, '🗑 TRASH (T)', t.x + t.w / 2, t.y + t.h / 2, 17, '#ffb3b3', 'center');
  const hnt = LAYOUT.hint;
  ctx.fillStyle = '#26264a';
  roundRect(ctx, hnt.x, hnt.y, hnt.w, hnt.h, 10);
  ctx.fill();
  text(ctx, '⏸ PAUSE (P)', hnt.x + hnt.w / 2, hnt.y + hnt.h / 2, 17, COLORS.muted, 'center');
}

function drawStations(ctx, state) {
  // The wooden counter band.
  ctx.fillStyle = COLORS.counter;
  ctx.fillRect(0, 628, W, H - 628);
  ctx.fillStyle = COLORS.counterEdge;
  ctx.fillRect(0, 628, W, 8);
  TOPPINGS.forEach((item, i) => {
    const r = stationRect(i);
    const inBowl = state.bowl.toppings.includes(item.id);
    ctx.fillStyle = inBowl ? '#3d3d24' : '#2c2c55';
    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.strokeStyle = inBowl ? COLORS.amber : '#44446e';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, item.icon, r.x + r.w / 2, r.y + 38, 44, COLORS.cream, 'center');
    text(ctx, item.name, r.x + r.w / 2, r.y + 76, 18, COLORS.cream, 'center');
    text(ctx, `key ${item.key}`, r.x + r.w / 2, r.y + 98, 13, COLORS.muted, 'center', 'normal');
  });
}

function drawFloatText(ctx, state) {
  if (!state.floatText) return;
  const rise = state.floatText.t * 40;
  ctx.globalAlpha = Math.max(0, 1 - state.floatText.t / 1.1);
  text(ctx, state.floatText.text, LAYOUT.pass.x + LAYOUT.pass.w / 2, 262 - rise, 30, COLORS.green, 'center');
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(8,8,20,0.82)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '🍜', W / 2, 190, 90, COLORS.cream, 'center');
  text(ctx, 'MIDNIGHT RAMEN', W / 2, 280, 64, COLORS.amber, 'center');
  text(ctx, 'A night-shift cooking game at a tiny lantern-lit ramen bar', W / 2, 330, 22, COLORS.cream, 'center');
  const lines = [
    'Order tickets land on the board — each shows the bowl to build.',
    'Click the pot (or N) to boil noodles, click again to drop them in the bowl.',
    'Click ingredient stations (or keys 1–6) to add toppings. Match the ticket exactly!',
    'Serve at the pass (click or SPACE) for points and tips. Wrong bowl? Trash it (T).',
    'Expired tickets cost a lantern — lose all 3 and the shift ends. P pauses.',
  ];
  lines.forEach((line, i) => text(ctx, line, W / 2, 396 + i * 30, 19, COLORS.muted, 'center', 'normal'));
  text(ctx, 'CLICK OR PRESS ENTER TO START THE SHIFT', W / 2, 590, 26, COLORS.green, 'center');
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(8,8,20,0.7)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '⏸ PAUSED', W / 2, 380, 52, COLORS.cream, 'center');
  text(ctx, 'Press P to resume', W / 2, 440, 22, COLORS.muted, 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(8,8,20,0.85)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, state.overReason === 'shift' ? '🌅 SHIFT COMPLETE!' : '🏮 THE LANTERNS WENT OUT', W / 2, 250, 48, COLORS.amber, 'center');
  text(ctx, `Final score: ${state.score}`, W / 2, 330, 40, COLORS.cream, 'center');
  text(ctx, `Bowls served: ${state.served} · Tickets lost: ${state.lost} · Best combo: x${state.bestCombo}`,
    W / 2, 385, 22, COLORS.muted, 'center');
  text(ctx, 'Press R or click to work another shift', W / 2, 470, 24, COLORS.green, 'center');
}

export function render(ctx, state) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  // Hanging lanterns over the kitchen.
  for (const x of [330, 950]) {
    ctx.strokeStyle = '#44446e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 58);
    ctx.lineTo(x, 84);
    ctx.stroke();
    text(ctx, '🏮', x, 100, 30, COLORS.cream, 'center');
  }
  drawHeader(ctx, state);
  drawBoard(ctx, state);
  drawPot(ctx, state);
  drawBowl(ctx, state);
  drawPass(ctx, state);
  drawStations(ctx, state);
  drawFloatText(ctx, state);
  if (state.mode === 'title') drawTitle(ctx, state);
  else if (state.mode === 'pause') drawPause(ctx);
  else if (state.mode === 'over') drawOver(ctx, state);
}
