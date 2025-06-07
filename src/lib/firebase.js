// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAD8iytkA-YXpGC7sbQPs5QcfPf4FEjfMU",
  authDomain: "mygpa-app.firebaseapp.com",
  projectId: "mygpa-app",
  storageBucket: "mygpa-app.firebasestorage.app",
  messagingSenderId: "457361752297",
  appId: "1:457361752297:web:82e4b4269c5ed01bdaf078"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;