import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { CelebrationSettingsData } from '../../types/firestore';
import { handleFirestoreError, OperationType } from './error';

const DOC_PATH = 'celebration/main';

export const defaultCelebrationSettings: CelebrationSettingsData = {
  candleCount: 5,
  confettiEnabled: true,
  confettiAmount: 100,
  confettiDuration: 4,
  wishModalTitle: 'Make a Magical Birthday Wish ✨',
  wishModalSubtitle: 'Close your eyes, whisper your deepest dream, and make a wish!',
  blowButtonText: 'Blow Out All Candles 🕯️',
  relightButtonText: 'Relight Candles 🔥',
  microphoneEnabled: true,
  microphoneSensitivity: 5,
  blowThreshold: 35,
  minimumBlowDuration: 300,
  blowCooldown: 1000,
};

export async function getCelebrationSettings(): Promise<CelebrationSettingsData> {
  if (!db) return defaultCelebrationSettings;
  try {
    const docRef = doc(db, 'celebration', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CelebrationSettingsData;
    }
    return defaultCelebrationSettings;
  } catch (error) {
    console.warn('celebration get error:', error);
    return defaultCelebrationSettings;
  }
}

export async function updateCelebrationSettings(data: Partial<CelebrationSettingsData>): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'celebration', 'main');
    const existing = await getCelebrationSettings();
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, updated);
  } catch (error) {
    console.warn('celebration update error:', error);
  }
}

export function subscribeCelebrationSettings(callback: (settings: CelebrationSettingsData) => void) {
  if (!db) {
    callback(defaultCelebrationSettings);
    return () => {};
  }
  try {
    const docRef = doc(db, 'celebration', 'main');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as CelebrationSettingsData);
        } else {
          callback(defaultCelebrationSettings);
        }
      },
      (err) => {
        console.warn('celebration snapshot error:', err);
        callback(defaultCelebrationSettings);
      }
    );
  } catch (err) {
    console.warn('celebration subscribe error:', err);
    callback(defaultCelebrationSettings);
    return () => {};
  }
}
