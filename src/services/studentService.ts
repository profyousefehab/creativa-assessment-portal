import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Student } from '../types';
import { notifyDbChange, saveLocalCache, loadLocalCache } from './dbEvents';

const COLLECTION = 'students';
const STORAGE_KEY = 'creativa_students_cache';

let cachedStudents: Student[] = loadLocalCache<Student[]>(STORAGE_KEY, []);

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

export async function findStudentByNationalId(nationalId: string): Promise<Student | null> {
  const trimmed = nationalId.trim();
  if (!trimmed) return null;

  // 1. Check local cache
  const local = cachedStudents.find((s) => s.nationalId === trimmed);
  if (local) return local;

  // 2. Query Cloud Firestore
  try {
    const q = query(collection(db, COLLECTION), where('nationalId', '==', trimmed));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const student = snap.docs[0].data() as Student;
      if (!cachedStudents.some((s) => s.id === student.id)) {
        cachedStudents.push(student);
        saveLocalCache(STORAGE_KEY, cachedStudents);
        notifyDbChange();
      }
      return student;
    }
  } catch (err) {
    console.warn('findStudentByNationalId Firestore error:', err);
  }

  return null;
}

export async function fetchStudents(): Promise<Student[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    if (!snap.empty) {
      const remoteDocs = snap.docs.map((d) => d.data() as Student);
      const remoteIds = new Set(remoteDocs.map((s) => s.id));
      const localOnly = cachedStudents.filter((s) => !remoteIds.has(s.id));
      cachedStudents = [...remoteDocs, ...localOnly];
      saveLocalCache(STORAGE_KEY, cachedStudents);
      notifyDbChange();
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

  // Create new student with deterministic ID based on national ID
  const newStudent: Student = {
    id: `std_${nationalId}`,
    nationalId,
    fullName,
    phone,
    email,
    createdAt: new Date().toISOString(),
  };

  cachedStudents.push(newStudent);
  saveLocalCache(STORAGE_KEY, cachedStudents);
  notifyDbChange();

  setDoc(doc(db, COLLECTION, newStudent.id), newStudent).catch((err) => {
    console.error('Firestore create student error:', err);
  });

  return { student: newStudent, error: null };
}

export async function verifyOrCreateStudentAsync(data: {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
}): Promise<{ student: Student | null; error: string | null }> {
  const nationalId = data.nationalId.trim();
  const fullName = data.fullName.trim();
  const phone = data.phone.trim();
  const email = data.email.trim().toLowerCase();

  if (!nationalId || !fullName || !phone || !email) {
    return { student: null, error: 'All fields (Full Name, Phone, Email, National ID) are required.' };
  }

  // Query Firestore if not present in memory cache
  const existing = await findStudentByNationalId(nationalId);

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

  // Create new student with deterministic ID based on national ID
  const newStudent: Student = {
    id: `std_${nationalId}`,
    nationalId,
    fullName,
    phone,
    email,
    createdAt: new Date().toISOString(),
  };

  if (!cachedStudents.some((s) => s.id === newStudent.id)) {
    cachedStudents.push(newStudent);
    saveLocalCache(STORAGE_KEY, cachedStudents);
    notifyDbChange();
  }

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
