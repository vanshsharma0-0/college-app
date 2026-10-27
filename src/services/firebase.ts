import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDEVaBxXkrDnG49pFWFK4gVv-HwL85i5tI",
  authDomain: "homeworks-b03f8.firebaseapp.com",
  projectId: "homeworks-b03f8",
  storageBucket: "homeworks-b03f8.appspot.com",
  messagingSenderId: "210759358485",
  appId: "1:210759358485:web:e2877a0bc8cdfc6c9161c",
  measurementId: "G-1E11PF3RQM",
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
