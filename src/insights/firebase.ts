import { FirebaseApp, initializeApp } from 'firebase/app';
import { logError } from '../helpers/errorLogging';

let firebaseApp: FirebaseApp | undefined;

try {
  // If Firebase settings are not set, it should run without initializing Firebase and not throw an error
  if (
    import.meta.env.REACT_APP_FIREBASE_API_KEY &&
    import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.REACT_APP_FIREBASE_PROJECT_ID &&
    import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET &&
    import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID &&
    import.meta.env.REACT_APP_FIREBASE_APP_ID
  ) {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_APP_FIREBASE_APIKEY,
      authDomain: import.meta.env.VITE_APP_FIREBASE_AUTHDOMAIN,
      projectId: import.meta.env.VITE_APP_FIREBASE_PROJECTID,
      storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGEBUCKET,
      messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGINGSENDERID,
      appId: import.meta.env.VITE_APP_FIREBASE_APPID,
      measurementId: import.meta.env.VITE_APP_FIREBASE_MEASUREMENTID,
    };

    firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : undefined;
  }
} catch (error) {
  logError('Error in Firebase initialization:', error);
}

export { firebaseApp };
