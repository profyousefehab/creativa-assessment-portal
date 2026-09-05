import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Category } from '../types';
import { notifyDbChange, saveLocalCache, loadLocalCache } from './dbEvents';
import { getCourses } from './courseService';

const COLLECTION = 'categories';
const STORAGE_KEY = 'creativa_categories_cache';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_web_dev', name: 'Web Development', createdAt: new Date().toISOString() },
  { id: 'cat_ai_data', name: 'AI & Data Science', createdAt: new Date().toISOString() },
  { id: 'cat_mobile_dev', name: 'Mobile App Development', createdAt: new Date().toISOString() },
  { id: 'cat_cyber_sec', name: 'Cybersecurity & Networks', createdAt: new Date().toISOString() },
  { id: 'cat_digital_mkt', name: 'Digital Marketing & Business', createdAt: new Date().toISOString() },
];

let cachedCategories: Category[] = loadLocalCache<Category[]>(STORAGE_KEY, DEFAULT_CATEGORIES);

export function getCategories(): Category[] {
  return cachedCategories;
}

export const getCachedCategories = getCategories;

export async function fetchCategories(): Promise<Category[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const remoteDocs = snap.docs.map((d) => d.data() as Category);
      const remoteIds = new Set(remoteDocs.map((c) => c.id));
      const localOnly = cachedCategories.filter((c) => !remoteIds.has(c.id));
      cachedCategories = [...remoteDocs, ...localOnly];
      saveLocalCache(STORAGE_KEY, cachedCategories);
      notifyDbChange();
    }
  } catch (err) {
    console.warn('Failed to fetch categories from Firestore:', err);
  }
  return cachedCategories;
}

export async function syncCategoriesToFirestore(): Promise<number> {
  let synced = 0;
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    const remoteIds = new Set(snap.docs.map((d) => d.id));
    for (const cat of cachedCategories) {
      if (!remoteIds.has(cat.id)) {
        await setDoc(doc(db, COLLECTION, cat.id), cat, { merge: true });
        synced++;
      }
    }
  } catch (err) {
    console.warn('syncCategoriesToFirestore error:', err);
  }
  return synced;
}

export function createCategory(name: string): Category {
  const trimmed = name.trim();
  const existing = cachedCategories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const newCat: Category = {
    id: 'cat_' + Date.now(),
    name: trimmed,
    createdAt: new Date().toISOString(),
  };

  cachedCategories.push(newCat);
  saveLocalCache(STORAGE_KEY, cachedCategories);
  notifyDbChange();

  setDoc(doc(db, COLLECTION, newCat.id), newCat).catch((err) => {
    console.error('Firestore createCategory error:', err);
  });

  return newCat;
}

export function deleteCategory(id: string): { success: boolean; error?: string } {
  const cat = cachedCategories.find((c) => c.id === id);
  if (!cat) {
    return { success: false, error: 'Category not found.' };
  }

  // Safety check: verify no courses are currently using this category
  const assignedCourses = getCourses(true).filter((c) => c.categoryId === id);
  if (assignedCourses.length > 0) {
    return {
      success: false,
      error: `Cannot delete "${cat.name}" because it is currently assigned to ${assignedCourses.length} course(s). Please reassign or delete those courses first.`,
    };
  }

  cachedCategories = cachedCategories.filter((c) => c.id !== id);
  saveLocalCache(STORAGE_KEY, cachedCategories);
  notifyDbChange();

  deleteDoc(doc(db, COLLECTION, id)).catch((err) => {
    console.error('Firestore deleteCategory error:', err);
  });

  return { success: true };
}

export function subscribeToCategories(callback: (categories: Category[]) => void): () => void {
  const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        const remoteDocs = snap.docs.map((d) => d.data() as Category);
        const remoteIds = new Set(remoteDocs.map((c) => c.id));
        const localOnly = cachedCategories.filter((c) => !remoteIds.has(c.id));
        cachedCategories = [...remoteDocs, ...localOnly];
        saveLocalCache(STORAGE_KEY, cachedCategories);
      }
      callback(cachedCategories);
      notifyDbChange();
    },
    (err) => {
      console.warn('subscribeToCategories listener error:', err);
      callback(cachedCategories);
    }
  );
}


