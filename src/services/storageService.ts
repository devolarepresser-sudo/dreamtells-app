import { DreamEntry, User } from '../types';

const KEYS = {
    USER: 'dreamtells_user',
    DREAMS: 'dreamtells_dreams',
    LANG: 'dreamtells_lang'
};

export const storageService = {
    getUser: (): User | null => {
        const data = localStorage.getItem(KEYS.USER);
        return data ? JSON.parse(data) : null;
    },

    saveUser: (user: User): void => {
        localStorage.setItem(KEYS.USER, JSON.stringify(user));
    },

    clearUser: (): void => {
        localStorage.removeItem(KEYS.USER);
    },

    getDreams: (): DreamEntry[] => {
        const data = localStorage.getItem(KEYS.DREAMS);
        return data ? JSON.parse(data) : [];
    },

    saveDream: (dream: DreamEntry): void => {
        const dreams = storageService.getDreams();
        dreams.unshift(dream);
        localStorage.setItem(KEYS.DREAMS, JSON.stringify(dreams));
    },

    updateDream: (updatedDream: DreamEntry): void => {
        const dreams = storageService.getDreams();
        const index = dreams.findIndex(d => d.id === updatedDream.id);
        if (index !== -1) {
            dreams[index] = updatedDream;
            localStorage.setItem(KEYS.DREAMS, JSON.stringify(dreams));
        }
    },

    deleteDream: (id: string): void => {
        const dreams = storageService.getDreams();
        const filtered = dreams.filter(d => d.id !== id);
        localStorage.setItem(KEYS.DREAMS, JSON.stringify(filtered));
    },

    clearDreams: (): void => {
        localStorage.removeItem(KEYS.DREAMS);
    },

    getLanguage: (): string | null => {
        return localStorage.getItem(KEYS.LANG);
    },

    setLanguage: (lang: string): void => {
        localStorage.setItem(KEYS.LANG, lang);
    }
};
