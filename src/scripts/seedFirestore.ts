import { doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  INITIAL_CATEGORIES,
  INITIAL_COURSES,
  INITIAL_ASSESSMENTS,
  INITIAL_STUDENTS,
  INITIAL_ATTEMPTS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';

export async function seedFirestoreDatabase(force = false): Promise<{ success: boolean; message: string }> {
  try {
    // Check if already seeded
    const markerDoc = await getDoc(doc(db, 'system', 'seed_status'));
    if (markerDoc.exists() && !force) {
      return { success: true, message: 'Database is already seeded with initial data.' };
    }

    const batch = writeBatch(db);

    // 1. Categories
    for (const cat of INITIAL_CATEGORIES) {
      batch.set(doc(db, 'categories', cat.id), cat, { merge: true });
    }

    // 2. Courses
    for (const course of INITIAL_COURSES) {
      batch.set(doc(db, 'courses', course.id), course, { merge: true });
    }

    // 3. Assessments
    for (const asm of INITIAL_ASSESSMENTS) {
      batch.set(doc(db, 'assessments', asm.id), asm, { merge: true });
    }

    // 4. Students
    for (const std of INITIAL_STUDENTS) {
      batch.set(doc(db, 'students', std.id), std, { merge: true });
    }

    // 5. Attempts
    for (const att of INITIAL_ATTEMPTS) {
      batch.set(doc(db, 'attempts', att.id), att, { merge: true });
    }

    // 6. Audit Logs
    for (const log of INITIAL_AUDIT_LOGS) {
      batch.set(doc(db, 'auditLogs', log.id), log, { merge: true });
    }

    // Set seed status marker
    batch.set(doc(db, 'system', 'seed_status'), {
      seededAt: new Date().toISOString(),
      version: '1.0.0',
    });

    await batch.commit();
    return { success: true, message: 'Firestore successfully populated with seed data!' };
  } catch (error: any) {
    console.error('Seed error:', error);
    return { success: false, message: error.message || 'Unknown error occurred while seeding.' };
  }
}
