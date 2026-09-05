import { syncCategoriesToFirestore } from './categoryService';
import { syncCoursesToFirestore } from './courseService';
import { syncAssessmentsToFirestore } from './assessmentService';
import { auth } from './firebase';
import { notifyDbChange } from './dbEvents';

export interface SyncResult {
  syncedCourses: number;
  syncedAssessments: number;
  syncedCategories: number;
  totalSynced: number;
}

let isSyncing = false;
let lastSyncTimestamp: string | null = null;
let lastSyncError: string | null = null;

export function getSyncStatus() {
  return {
    isSyncing,
    lastSyncTimestamp,
    lastSyncError,
  };
}

export async function syncAllToFirestore(): Promise<SyncResult> {
  if (isSyncing) {
    return { syncedCourses: 0, syncedAssessments: 0, syncedCategories: 0, totalSynced: 0 };
  }

  // Coordinator must be signed in for Cloud Firestore write rules
  if (!auth.currentUser) {
    return { syncedCourses: 0, syncedAssessments: 0, syncedCategories: 0, totalSynced: 0 };
  }

  isSyncing = true;
  lastSyncError = null;

  try {
    const [syncedCats, syncedCourses, syncedAssessments] = await Promise.all([
      syncCategoriesToFirestore(),
      syncCoursesToFirestore(),
      syncAssessmentsToFirestore(),
    ]);

    const totalSynced = syncedCats + syncedCourses + syncedAssessments;
    lastSyncTimestamp = new Date().toISOString();
    notifyDbChange();

    return {
      syncedCategories: syncedCats,
      syncedCourses,
      syncedAssessments,
      totalSynced,
    };
  } catch (err: any) {
    console.warn('syncAllToFirestore error:', err);
    lastSyncError = err?.message || 'Sync error';
    return { syncedCourses: 0, syncedAssessments: 0, syncedCategories: 0, totalSynced: 0 };
  } finally {
    isSyncing = false;
    notifyDbChange();
  }
}
