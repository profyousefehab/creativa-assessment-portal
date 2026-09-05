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
import { notifyDbChange, saveLocalCache, loadLocalCache } from './dbEvents';

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
      cachedCategories = snap.docs.map((d) => d.data() as Category);
      saveLocalCache(STORAGE_KEY, cachedCategories);
      notifyDbChange();
    } else if (cachedCategories.length > 0) {
      // Seed default categories into Firestore if empty
      cachedCategories.forEach((cat) => {
        setDoc(doc(db, COLLECTION, cat.id), cat).catch(() => {});
      });
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
  saveLocalCache(STORAGE_KEY, cachedCategories);
  notifyDbChange();

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

