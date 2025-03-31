/* eslint-disable import/no-extraneous-dependencies */
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getRemoteConfig } from 'firebase/remote-config';
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

const remoteConfig = firebaseApp ? getRemoteConfig(firebaseApp) : undefined;
// Set a VITE_APP_FIREBASE_TIME_INTERVALS value for testing
const firebaseTimeIntervals = import.meta.env.VITE_APP_FIREBASE_TIME_INTERVALS;
if (remoteConfig && firebaseTimeIntervals) {
  remoteConfig.settings = {
    minimumFetchIntervalMillis: firebaseTimeIntervals,
    fetchTimeoutMillis: firebaseTimeIntervals,
  };
}

export { remoteConfig };
