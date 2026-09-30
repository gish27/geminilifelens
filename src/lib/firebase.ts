import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseFileConfig from '../../firebase-applet-config.json';
import { resolveFirebaseConfig } from './firebaseConfig';
import {
  type Interaction,
  type FirestoreErrorInfo,
  type AuthErrorDetail,
  OperationType,
} from '../types';

// Resolve Firebase web config: non-sensitive fields from JSON, browser API key from VITE_FIREBASE_API_KEY
const firebaseConfig = resolveFirebaseConfig(firebaseFileConfig, import.meta.env);

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with custom database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  display: 'popup',
});

/**
 * Standardized Firestore error handler adhering to skill directives.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Strips all undefined fields before sending objects to Firestore drivers.
 */
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (v === undefined ? null : v))
  );
}

/**
 * Validate connection to Firestore. Only attempts connection if a user is authenticated
 * to avoid triggering unauthenticated connection warnings or security rule rejections.
 */
export async function testConnection(): Promise<boolean> {
  if (!auth.currentUser) {
    return false;
  }
  try {
    const userDocRef = doc(db, 'users', auth.currentUser.uid, 'interactions', '_ping');
    await getDocFromServer(userDocRef);
    return true;
  } catch (error: any) {
    // Non-existent document is expected and means the server responded
    if (error?.code === 'not-found') {
      return true;
    }
    return false;
  }
}

/**
 * Parse Firebase Auth errors into actionable, user-friendly details.
 */
export function parseAuthError(error: unknown): AuthErrorDetail {
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
    return {
      code: 'auth/popup-blocked',
      title: 'Google Sign-In Pop-up Blocked',
      message:
        'Your browser prevented the authentication pop-up window from opening. This commonly occurs when running in an embedded preview frame.',
      isPopupBlocked: true,
      suggestion:
        'Please allow pop-ups for this site in your browser address bar, open the application in a new browser tab, or try again directly.',
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      code: 'auth/popup-closed-by-user',
      title: 'Sign-In Cancelled',
      message: 'The sign-in window was closed before completing authentication.',
      isPopupBlocked: false,
      suggestion: 'Click Sign In with Google whenever you are ready.',
    };
  }

  if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
    return {
      code: 'auth/unauthorized-domain',
      title: 'Domain Not Authorized',
      message: 'This domain is not yet authorized in Firebase Console.',
      isPopupBlocked: false,
      suggestion:
        'Add this domain to Firebase Console > Authentication > Settings > Authorized domains.',
    };
  }

  return {
    code: code || 'auth/unknown',
    title: 'Authentication Issue',
    message: msg || 'An unexpected error occurred during authentication.',
    isPopupBlocked: false,
    suggestion: 'Please try again or check your network connection.',
  };
}

/**
 * Sign in using Google Auth Popup.
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign In failed:', error);
    throw error;
  }
}

/**
 * Sign out current authenticated user.
 */
export async function logOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign Out failed:', error);
    throw error;
  }
}

/**
 * Save or update an interaction document under the user's isolated subcollection:
 * /users/{userId}/interactions/{interactionId}
 */
export async function saveInteraction(
  userId: string,
  interaction: Interaction
): Promise<void> {
  const path = `users/${userId}/interactions/${interaction.id}`;
  try {
    const cleanData = sanitizePayload({
      ...interaction,
      userId,
      updatedAt: new Date().toISOString(),
    });
    const docRef = doc(db, 'users', userId, 'interactions', interaction.id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete an interaction document under the user's isolated subcollection.
 */
export async function deleteInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  const path = `users/${userId}/interactions/${interactionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'interactions', interactionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe in real-time to the current user's interactions collection.
 */
export function subscribeToUserInteractions(
  userId: string,
  onUpdate: (interactions: Interaction[]) => void,
  onError: (error: Error) => void
): () => void {
  const collectionPath = `users/${userId}/interactions`;
  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: Interaction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Interaction);
      });
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (err: any) {
        onError(err);
      }
    }
  );

  return unsubscribe;
}
