/**
 * Firebase web configuration resolution.
 *
 * Non-sensitive identifiers (projectId, appId, authDomain, firestoreDatabaseId, ...)
 * live in `firebase-applet-config.json`. The Firebase browser API key is NOT committed:
 * it is supplied at build time via `VITE_FIREBASE_API_KEY`. Optional `VITE_FIREBASE_*`
 * variables override the corresponding values from the JSON file.
 *
 * Only `VITE_`-prefixed variables are exposed to the browser bundle. Server-side secrets
 * such as `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` must never use the `VITE_` prefix.
 */

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
  [key: string]: unknown;
}

export type FirebaseEnv = Record<string, string | boolean | undefined>;

const ENV_OVERRIDES: Record<string, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  firestoreDatabaseId: 'VITE_FIREBASE_FIRESTORE_DATABASE_ID',
};

const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;

export class FirebaseConfigError extends Error {
  constructor(public readonly missingKeys: string[]) {
    super(
      `Firebase web configuration is incomplete. Missing: ${missingKeys
        .map((key) => ENV_OVERRIDES[key] || key)
        .join(', ')}. Set these at build time (e.g. in .env for local development). ` +
        'See README "Environment Configuration".'
    );
    this.name = 'FirebaseConfigError';
  }
}

export function resolveFirebaseConfig(
  fileConfig: Record<string, unknown>,
  env: FirebaseEnv
): FirebaseWebConfig {
  const config: Record<string, unknown> = { ...fileConfig };
  for (const [key, envName] of Object.entries(ENV_OVERRIDES)) {
    const value = env[envName];
    if (typeof value === 'string' && value.trim() !== '') {
      config[key] = value.trim();
    }
  }

  const missing = REQUIRED_KEYS.filter(
    (key) => typeof config[key] !== 'string' || (config[key] as string).trim() === ''
  );
  if (missing.length > 0) {
    throw new FirebaseConfigError([...missing]);
  }

  return config as FirebaseWebConfig;
}
