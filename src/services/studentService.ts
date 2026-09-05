import {
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Student } from '../types';

const COLLECTION = 'students';
let cachedStudents: Student[] = [];

export function getStudents(): Student[] {
  return cachedStudents;
}

export const getCachedStudents = getStudents;

export function getStudentById(id: string): Student | null {
  return cachedStudents.find((s) => s.id === id) || null;
}

export function getStudentByNationalId(nationalId: string): Student | null {
  const trimmed = nationalId.trim();
  return cachedStudents.find((s) => s.nationalId === trimmed) || null;
}

export async function fetchStudents(): Promise<Student[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    if (!snap.empty) {
      cachedStudents = snap.docs.map((d) => d.data() as Student);
    }
  } catch (err) {
    console.warn('Failed to fetch students from Firestore:', err);
  }
  return cachedStudents;
}

export function verifyOrCreateStudent(data: {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
}): { student: Student | null; error: string | null } {
  const nationalId = data.nationalId.trim();
  const fullName = data.fullName.trim();
  const phone = data.phone.trim();
  const email = data.email.trim().toLowerCase();

  if (!nationalId || !fullName || !phone || !email) {
    return { student: null, error: 'All fields (Full Name, Phone, Email, National ID) are required.' };
  }

  const existing = cachedStudents.find((s) => s.nationalId === nationalId);

  if (existing) {
    const nameMatches = existing.fullName.toLowerCase() === fullName.toLowerCase();
    const phoneMatches = existing.phone === phone;
    const emailMatches = existing.email.toLowerCase() === email;

    if (nameMatches && phoneMatches && emailMatches) {
      return { student: existing, error: null };
    }

    const mismatches: string[] = [];
    if (!nameMatches) mismatches.push('Name');
    if (!phoneMatches) mismatches.push('Phone Number');
    if (!emailMatches) mismatches.push('Email');

    return {
      student: null,
      error: `Identity Verification Failed: The provided National ID is already registered, but the ${mismatches.join(' and ')} do not match our verified records.`,
    };
  }

  // Create new student
  const newStudent: Student = {
    id: 'std_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    nationalId,
    fullName,
    phone,
    email,
    createdAt: new Date().toISOString(),
  };

  cachedStudents.push(newStudent);

  setDoc(doc(db, COLLECTION, newStudent.id), newStudent).catch((err) => {
    console.error('Firestore create student error:', err);
  });

  return { student: newStudent, error: null };
}

export function createOrUpdateStudent(data: {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
}): Student {
  const res = verifyOrCreateStudent(data);
  if (res.student) return res.student;
  throw new Error(res.error || 'Failed to verify or register student');
}
