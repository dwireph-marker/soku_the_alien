import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase/client';
import { AuditLogItem } from '../../types/firestore';
import { handleFirestoreError, OperationType } from './error';

const COLLECTION_PATH = 'auditLogs';

export async function getAuditLogs(): Promise<AuditLogItem[]> {
  if (!db || !auth?.currentUser) return [];
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AuditLogItem);
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      console.warn('auditLogs get error:', error);
    }
    return [];
  }
}

export async function addAuditLog(
  action: string,
  resource: string,
  description: string,
  resourceId?: string
): Promise<void> {
  if (!db) return;
  try {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, COLLECTION_PATH, id);
    const currentUser = auth?.currentUser;
    const logItem: Record<string, any> = {
      id,
      adminUid: currentUser?.uid || 'authenticated_admin',
      adminEmail: currentUser?.email || 'admin@birthday.site',
      action,
      resource,
      resourceId: resourceId ?? '',
      description,
      timestamp: new Date().toISOString(),
    };
    await setDoc(docRef, logItem as AuditLogItem);
  } catch (error) {
    console.warn('Failed to record audit log:', error);
  }
}

export function subscribeAuditLogs(callback: (items: AuditLogItem[]) => void) {
  if (!db || !auth?.currentUser) {
    callback([]);
    return () => {};
  }
  try {
    const colRef = collection(db, COLLECTION_PATH);
    const q = query(colRef, orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as AuditLogItem);
        callback(items);
      },
      (err) => {
        if (err?.code !== 'permission-denied') {
          console.warn('auditLogs snapshot error:', err);
        }
        callback([]);
      }
    );
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('auditLogs subscribe error:', err);
    }
    callback([]);
    return () => {};
  }
}
