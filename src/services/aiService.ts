import { InterpretationResult, Language } from '../types';
import { FREE_DEV_MODE } from '../config/featureFlags';

/**
 * URL padrão de PRODUÇÃO da API (Beacons / backend real).
 *
 * TROQUE ESSA STRING pela URL REAL do seu backend,
 * por exemplo:
 *
 *   'https://meu-backend-no-beacons.com'
 *
 * Sem barra no final.
 */
const DEFAULT_PROD_API_BASE_URL = 'https://SEU-ENDPOINT-BEACONS-AQUI.com';

/**
 * Resolve a URL base da API:
 * 1) Tenta ler VITE_API_URL do ambiente (.env, build, etc.).
 * 2) Se não existir ou estiver vazia, usa o fallback de produção
 *    (DEFAULT_PROD_API_BASE_URL) — isso garante que o APK funcione
 *    mesmo sem .env.
 */
const resolveApiBaseUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;

    const base =
        envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0
            ? envUrl.trim()
            : DEFAULT_PROD_API_BASE_URL;

    // remove barras sobrando no final
    return base.replace(/\/+$/, '');
};

const API_BASE_URL = resolveApiBaseUrl();

// Debug em desenvolvimento para conferir qual URL está sendo usada
if (import.meta.env.DEV) {
    console.log('[AI SERVICE] API_BASE_URL =', API_BASE_URL);
}

// Endpoint principal de interpretação de sonho
const API_URL = `${API_BASE_URL}/api/interpretarSonho`;

// Endpoints novos padronizados
const CONTEXT_API_URL = `${API_BASE_URL}/api/life-context`;
const DAILY_MESSAGE_API_URL = `${API_BASE_URL}/api/daily-message`;
const SYMBOL_API_URL = `${API_BASE_URL}/api/analyze-symbol`; // Novo endpoint

// =========================
// STUB: interpretação falsa
// =========================
const interpretDreamStub = async (text: string): Promise<InterpretationResult> => {
    console.log('[STUB] Analyzing dream:', text);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                dreamTitle: 'Sonho de Teste Stub',
                interpretationMain:
                    'Esta é uma interpretação simulada pelo stub de IA. O sonho parece indicar um desejo de validação e testes rigorosos. Você está no caminho certo para finalizar a auditoria.',
                symbols: [
                    {
                        name: 'Computador',
                        meaning: 'Trabalho, lógica e processamento de informações.',
                    },
                    {
                        name: 'Código',
                        meaning: 'Estrutura, regras e a linguagem oculta das coisas.',
                    },
                ],
                emotions: ['Curiosidade', 'Determinação', 'Foco'],
                lifeAreas: ['Carreira', 'Intelecto'],
                advice:
                    'Continue testando meticulosamente para garantir a qualidade máxima do produto final.',
                tags: ['teste', 'stub', 'dev'],
                language: 'pt',
            });
        }, 1500);
    });
};

// ======================================
// API REAL: interpretação de sonhos (GPT)
// ======================================
const interpretDreamApi = async (
    text: string,
    userId: string,
    isDevMode: boolean
): Promise<InterpretationResult> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uid: userId,
            dreamText: text,
            premium: !isDevMode,
        }),
    });

    if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const data = json.data;

    return {
        dreamTitle: data.dreamTitle ?? 'Sonho sem título',
        interpretationMain: data.interpretationMain ?? '',
        symbols: data.symbols ?? [],
        emotions: data.emotions ?? [],
        lifeAreas: data.lifeAreas ?? [],
        advice: data.advice ?? '',
        tags: data.tags ?? [],
        language: (data.language ?? 'pt') as Language,
    };
};

// ======================================
// API REAL: contexto de vida + sonhos
// ======================================
const analyzeLifeContextApi = async (
    lifeText: string,
    dreams: any[],
    language: string,
    userId: string
): Promise<string> => {
    const safeDreams = Array.isArray(dreams) ? dreams : [];
    const safeLanguage = language || 'pt-BR';

    const response = await fetch(CONTEXT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            uid: userId, // mantido por compatibilidade
            userId, // enviado também como userId “limpo”
            lifeText,
            dreams: safeDreams,
            language: safeLanguage,
        }),
    });

    if (!response.ok) {
        throw new Error(`Context API error: ${response.status}`);
    }

    const json = await response.json();
    // backend deve idealmente devolver { analysis: string }
    return json.analysis || json.data?.analysis || 'Análise indisponível.';
};

// ======================================
// API REAL: mensagem diária
// ======================================
const generateDailyMessageApi = async (userId: string): Promise<string> => {
    const response = await fetch(DAILY_MESSAGE_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
        throw new Error(`Daily Message API error: ${response.status}`);
    }

    const json = await response.json();
    // backend deve idealmente devolver { message: string }
    return json.message || json.data?.message || 'Mensagem indisponível.';
};

// =====================
// Serviço público de IA
// =====================
export const aiService = {
    // Interpretação de sonhos
    analyzeDream: async (
        text: string,
        userId: string = 'dev-guest'
    ): Promise<InterpretationResult> => {
        const isDevMode = FREE_DEV_MODE === true;

        try {
            return await interpretDreamApi(text, userId, isDevMode);
        } catch (error) {
            console.error('[AI ERROR] Falling back to STUB:', error);
            return await interpretDreamStub(text);
        }
    },

    // Contexto de vida com sonhos
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
            // Fallback: NUNCA deixa erro subir pro React
            return 'No momento, não foi possível analisar todo o seu contexto de vida. Mas o simples fato de você parar, escrever e olhar para isso já é um passo enorme de consciência.';
        }
    },

    // Stub de transcrição (simulado)
    transcribeAudio: async (audioBlob: Blob): Promise<string> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('Transcrição simulada: Eu estava voando sobre montanhas...');
            }, 2000);
        });
    },

    // Mensagem do dia
    generateDailyMessage: async (
        userId: string = 'dev-guest'
    ): Promise<string> => {
        try {
            return await generateDailyMessageApi(userId);
        } catch (error) {
            console.error('[DAILY MESSAGE ERROR]', error);
            // Fallback para não quebrar tela
            return 'Hoje é um convite para você dar um pequeno passo na direção da vida que deseja. Confie no processo e cuide de si com carinho.';
        }
    },

    // Análise profunda de Símbolo
    analyzeSymbol: async (
        symbol: string,
        userId: string = 'dev-guest'
    ): Promise<string> => {
        try {
            const response = await fetch(SYMBOL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, symbol }),
            });

            if (!response.ok) {
                // Se der 404 ou erro, faz fallback para um stub educativo
                throw new Error('Symbol API error');
            }

            const json = await response.json();
            return json.analysis || json.data?.analysis || 'Análise indisponível.';
        } catch (error) {
            console.warn('[AI SERVICE] Symbol analysis fallback:', error);
            return `O símbolo "${symbol}" carrega significados profundos no inconsciente coletivo. Frequentemente está associado a transformações internas e aspectos ocultos da psique que buscam integração. (Nota: Resposta gerada localmente devido a erro de conexão).`;
        }
    },
};
