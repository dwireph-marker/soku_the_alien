import { NoteDef } from './audioMelodies';

// Warm rich piano-like synthesizer sound
export function playPianoNote(
  ctx: AudioContext | null,
  masterGain: GainNode | null,
  freq: number,
  duration: number = 1.2,
  delay: number = 0,
  volume: number = 0.4
) {
  try {
    if (!ctx || !masterGain) return;

    const startTime = ctx.currentTime + Math.max(0, delay);
    
    // Fundamental tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Harmonic overtone (warmer acoustic feel)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    // Subtle gentle lower harmonic
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 0.5, startTime);

    // Envelope for main tone
    gain1.gain.setValueAtTime(0, startTime);
    gain1.gain.linearRampToValueAtTime(volume, startTime + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Envelope for harmonic
    gain2.gain.setValueAtTime(0, startTime);
    gain2.gain.linearRampToValueAtTime(volume * 0.35, startTime + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.7);

    // Envelope for sub
    gain3.gain.setValueAtTime(0, startTime);
    gain3.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.04);
    gain3.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.85);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc3.connect(gain3);
    gain3.connect(masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);

    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
    osc3.stop(startTime + duration + 0.05);
  } catch (e) {
    // Graceful fallback
  }
}

export function playPianoPattern(
  ctx: AudioContext | null,
  masterGain: GainNode | null,
  notes: NoteDef[],
  volume: number = 0.35
) {
  notes.forEach((n) => {
    playPianoNote(ctx, masterGain, n.freq, n.dur, n.delay, volume);
  });
}
