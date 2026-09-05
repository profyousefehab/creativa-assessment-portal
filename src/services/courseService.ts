import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Course } from '../types';
import { createAssessmentForCourse } from './assessmentService';
import { logAuditAction } from './auditService';

const COLLECTION = 'courses';
let cachedCourses: Course[] = [];

export function getCourses(includeArchived = false): Course[] {
  if (includeArchived) return cachedCourses;
  return cachedCourses.filter((c) => !c.isArchived);
}

export const getCachedCourses = getCourses;

export function getArchivedCourses(): Course[] {
  return cachedCourses.filter((c) => c.isArchived);
}

export function getCourseById(id: string): Course | null {
  return cachedCourses.find((c) => c.id === id) || null;
}

export async function fetchCourses(includeArchived = false): Promise<Course[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      cachedCourses = snap.docs.map((d) => d.data() as Course);
    }
  } catch (err) {
    console.warn('Failed to fetch courses from Firestore:', err);
  }

  return getCourses(includeArchived);
}

export function createCourse(data: {
  name: string;
  instructorName: string;
  categoryId: string;
  startDate: string;
  endDate: string;
}): Course {
  const newCourse: Course = {
    id: 'course_' + Date.now(),
    name: data.name.trim(),
    instructorName: data.instructorName.trim(),
    categoryId: data.categoryId,
    startDate: data.startDate,
    endDate: data.endDate,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cachedCourses.unshift(newCourse);

  setDoc(doc(db, COLLECTION, newCourse.id), newCourse).catch((err) => {
    console.error('Firestore createCourse error:', err);
  });

  // Automatically create the 1 Pre-Test and 1 Post-Test for this course
  createAssessmentForCourse(newCourse.id, 'PRE_TEST');
  createAssessmentForCourse(newCourse.id, 'POST_TEST');

  logAuditAction('COURSE_CREATED', 'Course', newCourse.id, { name: newCourse.name });
  return newCourse;
}

export function updateCourse(
  id: string,
  data: Partial<Omit<Course, 'id' | 'isArchived'>>
): Course | null {
  const course = cachedCourses.find((c) => c.id === id);
  const updatedAt = new Date().toISOString();

  if (course) {
    Object.assign(course, data, { updatedAt });
  }

  updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt,
  }).catch((err) => {
    console.error('Firestore updateCourse error:', err);
  });

  logAuditAction('COURSE_EDITED', 'Course', id, data);
  return course || null;
}

export function archiveCourse(id: string): boolean {
  const course = cachedCourses.find((c) => c.id === id);
  const updatedAt = new Date().toISOString();
  const archivedAt = updatedAt;

  if (course) {
    course.isArchived = true;
    course.archivedAt = archivedAt;
    course.updatedAt = updatedAt;
  }

  updateDoc(doc(db, COLLECTION, id), {
    isArchived: true,
    archivedAt,
    updatedAt,
  }).catch((err) => {
    console.error('Firestore archiveCourse error:', err);
  });

  logAuditAction('COURSE_ARCHIVED', 'Course', id, { name: course?.name });
  return true;
}

export function restoreCourse(id: string): boolean {
  const course = cachedCourses.find((c) => c.id === id);
  const updatedAt = new Date().toISOString();

  if (course) {
    course.isArchived = false;
    course.archivedAt = undefined;
    course.updatedAt = updatedAt;
  }

  updateDoc(doc(db, COLLECTION, id), {
    isArchived: false,
    archivedAt: null,
    updatedAt,
  }).catch((err) => {
    console.error('Firestore restoreCourse error:', err);
  });

  logAuditAction('COURSE_RESTORED', 'Course', id, { name: course?.name });
  return true;
}

export function subscribeToCourses(
  callback: (courses: Course[]) => void,
  includeArchived = false
): () => void {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        cachedCourses = snap.docs.map((d) => d.data() as Course);
      }
      callback(includeArchived ? cachedCourses : cachedCourses.filter((c) => !c.isArchived));
    },
    (err) => {
      console.warn('subscribeToCourses listener error:', err);
      callback(includeArchived ? cachedCourses : cachedCourses.filter((c) => !c.isArchived));
    }
  );
}
