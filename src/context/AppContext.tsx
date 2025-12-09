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
import { dreamService } from '../services/dreamService';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import pt from '../locales/pt.json';
import es from '../locales/es.json';
import en from '../locales/en.json';
import { FREE_DEV_MODE } from '../config/featureFlags';

const locales = { pt, es, en };

export interface DailyMessageData {
    date: string;
    message: string;
}

interface AppContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
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
    toggleFavorite: (id: string) => void;
    deleteDream: (id: string) => void;
    clearDreams: () => void;
    t: (key: keyof typeof pt) => string;
    upgradeToPremium: () => void;
    dailyMessage: DailyMessageData | null;
    setDailyMessage: (msg: string) => void;
    isLoading: boolean;

    // Premium / Trial
    canUsePremium: () => boolean;
    activatePremium: () => Promise<void>;

    // Alias usado em várias páginas (WriteDream, etc.)
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

    // Inicialização geral
    useEffect(() => {
        // Idioma
        const storedLang = storageService.getLanguage() as Language;
        if (storedLang) setLanguageState(storedLang);

        // Mensagem diária
        const storedMsg = localStorage.getItem('dreamtells_daily_msg');
        if (storedMsg) {
            try {
                setDailyMessageState(JSON.parse(storedMsg));
            } catch {
                // se der erro no JSON, ignora
            }
        }

        // Listener de autenticação Firebase
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userData = await authService.getUserData(firebaseUser.uid);

                    if (userData) {
                        // Verificar expiração do trial
                        if (userData.trialEnd && userData.isTrialActive) {
                            const now = new Date();
                            const trialEndDate = new Date(userData.trialEnd);

                            if (now > trialEndDate) {
                                // Trial expirou
                                userData.isTrialActive = false;

                                // Se o plano for premium/master, mantém Premium; caso contrário, bloqueia
                                const hasPaidPlan =
                                    userData.plan === 'premium' || userData.plan === 'master';

                                userData.isPremium = hasPaidPlan;
                                await authService.updateUser(userData);
                            }
                        }

                        setUser(userData);

                        // Carregar sonhos do usuário
                        const userDreams = await dreamService.getUserDreams(userData.id);
                        setDreams(userDreams);
                    } else {
                        setUser(null);
                        setDreams([]);
                    }
                } catch (error) {
                    console.error('[AppContext] Erro ao carregar dados do usuário:', error);
                    setUser(null);
                    setDreams([]);
                }
            } else {
                // Não autenticado
                setUser(null);
                if (FREE_DEV_MODE) {
                    // Load dreams for dev-guest from localStorage
                    const localDreams = storageService.getDreams();
                    setDreams(localDreams);
                } else {
                    setDreams([]);
                }
            }

            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        storageService.setLanguage(lang);
    };

    // Login e registro são tratados pelo Firebase Auth listener
    const login = async (_email: string, _name: string) => {
        // Fluxo tratado via Firebase UI/Auth
        return;
    };

    const register = async (_email: string, _password: string, _name: string) => {
        // Fluxo tratado via Firebase UI/Auth
        return;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setDreams([]);
    };

    const upgradeToPremium = async () => {
        if (user) {
            await activatePremium();
        }
    };

    // --------- LÓGICA PREMIUM / TRIAL CENTRALIZADA ---------

    // Aqui está o "acesso ilimitado":
    // enquanto o app estiver nessa fase, liberamos sempre.
    // enquanto o app estiver nessa fase, liberamos sempre.
    const canUsePremium = (): boolean => {
        if (FREE_DEV_MODE) return true;
        if (!user) return false;
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
        try {
            await authService.updateUser(updatedUser);
        } catch (error) {
            console.error('[AppContext] Erro ao ativar Premium:', error);
        }
    };

    // Alias usado nas páginas que chamam canInterpret()
    const canInterpret = (): boolean => {
        return canUsePremium();
    };

    // ------------------------------------------------------

    const addDream = async (
        text: string,
        result: any,
        source: 'text' | 'audio'
    ): Promise<string> => {
        if (!user && !FREE_DEV_MODE) throw new Error('User not logged in');

        const nowIso = new Date().toISOString();

        // Safe userId assignment - works with user logged in OR FREE_DEV_MODE
        const userId = user ? user.id : (FREE_DEV_MODE ? 'dev-guest' : 'unknown');

        // Map AI result fields to DreamEntry structure
        const newDream: Omit<DreamEntry, 'id'> = {
            userId,
            text,
            source,
            createdAt: nowIso,
            updatedAt: nowIso,

            // Fields from AI interpretation result
            dreamTitle: result?.dreamTitle || 'Sonho sem título',
            interpretationMain: result?.interpretationMain || '',
            symbols: result?.symbols || [],
            emotions: result?.emotions || [],
            lifeAreas: result?.lifeAreas || [],
            advice: result?.advice || '',
            tags: result?.tags || [],

            // Default flags
            isPremiumAnalysis: false,
            isFavorite: false,
            language: language as Language,
        };

        // Save to backend
        let id = 'dev-dream-' + Date.now();
        if (user || !FREE_DEV_MODE) {
            id = await dreamService.addDream(newDream);
        } else {
            console.log('[DEV MODE] Dream saved locally (mock):', newDream);
            // Save to localStorage so it persists after reload
            storageService.saveDream({ ...newDream, id } as DreamEntry);
        }

        const savedDream: DreamEntry = { ...newDream, id } as DreamEntry;

        // Update local state
        setDreams((prev) => [savedDream, ...prev]);

        // Update usage stats (counter only, no limits)
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
            try {
                await authService.updateUser(updatedUser);
            } catch (error) {
                console.error('[AppContext] Erro ao atualizar usage:', error);
            }
        }

        return id;
    };

    const toggleFavorite = async (id: string) => {
        const dream = dreams.find((d) => d.id === id);
        if (!dream) return;

        const updated = { ...dream, isFavorite: !dream.isFavorite };
        setDreams((prev) => prev.map((d) => (d.id === id ? updated : d)));

        try {
            await dreamService.updateDream(id, { isFavorite: updated.isFavorite });
        } catch (error) {
            console.error('[AppContext] Erro ao atualizar favorito:', error);
        }
    };

    const deleteDream = async (id: string) => {
        setDreams((prev) => prev.filter((d) => d.id !== id));
        try {
            await dreamService.deleteDream(id);
        } catch (error) {
            console.error('[AppContext] Erro ao deletar sonho:', error);
        }
    };

    const clearDreams = async () => {
        setDreams([]);
        try {
            if (user) {
                await dreamService.clearUserDreams(user.id);
            } else {
                storageService.clearDreams();
            }
        } catch (error) {
            console.error('[AppContext] Erro ao limpar histórico:', error);
        }
    };

    const setDailyMessage = (msg: string) => {
        const data: DailyMessageData = {
            date: new Date().toISOString().split('T')[0],
            message: msg,
        };
        setDailyMessageState(data);
        localStorage.setItem('dreamtells_daily_msg', JSON.stringify(data));
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
