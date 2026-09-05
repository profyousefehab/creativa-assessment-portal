// Reactive database event bus and local persistence cache
export const DB_CHANGE_EVENT = 'creativa_db_change';
const dbEventTarget = new EventTarget();

export function notifyDbChange(): void {
  try {
    dbEventTarget.dispatchEvent(new Event(DB_CHANGE_EVENT));
  } catch (err) {
    console.warn('notifyDbChange dispatch error:', err);
  }
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

export function loadLocalCache<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
      return fallback;
    }
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveLocalCache<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') {
      return;
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`saveLocalCache error for key "${key}":`, err);
  }
}

