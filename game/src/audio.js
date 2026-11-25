// Midnight Ramen — tiny WebAudio bleeps. No audio files: every sound is an
// oscillator with an envelope, created lazily on the first user gesture.

let ctx = null;

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.15, when = 0, slideTo = null) {
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  pop() { tone(520, 0.09, 'triangle', 0.18, 0, 760); },
  splash() { tone(300, 0.16, 'sine', 0.14, 0, 140); },
  ready() { tone(880, 0.1, 'triangle', 0.16); tone(1320, 0.14, 'triangle', 0.14, 0.08); },
  serve() { tone(660, 0.1, 'sine', 0.16); tone(880, 0.1, 'sine', 0.16, 0.09); tone(1180, 0.18, 'sine', 0.16, 0.18); },
  trash() { tone(220, 0.14, 'sawtooth', 0.08, 0, 110); },
  buzz() { tone(140, 0.2, 'square', 0.1); },
  expire() { tone(420, 0.3, 'sine', 0.16, 0, 130); },
  start() { tone(523, 0.1, 'triangle', 0.15); tone(784, 0.16, 'triangle', 0.15, 0.1); },
};
