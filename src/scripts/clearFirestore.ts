import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLLECTIONS_TO_CLEAR = [
  'categories',
  'courses',
  'assessments',
  'assessmentVersions',
  'students',
  'attempts',
  'auditLogs',
  'publishedResults',
  'system',
];

export async function clearAllFirestoreData(): Promise<{ success: boolean; deletedCount: number }> {
  let totalDeleted = 0;

  try {
    for (const collName of COLLECTIONS_TO_CLEAR) {
      const snap = await getDocs(collection(db, collName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          batch.delete(doc(db, collName, d.id));
          totalDeleted++;
        });
        await batch.commit();
      }
    }

    return { success: true, deletedCount: totalDeleted };
  } catch (error) {
    console.error('Failed to clear Firestore collections:', error);
    return { success: false, deletedCount: totalDeleted };
  }
}
