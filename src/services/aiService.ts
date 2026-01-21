import { InterpretationResult, Language } from '../types';
import { FREE_DEV_MODE } from '../config/featureFlags';
import { hybridStorage } from './hybridStorage';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const DEFAULT_PROD_API_BASE_URL = 'https://dreamtells-backend.onrender.com';
const DEFAULT_STAGING_API_BASE_URL = 'https://dreamtells-staging.onrender.com'; // Criaremos este no Render

// Render pode ter cold start + chamada IA pode demorar
const DEFAULT_TIMEOUT_MS = 60000;

// ✅ Deep questions: queremos 3, não 6
const DEEP_QUESTIONS_COUNT = 3;

// ✅ Normaliza idioma para backend (evita pt-BR / es-ES misturar)
const normalizeLangForBackend = (lang?: string): Language => {
    const raw = (lang || 'pt').toLowerCase().trim();
    if (raw.startsWith('pt')) return 'pt';
    if (raw.startsWith('es')) return 'es';
    if (raw.startsWith('en')) return 'en';
    if (raw.startsWith('fr')) return 'fr';
    if (raw.startsWith('it')) return 'it';
    if (raw.startsWith('de')) return 'de';
    return 'pt';
};

// ✅ Converte lista qualquer em 3 perguntas “âncora” (valem por 6)
const build3AnchorQuestions = (language: Language, _dreamText?: string): string[] => {
    // Pode ajustar o texto depois, mas já está “3 em 1”.
    // Cada pergunta cobre duas camadas: emoção + realidade / padrão + decisão / direção + ação
    if (language === 'es') {
        return [
            '¿Qué emoción principal te dejó este sueño al despertar y qué situación real de tu vida podría estar conectada con ella?',
            '¿Qué patrón o conflicto se repite aquí (en el sueño o en tu vida) y qué decisión estás evitando o postergando?',
            'Si el sueño fuera un “mensaje”, ¿qué acción concreta harías en las próximas 24–48 horas para alinearte con ese mensaje?'
        ];
    }
    if (language === 'en') {
        return [
            'What was the strongest emotion when you woke up, and what real-life situation might it be connected to?',
            'What recurring pattern/conflict shows up here, and what decision are you avoiding or delaying?',
            'If the dream were a “message”, what concrete action will you take in the next 24–48 hours to align with it?'
        ];
    }
    // pt (default)
    return [
        'Qual foi a emoção mais forte ao acordar e qual situação real da sua vida pode estar conectada a isso?',
        'Que padrão ou conflito se repete aqui (no sonho ou na sua vida) e qual decisão você está evitando ou adiando?',
        'Se este sonho fosse uma mensagem, qual ação concreta você vai fazer nas próximas 24–48 horas para se alinhar com ela?'
    ];
};

// ✅ Normaliza perguntas vindas do backend para 3
const normalizeDeepQuestionsTo3 = (questions: string[] | undefined, language: Language, dreamText?: string) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return build3AnchorQuestions(language, dreamText);
    }

    // Se veio menos de 3, completa com âncoras
    if (questions.length < DEEP_QUESTIONS_COUNT) {
        const anchors = build3AnchorQuestions(language, dreamText);
        const merged = [...questions];
        for (const q of anchors) {
            if (merged.length >= DEEP_QUESTIONS_COUNT) break;
            merged.push(q);
        }
        return merged.slice(0, DEEP_QUESTIONS_COUNT);
    }

    // Se veio 6 ou mais, substitui por 3 âncoras (mais fortes e consistentes)
    return build3AnchorQuestions(language, dreamText);
};

const generateEmotionalDiagnosisApi = async (payload: any): Promise<any> => {
    const safeLanguage = normalizeLangForBackend(payload?.language);

    const json = await fetchWithRetry<any>(
        EMOTIONAL_DIAG_API_URL,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,
                language: safeLanguage,
            }),
        },
        DEFAULT_TIMEOUT_MS,
        1
    );

    // Aceita vários formatos comuns de resposta
    if (json?.success === false) {
        throw new Error(json?.error || 'Falha ao gerar diagnóstico.');
    }

    return json?.data ?? json?.analysis ?? json;
};

