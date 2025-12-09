import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDWDiF-AwGEtMqYsSKzRVr_ZBb1SLwAkxk",
    authDomain: "dreamtells-sonhos.firebaseapp.com",
    projectId: "dreamtells-sonhos",
    storageBucket: "dreamtells-sonhos.firebasestorage.app",
    messagingSenderId: "28214150046",
    appId: "1:28214150046:web:31ff1e27294091c9470c8f",
    measurementId: "G-SVNS348DW2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
