import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { MemoryItem } from '../../types/firestore';
import { handleFirestoreError, OperationType } from './error';

const COLLECTION_PATH = 'memories';

export const defaultMemories: MemoryItem[] = [];

export async function getMemories(): Promise<MemoryItem[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      const imageUrl = data.imageUrl || data.url || '';
      return {
        ...data,
        imageUrl,
        url: imageUrl,
      } as MemoryItem;
    });
  } catch (error) {
    console.warn('memories get error:', error);
    return [];
  }
}

export async function saveMemory(memory: MemoryItem | any): Promise<void> {
  if (!db) return;
  try {
    const id = memory.id || `mem_${Date.now()}`;
    const docRef = doc(db, COLLECTION_PATH, id);
    const imageUrl = memory.imageUrl || memory.url || '';
    const payload: any = {
      ...memory,
      id,
      imageUrl,
      url: imageUrl,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    console.warn('memories save error:', error);
  }
}

export async function saveMemoriesBatch(memoriesList: (MemoryItem | any)[]): Promise<void> {
  if (!db) return;
  try {
    for (let i = 0; i < memoriesList.length; i++) {
      const memory = memoriesList[i];
      const id = memory.id || `mem_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, COLLECTION_PATH, id);
      const imageUrl = memory.imageUrl || memory.url || '';
      const payload: any = {
        ...memory,
        id,
        imageUrl,
        url: imageUrl,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, payload);
    }
  } catch (error) {
    console.warn('memories batch save error:', error);
  }
}

export async function deleteMemory(id: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('memories delete error:', error);
  }
}

export async function likeMemory(id: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as MemoryItem;
      await setDoc(docRef, { ...data, likes: (data.likes || 0) + 1 });
    }
  } catch (error) {
    console.warn('memories like error:', error);
  }
}

export function subscribeMemories(callback: (items: MemoryItem[]) => void) {
  if (!db) {
    callback(defaultMemories);
    return () => {};
  }
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          callback(defaultMemories);
          return;
        }
        const items = snap.docs.map((d) => {
          const data = d.data() as any;
          const imageUrl = data.imageUrl || data.url || '';
          return {
            ...data,
            imageUrl,
            url: imageUrl,
          } as MemoryItem;
        });
        callback(items);
      },
      (err) => {
        console.warn('memories snapshot error:', err);
        callback(defaultMemories);
      }
    );
  } catch (err) {
    console.warn('memories subscribe error:', err);
    callback(defaultMemories);
    return () => {};
  }
}
