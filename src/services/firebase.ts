import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// User provided configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6QAFUvIcdYSWy-i-zv0vsZOdFstUR94M",
  authDomain: "tournamenttracker-app.firebaseapp.com",
  projectId: "tournamenttracker-app",
  storageBucket: "tournamenttracker-app.firebasestorage.app",
  messagingSenderId: "160118226615",
  appId: "1:160118226615:web:57ab3e524d0b3a1f255732"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
