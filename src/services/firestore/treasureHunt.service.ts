import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import {
  TreasureHuntTemplate,
  TreasureHuntGlobalSettings,
  TreasureHuntStats,
  TreasureHuntInstance,
} from '../../types/firestore/treasureHunt';
import { defaultTreasureHunts, defaultTreasureHuntSettings } from '../../data/defaultTreasureHunts';

const SETTINGS_DOC = 'treasureHuntSettings/main';
const STATS_DOC = 'treasureHuntStats/main';
const TEMPLATES_COLLECTION = 'treasureHuntTemplates';
const INSTANCES_COLLECTION = 'treasureHuntInstances';

const LOCAL_STORAGE_SETTINGS_KEY = 'secret_hunt_settings';
const LOCAL_STORAGE_TEMPLATES_KEY = 'secret_hunt_templates';
const LOCAL_STORAGE_STATS_KEY = 'secret_hunt_stats';
const LOCAL_STORAGE_RECENT_HUNTS_KEY = 'secret_hunt_recent_ids';
const LOCAL_STORAGE_ACTIVE_INSTANCE_KEY = 'secret_hunt_active_instance';

const defaultStats: TreasureHuntStats = {
  totalPlays: 78,
  completed: 62,
  abandoned: 16,
  averageSolveTimeSeconds: 412, // ~6m 52s
  averageHintsUsed: 1.2,
  hardestPuzzle: 'CCTV Camera 02 Temporal Anomaly',
  mostPlayedHunt: 'The Stolen Quantum Cipher',
};

// ==========================================
// GLOBAL SETTINGS
// ==========================================
export async function getTreasureHuntSettings(): Promise<TreasureHuntGlobalSettings> {
  // Try Firestore first when available
  if (db) {
    try {
      const docRef = doc(db, 'treasureHuntSettings', 'main');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as TreasureHuntGlobalSettings;
        try {
          localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch {
      // Graceful fallback to local cache
    }
  }

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return defaultTreasureHuntSettings;
}

export async function updateTreasureHuntSettings(settings: Partial<TreasureHuntGlobalSettings>): Promise<void> {
  const current = await getTreasureHuntSettings();
  const merged: TreasureHuntGlobalSettings = { ...current, ...settings };

  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(merged));
  } catch {}

  if (db) {
    try {
      const docRef = doc(db, 'treasureHuntSettings', 'main');
      await setDoc(docRef, merged, { merge: true });
    } catch {
      // Local cache already updated
    }
  }
}

// ==========================================
// TEMPLATES (CRUD)
// ==========================================
export async function getTreasureHuntTemplates(): Promise<TreasureHuntTemplate[]> {
  // Try Firestore authoritative source first
  if (db) {
    try {
      const colRef = collection(db, TEMPLATES_COLLECTION);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const templates = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TreasureHuntTemplate));
        try {
          localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(templates));
        } catch {}
        return templates;
      }
    } catch {
      // Fall through to local cache
    }
  }

  // Fallback to local cache
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Fallback to default templates
  try {
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(defaultTreasureHunts));
  } catch {}
  return defaultTreasureHunts;
}

export async function saveTreasureHuntTemplate(template: TreasureHuntTemplate): Promise<void> {
  const templates = await getTreasureHuntTemplates();
  const index = templates.findIndex((t) => t.id === template.id);
  let updatedList: TreasureHuntTemplate[];
  if (index >= 0) {
    updatedList = [...templates];
    updatedList[index] = { ...template, updatedAt: new Date().toISOString() };
  } else {
    updatedList = [
      ...templates,
      { ...template, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(updatedList));
  } catch {}

  if (db) {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, template.id);
      await setDoc(docRef, template, { merge: true });
    } catch {
      // Offline fallback
    }
  }
}

export async function deleteTreasureHuntTemplate(id: string): Promise<void> {
  const templates = await getTreasureHuntTemplates();
  const updatedList = templates.filter((t) => t.id !== id);

  try {
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(updatedList));
  } catch {}

  if (db) {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch {
      // Offline fallback
    }
  }
}