const fetchJsonWithTimeout = async <T = any>(
    url: string,
    options: RequestInit,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> => {
    const startTime = Date.now();
    console.log(`[AI SERVICE] 🚀 Start Fetch: ${url} (timeout: ${timeoutMs}ms)`);

    const isNative = Capacitor.isNativePlatform();

    // =========================
    // ✅ NATIVE: usa HTTP nativo (bypassa CORS do WebView)
    // =========================
    if (isNative) {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms ao chamar ${url}`)), timeoutMs)
        );

        const reqPromise = (async () => {
            try {
                const method = (options.method || 'GET').toUpperCase();
                const headers = (options.headers || {}) as Record<string, string>;

                // Body JSON (se houver)
                let data: any = undefined;
                if (options.body) {
                    try {
                        data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
                    } catch {
                        data = options.body as any;
                    }
                }

                const resp = await CapacitorHttp.request({
                    url,
                    method,
                    headers,
                    data,
                    connectTimeout: timeoutMs,
                });

                const duration = Date.now() - startTime;
                console.log(`[AI SERVICE] ✅ Native Response: ${url} | Status: ${resp.status} | Time: ${duration}ms`);

                if (resp.status < 200 || resp.status >= 300) {
                    const details =
                        typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data ?? '');
                    console.error(`[AI SERVICE] ❌ Native Error ${resp.status}:`, details);
                    throw new Error(`HTTP ${resp.status}${details ? ` | ${details}` : ''}`);
                }

                return resp.data as T;
            } catch (err: any) {
                const duration = Date.now() - startTime;
                console.error(`[AI SERVICE] 💥 Native Network Error (${duration}ms):`, err);
                throw err;
            }
        })();

        return await Promise.race([reqPromise, timeoutPromise]);
    }

    // =========================
    // WEB: fetch normal (com AbortController)
    // =========================
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        const duration = Date.now() - startTime;
        console.log(`[AI SERVICE] ✅ Response: ${url} | Status: ${response.status} | Time: ${duration}ms`);

        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        if (!response.ok) {
            let details = '';
            try {
                details = isJson ? JSON.stringify(await response.json()) : await response.text();
            } catch {
                details = '';
            }
            console.error(`[AI SERVICE] ❌ Error ${response.status}:`, details);
            throw new Error(`HTTP ${response.status} ${response.statusText}${details ? ` | ${details}` : ''}`);
        }

        if (isJson) return (await response.json()) as T;

        const text = await response.text();
        // @ts-ignore
        return text as T;
    } catch (err: any) {
        const duration = Date.now() - startTime;

        if (err?.name === 'AbortError') {
            console.error(`[AI SERVICE] ⏳ Timeout (${duration}ms):`, url);
            throw new Error(`Timeout após ${timeoutMs}ms ao chamar ${url}`);
        }

        console.error(`[AI SERVICE] 💥 Network/Fetch Error (${duration}ms):`, err);
        throw err;
    } finally {
        clearTimeout(id);
    }
};

// ✅ Retry leve para falhas transitórias (sem exagero)
const fetchWithRetry = async <T = any>(
    url: string,
    options: RequestInit,
    timeoutMs: number,
    retries: number = 1
): Promise<T> => {
    try {
        return await fetchJsonWithTimeout<T>(url, options, timeoutMs);
    } catch (err: any) {
        const msg = String(err?.message || '');
        const transient =
            msg.includes('HTTP 502') ||
            msg.includes('HTTP 503') ||
            msg.includes('HTTP 504') ||
            msg.toLowerCase().includes('timeout');

        if (retries > 0 && transient) {
            console.warn(`[AI SERVICE] 🔁 Retry on transient error: ${msg}`);
            return await fetchJsonWithTimeout<T>(url, options, timeoutMs);
        }
        throw err;
    }
};

const resolveApiBaseUrl = (): string => {
    // @ts-ignore
    const envUrl = import.meta.env?.VITE_API_BASE_URL;
    if (envUrl) return envUrl;

    // @ts-ignore
    if (import.meta.env?.DEV) {
        // Se estiver no Android Emulator, localhost nao funciona. 
        // Precisa ser 10.0.2.2 para acessar a maquina host.
        if (Capacitor.getPlatform() === 'android') {
            return 'http://10.0.2.2:3000';
        }
        return 'http://localhost:3000';
    }

    // Se estivermos compilando para Staging (através de uma env variable)
    // @ts-ignore
    if (import.meta.env?.VITE_STAGING_MODE === 'true') {
        return DEFAULT_STAGING_API_BASE_URL;
    }

    return DEFAULT_PROD_API_BASE_URL;
};

const API_BASE_URL = resolveApiBaseUrl();

// @ts-ignore
if (import.meta.env?.DEV) {
    console.log('[AI SERVICE] API_BASE_URL =', API_BASE_URL);
}

const API_URL = `${API_BASE_URL}/api/interpretarSonho`;

const CONTEXT_API_URL = `${API_BASE_URL}/api/life-context`;
const DAILY_MESSAGE_API_URL = `${API_BASE_URL}/api/daily-message`;
const SYMBOL_API_URL = `${API_BASE_URL}/api/analyze-symbol`;
const DEEP_ANALYSIS_API_URL = `${API_BASE_URL}/api/analyze-deep`;
const DEEP_QUESTIONS_API_URL = `${API_BASE_URL}/api/deep-questions`;
const GLOBAL_ANALYSIS_API_URL = `${API_BASE_URL}/api/global-analysis`;
const EMOTIONAL_DIAG_API_URL = `${API_BASE_URL}/api/emotional-diagnosis`;

// ✅ Prewarm para reduzir cold start do Render (não quebra nada se falhar)
const prewarmBackend = async (): Promise<void> => {
    try {
        const healthUrl = `${API_BASE_URL}/health`;
        console.log('[AI SERVICE] 🔥 Prewarm:', healthUrl);

        // timeout curto só pra “acordar” o servidor
        await fetchWithRetry<any>(
            healthUrl,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } },
            8000,
            0
        );
    } catch (e) {
        // Ignora: prewarm é “nice to have”
        console.warn('[AI SERVICE] Prewarm failed (ignored):', e);
    }
};

const analyzeLifeContextApi = async (
    lifeText: string,
    dreams: any[],
    language: string,
    userId: string
): Promise<string> => {
    const safeDreams = Array.isArray(dreams) ? dreams : [];
    const safeLanguage = normalizeLangForBackend(language);

    const json = await fetchWithRetry<any>(
        CONTEXT_API_URL,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: userId,
                userId,
                lifeText,
                dreams: safeDreams,
                language: safeLanguage,
            }),
        },
        DEFAULT_TIMEOUT_MS,
        1
    );

    return json.analysis || json.data?.analysis || 'Análise indisponível.';
};

const generateDailyMessageApi = async (userId: string): Promise<any> => {
    const json = await fetchWithRetry<any>(
        DAILY_MESSAGE_API_URL,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        },
        DEFAULT_TIMEOUT_MS,
        1
    );

    return json;
};

const interpretDreamStub = async (text: string): Promise<InterpretationResult> => {
    console.log('[STUB] Analyzing dream (New Persona):', text);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                dreamTitle: 'O Grito Mudo',
                interpretationMain: `Há um peso esmagador no seu peito que este sonho está finalmente dando forma.

Você tem aguentado situações insustentáveis fingindo que "está tudo sob controle", mas seu inconsciente está gritando que o controle já se perdeu.

A verdade é que você não está cansado de fazer coisas; você está exausto de segurar uma máscara de força que já não lhe serve mais.

O sonho revela que sua exaustão não é apenas física, é um grito da sua alma pedindo para apenas 'ser'.

Qual é a única fraqueza que você jamais admitiria para ninguém, mas que se você soltasse, te faria respirar de novo?`,
                symbols: [
                    { name: 'Sala Vazia', meaning: 'O espaço que você esvaziou de si mesmo para caber nas expectativas dos outros.' },
                    { name: 'Grito sem Som', meaning: 'Todas as vezes que você disse "sim" quando sua alma gritava "não".' }
                ],
                emotions: ['Exaustão de papel', 'Solidão acompanhada', 'Desejo de verdade'],
                lifeAreas: ['Identidade', 'Limites', 'Saúde Emocional'],
                advice: 'Pare de ser forte por um dia. Apenas por hoje, deixe alguém cuidar de você.',
                tags: ['máscaras', 'limites', 'verdade interna'],
                language: 'pt',
            });
        }, 1500);
    });
};

const interpretDreamApi = async (
    text: string,
    userId: string,
    // isDevMode removido
    language: string = 'pt'
): Promise<InterpretationResult> => {
    const safeLanguage = normalizeLangForBackend(language);

    // ✅ dica prática: payload mínimo ajuda um pouco
    const json = await fetchWithRetry<any>(
        API_URL,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: userId,
                dreamText: text,
                premium: true,
                language: safeLanguage,
            }),
        },
        DEFAULT_TIMEOUT_MS,
        1
    );

    const data = json.data ?? json;

    return {
        dreamTitle: data.dreamTitle ?? 'Sonho sem título',
        interpretationMain: data.interpretationMain ?? '',
        symbols: data.symbols ?? [],
        emotions: data.emotions ?? [],
        lifeAreas: data.lifeAreas ?? [],
        advice: data.advice ?? '',
        tags: data.tags ?? [],
        language: (normalizeLangForBackend(data.language ?? safeLanguage)) as Language,
    };
};

const analyzeDeepDreamApi = async (
    dreamText: string,
    initialInterpretation: any,
    userAnswers: Record<number, string>,
    language: string
): Promise<{ analysis: any }> => {
    const safeLanguage = normalizeLangForBackend(language);

    console.log('[AI SERVICE] Calling Deep Analysis at:', DEEP_ANALYSIS_API_URL, `Lang: ${safeLanguage}`);

    const payload = { dreamText, initialInterpretation, userAnswers, language: safeLanguage };

    const json = await fetchWithRetry<any>(
        DEEP_ANALYSIS_API_URL,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        },
        DEFAULT_TIMEOUT_MS,
        1
    );

    const analysis =
        json?.analysis ??
        json?.data?.analysis ??
        json?.deepAnalysis ??
        json?.data ??
        json;

    if (!analysis || (typeof analysis === 'object' && Object.keys(analysis).length === 0)) {
        throw new Error('[Deep Analysis] Resposta vazia ou formato inesperado.');
    }

    return analysis;
};

const generateDeepQuestionsApi = async (dreamText: string, language: string): Promise<string[]> => {
    const safeLanguage = normalizeLangForBackend(language);

    try {
        const json = await fetchWithRetry<any>(
            DEEP_QUESTIONS_API_URL,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: dreamText, language: safeLanguage }),
            },
            DEFAULT_TIMEOUT_MS,
            1
        );

        const questions = json.questions || [];
        return normalizeDeepQuestionsTo3(questions, safeLanguage, dreamText);
    } catch (error) {
        console.error('[AI SERVICE] generateDeepQuestionsApi error:', error);
        // ✅ fallback já em 3 perguntas
        return build3AnchorQuestions(safeLanguage, dreamText);
    }
};

// ======================================================
// 🛑 HELPER: Limite Diário (3 sonhos/leitura)
// ======================================================
const DAILY_LIMIT = 3;

const getDailyUsageKey = (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return `dream_limit_${userId}_${today}`;
};

const checkDailyLimit = async (userId: string): Promise<void> => {
    try {
        const key = getDailyUsageKey(userId);
        const { value } = await Preferences.get({ key });
        const count = value ? parseInt(value, 10) : 0;

        if (count >= DAILY_LIMIT) {
            throw new Error(`Limite diário atingido! Você pode criar até ${DAILY_LIMIT} interpretações por dia. Volte amanhã!`);
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('Limite')) throw error;
        console.warn('[AI SERVICE] Erro ao verificar limite:', error);
    }
};

const incrementDailyLimit = async (userId: string): Promise<void> => {
    try {
        const key = getDailyUsageKey(userId);
        const { value } = await Preferences.get({ key });
        const count = value ? parseInt(value, 10) : 0;
        await Preferences.set({ key, value: (count + 1).toString() });
    } catch (error) {
        console.warn('[AI SERVICE] Erro ao incrementar limite:', error);
    }
};

export const aiService = {
    // ✅ para chamar no boot do app (ex.: AppContext initialize)
    prewarmBackend: async (): Promise<void> => {
        return await prewarmBackend();
    },

    analyzeDream: async (
        text: string,
        userId: string = 'dev-guest',
        language: string = 'pt'
    ): Promise<InterpretationResult> => {
        // @ts-ignore
        const isDevEnv = import.meta.env?.DEV;

        // 1. Verifica limite
        await checkDailyLimit(userId);

        try {
            // 🔹 INJEÇÃO DE CONTEXTO "MAPA DO INCONSCIENTE"
            let dreamTextWithContext = text;
            try {
                const map = await hybridStorage.getUnconsciousMap();
                if (map && (map.axisIdentity || map.axisSecurity)) {
                    const contextString = `
[ESTADO INTERNO (Use como LENTE SILENCIOSA para calibrar a interpretação. NÃO CITE estes dados):
1. IDENTIDADE: ${map.axisIdentity?.status || '?'} (${map.axisIdentity?.note || ''})
2. SEGURANÇA: ${map.axisSecurity?.status || '?'} (${map.axisSecurity?.note || ''})
3. VÍNCULO: ${(map.axisBond?.status || []).join(', ')} (${map.axisBond?.note || ''})
4. MOVIMENTO: ${map.axisMovement?.status || '?'} (${map.axisMovement?.note || ''})
5. DESEJO: ${map.axisDesire?.status || '?'} (${map.axisDesire?.note || ''})
6. ENERGIA: ${map.axisEnergy?.status || '?'} (${map.axisEnergy?.note || ''})
]`.trim();
                    dreamTextWithContext = `${text}\n\n${contextString}`;
                }
            } catch (err) {
                console.warn('[AI SERVICE] Falha ao carregar Mapa do Inconsciente:', err);
            }

            const result = await interpretDreamApi(dreamTextWithContext, userId, language);

            // 2. Incrementa se sucesso
            await incrementDailyLimit(userId);

            return result;
        } catch (error: any) {
            if (isDevEnv && FREE_DEV_MODE) {
                console.warn('[AI DEV FALLBACK] Erro na API real, usando STUB por ser DEV MODE:', error);
                const stub = await interpretDreamStub(text);
                await incrementDailyLimit(userId);
                return stub;
            }

            console.error('[AI ERROR] Real API failed:', error);
            throw error;
        }
    },

    analyzeDeepDream: async (
        dreamText: string,
        initialInterpretation: any,
        userAnswers: Record<number, string>,
        language: string = 'pt'
    ): Promise<any> => {
        return await analyzeDeepDreamApi(dreamText, initialInterpretation, userAnswers, language);
    },

    getDeepQuestions: async (dreamText: string, language: string = 'pt'): Promise<string[]> => {
        return await generateDeepQuestionsApi(dreamText, language);
    },

    analyzeGlobalDreams: async (dreams: any[]): Promise<any> => {
        const json = await fetchWithRetry<any>(
            GLOBAL_ANALYSIS_API_URL,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dreams }),
            },
            DEFAULT_TIMEOUT_MS,
            1
        );

        return json.analysis;
    },

    analyzeLifeContextWithDreams: async (
        lifeText: string,
        dreams: any[],
        language: string,
        userId: string = 'dev-guest'
    ): Promise<string> => {
        try {
            return await analyzeLifeContextApi(lifeText, dreams, language, userId);
        } catch (error) {
            console.error('[AI SERVICE] analyzeLifeContextWithDreams error:', error);
            return 'No momento, não foi possível analisar todo o seu contexto de vida.';
        }
    },

    transcribeAudio: async (_audioBlob: Blob): Promise<string> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve('Transcrição simulada: Eu estava voando sobre montanhas...'), 2000);
        });
    },

    generateDailyMessage: async (userId: string = 'dev-guest'): Promise<string> => {
        try {
            return await generateDailyMessageApi(userId);
        } catch (error) {
            console.error('[DAILY MESSAGE ERROR]', error);
            return 'Hoje é um convite para você dar um pequeno passo na direção da vida que deseja.';
        }
    },

    generateEmotionalDiagnosis: async (payload: any): Promise<any> => {
        return await generateEmotionalDiagnosisApi(payload);
    },

    analyzeSymbol: async (symbol: string, userId: string = 'dev-guest'): Promise<string> => {
        try {
            const json = await fetchWithRetry<any>(
                SYMBOL_API_URL,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, symbol }),
                },
                DEFAULT_TIMEOUT_MS,
                1
            );

            return json.analysis || json.data?.analysis || 'Análise indisponível.';
        } catch (error) {
            console.warn('[AI SERVICE] Symbol analysis fallback:', error);
            return `O símbolo "${symbol}" está associado a transformações profundas do inconsciente. (Resposta local por erro de conexão).`;
        }
    },
};
