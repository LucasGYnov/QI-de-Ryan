import { ls } from './util.js';

// Sons synthétisés (Web Audio), aucun fichier audio. Désactivés par défaut.
let ctx = null;
let on = ls.get('ryan_sound') === '1';

export const enabled = () => on;

function ensure() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { ctx = null; }
  return ctx;
}

export function toggle() {
  on = !on;
  ls.set('ryan_sound', on ? '1' : '0');
  if (on) ensure();
  return on;
}

function tone(f, st, dur, type = 'square', vol = 0.12, endF) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, st);
  if (endF) o.frequency.exponentialRampToValueAtTime(endF, st + dur);
  g.gain.setValueAtTime(0.0001, st);
  g.gain.exponentialRampToValueAtTime(vol, st + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
  o.connect(g).connect(ctx.destination);
  o.start(st); o.stop(st + dur + 0.02);
}

function noise(st, dur) {
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = 5000; g.gain.value = 0.1;
  s.connect(f).connect(g).connect(ctx.destination);
  s.start(st);
}

function trombone(t) {
  [293.66, 277.18, 261.63, 246.94].forEach((f, i) => {
    const st = t + i * 0.34, dur = i === 3 ? 1 : 0.3;
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1100; o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, st);
    if (i === 3) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 6; lg.gain.value = 6;
      lfo.connect(lg).connect(o.frequency); lfo.start(st); lfo.stop(st + dur);
    }
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(0.14, st + 0.03);
    g.gain.setValueAtTime(0.14, st + dur - 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
    o.connect(lp).connect(g).connect(ctx.destination);
    o.start(st); o.stop(st + dur + 0.02);
  });
}

export function play(kind) {
  if (!on || !ensure()) return;
  const t = ctx.currentTime + 0.01;
  if (kind === 'up') { tone(1318, t, 0.08); tone(1760, t + 0.08, 0.25); noise(t + 0.02, 0.12); }
  else if (kind === 'down') trombone(t);
  else if (kind === 'trophy') [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.2, 'triangle', 0.16));
  else if (kind === 'ko') tone(220, t, 0.7, 'sine', 0.22, 55);
  else if (kind === 'tap') tone(880, t, 0.05, 'triangle', 0.08);
}
