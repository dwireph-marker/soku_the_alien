import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  inMemoryPersistence,
  Auth
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  Firestore
} from 'firebase/firestore';

const metaEnv = (import.meta as any).env || {};

const apiKey = metaEnv.VITE_FIREBASE_API_KEY || metaEnv.NEXT_PUBLIC_FIREBASE_API_KEY;

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 5 && apiKey !== 'YOUR_FIREBASE_API_KEY') {
  try {
    const firebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || metaEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || metaEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || metaEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || metaEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: metaEnv.VITE_FIREBASE_APP_ID || metaEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(firebaseConfig);
    }

    try {
      authInstance = initializeAuth(appInstance, {
        persistence: [browserLocalPersistence, inMemoryPersistence],
      });
    } catch {
      try {
        authInstance = getAuth(appInstance);
      } catch (authErr) {
        console.debug('Auth init fallback:', authErr);
      }
    }

    try {
      dbInstance = initializeFirestore(appInstance, {
        localCache: memoryLocalCache(),
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      try {
        dbInstance = getFirestore(appInstance);
      } catch (dbErr) {
        console.debug('Firestore init fallback:', dbErr);
      }
    }
  } catch (err) {
    console.debug('Firebase client initialization note:', err);
  }
}

export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
export default appInstance;

