import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    orderBy,
    writeBatch
} from "firebase/firestore";
import { db } from "../config/firebase";
import { DreamEntry } from "../types";

const DREAMS_COLLECTION = "dreams";

export const dreamService = {
    addDream: async (dream: Omit<DreamEntry, 'id'>): Promise<string> => {
        const docRef = await addDoc(collection(db, DREAMS_COLLECTION), dream);
        return docRef.id;
    },

    getUserDreams: async (userId: string): Promise<DreamEntry[]> => {
        const q = query(
            collection(db, DREAMS_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as DreamEntry));
    },

    deleteDream: async (dreamId: string) => {
        await deleteDoc(doc(db, DREAMS_COLLECTION, dreamId));
    },

    updateDream: async (dreamId: string, data: Partial<DreamEntry>) => {
        await updateDoc(doc(db, DREAMS_COLLECTION, dreamId), data);
    },

    clearUserDreams: async (userId: string) => {
        const q = query(
            collection(db, DREAMS_COLLECTION),
            where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return;

        const batch = writeBatch(db);
        querySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    }
};
