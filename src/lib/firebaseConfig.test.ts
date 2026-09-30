import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveFirebaseConfig, FirebaseConfigError } from './firebaseConfig.ts';

const configPath = path.resolve(import.meta.dirname, '../../firebase-applet-config.json');
const rawConfig = fs.readFileSync(configPath, 'utf8');
const fileConfig = JSON.parse(rawConfig);

test('committed firebase-applet-config.json does not contain a Google API key', () => {
  assert.equal(fileConfig.apiKey, '');
  assert.doesNotMatch(rawConfig, /AIza[0-9A-Za-z_-]{20,}/);
});

test('throws a descriptive error when VITE_FIREBASE_API_KEY is missing', () => {
  assert.throws(
    () => resolveFirebaseConfig(fileConfig, {}),
    (err: unknown) =>
      err instanceof FirebaseConfigError &&
      err.missingKeys.includes('apiKey') &&
      err.message.includes('VITE_FIREBASE_API_KEY')
  );
  assert.throws(
    () => resolveFirebaseConfig(fileConfig, { VITE_FIREBASE_API_KEY: '   ' }),
    FirebaseConfigError
  );
});

test('uses VITE_FIREBASE_API_KEY and preserves non-sensitive fields from the JSON file', () => {
  const config = resolveFirebaseConfig(fileConfig, { VITE_FIREBASE_API_KEY: 'test-browser-key' });
  assert.equal(config.apiKey, 'test-browser-key');
  assert.equal(config.projectId, fileConfig.projectId);
  assert.equal(config.appId, fileConfig.appId);
  assert.equal(config.authDomain, fileConfig.authDomain);
  assert.equal(config.firestoreDatabaseId, fileConfig.firestoreDatabaseId);
  assert.equal(config.storageBucket, fileConfig.storageBucket);
  assert.equal(config.messagingSenderId, fileConfig.messagingSenderId);
});

test('optional VITE_FIREBASE_* variables override JSON values', () => {
  const config = resolveFirebaseConfig(fileConfig, {
    VITE_FIREBASE_API_KEY: 'test-browser-key',
    VITE_FIREBASE_PROJECT_ID: 'other-project',
  });
  assert.equal(config.projectId, 'other-project');
});

test('reports every missing required field', () => {
  assert.throws(
    () => resolveFirebaseConfig({}, {}),
    (err: unknown) =>
      err instanceof FirebaseConfigError &&
      ['apiKey', 'authDomain', 'projectId', 'appId'].every((k) => err.missingKeys.includes(k))
  );
});
