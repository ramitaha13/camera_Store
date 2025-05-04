// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // For Firestore
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbJEfUq2h76F-Sov9OI-Q8jVICxuYSaU8",
  authDomain: "camerastore-cf5c8.firebaseapp.com",
  projectId: "camerastore-cf5c8",
  storageBucket: "camerastore-cf5c8.firebasestorage.app",
  messagingSenderId: "676491591726",
  appId: "1:676491591726:web:65faa16c5259eb64e4dfbf",
  measurementId: "G-01B7NFZWCL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export { app, firestore };
