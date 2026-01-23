import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { User, DreamEntry, Language, Plan } from '../types';
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

import i18n from '../i18n'; // Importação do i18n configurado

const locales = { pt, es, en, fr, it, de };

// ✅ Sem nuvem para perfil por enquanto (só login online)
const LOCAL_ONLY_PROFILE = true;

export interface DailyMessageData {
    date: string;
    message: string;
    title?: string;
    practice?: string;
    archetype?: string;
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
    t: (key: keyof typeof pt, params?: Record<string, string | number>) => string;
    upgradeToPremium: () => Promise<void>;
    dailyMessage: DailyMessageData | null;
    setDailyMessage: (msg: string | DailyMessageData) => Promise<void>;
    isLoading: boolean;

    canUsePremium: () => boolean;
    activatePremium: () => Promise<void>;
    canInterpret: () => boolean;
    updateProfile: (name: string, photoURL?: string) => Promise<void>;
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
            try {
                // Idioma
                const storedLang = (await hybridStorage.getLanguage()) as Language;
                if (storedLang) {
                    setLanguageState(storedLang);
                    i18n.changeLanguage(storedLang); // Sincroniza i18n
                } else {
                    i18n.changeLanguage('pt'); // Default fixo
                }

                // Mensagem diária
                const storedMsg = await hybridStorage.getItem('dreamtells_daily_msg');
                if (storedMsg) {
                    try {
                        setDailyMessageState(JSON.parse(storedMsg));
                    } catch { }
                }

                // Carrega sonhos GUEST inicialmente
                const guestDreams = await hybridStorage.getDreamsForUser('guest');
                setDreams(guestDreams);
            } catch (error) {
                console.error('[AppContext] Initialization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            (async () => {
                setIsLoading(true);
                try {
                    if (firebaseUser) {
                        // Carrega perfil offline primeiro se existir
                        const offlineUser = await hybridStorage.getUser();

                        // Busca dados reais do Firebase
                        const userData = await authService.getUserData(firebaseUser.uid);

                        if (userData) {
                            setUser(userData);
                            const userDreams = await hybridStorage.getDreamsForUser(userData.id);
                            setDreams(userDreams);
                            await hybridStorage.saveUser(userData);
                        } else if (offlineUser && offlineUser.id === firebaseUser.uid) {
                            setUser(offlineUser);
                            const userDreams = await hybridStorage.getDreamsForUser(offlineUser.id);
                            setDreams(userDreams);
                        } else {
                            // Fallback minimal
                            const minimalUser: User = {
                                id: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                name: firebaseUser.displayName || 'Usuário',
                                isPremium: false,
                                isTrialActive: true,
                                trialStart: new Date().toISOString(),
                                trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                plan: 'free',
                                preferences: { language: 'pt', showQuotes: true },
                                usage: { interpretationsCount: 0 },
                                dreamsTodayCount: 0,
                                lastDreamDate: '',
                            };
                            setUser(minimalUser);
                        }
                    } else {
                        // Logoff: volta para guest
                        setUser(null);
                        const guestDreams = await hybridStorage.getDreamsForUser('guest');
                        setDreams(guestDreams);
                    }
                } catch (error) {
                    console.error('[AppContext] Auth change error:', error);
                } finally {
                    setIsLoading(false);
                }
            })();
        });

        return () => unsubscribe();
    }, []);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        i18n.changeLanguage(lang); // Atualiza i18next quando usuário muda no profile
        await hybridStorage.saveLanguage(lang);
    };

    const login = async (email: string, password: string) => {
        const userData = await authService.login(email, password);
        setUser(userData);
    };

    const register = async (email: string, password: string, name: string) => {
        const userData = await authService.register(email, password, name);
        setUser(userData);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const upgradeToPremium = async () => {
        if (user) {
            await activatePremium();
        }
    };

    // --------- PREMIUM / TRIAL ---------
    const canUsePremium = (): boolean => {
        if (FREE_DEV_MODE) return true;
        if (!user) return true;
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
        await hybridStorage.saveUser(updatedUser);
        if (!LOCAL_ONLY_PROFILE) {
            await authService.updateUser(updatedUser);
        }
    };

    const canInterpret = (): boolean => canUsePremium();

    const updateProfile = async (name: string, photoURL?: string) => {
        if (!user) return;

        const updatedUser: User = {
            ...user,
            name,
            photoURL: photoURL || user.photoURL,
        };

        setUser(updatedUser);
        await hybridStorage.saveUser(updatedUser);
        if (!LOCAL_ONLY_PROFILE) {
            await authService.updateUser(updatedUser);
        }
    };

    const addDream = async (
        text: string,
        result: any,
        source: 'text' | 'audio'
    ): Promise<string> => {
        const nowIso = new Date().toISOString();
        const userId = getActiveUserId(user);

        const id = 'local-dream-' + Date.now();
        const savedDream: DreamEntry = {
            id,
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

        await hybridStorage.saveDreamForUser(userId, savedDream);
        setDreams((prev) => [savedDream, ...prev]);

        return id;
    };

    const toggleFavorite = async (id: string) => {
        const userId = getActiveUserId(user);
        const dream = dreams.find((d) => d.id === id);
        if (!dream) return;

        const updated = { ...dream, isFavorite: !dream.isFavorite };
        setDreams((prev) => prev.map((d) => (d.id === id ? updated : d)));
        await hybridStorage.updateDreamForUser(userId, updated);
    };

    const deleteDream = async (id: string) => {
        const userId = getActiveUserId(user);
        setDreams((prev) => prev.filter((d) => d.id !== id));
        await hybridStorage.deleteDreamForUser(userId, id);
    };

    const updateDream = async (id: string, updateData: Partial<DreamEntry>) => {
        const userId = getActiveUserId(user);
        const current = dreams.find(d => d.id === id);
        if (!current) return;

        const updated = { ...current, ...updateData, updatedAt: new Date().toISOString() };
        setDreams((prev) => prev.map((d) => (d.id === id ? updated : d)));
        await hybridStorage.updateDreamForUser(userId, updated);
    };

    const clearDreams = async () => {
        const userId = getActiveUserId(user);
        setDreams([]);
        await hybridStorage.clearDreamsForUser(userId);
    };

    const setDailyMessage = async (msg: string | DailyMessageData) => {
        const data: DailyMessageData = typeof msg === 'string'
            ? {
                date: new Date().toISOString().split('T')[0],
                message: msg,
            }
            : msg;
        setDailyMessageState(data);
        await hybridStorage.setItem('dreamtells_daily_msg', JSON.stringify(data));
    };

    const t = (key: keyof typeof pt, params?: Record<string, string | number>): string => {
        try {
            const locale = locales[language] as any;
            let text = locale[key] || (locales['pt'] as any)[key] || key;

            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    text = text.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
                });
            }

            return text;
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
                updateProfile,
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
