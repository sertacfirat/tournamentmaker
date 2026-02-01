import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// User provided configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuyRJ5gDLW5ITe_FiEiStzjTgZr00UocI",
  authDomain: "torunamenttracker.firebaseapp.com",
  projectId: "torunamenttracker",
  storageBucket: "torunamenttracker.firebasestorage.app",
  messagingSenderId: "211238799177",
  appId: "1:211238799177:web:09ed7b126feed47fd77c98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
