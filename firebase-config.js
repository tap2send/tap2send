// Firebase SDK v9 Modular

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQMbfvjHV-1I3UEHt3asuEBNOO2Qh3RFA",
  authDomain: "tap2send-8e72d.firebaseapp.com",
  projectId: "tap2send-8e72d",
  storageBucket: "tap2send-8e72d.firebasestorage.app",
  messagingSenderId: "572191430506",
  appId: "1:572191430506:web:3100a351c4be63fbf6b713"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
