import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtudvdGbEpreISGo5-28ezY6wjzvSyM38",
  authDomain: "medx-fa930.firebaseapp.com",
  projectId: "medx-fa930",
  storageBucket: "medx-fa930.appspot.com",
  messagingSenderId: "630532621536",
  appId: "1:630532621536:web:72ab448999f2c6ebbcbc85",
  measurementId: "G-8XT4CGD1PF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
