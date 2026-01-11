import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User as FirebaseUser,
    GoogleAuthProvider,
    signInWithCredential,
    sendPasswordResetEmail
} from "firebase/auth";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User, Plan } from "../types";

// Helper function to check trial expiration
const checkTrialExpiration = (user: User): User => {
    // Master users always have premium
    if (user.plan === 'master') {
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
            user.isPremium = user.plan === 'premium';
        } else {
            // Trial still active
            user.isPremium = true;
        }
    } else {
        // No active trial, check plan
        user.isPremium = user.plan === 'premium' || user.plan === 'master';
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

        // Create user document in Firestore with 7-day trial
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const newUser: User = {
            id: firebaseUser.uid,
            name: name,
            email: email,
            preferences: { language: 'pt', showQuotes: true }, // Default
            plan: 'free',
            usage: { interpretationsCount: 0 },
            dreamsTodayCount: 0,
            lastDreamDate: new Date().toISOString().split('T')[0],

            // 7-day Premium Trial
            trialStart: now.toISOString(),
            trialEnd: trialEnd.toISOString(),
            isTrialActive: true,
            isPremium: true
        };

        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        return newUser;
    },

    login: async (email: string, password: string): Promise<User> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

        if (userDoc.exists()) {
            let userData = userDoc.data() as User;

            // Master Access Check (Override plan if email matches)
            const masterEmails = ['elepressar@gmail.com', 'elepresser@gmail.com'];
            if (masterEmails.includes(email.toLowerCase())) {
                if (userData.plan !== 'master') {
                    await updateDoc(doc(db, "users", firebaseUser.uid), { plan: 'master' });
                    userData.plan = 'master';
                }
            }

            // Check trial expiration
            userData = checkTrialExpiration(userData);

            return userData;
        } else {
            // Fallback if doc doesn't exist (shouldn't happen for new users, but maybe for old auths)
            const masterEmails = ['elepressar@gmail.com', 'elepresser@gmail.com'];
            // Fallback user creation with trial
            const now = new Date();
            const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: email,
                preferences: { language: 'pt', showQuotes: true },
                plan: masterEmails.includes(email.toLowerCase()) ? 'master' : 'free',
                usage: { interpretationsCount: 0 },
                dreamsTodayCount: 0,
                lastDreamDate: new Date().toISOString().split('T')[0],

                // 7-day Premium Trial
                trialStart: now.toISOString(),
                trialEnd: trialEnd.toISOString(),
                isTrialActive: !masterEmails.includes(email.toLowerCase()),
                isPremium: true
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            return newUser;
        }
    },

    logout: async () => {
        await signOut(auth);
    },

    getUserData: async (uid: string): Promise<User | null> => {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            let userData = userDoc.data() as User;

            // Check trial expiration
            userData = checkTrialExpiration(userData);

            return userData;
        }
        return null;
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

        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

        if (userDoc.exists()) {
            let userData = userDoc.data() as User;
            // Master Access Check (Override plan if email matches)
            const masterEmails = ['elepressar@gmail.com', 'elepresser@gmail.com'];
            if (firebaseUser.email && masterEmails.includes(firebaseUser.email.toLowerCase())) {
                if (userData.plan !== 'master') {
                    await updateDoc(doc(db, "users", firebaseUser.uid), { plan: 'master' });
                    userData.plan = 'master';
                }
            }

            // Check trial expiration
            userData = checkTrialExpiration(userData);
            return userData;
        } else {
            // New User via Google
            const masterEmails = ['elepressar@gmail.com', 'elepresser@gmail.com'];
            const email = firebaseUser.email || '';

            const now = new Date();
            const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: email,
                preferences: { language: 'pt', showQuotes: true },
                plan: masterEmails.includes(email.toLowerCase()) ? 'master' : 'free',
                usage: { interpretationsCount: 0 },
                dreamsTodayCount: 0,
                lastDreamDate: new Date().toISOString().split('T')[0],

                // 7-day Premium Trial
                trialStart: now.toISOString(),
                trialEnd: trialEnd.toISOString(),
                isTrialActive: !masterEmails.includes(email.toLowerCase()),
                isPremium: true
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            return newUser;
        }
    }
};
