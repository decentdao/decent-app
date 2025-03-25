import { initializeApp } from 'firebase/app';

const firebaseConfig = import.meta.env.VITE_APP_FIREBASE_CONFIG;

export const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : undefined;
