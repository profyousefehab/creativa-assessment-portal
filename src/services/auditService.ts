import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { AuditLog } from '../types';

const COLLECTION = 'auditLogs';
let cachedLogs: AuditLog[] = [];

export function getAuditLogs(): AuditLog[] {
  return cachedLogs;
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    if (!snap.empty) {
      cachedLogs = snap.docs.map((d) => d.data() as AuditLog);
    }
  } catch (err) {
    console.warn('Failed to fetch audit logs from Firestore:', err);
  }
  return cachedLogs;
}

export function logAuditAction(
  action: AuditLog['action'],
  entity: AuditLog['entity'],
  entityId: string,
  metadata?: Record<string, any>
): AuditLog {
  const coordEmail = auth.currentUser?.email || 'coordinator@creativa.gov.eg';
  const newLog: AuditLog = {
    id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    coordinatorEmail: coordEmail,
    action,
    entity,
    entityId,
    timestamp: new Date().toISOString(),
    metadata,
  };

  cachedLogs.unshift(newLog);

  setDoc(doc(db, COLLECTION, newLog.id), newLog).catch((err) => {
    console.warn('Firestore logAuditAction error:', err);
  });

  return newLog;
}

export function subscribeToAuditLogs(callback: (logs: AuditLog[]) => void): () => void {
  const q = query(collection(db, COLLECTION), orderBy('timestamp', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        cachedLogs = snap.docs.map((d) => d.data() as AuditLog);
      }
      callback(cachedLogs);
    },
    (err) => {
      console.warn('subscribeToAuditLogs listener error:', err);
      callback(cachedLogs);
    }
  );
}
