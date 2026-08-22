// Web Audio & Custom Audio Engine for Romantic Music & Sound FX
import { chordSequence, birthdayNotes, acousticLoveNotes, eliseNotes } from './audioMelodies';
import { playPianoNote, playPianoPattern } from './synthPlayer';

export interface MusicConfig {
  type?: 'birthday' | 'synth' | 'preset' | 'custom' | 'file' | 'piano' | 'acoustic' | 'orchestral' | 'lofi' | 'elise' | string;
  url?: string;
  name?: string;
}

class RomanticAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private melodyTimer: any = null;
  private masterGain: GainNode | null = null;
  private customAudioEl: HTMLAudioElement | null = null;
  private currentConfig: MusicConfig = { type: 'birthday', name: '🎂 Romantic Piano Birthday' };
  private stateListeners: Set<(isPlaying: boolean, config: MusicConfig) => void> = new Set();

  private notifyListeners() {
    this.stateListeners.forEach((listener) => {
      try {
        listener(this.isPlaying, this.currentConfig);
      } catch (e) {
        console.warn('Audio listener error:', e);
      }
    });
  }

  public subscribe(listener: (isPlaying: boolean, config: MusicConfig) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.isPlaying, this.currentConfig);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private initCtx() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.22; // Gentle warm volume
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMusicConfig(config: MusicConfig) {
    this.currentConfig = { ...this.currentConfig, ...config };
    if (this.isPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }

  public playNote(freq: number, duration: number = 1.2, delay: number = 0, volume: number = 0.35) {
    this.initCtx();
    playPianoNote(this.ctx, this.masterGain, freq, duration, delay, volume);
  }

  // Built-in Synth Background Melody (Canon chord progression)
  public startBackgroundMelody() {
    this.stopCustomAudio();
    this.stopBackgroundMelody();
    this.initCtx();
    this.isPlaying = true;
    this.notifyListeners();

    let step = 0;
    const playChordStep = () => {
      if (!this.isPlaying) return;
      const chord = chordSequence[step % chordSequence.length];
      chord.forEach((freq, idx) => {
        this.playNote(freq, 2.4, idx * 0.18, 0.28);
      });
      this.playNote(chord[0] * 2, 1.2, 0.8, 0.25);
      this.playNote(chord[1] * 2, 1.2, 1.2, 0.25);

      step++;
      this.melodyTimer = setTimeout(playChordStep, 2200);
    };

    playChordStep();
  }

  public stopBackgroundMelody() {
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
  }

  // Built-in Romantic Happy Birthday Piano Song (100% Reliable & Offline)
  public startBirthdayMelody() {
    this.stopCustomAudio();
    this.stopBackgroundMelody();
    this.initCtx();
    this.isPlaying = true;
    this.notifyListeners();

    const playBirthdayLoop = () => {
      if (!this.isPlaying) return;
      playPianoPattern(this.ctx, this.masterGain, birthdayNotes, 0.4);
      this.melodyTimer = setTimeout(playBirthdayLoop, 21500);
    };

    playBirthdayLoop();
  }

  // Built-in Soft Acoustic Love Song (100% Reliable & Offline)
  public startAcousticLoveMelody() {
    this.stopCustomAudio();
    this.stopBackgroundMelody();
    this.initCtx();
    this.isPlaying = true;
    this.notifyListeners();

    const playLoop = () => {
      if (!this.isPlaying) return;
      playPianoPattern(this.ctx, this.masterGain, acousticLoveNotes, 0.38);
      this.melodyTimer = setTimeout(playLoop, 12000);
    };
    playLoop();
  }

  // Built-in Classical Für Elise Piano (100% Reliable & Offline)
  public startEliseMelody() {
    this.stopCustomAudio();
    this.stopBackgroundMelody();
    this.initCtx();
    this.isPlaying = true;
    this.notifyListeners();

    const playLoop = () => {
      if (!this.isPlaying) return;
      playPianoPattern(this.ctx, this.masterGain, eliseNotes, 0.38);
      this.melodyTimer = setTimeout(playLoop, 7200);
    };
    playLoop();
  }

  // Custom / Uploaded Audio Playback
  public startCustomAudio(url: string, type?: string) {
    this.stopBackgroundMelody();
    this.stopCustomAudio();

    if (!url || typeof url !== 'string' || !url.trim()) {
      console.warn('Audio URL is empty or invalid, playing offline piano melody.');
      this.playFallbackMelody(type);
      return;
    }

    try {
      this.isPlaying = true;
      const audio = new Audio();
      this.customAudioEl = audio;
      audio.loop = true;
      audio.volume = 0.65;
      audio.preload = 'auto';

      audio.onerror = () => {
        if (!this.isPlaying || this.customAudioEl !== audio) {
          return;
        }
        console.warn('Custom audio load error. Switching to built-in acoustic melody.');
        this.stopCustomAudio();
        this.playFallbackMelody(type);
      };

      audio.src = url.trim();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (!this.isPlaying || this.customAudioEl !== audio) {
              try {
                audio.pause();
                audio.currentTime = 0;
                audio.removeAttribute('src');
              } catch (e) {}
            } else {
              this.notifyListeners();
            }
          })
          .catch((err) => {
            if (
              err &&
              (err.name === 'AbortError' ||
                String(err.message || '').toLowerCase().includes('interrupted') ||
                String(err.message || '').toLowerCase().includes('pause'))
            ) {
              return;
            }

            if (err && err.name === 'NotAllowedError') {
              console.warn('Audio playback awaiting user gesture.');
              return;
            }

            console.warn('Custom audio playback issue, playing acoustic fallback:', err);
            this.stopCustomAudio();
            this.playFallbackMelody(type);
          });
      }
      this.notifyListeners();
    } catch (err) {
      console.warn('Audio element initialization error:', err);
      this.playFallbackMelody(type);
    }
  }

  public playFallbackMelody(type?: string) {
    if (type === 'piano' || type === 'acoustic') {
      this.startAcousticLoveMelody();
    } else if (type === 'elise') {
      this.startEliseMelody();
    } else if (type === 'lofi' || type === 'synth') {
      this.startBackgroundMelody();
    } else {
      this.startBirthdayMelody();
    }
  }

  public stopCustomAudio() {
    if (this.customAudioEl) {
      const audio = this.customAudioEl;
      this.customAudioEl = null;
      try {
        audio.onerror = null;
        audio.oncanplay = null;
        audio.onended = null;
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute('src');
      } catch (e) {}
    }
  }

  // General Music Controls
  public startMusic(config?: MusicConfig) {
    this.stopMusic();

    if (config) {
      this.currentConfig = { ...this.currentConfig, ...config };
    }

    this.initCtx();

    const { type, url } = this.currentConfig;
    const resolvedUrl = (url || '').trim();
    const isCustomOrUploaded = (type === 'custom' || type === 'file' || type === 'uploaded') && Boolean(resolvedUrl);

    if (isCustomOrUploaded) {
      this.startCustomAudio(resolvedUrl, type);
    } else if (type === 'piano' || type === 'acoustic') {
      this.startAcousticLoveMelody();
    } else if (type === 'elise') {
      this.startEliseMelody();
    } else if (type === 'lofi' || type === 'synth') {
      this.startBackgroundMelody();
    } else {
      this.startBirthdayMelody();
    }
    this.isPlaying = true;
    this.notifyListeners();
  }

  public stopMusic() {
    this.isPlaying = false;
    this.stopBackgroundMelody();
    this.stopCustomAudio();

    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.disconnect();
      } catch (e) {}
      this.masterGain = null;
    }
    if (this.ctx) {
      try {
        this.ctx.suspend();
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
    this.notifyListeners();
  }

  public toggleMusic(config?: MusicConfig): boolean {
    if (this.isPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic(config);
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentConfig(): MusicConfig {
    return this.currentConfig;
  }

  // Sound FX
  public playPopSound() {
    this.initCtx();
    this.playNote(523.25, 0.15, 0, 0.4);
    this.playNote(880, 0.2, 0.05, 0.3);
  }

  public playChime() {
    this.initCtx();
    this.playNote(587.33, 0.3, 0, 0.3); // D5
    this.playNote(880.00, 0.4, 0.08, 0.3); // A5
    this.playNote(1174.66, 0.5, 0.16, 0.35); // D6
  }

  public playBlowCandleSound() {
    this.initCtx();
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      this.playNote(freq, 0.4, idx * 0.08, 0.35);
    });
  }

  public playFanfare() {
    this.initCtx();
    const fanfare = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    fanfare.forEach((f, idx) => {
      this.playNote(f, 0.6, idx * 0.12, 0.35);
    });
  }

  public playUnwrapSound() {
    this.initCtx();
    this.playNote(659.25, 0.25, 0, 0.3);
    this.playNote(783.99, 0.35, 0.1, 0.3);
  }
}

export const romanticAudio = new RomanticAudioEngine();
