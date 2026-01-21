import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

// ✅ EIXOS PSÍQUICOS (Versão 2.0)
export interface UnconsciousMap {
    // EIXO 1 - Identidade Vivida
    axisIdentity?: {
        status: string; // Alinhado, Conflito, Transição...
        note?: string;
    };
    // EIXO 2 - Chão Interno (Segurança)
    axisSecurity?: {
        status: string; // Enraizado, Suspenso...
        note?: string;
    };
    // EIXO 3 - Vínculo Emocional
    axisBond?: {
        status: string[]; // Multipla (max 2)
        note?: string;
    };
    // EIXO 4 - Movimento / Direção
    axisMovement?: {
        status: string; // Avançando, Parado...
        note?: string;
    };
    // EIXO 5 - Desejo
    axisDesire?: {
        status: string; // Sei o que quero, Medo...
        note?: string;
    };
    // EIXO 6 - Energia Emocional
    axisEnergy?: {
        status: string; // Expansão, Cansaço...
        note?: string;
    };

    lastUpdated?: string;
}

export const hybridStorage = {
    async getItem(key: string): Promise<string | null> {
        try {
            if (isNative) {
                const { value } = await Preferences.get({ key });
                return value;
            } else {
                return localStorage.getItem(key);
            }
        } catch (error) {
            console.error('[hybridStorage] Error getting item:', key, error);
            return null;
        }
    },

    async setItem(key: string, value: string): Promise<void> {
        try {
            if (isNative) {
                await Preferences.set({ key, value });
            } else {
                localStorage.setItem(key, value);
            }
        } catch (error) {
            console.error('[hybridStorage] Error setting item:', key, error);
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            if (isNative) {
                await Preferences.remove({ key });
            } else {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error('[hybridStorage] Error removing item:', key, error);
        }
    },

    // --- Sonhos ---
    async getDreamsForUser(userId: string): Promise<any[]> {
        const key = `dreamtells_dreams_${userId}`;
        const data = await this.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    async saveDreamForUser(userId: string, dream: any): Promise<void> {
        const key = `dreamtells_dreams_${userId}`;
        const current = await this.getDreamsForUser(userId);
        const updated = [dream, ...current];
        await this.setItem(key, JSON.stringify(updated));
    },

    async updateDreamForUser(userId: string, dream: any): Promise<void> {
        const key = `dreamtells_dreams_${userId}`;
        const current = await this.getDreamsForUser(userId);
        const updated = current.map(d => d.id === dream.id ? dream : d);
        await this.setItem(key, JSON.stringify(updated));
    },

    async deleteDreamForUser(userId: string, dreamId: string): Promise<void> {
        const key = `dreamtells_dreams_${userId}`;
        const current = await this.getDreamsForUser(userId);
        const updated = current.filter(d => d.id !== dreamId);
        await this.setItem(key, JSON.stringify(updated));
    },

    async clearDreamsForUser(userId: string): Promise<void> {
        const key = `dreamtells_dreams_${userId}`;
        await this.removeItem(key);
    },

    // --- Usuário (Offline) ---
    async saveUser(user: any): Promise<void> {
        await this.setItem('dreamtells_user', JSON.stringify(user));
    },

    async getUser(): Promise<any | null> {
        const data = await this.getItem('dreamtells_user');
        return data ? JSON.parse(data) : null;
    },

    // --- Idioma ---
    async getLanguage(): Promise<string | null> {
        return await this.getItem('dreamtells_lang');
    },

    async saveLanguage(lang: string): Promise<void> {
        await this.setItem('dreamtells_lang', lang);
    },

    // --- Símbolos (Cache de Definições) ---
    async getSymbolDefinitions(): Promise<Record<string, string>> {
        const data = await this.getItem('dreamtells_symbol_definitions');
        return data ? JSON.parse(data) : {};
    },

    async saveSymbolDefinition(symbolName: string, definition: string): Promise<void> {
        const key = 'dreamtells_symbol_definitions';
        const current = await this.getSymbolDefinitions();
        current[symbolName.toLowerCase()] = definition;
        await this.setItem(key, JSON.stringify(current));
    },

    // --- Mapa do Inconsciente ---
    async getUnconsciousMap(): Promise<UnconsciousMap> {
        const data = await this.getItem('dreamtells_unconscious_map');
        return data ? JSON.parse(data) : {};
    },

    async saveUnconsciousMap(map: UnconsciousMap): Promise<void> {
        await this.setItem('dreamtells_unconscious_map', JSON.stringify(map));
    }
};
