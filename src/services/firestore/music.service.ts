import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { MusicConfigData } from '../../types/firestore';
import { handleFirestoreError, OperationType } from './error';

const DOC_PATH = 'music/main';

export const defaultMusicConfig: MusicConfigData = {
  bgMusicEnabled: true,
  bgMusicType: 'birthday',
  bgMusicPresetUrl: '',
  bgMusicCustomUrl: '',
  bgMusicCustomName: '🎂 Romantic Piano Birthday',
  activeTrackId: 'birthday',
  customAudioTracks: [],
  soundFxEnabled: true,
};

export async function getMusicConfig(): Promise<MusicConfigData> {
  if (!db) return defaultMusicConfig;
  try {
    const docRef = doc(db, 'music', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as MusicConfigData;
      return {
        ...defaultMusicConfig,
        ...data,
        customAudioTracks: Array.isArray(data.customAudioTracks) ? data.customAudioTracks : [],
      };
    }
    return defaultMusicConfig;
  } catch (error) {
    console.warn('music get error:', error);
    return defaultMusicConfig;
  }
}

export async function updateMusicConfig(data: Partial<MusicConfigData>): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'music', 'main');
    const existing = await getMusicConfig();
    const updated: MusicConfigData = {
      ...existing,
      ...data,
      customAudioTracks: Array.isArray(data.customAudioTracks) ? data.customAudioTracks : (existing.customAudioTracks || []),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, updated);
  } catch (error) {
    console.warn('music update error:', error);
  }
}

export function subscribeMusicConfig(callback: (config: MusicConfigData) => void) {
  if (!db) {
    callback(defaultMusicConfig);
    return () => {};
  }
  try {
    const docRef = doc(db, 'music', 'main');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as MusicConfigData;
          callback({
            ...defaultMusicConfig,
            ...data,
            customAudioTracks: Array.isArray(data.customAudioTracks) ? data.customAudioTracks : [],
          });
        } else {
          callback(defaultMusicConfig);
        }
      },
      (err) => {
        console.warn('music snapshot error:', err);
        callback(defaultMusicConfig);
      }
    );
  } catch (err) {
    console.warn('music subscribe error:', err);
    callback(defaultMusicConfig);
    return () => {};
  }
}
