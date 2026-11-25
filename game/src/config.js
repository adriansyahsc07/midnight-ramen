// Midnight Ramen — configuration: ingredients, layout, timing, difficulty.

// The six topping stations on the counter. Noodles are special: they come
// from the boiling pot, never from a station.
export const TOPPINGS = [
  { id: 'egg',     name: 'Egg',     icon: '🥚', key: '1' },
  { id: 'chashu',  name: 'Chashu',  icon: '🍖', key: '2' },
  { id: 'naruto',  name: 'Naruto',  icon: '🍥', key: '3' },
  { id: 'scallion', name: 'Scallion', icon: '🌱', key: '4' },
  { id: 'corn',    name: 'Corn',    icon: '🌽', key: '5' },
  { id: 'chili',   name: 'Chili',   icon: '🌶️', key: '6' },
];

export const NOODLE = { id: 'noodles', name: 'Noodles', icon: '🍜' };

export function toppingById(id) {
  return TOPPINGS.find((t) => t.id === id) || null;
}

// Canvas geometry (the canvas is 1280x800).
export const W = 1280;
export const H = 800;

export const LAYOUT = {
  headerH: 58,
  board: { x: 16, y: 66, w: 1248, h: 162 },
  ticket: { w: 296, h: 146, gap: 12, x0: 28, y: 74 },
  pot: { cx: 168, cy: 408, r: 92 },
  bowl: { cx: 600, cy: 408, r: 108 },
  pass: { x: 908, y: 292, w: 332, h: 218 },
  trash: { x: 908, y: 528, w: 158, h: 62 },
  hint: { x: 1082, y: 528, w: 158, h: 62 },
  station: { y: 648, h: 112, w: 196, gap: 10, x0: 24 },
};

export function stationRect(i) {
  const s = LAYOUT.station;
  return { x: s.x0 + i * (s.w + s.gap), y: s.y, w: s.w, h: s.h };
}

export function ticketRect(i) {
  const t = LAYOUT.ticket;
  return { x: t.x0 + i * (t.w + t.gap), y: t.y, w: t.w, h: t.h };
}

// Timing and difficulty. Everything ramps with elapsed shift time so the
// last minute of a shift is a genuine rush.
export const SHIFT_SECONDS = 180;
export const BOIL_SECONDS = 2.8;
export const MAX_TICKETS = 4;
export const START_LANTERNS = 3;

export function difficulty(elapsed) {
  return {
    spawnEvery: Math.max(5.0, 9.0 - elapsed * 0.022),
    ticketTime: Math.max(30, 46 - elapsed * 0.085),
    maxToppings: Math.min(5, 2 + Math.floor(elapsed / 40)),
    minToppings: elapsed < 40 ? 2 : 3,
  };
}

// Palette: deep indigo night with warm lantern amber.
export const COLORS = {
  bg: '#12122b',
  bgPanel: '#1c1c3e',
  board: '#23234a',
  counter: '#3a2b20',
  counterEdge: '#543e2c',
  amber: '#ffb347',
  amberDeep: '#f08c1e',
  cream: '#fff3d6',
  muted: '#9a9ac4',
  red: '#ff5a5a',
  green: '#7be495',
  broth: '#f7b733',
  bowlBlue: '#2b4c7e',
};
