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
import { VoucherItem } from '../../types/firestore';
import { handleFirestoreError, OperationType } from './error';

const COLLECTION_PATH = 'vouchers';

export const defaultVouchers: VoucherItem[] = [];

export async function getVouchers(): Promise<VoucherItem[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as VoucherItem);
  } catch (error) {
    console.warn('vouchers get error:', error);
    return [];
  }
}

export async function saveVoucher(voucher: VoucherItem): Promise<void> {
  if (!db) return;
  try {
    const id = voucher.id || `voucher_${Date.now()}`;
    const docRef = doc(db, COLLECTION_PATH, id);
    const payload: VoucherItem = {
      ...voucher,
      id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    console.warn('vouchers save error:', error);
  }
}

export async function deleteVoucher(id: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('vouchers delete error:', error);
  }
}

export async function redeemVoucher(id: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await setDoc(
      docRef,
      {
        isRedeemed: true,
        redeemedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('vouchers redeem error:', error);
  }
}

export function subscribeVouchers(callback: (items: VoucherItem[]) => void) {
  if (!db) {
    callback(defaultVouchers);
    return () => {};
  }
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          callback(defaultVouchers);
          return;
        }
        const items = snap.docs.map((d) => d.data() as VoucherItem);
        callback(items);
      },
      (err) => {
        console.warn('vouchers snapshot error:', err);
        callback(defaultVouchers);
      }
    );
  } catch (err) {
    console.warn('vouchers subscribe error:', err);
    callback(defaultVouchers);
    return () => {};
  }
}
