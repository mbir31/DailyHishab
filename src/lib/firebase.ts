import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID
const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);

export { doc, setDoc, getDoc, deleteDoc, collection, getDocs };
