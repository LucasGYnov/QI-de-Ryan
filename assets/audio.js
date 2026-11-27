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
  else if (kind === 'siren') for (let i = 0; i < 4; i++) { tone(660, t + i * 0.5, 0.25, 'sawtooth', 0.07); tone(880, t + i * 0.5 + 0.25, 0.25, 'sawtooth', 0.07); }
  else if (kind === 'splat') { noise(t, 0.25); tone(160, t, 0.2, 'sine', 0.2, 60); }
  else if (kind === 'heart') { tone(1047, t, 0.15, 'triangle', 0.1); tone(1319, t + 0.12, 0.25, 'triangle', 0.1); }
  else if (kind === 'punch') { noise(t, 0.15); tone(140, t, 0.3, 'sine', 0.3, 40); }
  else if (kind === 'tick') tone(1600, t, 0.02, 'square', 0.04);
  else if (kind === 'flash') { noise(t, 0.06); tone(2200, t + 0.08, 0.08, 'square', 0.08); tone(2200, t + 0.22, 0.08, 'square', 0.08); }
  else if (kind === 'engine') {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 1400;
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.8); o.frequency.exponentialRampToValueAtTime(240, t + 1.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    o.connect(lp).connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1.55);
  }
  else if (kind === 'bars') [0, 0.12, 0.24].forEach(d => tone(90, t + d, 0.1, 'square', 0.12));
}
