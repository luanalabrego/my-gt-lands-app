// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDs-LxfVF_Zdk49PVFVv8w5EihEzuR8X64",
  authDomain: "gt-lands-app.firebaseapp.com",
  projectId: "gt-lands-app",
  storageBucket: "gt-lands-app.firebasestorage.app",
  messagingSenderId: "31066480457",
  appId: "1:31066480457:web:4f092b8d646c21221b8498",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
