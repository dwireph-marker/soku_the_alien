import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { AppPreferencesData } from '../../types/firestore';
import { handleFirestoreError, OperationType } from './error';

const DOC_PATH = 'appPreferences/user_pref';

export const defaultPreferences: AppPreferencesData = {
  theme: 'midnight',
  soundEnabled: true,
};

export async function getAppPreferences(): Promise<AppPreferencesData> {
  if (!db) return defaultPreferences;
  try {
    const docRef = doc(db, 'appPreferences', 'user_pref');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppPreferencesData;
    }
    await setDoc(docRef, defaultPreferences);
    return defaultPreferences;
  } catch (error) {
    console.warn('preferences get error:', error);
    return defaultPreferences;
  }
}

export async function updateAppPreferences(data: Partial<AppPreferencesData>): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'appPreferences', 'user_pref');
    const existing = await getAppPreferences();
    await setDoc(docRef, { ...existing, ...data });
  } catch (error) {
    console.warn('preferences update error:', error);
  }
}

export function subscribeAppPreferences(callback: (prefs: AppPreferencesData) => void) {
  if (!db) {
    callback(defaultPreferences);
    return () => {};
  }
  try {
    const docRef = doc(db, 'appPreferences', 'user_pref');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as AppPreferencesData);
        } else {
          callback(defaultPreferences);
        }
      },
      () => {
        callback(defaultPreferences);
      }
    );
  } catch (err) {
    console.warn('preferences subscribe error:', err);
    callback(defaultPreferences);
    return () => {};
  }
}
