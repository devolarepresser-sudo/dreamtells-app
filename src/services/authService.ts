import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential,
    sendPasswordResetEmail,
} from "firebase/auth";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User } from "../types";

const DEV_FORCE_PREMIUM_KEY = "devForcePremium";

// Helper function to check trial expiration
const checkTrialExpiration = (user: User): User => {
    const plan = String((user as any).plan ?? "free");

    // Master users always have premium
    if (plan === "master") {
        user.isPremium = true;
        user.isTrialActive = false;
        return user;
    }

    // Check if trial is active and not expired
    if (user.isTrialActive && user.trialEnd) {
        const now = new Date();
        const trialEndDate = new Date(user.trialEnd);

        if (now > trialEndDate) {
            // Trial expired
            user.isTrialActive = false;
            user.isPremium = plan === "premium";
        } else {
            // Trial still active
            user.isPremium = true;
        }
    } else {
        // No active trial, check plan
        user.isPremium = plan === "premium";
    }

    return user;
};

export const authService = {
    resetPassword: async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    },

    register: async (email: string, password: string, name: string): Promise<User> => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, { displayName: name });

        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const newUserBase: User = {
            id: firebaseUser.uid,
            name: name,
            email: email,
            preferences: { language: "pt", showQuotes: true },
            plan: "free" as any,
            usage: { interpretationsCount: 0 },
            dreamsTodayCount: 0,
            lastDreamDate: new Date().toISOString().split("T")[0],

            trialStart: now.toISOString(),
            trialEnd: trialEnd.toISOString(),
            isTrialActive: true,
            isPremium: true,
        };

        const newUser = newUserBase;

        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        return newUser;
    },

    login: async (email: string, password: string): Promise<User> => {
        console.log("[AUTH SERVICE] Starting login for:", email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("[AUTH SERVICE] Auth successful, firebase uid:", userCredential.user.uid);
        const firebaseUser = userCredential.user;


        const userRef = doc(db, "users", firebaseUser.uid);
        let userData: User | null = null;
        let userDocSnapshot: any = null;

        try {
            console.log("[AUTH SERVICE] Fetching user doc from Firestore (with timeout)...");
            // Race condition: Firestore vs Timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore timeout")), 2500)
            );

            userDocSnapshot = await Promise.race([
                getDoc(userRef),
                timeoutPromise
            ]) as any;

            console.log("[AUTH SERVICE] Firestore getDoc finished. Exists:", userDocSnapshot.exists());

            if (userDocSnapshot && userDocSnapshot.exists()) {
                userData = userDocSnapshot.data() as User;

                // Normal flow
                userData = checkTrialExpiration(userData);
                return userData;
            }
        } catch (error) {
            console.warn("Firestore fetch error or timeout:", error);
            // Continua para o fallback
        }

        // Fallback se doc não existir ou timeout
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const newUserBase: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: email,
            preferences: { language: "pt", showQuotes: true },
            plan: "free" as any,
            usage: { interpretationsCount: 0 },
            dreamsTodayCount: 0,
            lastDreamDate: new Date().toISOString().split("T")[0],

            trialStart: now.toISOString(),
            trialEnd: trialEnd.toISOString(),
            isTrialActive: true,
            isPremium: true,
        };

        const newUser = newUserBase;
        // Tenta salvar, mas não bloqueia se falhar
        try {
            setDoc(userRef, newUser).catch(e => console.warn("Background save failed", e));
        } catch (e) {
            console.warn("Failed to create user doc (offline)", e);
        }
        return newUser;
    },

    logout: async () => {
        await signOut(auth);
        try {
            localStorage.removeItem(DEV_FORCE_PREMIUM_KEY);
        } catch { }
    },

    getUserData: async (uid: string): Promise<User | null> => {
        try {
            // Race condition: Firestore vs Timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore timeout")), 2500)
            );

            // @ts-ignore
            const userDoc = await Promise.race([
                getDoc(doc(db, "users", uid)),
                timeoutPromise
            ]) as any;

            if (!userDoc.exists()) return null;

            let userData = userDoc.data() as User;


            userData = checkTrialExpiration(userData);
            return userData;
        } catch (err) {
            console.warn("[AUTH] getUserData timed out or failed:", err);
            return null; // AppContext vai tratar isso e usar fallback ou cache local
        }
    },

    updateUser: async (user: User) => {
        await setDoc(doc(db, "users", user.id), user, { merge: true });
    },

    loginWithGoogle: async (): Promise<User> => {
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;


        const userRef = doc(db, "users", firebaseUser.uid);
        let userData: User | null = null;
        try {
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                userData = userDoc.data() as User;

                userData = checkTrialExpiration(userData);
                return userData;
            }
        } catch (error) {
            console.warn("Firestore error (likely offline):", error);
        }

        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const newUserBase: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            preferences: { language: "pt", showQuotes: true },
            plan: "free" as any,
            usage: { interpretationsCount: 0 },
            dreamsTodayCount: 0,
            lastDreamDate: new Date().toISOString().split("T")[0],

            trialStart: now.toISOString(),
            trialEnd: trialEnd.toISOString(),
            isTrialActive: true,
            isPremium: true,
        };

        const newUser = newUserBase;
        // Tenta salvar, mas não bloqueia se falhar
        try {
            await setDoc(userRef, newUser);
        } catch (e) { console.warn("Failed to create user doc (offline)", e); }
        return newUser;

    },
};
