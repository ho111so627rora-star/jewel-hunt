'use client';
let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
const MASTER = 1.7; // Keeps cues audible over the BGM (Bgm.tsx plays at .55 volume); tune both together.
function tone(ac: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, gain: number) {
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain * MASTER, start + .012);
  g.gain.exponentialRampToValueAtTime(.0001, start + duration);
  osc.connect(g); g.connect(ac.destination);
  osc.start(start); osc.stop(start + duration + .02);
}
function noise(ac: AudioContext, start: number, duration: number, gain: number, filterFreq: number) {
  const size = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, size, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(); src.buffer = buffer;
  const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = filterFreq;
  const g = ac.createGain(); g.gain.setValueAtTime(gain * MASTER, start); g.gain.exponentialRampToValueAtTime(.0001, start + duration);
  src.connect(filter); filter.connect(g); g.connect(ac.destination);
  src.start(start); src.stop(start + duration + .02);
}
export type SfxName = 'select' | 'lock' | 'reveal' | 'steal' | 'poison' | 'mining' | 'collision' | 'turn' | 'victory';
/** Small synthesized cues (no audio assets) layered on top of the ambient BGM; each call is cheap and self-contained. */
export function playSfx(name: SfxName) {
  const ac = getCtx(); if (!ac) return;
  const t = ac.currentTime;
  if (name === 'select') tone(ac, 880, t, .08, 'triangle', .12);
  else if (name === 'lock') { tone(ac, 180, t, .22, 'sine', .22); tone(ac, 90, t + .02, .25, 'sine', .16); }
  else if (name === 'reveal') [520, 660, 780].forEach((f, i) => tone(ac, f, t + i * .05, .3, 'sine', .11));
  else if (name === 'steal') { noise(ac, t, .12, .18, 3200); tone(ac, 1200, t, .1, 'sawtooth', .09); }
  else if (name === 'poison') { tone(ac, 140, t, .5, 'sine', .15); noise(ac, t + .05, .35, .07, 500); }
  else if (name === 'mining') { tone(ac, 1046, t, .09, 'triangle', .13); tone(ac, 1318, t + .06, .12, 'triangle', .11); }
  else if (name === 'collision') tone(ac, 200, t, .15, 'square', .09);
  else if (name === 'turn') tone(ac, 660, t, .18, 'sine', .09);
  else if (name === 'victory') [523, 659, 784, 1046].forEach((f, i) => tone(ac, f, t + i * .09, .4, 'triangle', .13));
}
