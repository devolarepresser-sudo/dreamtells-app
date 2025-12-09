const STORAGE_PREFIX = 'dreamtells_dreams_';

export interface StoredDream {
    id: string;
    userId: string;
    text: string;
    aiInterpretation: string;
    createdAt: string;
    symbols?: any[]; // Mantido genérico conforme solicitado
    [key: string]: any; // Permite campos extras sem quebrar
}

export function loadDreams(userId: string): StoredDream[] {
    const key = `${STORAGE_PREFIX}${userId || 'guest'}`;

    try {
        if (typeof localStorage === 'undefined') {
            return [];
        }

        const item = localStorage.getItem(key);
        if (!item) {
            return [];
        }

        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
            return parsed;
        }

        return [];
    } catch (error) {
        console.error('[dreamStorage] Erro ao carregar sonhos:', error);
        return [];
    }
}

export function saveDreams(userId: string, dreams: StoredDream[]): void {
    const key = `${STORAGE_PREFIX}${userId || 'guest'}`;

    try {
        if (typeof localStorage === 'undefined') {
            console.warn('[dreamStorage] localStorage não disponível.');
            return;
        }

        localStorage.setItem(key, JSON.stringify(dreams));
    } catch (error) {
        console.warn('[dreamStorage] Erro ao salvar sonhos:', error);
    }
}

export function addDream(userId: string, dream: StoredDream): StoredDream[] {
    const existing = loadDreams(userId);
    // Adiciona no início da lista
    const updated = [dream, ...existing];
    saveDreams(userId, updated);
    return updated;
}
