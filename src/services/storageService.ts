import { DreamEntry, User } from '../types';
import { hybridStorage } from './hybridStorage';

const KEYS = {
    USER: 'dreamtells_user',
    DREAMS: 'dreamtells_dreams',
    LANG: 'dreamtells_lang'
};

const dreamsKeyForUser = (userId?: string | null) =>
    `${KEYS.DREAMS}_${userId || 'guest'}`;

export const storageService = {
    getUser: async (): Promise<User | null> => {
        const data = await hybridStorage.getItem(KEYS.USER);
        return data ? JSON.parse(data) : null;
    },

    saveUser: async (user: User): Promise<void> => {
        await hybridStorage.setItem(KEYS.USER, JSON.stringify(user));
    },

    clearUser: async (): Promise<void> => {
        await hybridStorage.removeItem(KEYS.USER);
    },

    // ✅ NOVO: por usuário (padrão definitivo)
    getDreamsForUser: async (userId?: string | null): Promise<DreamEntry[]> => {
        const data = await hybridStorage.getItem(dreamsKeyForUser(userId));
        return data ? JSON.parse(data) : [];
    },

    saveDreamForUser: async (userId: string | null | undefined, dream: DreamEntry): Promise<void> => {
        const dreams = await storageService.getDreamsForUser(userId);
        dreams.unshift(dream);
        await hybridStorage.setItem(dreamsKeyForUser(userId), JSON.stringify(dreams));
    },

    updateDreamForUser: async (userId: string | null | undefined, updatedDream: DreamEntry): Promise<void> => {
        const dreams = await storageService.getDreamsForUser(userId);
        const index = dreams.findIndex(d => d.id === updatedDream.id);
        if (index !== -1) {
            dreams[index] = updatedDream;
            await hybridStorage.setItem(dreamsKeyForUser(userId), JSON.stringify(dreams));
        }
    },

    deleteDreamForUser: async (userId: string | null | undefined, id: string): Promise<void> => {
        const dreams = await storageService.getDreamsForUser(userId);
        const filtered = dreams.filter(d => d.id !== id);
        await hybridStorage.setItem(dreamsKeyForUser(userId), JSON.stringify(filtered));
    },

    clearDreamsForUser: async (userId: string | null | undefined): Promise<void> => {
        await hybridStorage.removeItem(dreamsKeyForUser(userId));
    },

    syncDreamsForUser: async (userId: string | null | undefined, dreams: DreamEntry[]): Promise<void> => {
        try {
            await hybridStorage.setItem(dreamsKeyForUser(userId), JSON.stringify(dreams));
            console.log(`[HISTORY] syncDreams: saved ${dreams.length} dreams to local cache (${dreamsKeyForUser(userId)}).`);
        } catch (error) {
            console.error('[HISTORY] Error syncing dreams to local cache:', error);
        }
    },

    // -----------------------------
    // ⚠️ Compatibilidade: mantém as funções antigas para não quebrar chamadas existentes.
    // Elas continuam apontando para a chave antiga 'dreamtells_dreams'.
    // Depois você troca as chamadas no AppContext para as versões ForUser.
    // -----------------------------

    getDreams: async (): Promise<DreamEntry[]> => {
        const data = await hybridStorage.getItem(KEYS.DREAMS);
        return data ? JSON.parse(data) : [];
    },

    saveDream: async (dream: DreamEntry): Promise<void> => {
        const dreams = await storageService.getDreams();
        dreams.unshift(dream);
        await hybridStorage.setItem(KEYS.DREAMS, JSON.stringify(dreams));
    },

    updateDream: async (updatedDream: DreamEntry): Promise<void> => {
        const dreams = await storageService.getDreams();
        const index = dreams.findIndex(d => d.id === updatedDream.id);
        if (index !== -1) {
            dreams[index] = updatedDream;
            await hybridStorage.setItem(KEYS.DREAMS, JSON.stringify(dreams));
        }
    },

    deleteDream: async (id: string): Promise<void> => {
        const dreams = await storageService.getDreams();
        const filtered = dreams.filter(d => d.id !== id);
        await hybridStorage.setItem(KEYS.DREAMS, JSON.stringify(filtered));
    },

    clearDreams: async (): Promise<void> => {
        await hybridStorage.removeItem(KEYS.DREAMS);
    },

    syncDreams: async (dreams: DreamEntry[]): Promise<void> => {
        try {
            await hybridStorage.setItem(KEYS.DREAMS, JSON.stringify(dreams));
            console.log(`[HISTORY] syncDreams: saved ${dreams.length} dreams to local cache.`);
        } catch (error) {
            console.error('[HISTORY] Error syncing dreams to local cache:', error);
        }
    },

    getLanguage: async (): Promise<string | null> => {
        return await hybridStorage.getItem(KEYS.LANG);
    },

    setLanguage: async (lang: string): Promise<void> => {
        await hybridStorage.setItem(KEYS.LANG, lang);
    }
};
