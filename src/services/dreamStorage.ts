const STORAGE_PREFIX = 'dreamtells_dreams_';

export interface StoredDream {
    id: string;
    userId: string;
    text: string;

    // Mantemos o nome atual, mas vamos garantir compatibilidade
    aiInterpretation: string;

    createdAt: string;
    symbols?: any[];
    [key: string]: any;
}

function getKey(userId: string) {
    return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

async function getPrefs() {
    try {
        const prefs = (window as any)?.Capacitor?.Plugins?.Preferences;
        return prefs && typeof prefs.get === 'function' ? prefs : null;
    } catch {
        return null;
    }
}

export async function loadDreams(userId: string): Promise<StoredDream[]> {
    const key = getKey(userId);

    try {
        const prefs = await getPrefs();

        // Android/Capacitor: Preferences
        if (prefs) {
            const r = await prefs.get({ key });
            if (!r?.value) return [];
            const parsed = JSON.parse(r.value);
            return Array.isArray(parsed) ? parsed : [];
        }

        // Web: localStorage
        if (typeof localStorage === 'undefined') return [];
        const item = localStorage.getItem(key);
        if (!item) return [];
        const parsed = JSON.parse(item);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('[dreamStorage] Erro ao carregar sonhos:', error);
        return [];
    }
}

export async function saveDreams(userId: string, dreams: StoredDream[]): Promise<void> {
    const key = getKey(userId);

    try {
        // Compat: garantir campo "interpretation" para páginas antigas/novas
        const normalized = dreams.map((d) => ({
            ...d,
            interpretation: d.interpretation ?? d.aiInterpretation ?? '',
            aiInterpretation: d.aiInterpretation ?? d.interpretation ?? '',
        }));

        const json = JSON.stringify(normalized);

        const prefs = await getPrefs();

        // Android/Capacitor: Preferences
        if (prefs) {
            await prefs.set({ key, value: json });
            return;
        }

        // Web: localStorage
        if (typeof localStorage === 'undefined') {
            console.warn('[dreamStorage] localStorage não disponível.');
            return;
        }
        localStorage.setItem(key, json);
    } catch (error) {
        console.warn('[dreamStorage] Erro ao salvar sonhos:', error);
    }
}

export async function addDream(userId: string, dream: StoredDream): Promise<StoredDream[]> {
    const existing = await loadDreams(userId);

    const normalizedDream: StoredDream = {
        ...dream,
        aiInterpretation: (dream as any).aiInterpretation ?? (dream as any).interpretation ?? '',
        interpretation: (dream as any).interpretation ?? (dream as any).aiInterpretation ?? '',
    };

    const updated = [normalizedDream, ...existing];
    await saveDreams(userId, updated);
    return updated;
}
