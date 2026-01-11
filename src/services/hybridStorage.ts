import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

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
    }
};
