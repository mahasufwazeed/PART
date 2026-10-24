import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function getEnvValue(key: string): string {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch {}

  return '';
}

export function getFirebaseConfig(): FirebaseConfig {
  return {
    apiKey:
      getEnvValue('VITE_FIREBASE_API_KEY') ||
      getEnvValue('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain:
      getEnvValue('VITE_FIREBASE_AUTH_DOMAIN') ||
      getEnvValue('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId:
      getEnvValue('VITE_FIREBASE_PROJECT_ID') ||
      getEnvValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket:
      getEnvValue('VITE_FIREBASE_STORAGE_BUCKET') ||
      getEnvValue('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId:
      getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID') ||
      getEnvValue('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId:
      getEnvValue('VITE_FIREBASE_APP_ID') ||
      getEnvValue('NEXT_PUBLIC_FIREBASE_APP_ID'),
  };
}

export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId && config.appId);
}

export function getMissingFirebaseKeys(): string[] {
  const config = getFirebaseConfig();
  const missing: string[] = [];
  if (!config.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!config.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!config.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!config.storageBucket) missing.push('VITE_FIREBASE_STORAGE_BUCKET');
  if (!config.messagingSenderId) missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  if (!config.appId) missing.push('VITE_FIREBASE_APP_ID');
  return missing;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured()) {
  try {
    if (!getApps().length) {
      app = initializeApp(getFirebaseConfig());
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.warn('Firebase initialization error:', error);
  }
}

export { app, auth, db, googleProvider };
