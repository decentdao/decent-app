/* eslint-disable import/no-extraneous-dependencies */
import { FirebaseApp, initializeApp } from 'firebase/app';
import { logError } from '../helpers/errorLogging';

let firebaseApp: FirebaseApp | undefined;

try {
  // If Firebase settings are not set, it should run without initializing Firebase and not throw an error
  if (import.meta.env.VITE_APP_FIREBASE_CONFIG) {
    firebaseApp = initializeApp(JSON.parse(import.meta.env.VITE_APP_FIREBASE_CONFIG));
  }
} catch (error) {
  logError('Error in Firebase initialization:', error);
}

export { firebaseApp };
