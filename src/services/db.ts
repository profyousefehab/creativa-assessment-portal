// Master Database & Services Integration Module
// Connects UI components to Firebase Services and live Firestore data

export * from './firebase';
export * from './auth';
export * from './dbEvents';
export * from './categoryService';
export * from './courseService';
export * from './assessmentService';
export * from './studentService';
export * from './attemptService';
export * from './gradingService';
export * from './analyticsService';
export * from './auditService';
export * from './syncService';
export { clearAllFirestoreData } from '../scripts/clearFirestore';

import { fetchCourses, subscribeToCourses } from './courseService';
import { fetchAssessments, subscribeToAssessments } from './assessmentService';
import { fetchStudents } from './studentService';
import { fetchAttempts } from './attemptService';
import { fetchCategories, subscribeToCategories } from './categoryService';
import { fetchAuditLogs } from './auditService';
import { notifyDbChange } from './dbEvents';

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

// Global initialization: cleans legacy local storage, initializes cache, and connects realtime listeners
let isInitialized = false;

export async function initializeDatabase(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  try {
    // Purge obsolete legacy mock keys
    LEGACY_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    });

    // Wire realtime listeners to keep data in sync automatically
    subscribeToCategories(() => {});
    subscribeToCourses(() => {}, true);
    subscribeToAssessments(() => {});

    // Initial fetch from Firestore
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

