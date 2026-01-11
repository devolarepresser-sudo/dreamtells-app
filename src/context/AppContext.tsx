import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { User, DreamEntry, Language, Plan } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import pt from '../locales/pt.json';
import es from '../locales/es.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import it from '../locales/it.json';
import de from '../locales/de.json';
import { FREE_DEV_MODE } from '../config/featureFlags';
import { hybridStorage } from '../services/hybridStorage';

const locales = { pt, es, en, fr, it, de };

// ✅ Sem nuvem para sonhos/perfil por enquanto (só login online)
const LOCAL_ONLY_DREAMS = true;
const LOCAL_ONLY_PROFILE = true;

export interface DailyMessageData {
    date: string;
    message: string;
}

interface AppContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    user: User | null;
    login: (email: string, name: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    dreams: DreamEntry[];
    addDream: (
        text: string,
        result: any,
        source: 'text' | 'audio'
    ) => Promise<string>;
    toggleFavorite: (id: string) => Promise<void>;
    deleteDream: (id: string) => Promise<void>;
    updateDream: (id: string, data: Partial<DreamEntry>) => Promise<void>;
    clearDreams: () => Promise<void>;
    t: (key: keyof typeof pt) => string;
    upgradeToPremium: () => Promise<void>;
    dailyMessage: DailyMessageData | null;
    setDailyMessage: (msg: string) => Promise<void>;
    isLoading: boolean;

    canUsePremium: () => boolean;
    activatePremium: () => Promise<void>;
    canInterpret: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('pt');
    const [user, setUser] = useState<User | null>(null);
    const [dreams, setDreams] = useState<DreamEntry[]>([]);
    const [dailyMessage, setDailyMessageState] =
        useState<DailyMessageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getActiveUserId = (u: User | null) => (u?.id ? u.id : 'guest');

    // Inicialização geral
    useEffect(() => {
        const initialize = async () => {
            // Idioma
            const storedLang = (await storageService.getLanguage()) as Language;
            if (storedLang) setLanguageState(storedLang);

            // Mensagem diária
            const storedMsg = await hybridStorage.getItem('dreamtells_daily_msg');
            if (storedMsg) {
                try {
                    setDailyMessageState(JSON.parse(storedMsg));
                } catch { }
            }

            // Carrega sonhos GUEST no boot (evita tela vazia antes do auth)
            try {
                // @ts-ignore - depende do storageService com ForUser
                const guestDreams = await storageService.getDreamsForUser('guest');
                setDreams(guestDreams);
                console.log(`[HISTORY] Initial guest cache load: ${guestDreams.length} dreams.`);
            } catch (e) {
                console.warn('[HISTORY] Failed to load guest dreams:', e);
                setDreams([]);
            }
        };

        initialize();

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            (async () => {
                try {
                    setIsLoading(true);

                    if (firebaseUser) {
                        const minimalUser: User = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            name: firebaseUser.displayName || 'Usuário',
                            isPremium: false,
                            isTrialActive: true, // pode começar com trial local
                            trialStart: new Date().toISOString(),
                            trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                            plan: 'free',
                            preferences: { language: 'pt', showQuotes: true },
                            usage: { interpretationsCount: 0 },
                            dreamsTodayCount: 0,
                            lastDreamDate: '',
                        };

                        setUser(minimalUser);

                        // ✅ Perfil local (sem Firestore)
                        if (LOCAL_ONLY_PROFILE) {
                            try {
                                await storageService.saveUser(minimalUser);
                            } catch { }
                        }

                        // ✅ Sonhos locais por UID
                        try {
                            // @ts-ignore - depende do storageService com ForUser
                            const userDreams = await storageService.getDreamsForUser(firebaseUser.uid);
                            setDreams(userDreams);
                            console.log(`[HISTORY] Loaded local dreams for uid=${firebaseUser.uid}: ${userDreams.length}`);
                        } catch (e) {
                            console.warn('[HISTORY] Failed to load user dreams:', e);
                            setDreams([]);
                        }

                        // Log de status
                        try {
                            // @ts-ignore
                            const cnt = (await storageService.getDreamsForUser(firebaseUser.uid)).length;
                            console.log(`[HISTORY] current local count (uid): ${cnt}`);
                        } catch { }

                        return;
                    }

                    // ✅ Deslogado: volta pro guest
                    setUser(null);
                    try {
                        // @ts-ignore
                        const guestDreams = await storageService.getDreamsForUser('guest');
                        setDreams(guestDreams);
                        console.log(`[HISTORY] Loaded local dreams for guest: ${guestDreams.length}`);
                    } catch (e) {
                        console.warn('[HISTORY] Failed to load guest dreams:', e);
                        setDreams([]);
                    }

                    try {
                        // @ts-ignore
                        const cnt = (await storageService.getDreamsForUser('guest')).length;
                        console.log(`[HISTORY] current local count (guest): ${cnt}`);
                    } catch { }
                } finally {
                    setIsLoading(false);
                }
            })();
        });

        return () => unsubscribe();
    }, []);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        await storageService.setLanguage(lang);
    };

    const login = async (_email: string, _name: string) => {
        return;
    };

    const register = async (_email: string, _password: string, _name: string) => {
        return;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        // não zera dreams aqui; o onAuthStateChanged vai carregar guest
    };

    const upgradeToPremium = async () => {
        if (user) {
            await activatePremium();
        }
    };

    // --------- PREMIUM / TRIAL (local por enquanto) ---------
    const canUsePremium = (): boolean => {
        if (FREE_DEV_MODE) return true;
        if (!user) return true; // guest pode usar (você decide depois)
        return Boolean(user.isPremium || user.isTrialActive);
    };

    const activatePremium = async (): Promise<void> => {
        if (!user) return;

        const updatedUser: User = {
            ...user,
            plan: 'premium' as Plan,
            isPremium: true,
            isTrialActive: false,
        };

        setUser(updatedUser);

        // ✅ sem Firestore agora
        if (LOCAL_ONLY_PROFILE) {
            try {
                await storageService.saveUser(updatedUser);
            } catch { }
        }
    };

    const canInterpret = (): boolean => canUsePremium();
    // ------------------------------------------------------

    const addDream = async (
        text: string,
        result: any,
        source: 'text' | 'audio'
    ): Promise<string> => {
        const nowIso = new Date().toISOString();
        const userId = getActiveUserId(user);

        const newDream: Omit<DreamEntry, 'id'> = {
            userId,
            text,
            source,
            createdAt: nowIso,
            updatedAt: nowIso,

            dreamTitle: result?.dreamTitle || 'Sonho sem título',
            interpretationMain: result?.interpretationMain || '',
            symbols: result?.symbols || [],
            emotions: result?.emotions || [],
            lifeAreas: result?.lifeAreas || [],
            advice: result?.advice || '',
            tags: result?.tags || [],

            isPremiumAnalysis: false,
            isFavorite: false,
            language: language as Language,
        };

        const id = 'local-dream-' + Date.now();
        const savedDream: DreamEntry = { ...newDream, id } as DreamEntry;

        // ✅ sempre local e por usuário
        // @ts-ignore
        await storageService.saveDreamForUser(userId, savedDream);

        setDreams((prev) => [savedDream, ...prev]);

        // (Opcional) atualizar usage local
        if (user) {
            const currentUsage = user.usage || { interpretationsCount: 0 };
            const updatedUser: User = {
                ...user,
                usage: {
                    ...currentUsage,
                    interpretationsCount: (currentUsage.interpretationsCount || 0) + 1,
                },
            };
            setUser(updatedUser);

            if (LOCAL_ONLY_PROFILE) {
                try { await storageService.saveUser(updatedUser); } catch { }
            }
        }

        return id;
    };

    const toggleFavorite = async (id: string) => {
        const userId = getActiveUserId(user);

        const dream = dreams.find((d) => d.id === id);
        if (!dream) return;

        const updated = { ...dream, isFavorite: !dream.isFavorite };
        setDreams((prev) => prev.map((d) => (d.id === id ? updated : d)));

        try {
            // @ts-ignore
            await storageService.updateDreamForUser(userId, updated);
        } catch (error) {
            console.error('[AppContext] Erro ao atualizar favorito:', error);
        }
    };

    const deleteDream = async (id: string) => {
        const userId = getActiveUserId(user);

        setDreams((prev) => prev.filter((d) => d.id !== id));
        try {
            // @ts-ignore
            await storageService.deleteDreamForUser(userId, id);
        } catch (error) {
            console.error('[AppContext] Erro ao deletar sonho:', error);
        }
    };

    const updateDream = async (id: string, updateData: Partial<DreamEntry>) => {
        const userId = getActiveUserId(user);

        const current = dreams.find(d => d.id === id);
        if (!current) return;

        const updated = { ...current, ...updateData, updatedAt: new Date().toISOString() };

        setDreams((prev) =>
            prev.map((d) => (d.id === id ? updated : d))
        );

        try {
            // @ts-ignore
            await storageService.updateDreamForUser(userId, updated);
        } catch (error) {
            console.error('[AppContext] Erro ao atualizar sonho:', error);
        }
    };

    const clearDreams = async () => {
        const userId = getActiveUserId(user);

        setDreams([]);
        try {
            // @ts-ignore
            await storageService.clearDreamsForUser(userId);
        } catch (error) {
            console.error('[AppContext] Erro ao limpar histórico:', error);
        }
    };

    const setDailyMessage = async (msg: string) => {
        const data: DailyMessageData = {
            date: new Date().toISOString().split('T')[0],
            message: msg,
        };
        setDailyMessageState(data);
        await hybridStorage.setItem('dreamtells_daily_msg', JSON.stringify(data));
    };

    const t = (key: keyof typeof pt): string => {
        try {
            const locale = locales[language] as any;
            return locale[key] || (locales['pt'] as any)[key] || key;
        } catch {
            return key;
        }
    };

    return (
        <AppContext.Provider
            value={{
                language,
                setLanguage,
                user,
                login,
                register,
                logout,
                dreams,
                addDream,
                toggleFavorite,
                deleteDream,
                updateDream,
                clearDreams,
                t,
                upgradeToPremium,
                dailyMessage,
                setDailyMessage,
                isLoading,
                canUsePremium,
                activatePremium,
                canInterpret,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
