import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Category } from '../types';

const COLLECTION = 'categories';
let cachedCategories: Category[] = [];

export function getCategories(): Category[] {
  return cachedCategories;
}

export const getCachedCategories = getCategories;

export async function fetchCategories(): Promise<Category[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      cachedCategories = snap.docs.map((d) => d.data() as Category);
    }
  } catch (err) {
    console.warn('Failed to fetch categories from Firestore:', err);
  }
  return cachedCategories;
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

  setDoc(doc(db, COLLECTION, newCat.id), newCat).catch((err) => {
    console.error('Firestore createCategory error:', err);
  });

  return newCat;
}

export function subscribeToCategories(callback: (categories: Category[]) => void): () => void {
  const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        cachedCategories = snap.docs.map((d) => d.data() as Category);
      }
      callback(cachedCategories);
    },
    (err) => {
      console.warn('subscribeToCategories listener error:', err);
      callback(cachedCategories);
    }
  );
}
