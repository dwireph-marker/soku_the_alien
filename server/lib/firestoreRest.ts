import 'dotenv/config';

const DEFAULT_FIREBASE_API_KEY = 'AIzaSyAqQIiCklhaOacTGR-LZC0kiPKQXtH_lV4';
const DEFAULT_FIREBASE_PROJECT_ID = 'ai-studio-applet';

function getFirebaseConfig() {
  const apiKey = (
    process.env.VITE_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    DEFAULT_FIREBASE_API_KEY
  ).trim();

  const projectId = (
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    DEFAULT_FIREBASE_PROJECT_ID
  ).trim();

  return { apiKey, projectId };
}

export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return fields;
}

export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { integerValue: '0' };
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreDocument(doc: any): any {
  if (!doc || !doc.fields) return null;
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(doc.fields)) {
    result[key] = fromFirestoreValue(val);
  }
  return result;
}

export function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('stringValue' in val) return String(val.stringValue);
  if ('timestampValue' in val) return String(val.timestampValue);
  if ('arrayValue' in val) {
    return Array.isArray(val.arrayValue.values) ? val.arrayValue.values.map(fromFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    if (val.mapValue.fields) {
      for (const [k, v] of Object.entries(val.mapValue.fields)) {
        res[k] = fromFirestoreValue(v);
      }
    }
    return res;
  }
  return val;
}

// In-process write-through caches for high-speed lookups
const inMemoryProcessedSessionKeys = new Set<string>();
const inMemoryUserProgressStore = new Map<string, any>();

/**
 * Checks if a unique session key has already been recorded in Firestore or local cache.
 */
export async function isSessionProcessed(uniqueSessionKey: string): Promise<boolean> {
  if (!uniqueSessionKey) return false;
  if (inMemoryProcessedSessionKeys.has(uniqueSessionKey)) {
    return true;
  }

  const { apiKey, projectId } = getFirebaseConfig();
  if (!projectId || !apiKey) return false;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/(default)/documents/examArena_processed_sessions/${encodeURIComponent(
      uniqueSessionKey
    )}?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { method: 'GET' });
    if (res.status === 200) {
      inMemoryProcessedSessionKeys.add(uniqueSessionKey);
      return true;
    }
  } catch (err: any) {
    console.debug('[FirestoreRest] Session check note:', err?.message || err);
  }

  return false;
}

/**
 * Atomically marks a session as processed in Firestore and the in-process cache.
 */
export async function markSessionProcessed(uniqueSessionKey: string, sessionData: Record<string, any>): Promise<boolean> {
  if (!uniqueSessionKey) return false;
  inMemoryProcessedSessionKeys.add(uniqueSessionKey);

  const { apiKey, projectId } = getFirebaseConfig();
  if (!projectId || !apiKey) return true;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/(default)/documents/examArena_processed_sessions/${encodeURIComponent(
      uniqueSessionKey
    )}?key=${encodeURIComponent(apiKey)}`;

    const fields = toFirestoreFields(sessionData);
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    return true;
  } catch (err: any) {
    console.debug('[FirestoreRest] Session write note:', err?.message || err);
    return true;
  }
}

/**
 * Retrieves per-user progress from memory or Firestore.
 */
export async function fetchUserProgress(uid: string): Promise<any | null> {
  if (!uid) return null;
  if (inMemoryUserProgressStore.has(uid)) {
    return inMemoryUserProgressStore.get(uid);
  }

  const { apiKey, projectId } = getFirebaseConfig();
  if (!projectId || !apiKey) return null;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/(default)/documents/examArena_progress/${encodeURIComponent(uid)}?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { method: 'GET' });
    if (res.status === 200) {
      const data = await res.json();
      const parsed = fromFirestoreDocument(data);
      if (parsed) {
        inMemoryUserProgressStore.set(uid, parsed);
        return parsed;
      }
    }
  } catch (err: any) {
    console.debug('[FirestoreRest] User progress fetch note:', err?.message || err);
  }

  return null;
}

/**
 * Persists per-user progress to memory and Firestore.
 */
export async function persistUserProgress(uid: string, progress: Record<string, any>): Promise<boolean> {
  if (!uid) return false;
  inMemoryUserProgressStore.set(uid, progress);

  const { apiKey, projectId } = getFirebaseConfig();
  if (!projectId || !apiKey) return true;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/(default)/documents/examArena_progress/${encodeURIComponent(uid)}?key=${encodeURIComponent(apiKey)}`;

    const fields = toFirestoreFields(progress);
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    return true;
  } catch (err: any) {
    console.debug('[FirestoreRest] User progress persist note:', err?.message || err);
    return true;
  }
}

/**
 * Clears user progress in Firestore and memory.
 */
export async function purgeUserProgress(uid: string, initialProgress: Record<string, any>): Promise<boolean> {
  if (!uid) return false;
  inMemoryUserProgressStore.set(uid, initialProgress);

  // Clear memory cache keys matching this user UID
  for (const key of inMemoryProcessedSessionKeys) {
    if (key.startsWith(`${uid}_`)) {
      inMemoryProcessedSessionKeys.delete(key);
    }
  }

  const { apiKey, projectId } = getFirebaseConfig();
  if (!projectId || !apiKey) return true;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/(default)/documents/examArena_progress/${encodeURIComponent(uid)}?key=${encodeURIComponent(apiKey)}`;

    const fields = toFirestoreFields(initialProgress);
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    return true;
  } catch (err: any) {
    console.debug('[FirestoreRest] User progress purge note:', err?.message || err);
    return true;
  }
}
