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
import { db, auth } from '../../lib/firebase/client';
import { BirthdayWishItem } from '../../types/firestore';
import { handleFirestoreError, OperationType } from './error';

const COLLECTION_PATH = 'wishes';

export async function getWishes(): Promise<BirthdayWishItem[]> {
  if (!db || !auth?.currentUser) return [];
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as BirthdayWishItem);
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      console.warn('wishes get error:', error);
    }
    return [];
  }
}

export async function addWish(wishText: string, herName: string): Promise<BirthdayWishItem> {
  const id = `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const wishItem: BirthdayWishItem = {
    id,
    wishText: wishText.trim(),
    herName: herName.trim() || 'Sonali',
    createdAt: new Date().toISOString(),
    isViewed: false,
  };
  if (!db) return wishItem;
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await setDoc(docRef, wishItem);
  } catch (error) {
    console.warn('wishes add error:', error);
  }
  return wishItem;
}

export async function deleteWish(id: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('wishes delete error:', error);
  }
}

export function subscribeWishes(callback: (items: BirthdayWishItem[]) => void) {
  if (!db || !auth?.currentUser) {
    callback([]);
    return () => {};
  }
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as BirthdayWishItem);
        callback(items);
      },
      (err) => {
        if (err?.code !== 'permission-denied') {
          console.warn('wishes snapshot error:', err);
        }
        callback([]);
      }
    );
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('wishes subscribe error:', err);
    }
    callback([]);
    return () => {};
  }
}