// ==========================================
// GAME INSTANCES (PERSISTENCE & RECOVERY)
// ==========================================
export async function saveHuntInstance(instance: TreasureHuntInstance): Promise<void> {
  // 1. Save to local storage for instant sync
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_INSTANCE_KEY, JSON.stringify(instance));
  } catch {}

  // 2. Persist to Firestore if available
  if (db && instance.instanceId) {
    try {
      const docRef = doc(db, INSTANCES_COLLECTION, instance.instanceId);
      await setDoc(docRef, instance, { merge: true });
    } catch {
      // Ignore network errors for resilience
    }
  }
}

export async function getActiveHuntInstance(): Promise<TreasureHuntInstance | null> {
  // 1. Read from local cache first for sub-millisecond restore
  let cachedInstance: TreasureHuntInstance | null = null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_INSTANCE_KEY);
    if (raw) {
      cachedInstance = JSON.parse(raw);
    }
  } catch {}

  // 2. If cached instance exists and has an ID, try checking Firestore for freshest state
  if (cachedInstance && db && cachedInstance.instanceId) {
    try {
      const docRef = doc(db, INSTANCES_COLLECTION, cachedInstance.instanceId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const firestoreData = snap.data() as TreasureHuntInstance;
        try {
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_INSTANCE_KEY, JSON.stringify(firestoreData));
        } catch {}
        return firestoreData;
      }
    } catch {
      // Use cached instance
    }
  }

  return cachedInstance;
}

export async function clearActiveHuntInstance(instanceId?: string): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_INSTANCE_KEY);
  } catch {}

  if (db && instanceId) {
    try {
      const docRef = doc(db, INSTANCES_COLLECTION, instanceId);
      await deleteDoc(docRef);
    } catch {
      // Safe catch
    }
  }
}

// ==========================================
// RECENT HUNTS & ANTI-REPETITION POOL
// ==========================================
export function getRecentlyPlayedHunts(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECENT_HUNTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function recordPlayedHuntId(huntId: string): void {
  try {
    const recent = getRecentlyPlayedHunts();
    const updated = [huntId, ...recent.filter((id) => id !== huntId)].slice(0, 5);
    localStorage.setItem(LOCAL_STORAGE_RECENT_HUNTS_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearRecentHuntsHistory(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_RECENT_HUNTS_KEY);
  } catch {}
}

// ==========================================
// STATS & ANALYTICS
// ==========================================
export async function getTreasureHuntStats(): Promise<TreasureHuntStats> {
  if (db) {
    try {
      const docRef = doc(db, 'treasureHuntStats', 'main');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as TreasureHuntStats;
        try {
          localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch {
      // Fallback to cache
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}

  return defaultStats;
}

export async function recordHuntPlay(huntId: string): Promise<void> {
  const stats = await getTreasureHuntStats();
  const updated: TreasureHuntStats = {
    ...stats,
    totalPlays: stats.totalPlays + 1,
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(updated));
  } catch {}

  if (db) {
    try {
      const docRef = doc(db, 'treasureHuntStats', 'main');
      await setDoc(docRef, updated, { merge: true });
    } catch {}
  }
}

export async function recordHuntCompletion(opts: {
  huntId: string;
  solveDurationSeconds: number;
  hintsUsed: number;
}): Promise<void> {
  const stats = await getTreasureHuntStats();
  const newCompleted = stats.completed + 1;
  const newAvgTime = Math.round(
    (stats.averageSolveTimeSeconds * stats.completed + opts.solveDurationSeconds) / newCompleted
  );
  const newAvgHints = Number(
    ((stats.averageHintsUsed * stats.completed + opts.hintsUsed) / newCompleted).toFixed(1)
  );

  const updated: TreasureHuntStats = {
    ...stats,
    completed: newCompleted,
    averageSolveTimeSeconds: newAvgTime,
    averageHintsUsed: newAvgHints,
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(updated));
  } catch {}

  if (db) {
    try {
      const docRef = doc(db, 'treasureHuntStats', 'main');
      await setDoc(docRef, updated, { merge: true });
    } catch {}
  }
}
