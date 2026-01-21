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
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User } from "../types";

/**
 * ✅ DEV / MASTER OVERRIDE
 * - Se logar com email elepresser@gmail.com + senha 123456 => libera TUDO
 * - Também libera para elepressar@gmail.com (variação que você já usava)
 *
 * Observação: senha hardcoded no front NÃO é segura em produção.
 * Use isso só como atalho dev.
 */
const DEV_MASTER_EMAILS = ["elepresser@gmail.com", "elepressar@gmail.com"].map((e) =>
    e.toLowerCase()
);
const DEV_MASTER_PASSWORD = "123456";
const DEV_FORCE_PREMIUM_KEY = "devForcePremium";

/** true quando deve liberar premium total */
const shouldForcePremium = (email?: string | null, password?: string) => {
    const e = (email ?? "").toLowerCase().trim();
    if (!DEV_MASTER_EMAILS.includes(e)) return false;

    // Para login com email/senha: exige senha 123456
    if (typeof password === "string") return password === DEV_MASTER_PASSWORD;

    // Para Google login (sem senha): libera se o email for da whitelist
    return true;
};

/** aplica premium total no objeto user */
const applyForcedPremium = (user: User): User => {
    const patched: User = { ...user };

    // usa string/any pra não brigar com union types do seu Plan
    (patched as any).plan = "master";
    patched.isPremium = true;
    patched.isTrialActive = false;

    return patched;
};

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

        // ✅ Se registrar com seu email+senha dev, já vira master
        const force = shouldForcePremium(email, password);
        const newUser = force ? applyForcedPremium(newUserBase) : newUserBase;

        if (force) {
            try {
                localStorage.setItem(DEV_FORCE_PREMIUM_KEY, "1");
            } catch { }
        }

        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        return newUser;
    },

    login: async (email: string, password: string): Promise<User> => {
        console.log("[AUTH SERVICE] Starting login for:", email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("[AUTH SERVICE] Auth successful, firebase uid:", userCredential.user.uid);
        const firebaseUser = userCredential.user;

        const force = shouldForcePremium(email, password);
        if (force) {
            try {
                localStorage.setItem(DEV_FORCE_PREMIUM_KEY, "1");
            } catch { }
        }

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

                // ✅ Master override
                if (force) {
                    // atualiza firestore só se não estiver master
                    if (String((userData as any).plan) !== "master") {
                        try {
                            // Não bloqueia o login se falhar
                            updateDoc(userRef, { plan: "master" as any, isPremium: true, isTrialActive: false } as any).catch(e => console.warn(e));
                        } catch (e) { console.warn("Failed to update master plan", e); }
                    }
                    userData = applyForcedPremium(userData);
                    return userData;
                }

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

        const newUser = force ? applyForcedPremium(newUserBase) : newUserBase;
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

            // ✅ Se a flag local estiver ativa, força premium também
            try {
                if (localStorage.getItem(DEV_FORCE_PREMIUM_KEY) === "1") {
                    userData = applyForcedPremium(userData);
                    return userData;
                }
            } catch { }

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

        const email = (firebaseUser.email || "").toLowerCase();
        const force = shouldForcePremium(email); // google não tem senha

        if (force) {
            try {
                localStorage.setItem(DEV_FORCE_PREMIUM_KEY, "1");
            } catch { }
        }

        const userRef = doc(db, "users", firebaseUser.uid);
        let userData: User | null = null;
        try {
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                userData = userDoc.data() as User;

                if (force) {
                    if (String((userData as any).plan) !== "master") {
                        try {
                            await updateDoc(userRef, { plan: "master" as any, isPremium: true, isTrialActive: false } as any);
                        } catch (e) { console.warn("Failed to update master plan", e); }
                    }
                    userData = applyForcedPremium(userData);
                    return userData;
                }

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

        const newUser = force ? applyForcedPremium(newUserBase) : newUserBase;
        // Tenta salvar, mas não bloqueia se falhar
        try {
            await setDoc(userRef, newUser);
        } catch (e) { console.warn("Failed to create user doc (offline)", e); }
        return newUser;

    },
};
