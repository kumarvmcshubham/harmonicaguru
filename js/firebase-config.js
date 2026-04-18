// js/firebase-config.js
// HarmonicaGuru — Firebase Configuration
// This file initialises Firebase and exports the services we need

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAl-lH3ODJgb05v_g6sC3YA6m5SMePY7Tc",
  authDomain: "harmonicaguru-1ca81.firebaseapp.com",
  projectId: "harmonicaguru-1ca81",
  storageBucket: "harmonicaguru-1ca81.firebasestorage.app",
  messagingSenderId: "603614747036",
  appId: "1:603614747036:web:f4b3009af8f13925f4d059"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Export the services we'll use across the app
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);