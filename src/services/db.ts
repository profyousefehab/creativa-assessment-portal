// Master Database & Services Integration Module
// Connects UI components to Firebase Services and live Firestore data

export * from './firebase';
export * from './auth';
export * from './categoryService';
export * from './courseService';
export * from './assessmentService';
export * from './studentService';
export * from './attemptService';
export * from './gradingService';
export * from './analyticsService';
export * from './auditService';
export { clearAllFirestoreData } from '../scripts/clearFirestore';

import { fetchCourses } from './courseService';
import { fetchAssessments } from './assessmentService';
import { fetchStudents } from './studentService';
import { fetchAttempts } from './attemptService';
import { fetchCategories } from './categoryService';
import { fetchAuditLogs } from './auditService';

// Legacy keys to clean up so old browser mock sessions do not linger
const LEGACY_STORAGE_KEYS = [
  'creativa_categories_v1',
  'creativa_courses_v1',
  'creativa_assessments_v1',
  'creativa_versions_v1',
  'creativa_students_v1',
  'creativa_attempts_v1',
  'creativa_audit_logs_v1',
  'creativa_published_results_v1',
];

// Event target for reactive updates
const dbEventTarget = new EventTarget();
export const DB_CHANGE_EVENT = 'creativa_db_change';

export function notifyDbChange() {
  dbEventTarget.dispatchEvent(new Event(DB_CHANGE_EVENT));
}

export function subscribeToDb(callback: () => void): () => void {
  const handler = () => callback();
  dbEventTarget.addEventListener(DB_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    dbEventTarget.removeEventListener(DB_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

// Global initialization: cleans legacy local storage and loads real Firestore data
let isInitialized = false;

export async function initializeDatabase(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  try {
    // Purge legacy local mock cache keys if present
    LEGACY_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    });

    // Fetch genuine data from Firestore
    await Promise.allSettled([
      fetchCategories(),
      fetchCourses(true),
      fetchAssessments(),
      fetchStudents(),
      fetchAttempts(),
      fetchAuditLogs(),
    ]);

    notifyDbChange();
  } catch (err) {
    console.warn('Database initialization warning:', err);
  }
}
