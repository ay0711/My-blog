import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDoTsAuEjk9f9B8lDwhe5tnKEZgTBqI8fU",
  authDomain: "blog-d852d.firebaseapp.com",
  projectId: "blog-d852d",
  storageBucket: "blog-d852d.firebasestorage.app",
  messagingSenderId: "339850237054",
  appId: "1:339850237054:web:baa233ea36ef0d6668b42f",
  measurementId: "G-P10XP4LXVB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Provider with custom parameters
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account', // Force account selection to avoid token issues
});
