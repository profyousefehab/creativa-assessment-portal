import { useEffect, useState } from 'react';
import {
  collection,
  query,
  onSnapshot,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../services/firebase';

interface UseFirestoreQueryResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useFirestoreQuery<T = DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): UseFirestoreQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as unknown as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore query error on ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading, error };
}
