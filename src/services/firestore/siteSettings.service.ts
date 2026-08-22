import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { SiteSettingsData } from '../../types/firestore';
import { handleFirestoreError, OperationType } from './error';
import { calculateNextBirthdayOccurrence } from '../../utils/birthdayCountdown';

const DOC_PATH = 'siteSettings/main';

export const defaultSiteSettings: SiteSettingsData = {
  herName: 'Sonali',
  hisName: 'Forever Yours',
  birthdayDate: '2026-12-25',
  birthdayTime: '00:00:00',
  timezone: 'Asia/Kolkata',
  countdownEnabled: true,
  birthdayMonth: 12,
  birthdayDay: 25,
  birthdayYear: 2026,
  targetDate: '2026-12-24T18:30:00.000Z',
  loveLetterTitle: 'Happy Birthday to the Love of My Life ❤️',
  loveLetterBody: 'From the very first moment our eyes met, my world changed in ways I never thought possible. Your radiant smile brightens even my darkest days, and your laughter is my favorite sound in the universe. Today, as you celebrate another wonderful year of life, I want to remind you how deeply, truly, and endlessly you are loved.',
  bgMusicEnabled: true,
  bgMusicType: 'birthday',
  bgMusicPresetUrl: '',
  bgMusicCustomUrl: '',
  bgMusicCustomName: '🎂 Romantic Piano Birthday',
  activeTrackId: 'birthday',
  soundFxEnabled: true,
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
  if (!db) return defaultSiteSettings;
  try {
    const docRef = doc(db, 'siteSettings', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SiteSettingsData;
    }
    return defaultSiteSettings;
  } catch (error) {
    console.warn('siteSettings get error:', error);
    return defaultSiteSettings;
  }
}

export async function updateSiteSettings(data: Partial<SiteSettingsData>): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'siteSettings', 'main');
    const existing = await getSiteSettings();
    const merged = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // If birthday date, time or timezone changed, recalculate the next target occurrence
    if (merged.birthdayDate || merged.birthdayTime || merged.timezone || merged.birthdayMonth) {
      const nextOcc = calculateNextBirthdayOccurrence({
        birthdayDate: merged.birthdayDate,
        birthdayTime: merged.birthdayTime,
        timezone: merged.timezone,
        birthdayMonth: merged.birthdayMonth,
        birthdayDay: merged.birthdayDay,
        birthdayYear: merged.birthdayYear,
      });
      merged.targetDate = nextOcc.targetDateIso;
    }

    await setDoc(docRef, merged);
  } catch (error) {
    console.warn('siteSettings update error:', error);
  }
}

export function subscribeSiteSettings(callback: (settings: SiteSettingsData) => void) {
  if (!db) {
    callback(defaultSiteSettings);
    return () => {};
  }
  try {
    const docRef = doc(db, 'siteSettings', 'main');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as SiteSettingsData);
        } else {
          callback(defaultSiteSettings);
        }
      },
      (err) => {
        console.warn('siteSettings snapshot error:', err);
        callback(defaultSiteSettings);
      }
    );
  } catch (err) {
    console.warn('siteSettings subscribe error:', err);
    callback(defaultSiteSettings);
    return () => {};
  }
}
