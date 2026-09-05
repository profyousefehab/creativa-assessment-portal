import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

export interface CoordinatorUser {
  id: string;
  email: string;
  name: string;
  role: 'COORDINATOR';
}

export function mapFirebaseUser(user: User | null): CoordinatorUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email || '',
    name: user.displayName || (user.email ? user.email.split('@')[0] : 'Coordinator'),
    role: 'COORDINATOR',
  };
}

export function getCoordinatorSession(): CoordinatorUser | null {
  return mapFirebaseUser(auth.currentUser);
}

export async function loginCoordinator(email: string, pass: string): Promise<CoordinatorUser> {
  const cleanEmail = email.trim();
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = mapFirebaseUser(cred.user);
    if (!user) throw new Error('Authentication failed');
    return user;
  } catch (err: any) {
    if (err?.message?.includes('CONFIGURATION_NOT_FOUND') || err?.code === 'auth/configuration-not-found') {
      throw new Error('Firebase Email/Password authentication is not enabled yet. Please enable it in the Firebase Console under Authentication > Sign-in method.');
    }
    // If user not found or first-time setup, auto-create account in Firebase Auth
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/invalid-email'
    ) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        const user = mapFirebaseUser(cred.user);
        if (user) return user;
      } catch (createErr: any) {
        if (createErr?.message?.includes('CONFIGURATION_NOT_FOUND') || createErr?.code === 'auth/configuration-not-found') {
          throw new Error('Firebase Email/Password authentication is not enabled yet. Please enable it in the Firebase Console under Authentication > Sign-in method.');
        }
        throw new Error(createErr.message || err.message);
      }
    }
    throw err;
  }
}

export async function logoutCoordinator(): Promise<void> {
  await signOut(auth);
}

import { syncAllToFirestore } from './syncService';

export function subscribeToAuth(callback: (user: CoordinatorUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    const mapped = mapFirebaseUser(user);
    if (mapped) {
      syncAllToFirestore().catch((err) => console.warn('Auto-sync error on auth:', err));
    }
    callback(mapped);
  });
}
