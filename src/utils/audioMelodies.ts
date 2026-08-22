export interface NoteDef {
  freq: number;
  dur: number;
  delay: number;
}

// Romantic Canon / Lullaby gentle chord progression
export const chordSequence = [
  [261.63, 329.63, 392.00], // C
  [196.00, 246.94, 293.66], // G
  [220.00, 261.63, 329.63], // Am
  [164.81, 196.00, 246.94], // Em
  [174.61, 220.00, 261.63], // F
  [261.63, 329.63, 392.00], // C
  [174.61, 220.00, 261.63], // F
  [196.00, 246.94, 293.66], // G
];

// Complete Happy Birthday piano score with gentle harmony
export const birthdayNotes: NoteDef[] = [
  { freq: 261.63, dur: 0.45, delay: 0 },
  { freq: 261.63, dur: 0.45, delay: 0.45 },
  { freq: 293.66, dur: 0.8, delay: 0.9 },
  { freq: 261.63, dur: 0.8, delay: 1.7 },
  { freq: 349.23, dur: 0.8, delay: 2.5 },
  { freq: 329.63, dur: 1.4, delay: 3.3 },

  { freq: 261.63, dur: 0.45, delay: 4.9 },
  { freq: 261.63, dur: 0.45, delay: 5.35 },
  { freq: 293.66, dur: 0.8, delay: 5.8 },
  { freq: 261.63, dur: 0.8, delay: 6.6 },
  { freq: 392.00, dur: 0.8, delay: 7.4 },
  { freq: 349.23, dur: 1.4, delay: 8.2 },

  { freq: 261.63, dur: 0.45, delay: 9.8 },
  { freq: 261.63, dur: 0.45, delay: 10.25 },
  { freq: 523.25, dur: 0.8, delay: 10.7 },
  { freq: 440.00, dur: 0.8, delay: 11.5 },
  { freq: 349.23, dur: 0.8, delay: 12.3 },
  { freq: 329.63, dur: 0.8, delay: 13.1 },
  { freq: 293.66, dur: 1.4, delay: 13.9 },

  { freq: 466.16, dur: 0.45, delay: 15.5 },
  { freq: 466.16, dur: 0.45, delay: 15.95 },
  { freq: 440.00, dur: 0.8, delay: 16.4 },
  { freq: 349.23, dur: 0.8, delay: 17.2 },
  { freq: 392.00, dur: 0.8, delay: 18.0 },
  { freq: 349.23, dur: 1.8, delay: 18.8 },
];

// Soft Acoustic Love Song
export const acousticLoveNotes: NoteDef[] = [
  { freq: 329.63, dur: 0.9, delay: 0 },
  { freq: 392.00, dur: 0.9, delay: 0.5 },
  { freq: 440.00, dur: 1.2, delay: 1.0 },
  { freq: 493.88, dur: 1.5, delay: 1.8 },

  { freq: 523.25, dur: 1.0, delay: 2.8 },
  { freq: 493.88, dur: 1.0, delay: 3.6 },
  { freq: 440.00, dur: 1.2, delay: 4.4 },
  { freq: 392.00, dur: 1.8, delay: 5.4 },

  { freq: 349.23, dur: 1.0, delay: 6.8 },
  { freq: 392.00, dur: 1.0, delay: 7.6 },
  { freq: 440.00, dur: 1.2, delay: 8.4 },
  { freq: 392.00, dur: 2.2, delay: 9.4 },
];

// Classical Piano Für Elise
export const eliseNotes: NoteDef[] = [
  { freq: 659.25, dur: 0.35, delay: 0 },
  { freq: 622.25, dur: 0.35, delay: 0.3 },
  { freq: 659.25, dur: 0.35, delay: 0.6 },
  { freq: 622.25, dur: 0.35, delay: 0.9 },
  { freq: 659.25, dur: 0.35, delay: 1.2 },
  { freq: 493.88, dur: 0.35, delay: 1.5 },
  { freq: 587.33, dur: 0.35, delay: 1.8 },
  { freq: 523.25, dur: 0.35, delay: 2.1 },
  { freq: 440.00, dur: 1.0, delay: 2.4 },

  { freq: 261.63, dur: 0.35, delay: 3.2 },
  { freq: 329.63, dur: 0.35, delay: 3.5 },
  { freq: 440.00, dur: 0.35, delay: 3.8 },
  { freq: 493.88, dur: 1.0, delay: 4.1 },

  { freq: 329.63, dur: 0.35, delay: 4.9 },
  { freq: 415.30, dur: 0.35, delay: 5.2 },
  { freq: 493.88, dur: 0.35, delay: 5.5 },
  { freq: 523.25, dur: 1.0, delay: 5.8 },
];
