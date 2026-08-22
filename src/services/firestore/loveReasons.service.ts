import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { LoveReasonItem } from '../../types/firestore';
import { handleFirestoreError, OperationType } from './error';

const COLLECTION_PATH = 'loveReasons';

export const defaultLoveReasons: LoveReasonItem[] = [];

export async function getLoveReasons(): Promise<LoveReasonItem[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LoveReasonItem);
  } catch (error) {
    console.warn('loveReasons get error:', error);
    return [];
  }
}

export async function saveLoveReason(reason: LoveReasonItem): Promise<void> {
  if (!db) return;
  try {
    const id = reason.id || `reason_${Date.now()}`;
    const docRef = doc(db, COLLECTION_PATH, id);
    const payload: LoveReasonItem = {
      ...reason,
      id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    console.warn('loveReasons save error:', error);
  }
}

export async function deleteLoveReason(id: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('loveReasons delete error:', error);
  }
}

export function subscribeLoveReasons(callback: (items: LoveReasonItem[]) => void) {
  if (!db) {
    callback(defaultLoveReasons);
    return () => {};
  }
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          callback(defaultLoveReasons);
          return;
        }
        const items = snap.docs.map((d) => d.data() as LoveReasonItem);
        callback(items);
      },
      (err) => {
        console.warn('loveReasons snapshot error:', err);
        callback(defaultLoveReasons);
      }
    );
  } catch (err) {
    console.warn('loveReasons subscribe error:', err);
    callback(defaultLoveReasons);
    return () => {};
  }
}
