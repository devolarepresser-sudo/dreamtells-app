import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import {
    Activity,
    Brain,
    Compass,
    Zap,
    Trophy,
    Shield,
    Star,
    Sparkles,
    AlertCircle,
    Share2,
    CheckCircle2,
    XCircle,
    PenLine,
    RefreshCcw,
    Lock,
} from 'lucide-react';

/**
 * Diagnóstico Emocional (Stats.tsx)
 * - Une: sonhos (histórico) + validações + texto do dia
 * - Gera um diagnóstico com IA (usando aiService.analyzeGlobalDreams)
 * - Cache diário + limite 2 diagnósticos/dia
 * - Funciona mesmo sem sonho novo (e até sem sonhos) usando texto do dia como “matéria-prima”
 *
 * IMPORTANTE:
 * - Não cria rotas novas
 * - Não mexe no backend
 * - Substitua o arquivo atual por este
 */

// -------------------- helpers --------------------
const normalizeText = (str: string) =>
    String(str || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const safeJsonParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

// Heurística rápida do “estado” a partir de emoções (se existirem)
const getSubconsciousDiagnosis = (dreams: any[]) => {
    const emotionCounts: Record<string, number> = {};
    const emotionDisplay: Record<string, string> = {};

    dreams.forEach((d) => {
        const arr = Array.isArray(d?.emotions) ? d.emotions : [];
        arr.forEach((e: string) => {
            const norm = normalizeText(e);
            if (!norm) return;
            emotionCounts[norm] = (emotionCounts[norm] || 0) + 1;
            if (!emotionDisplay[norm] || String(e).length > String(emotionDisplay[norm]).length) {
                emotionDisplay[norm] = String(e).trim();
            }
        });
    });

    const topEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => emotionDisplay[k] || k);

    let stateTitle = 'Equilíbrio / Indefinido';
    let stateDesc = 'Seus registros ainda não mostram um padrão dominante claro.';
    let stateColor = '#64748B';
    let StateIcon: any = Compass;

    const keywords = {
        alerta: ['medo', 'ansiedade', 'perseguicao', 'pânico', 'panico', 'susto', 'ameaça', 'ameaca'],
        transicao: ['confusao', 'estranho', 'viagem', 'novo', 'perdido', 'mudança', 'mudanca'],
        bloqueio: ['raiva', 'frustracao', 'preso', 'tristeza', 'morte', 'culpa', 'vergonha'],
        clareza: ['alegria', 'luz', 'voo', 'amor', 'paz', 'felicidade', 'alivio', 'alívio'],
    };

    const scores = { alerta: 0, transicao: 0, bloqueio: 0, clareza: 0 };
    Object.keys(emotionCounts).forEach((emo) => {
        const count = emotionCounts[emo];
        if (keywords.alerta.some((k) => emo.includes(normalizeText(k)))) scores.alerta += count;
        if (keywords.transicao.some((k) => emo.includes(normalizeText(k)))) scores.transicao += count;
        if (keywords.bloqueio.some((k) => emo.includes(normalizeText(k)))) scores.bloqueio += count;
        if (keywords.clareza.some((k) => emo.includes(normalizeText(k)))) scores.clareza += count;
    });

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
        if (scores.bloqueio === maxScore) {
            stateTitle = 'Bloqueio Emocional';
            stateDesc = 'Há sinais de frustração e emoções seguradas pedindo vazão e decisão.';
            stateColor = '#EF4444';
            StateIcon = Activity;
        } else if (scores.alerta === maxScore) {
            stateTitle = 'Estado de Alerta';
            stateDesc = 'Ansiedade/hipervigilância: algo pendente ou desconforto está te puxando por dentro.';
            stateColor = '#F59E0B';
            StateIcon = Zap;
        } else if (scores.transicao === maxScore) {
            stateTitle = 'Em Transição';
            stateDesc = 'Mudança interna em curso: confusão e novidade indicam reorganização de rota e identidade.';
            stateColor = '#8B5CF6';
            StateIcon = Brain;
        } else if (scores.clareza === maxScore) {
            stateTitle = 'Clareza & Conexão';
            stateDesc = 'Harmonia/expansão: sinais de direção e intuição mais nítida no seu caminho.';
            stateColor = '#10B981';
            StateIcon = Compass;
        }
    }

    return { stateTitle, stateDesc, stateColor, StateIcon, topEmotions };
};

// Conteúdo prático por estado (para validação e ação)
const getPracticalMeaning = (stateTitle: string) => {
    const map: Record<
        string,
        { bullets: string[]; claims: string[]; actionTitle: string; actionPlaceholder: string }
    > = {
        'Estado de Alerta': {
            bullets: [
                'Você está tentando prever o que pode dar errado (modo vigilância).',
                'Existe decisão pendente ou desconforto que você vem empurrando.',
                'Seu inconsciente está sinalizando: isso não some sozinho.',
            ],
            claims: [
                'Tenho evitado uma decisão importante.',
                'Sinto pressão interna / ansiedade sem “motivo claro”.',
                'Estou cansado de pensar e não agir.',
                'Sinto que algo está pendente e me cobrando.',
            ],
            actionTitle: 'Ação de hoje (2 min)',
            actionPlaceholder: 'Qual decisão você está evitando encarar? Escreva em 1 frase.',
        },
        'Bloqueio Emocional': {
            bullets: [
                'Você está segurando emoções para não explodir ou desabar.',
                'Há frustração repetida e sensação de estar preso.',
                'O inconsciente tenta “vazar” isso nos sonhos para aliviar o peso.',
            ],
            claims: [
                'Sinto que estou travado e não avanço.',
                'Tenho raiva/tristeza guardada que não expresso.',
                'Sinto que repito o mesmo padrão.',
                'Sinto que estou preso a uma situação.',
            ],
            actionTitle: 'Ação de hoje (2 min)',
            actionPlaceholder: 'O que você está segurando para evitar conflito? Escreva sem filtro.',
        },
        'Em Transição': {
            bullets: [
                'Você está mudando por dentro, mesmo sem organizar por fora.',
                'Confusão aqui é reestruturação de rumo e prioridades.',
                'Seu inconsciente está testando caminhos antes de você decidir.',
            ],
            claims: [
                'Sinto que minha vida está mudando e eu ainda não me adaptei.',
                'Estou confuso sobre o próximo passo.',
                'Quero recomeçar, mas temo o “depois”.',
                'Sinto que algo novo está nascendo em mim.',
            ],
            actionTitle: 'Ação de hoje (2 min)',
            actionPlaceholder: 'Qual próximo passo pequeno faria sentido hoje?',
        },
        'Clareza & Conexão': {
            bullets: [
                'Você está mais alinhado com sua intuição e com o que importa.',
                'Há sinais de expansão: coragem, paz, direção.',
                'O inconsciente reforça confiança e conexão.',
            ],
            claims: [
                'Sinto mais esperança e direção.',
                'Tenho sentido paz em momentos que antes eu não tinha.',
                'Estou mais conectado comigo mesmo.',
                'Estou construindo algo melhor.',
            ],
            actionTitle: 'Ação de hoje (2 min)',
            actionPlaceholder: 'O que você quer reforçar nessa fase? Escreva 1 compromisso simples para hoje.',
        },
        'Equilíbrio / Indefinido': {
            bullets: [
                'Sinais distribuídos: ainda não há padrão dominante claro.',
                'Pode ser estabilidade ou falta de dados.',
                'Com mais registros, o diagnóstico fica mais nítido.',
            ],
            claims: [
                'Sinto que estou em uma fase neutra/estável.',
                'Me sinto confuso, mas sem intensidade.',
                'Sinto que falta clareza do que estou vivendo.',
                'Quero entender melhor meus padrões.',
            ],
            actionTitle: 'Ação de hoje (2 min)',
            actionPlaceholder: 'Como você está hoje, em poucas palavras? (ex: cansado, pressionado, sem foco)',
        },
    };

    return map[stateTitle] || map['Equilíbrio / Indefinido'];
};

type YesNo = 'yes' | 'no';
type DailyValidation = Record<number, YesNo | null>;

const DIAG_LIMIT_PER_DAY = 2;

const Stats: React.FC = () => {
    const { dreams } = useApp();

    // -------------------- diagnóstico (controle de estado) --------------------
    const [diagError, setDiagError] = useState<string | null>(null);
    const [isGeneratingDiagnosis, setIsGeneratingDiagnosis] = useState(false);

    const handleGenerateDiagnosis = async () => {
        console.log("[DIAG] start - clicked");

        // 🔴 LOG 1
        console.log("[DIAG] before cache/limit checks");

        try {
            setIsGeneratingDiagnosis(true);
            setDiagError(null);

            // 🔴 LOG 2
            console.log("[DIAG] passed state setup");

            // ⚠️ COMENTE TEMPORARIAMENTE QUALQUER BLOCO DE CACHE/LIMITE
            /*
            if (cachedSomething) {
              return;
            }
            if (diagCount >= DIAG_LIMIT_PER_DAY) {
              return;
            }
            */

            // 🔴 LOG 3
            console.log("[DIAG] calling aiService NOW");

            const response = await aiService.analyzeGlobalDreams({
                test: true,
            });

            // 🔴 LOG 4
            console.log("[DIAG] aiService response", response);

        } catch (err) {
            console.error("[DIAG] error", err);
            setDiagError(String(err));
        } finally {
            setIsGeneratingDiagnosis(false);
        }
    };


    // Heurística de estado (rápido)
    const heuristic = useMemo(() => getSubconsciousDiagnosis(Array.isArray(dreams) ? dreams : []), [dreams]);
    const { stateTitle, stateDesc, stateColor, StateIcon, topEmotions } = heuristic;
    const practical = useMemo(() => getPracticalMeaning(stateTitle), [stateTitle]);

    // Chaves diárias
    const todayKey = useMemo(() => getTodayKey(), []);
    const diagCountKey = `dreamtells_emodiag_count_${todayKey}`;
    const diagCacheKey = `dreamtells_emodiag_cache_${todayKey}`;
    const validationKey = `dreamtells_emodiag_validation_${todayKey}`;
    const microKey = `dreamtells_emodiag_micro_${todayKey}`;

    // Limite de diagnósticos/dia
    const [diagCount, setDiagCount] = useState<number>(() => Number(localStorage.getItem(diagCountKey) || 0));
    const canGenerate = diagCount < DIAG_LIMIT_PER_DAY;

    // Texto do dia (entrada do usuário)
    const [todayText, setTodayText] = useState<string>(() => safeJsonParse<string>(localStorage.getItem(microKey), ''));
    const [todaySaved, setTodaySaved] = useState<boolean>(() => !!localStorage.getItem(microKey));

    // Validações
    const [validation, setValidation] = useState<DailyValidation>(() =>
        safeJsonParse<DailyValidation>(localStorage.getItem(validationKey), {})
    );

    // Diagnóstico IA (cache diário)
    const [diagnosisAI, setDiagnosisAI] = useState<any>(() =>
        safeJsonParse<any>(localStorage.getItem(diagCacheKey), null)
    );

    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // Modal do “fase de vida” (usamos como motor de diagnóstico IA — já funciona no seu backend)
    const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);

    const actionRef = useRef<HTMLDivElement | null>(null);

    // Coerência (validação sim/não)
    const coherence = useMemo(() => {
        const values = Object.values(validation).filter((v) => v === 'yes' || v === 'no') as YesNo[];
        const yesCount = values.filter((v) => v === 'yes').length;
        const noCount = values.filter((v) => v === 'no').length;
        const total = yesCount + noCount;
        if (!total) return null;
        return Math.round((yesCount / total) * 100);
    }, [validation]);

    // Texto curto “diagnóstico do dia” (heurística)
    const heuristicSummary = useMemo(() => {
        const top = topEmotions?.[0];
        if (!Array.isArray(dreams) || dreams.length === 0) {
            return `Hoje você está em **${stateTitle}**. Mesmo sem sonhos novos, você pode registrar como está e gerar direção prática.`;
        }
        if (!top) return `Hoje você está em **${stateTitle}**. Registre mais emoções nos sonhos para melhorar a precisão.`;
        return `Hoje você está em **${stateTitle}**, puxado principalmente por **"${top}"**.`;
    }, [dreams, stateTitle, topEmotions]);

    // Salvar texto do dia (sem IA)
    const handleSaveTodayText = () => {
        const txt = (todayText || '').trim();
        if (!txt) {
            alert('Escreva pelo menos uma frase.');
            return;
        }
        localStorage.setItem(microKey, JSON.stringify(txt));
        setTodaySaved(true);
    };

    // Limpar texto do dia
    const handleClearTodayText = () => {
        setTodayText('');
        setTodaySaved(false);
        localStorage.removeItem(microKey);
    };

    // Marcar validações
    const setClaim = (idx: number, value: YesNo) => {
        setValidation((prev) => {
            const next: DailyValidation = { ...prev, [idx]: prev[idx] === value ? null : value };
            localStorage.setItem(validationKey, JSON.stringify(next));
            return next;
        });
    };

    // Monta “sonhos recentes” (robusto: tenta pegar texto/interpretação/insights se existirem)
    const recentDreams = useMemo(() => {
        const list = Array.isArray(dreams) ? dreams.slice(-5) : [];
        return list.map((d: any) => ({
            dreamText: d?.dreamText || d?.text || d?.dream || d?.sonho || '',
            dreamTitle: d?.dreamTitle || d?.title || '',
            interpretationMain: d?.interpretationMain || d?.interpretation || d?.analysis || '',
            advice: d?.advice || '',
            emotions: Array.isArray(d?.emotions) ? d.emotions : [],
            createdAt: d?.createdAt || d?.date || d?.timestamp || null,
        }));
    }, [dreams]);

    // Se não tiver sonhos, cria uma “base” pra IA usar (pra não bloquear hábito)
    const dreamsForAI = useMemo(() => {
        if (recentDreams.length >= 2) return recentDreams;

        // Garante pelo menos 2 itens pro backend não recusar (se ele exigir 2)
        const baseText = (todayText || '').trim() || 'Sem sonho registrado hoje. Quero diagnóstico emocional do meu estado atual.';
        const placeholder = {
            dreamText: baseText,
            dreamTitle: 'Registro do dia',
            interpretationMain: '',
            advice: '',
            emotions: [],
            createdAt: new Date().toISOString(),
        };

        if (recentDreams.length === 1) return [recentDreams[0], placeholder];
        return [placeholder, placeholder];
    }, [recentDreams, todayText]);

    // Geração IA: usa o motor existente (analyzeGlobalDreams) como “diagnóstico”
    // Ele vai retornar algo como: phaseTitle / archetype / summary / mainChallenge / advice
    const generateEmotionalDiagnosis = async () => {
        if (!canGenerate) {
            alert('Você já gerou os 2 diagnósticos de hoje.\n\nVolte amanhã para continuar seu acompanhamento.');
            return;
        }

        setIsGenerating(true);
        setAiError(null);

        try {
            // A ideia: “forçar contexto” pro modelo analisando sonhos + texto do dia + validações
            // Como o backend atual recebe só dreams, colocamos esses sinais dentro do array (bem leve, sem quebrar schema).
            const signals = {
                dreamText:
                    `SINAIS DO DIA (usar como contexto):\n` +
                    `- Estado (heurístico): ${stateTitle}\n` +
                    `- Emoções dominantes: ${(topEmotions || []).slice(0, 3).join(', ') || '—'}\n` +
                    `- Como estou hoje: ${(todayText || '').trim() || '—'}\n` +
                    `- Validações (sim/não): ${JSON.stringify(validation)}\n` +
                    `INSTRUÇÃO: gere um diagnóstico emocional claro e uma direção prática.\n`,
                dreamTitle: 'Contexto do dia (Diagnóstico Emocional)',
                interpretationMain: '',
                advice: '',
                emotions: [],
                createdAt: new Date().toISOString(),
            };

            const payloadDreams = [...dreamsForAI, signals];

            // Chama a IA já usada no app (backend atual)
            const result = await aiService.analyzeGlobalDreams(payloadDreams);

            setDiagnosisAI(result);
            localStorage.setItem(diagCacheKey, JSON.stringify(result));

            const nextCount = diagCount + 1;
            setDiagCount(nextCount);
            localStorage.setItem(diagCountKey, String(nextCount));

            setShowDeepAnalysis(false);
        } catch (err: any) {
            console.error('Erro ao gerar diagnóstico IA:', err);
            const msg = err?.message || 'Não foi possível gerar seu diagnóstico agora.';
            setAiError(msg);
            setDiagError(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    // Share do diagnóstico gerado
    const handleShare = async () => {
        if (!diagnosisAI) return;

        const title = diagnosisAI.phaseTitle || diagnosisAI.phaseName || 'Diagnóstico Emocional';
        const archetype = diagnosisAI.archetype || '—';
        const summary = diagnosisAI.summary || diagnosisAI.description || '';
        const challenge = diagnosisAI.mainChallenge || (Array.isArray(diagnosisAI.keyChallenges) ? diagnosisAI.keyChallenges[0] : '') || '';
        const guidance = diagnosisAI.advice || diagnosisAI.guidance || '';

        const textToShare =
            `✨ *Diagnóstico Emocional - DreamTells* ✨\n\n` +
            `🧠 *Diagnóstico:* ${title}\n` +
            `🛡️ *Arquétipo:* ${archetype}\n\n` +
            (summary ? `"${summary}"\n\n` : '') +
            (challenge ? `🚧 *Desafio:* ${challenge}\n\n` : '') +
            (guidance ? `✅ *Direção:* ${guidance}\n\n` : '') +
            `Volte amanhã e registre 1 frase do seu dia para refinar o diagnóstico.`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Meu Diagnóstico Emocional', text: textToShare });
            } catch {
                // ignore cancel
            }
        } else {
            try {
                await navigator.clipboard.writeText(textToShare);
                alert('Copiado para a área de transferência!');
            } catch {
                alert('Não foi possível copiar.');
            }
        }
    };

    // Auto-scroll para a ação
    const goToAction = () => actionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return (
        <Layout title="Diagnóstico Emocional" showBack icon={<Activity size={18} color="#F9FAFB" />}>
            <div style={{ flex: 1, position: 'relative' }}>
                {/* Card de estado (heurístico) */}
                <div
                    className="card"
                    style={{
                        marginBottom: 16,
                        background: `linear-gradient(135deg, ${stateColor}20, rgba(15, 23, 42, 0.6))`,
                        borderColor: `${stateColor}50`,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div
                            style={{
                                padding: 8,
                                borderRadius: '50%',
                                background: `${stateColor}30`,
                                color: stateColor,
                            }}
                        >
                            <StateIcon size={24} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#F8FAFC', fontWeight: 900, margin: 0 }}>{stateTitle}</h3>
                            <span style={{ color: 'rgba(226,232,240,0.75)', fontSize: '0.82rem', marginTop: 2 }}>
                                Hoje: {todayKey} • Sonhos no app: {Array.isArray(dreams) ? dreams.length : 0}
                            </span>
                        </div>
                    </div>

                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', fontSize: '0.95rem', margin: 0 }}>
                        {stateDesc}
                    </p>
                </div>

                {/* Resumo heurístico + botão ir pra ação */}
                <div
                    className="card"
                    style={{
                        marginBottom: 16,
                        background: 'linear-gradient(to right, #F8FAFC, #EFF6FF)',
                        borderLeft: '4px solid #3B82F6',
                        padding: 16,
                    }}
                >
                    <h3
                        style={{
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: '#3B82F6',
                            fontWeight: 900,
                            marginBottom: 8,
                        }}
                    >
                        Diagnóstico rápido
                    </h3>

                    <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: 14 }}>
                        {heuristicSummary}
                    </p>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={goToAction}
                            style={{
                                background: 'transparent',
                                border: '1px solid #3B82F6',
                                color: '#3B82F6',
                                borderRadius: 999,
                                padding: '8px 14px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <PenLine size={16} />
                            Escrever como estou hoje
                        </button>

                        <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 800 }}>
                            {false && (
                                <div className="diagMeta">
                                    Diagnósticos hoje: {diagCount}/{DIAG_LIMIT_PER_DAY}
                                </div>
                            )}
                        </span>
                    </div>
                </div>

                {/* Diagnóstico IA (resultado do dia) */}
                <div
                    className="card"
                    style={{
                        marginBottom: 16,
                        padding: 18,
                        background: diagnosisAI
                            ? 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)'
                            : 'rgba(15, 23, 42, 0.65)',
                        border: diagnosisAI ? '1px solid rgba(90, 62, 242, 0.4)' : `1px solid ${stateColor}30`,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {diagnosisAI ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                <Trophy size={22} color="#FBBF24" />
                                <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC', fontWeight: 900, margin: 0 }}>
                                    Diagnóstico do dia: {diagnosisAI.phaseTitle || diagnosisAI.phaseName || '—'}
                                </h3>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '4px 12px',
                                        borderRadius: 99,
                                        background: 'rgba(99, 102, 241, 0.15)',
                                        color: '#818CF8',
                                        fontSize: '0.85rem',
                                        fontWeight: 800,
                                        marginBottom: 10,
                                    }}
                                >
                                    <Shield size={14} />
                                    Arquétipo: {diagnosisAI.archetype || '—'}
                                </div>

                                <p style={{ color: '#CBD5E1', lineHeight: '1.7', fontSize: '0.95rem', margin: 0 }}>
                                    “{diagnosisAI.summary || diagnosisAI.description || '—'}”
                                </p>
                            </div>

                            {(diagnosisAI.mainChallenge || (Array.isArray(diagnosisAI.keyChallenges) && diagnosisAI.keyChallenges.length)) && (
                                <div
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: 14,
                                        padding: 14,
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        marginBottom: 12,
                                    }}
                                >
                                    <h4
                                        style={{
                                            color: '#FCA5A5',
                                            fontSize: '0.9rem',
                                            fontWeight: 900,
                                            marginBottom: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <AlertCircle size={16} />
                                        Ponto crítico agora
                                    </h4>
                                    <p style={{ color: '#E2E8F0', fontSize: '0.92rem', margin: 0 }}>
                                        {diagnosisAI.mainChallenge ||
                                            (Array.isArray(diagnosisAI.keyChallenges) ? diagnosisAI.keyChallenges[0] : '')}
                                    </p>
                                </div>
                            )}

                            <div
                                style={{
                                    background: 'linear-gradient(90deg, rgba(90, 62, 242, 0.1), transparent)',
                                    padding: 14,
                                    borderLeft: '3px solid #6366F1',
                                    borderRadius: 12,
                                }}
                            >
                                <h4 style={{ color: '#A5B4FC', fontSize: '0.9rem', fontWeight: 900, marginBottom: 6 }}>
                                    Direção prática
                                </h4>
                                <p style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                                    {diagnosisAI.advice || diagnosisAI.guidance || '—'}
                                </p>

                                <p style={{ marginTop: 10, color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                    Gancho: volte amanhã e registre 1 frase do seu dia. Eu refino a direção com mais precisão.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleShare}
                                    style={{
                                        flex: 1,
                                        minWidth: 190,
                                        padding: '12px 14px',
                                        borderRadius: 14,
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                                        color: '#FFFFFF',
                                        cursor: 'pointer',
                                        fontWeight: 900,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                    }}
                                >
                                    <Share2 size={18} />
                                    Compartilhar
                                </motion.button>

                                <button
                                    onClick={() => setShowDeepAnalysis(true)}
                                    style={{
                                        flex: 1,
                                        minWidth: 190,
                                        padding: '12px 14px',
                                        borderRadius: 14,
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        background: 'rgba(255,255,255,0.04)',
                                        color: '#E2E8F0',
                                        cursor: 'pointer',
                                        fontWeight: 900,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                    }}
                                >
                                    <RefreshCcw size={18} />
                                    Atualizar diagnóstico (IA)
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 style={{ fontSize: '1.1rem', color: '#F8FAFC', fontWeight: 900, marginBottom: 8 }}>
                                Diagnóstico Emocional (IA)
                            </h3>
                            <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: 14 }}>
                                Gere um diagnóstico que une seus sonhos + o que você está vivendo hoje. Ele te dá direção prática e cria um gancho real
                                para voltar amanhã.
                            </p>

                            <button
                                onClick={() => setShowDeepAnalysis(true)}
                                style={{
                                    width: '100%',
                                    background: `linear-gradient(135deg, #5A3EF2, #4338CA)`,
                                    border: 'none',
                                    color: '#F8FAFC',
                                    borderRadius: 14,
                                    padding: '14px 16px',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    fontWeight: 900,
                                    boxShadow: `0 12px 30px rgba(79, 70, 229, 0.35)`,
                                }}
                            >
                                <Sparkles size={18} />
                                Gerar diagnóstico agora
                            </button>

                            {aiError && (
                                <p style={{ marginTop: 10, color: '#FCA5A5', fontSize: '0.9rem', fontWeight: 800 }}>
                                    {aiError}
                                </p>
                            )}
                        </>
                    )}

                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 800 }}>
                            {false && (
                                <div className="diagMeta">
                                    Diagnósticos hoje: {diagCount}/{DIAG_LIMIT_PER_DAY}
                                </div>
                            )}
                        </span>
                        {false && (
                            <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 800 }}>
                                {canGenerate ? 'Restam chamadas hoje' : 'Limite atingido hoje'}
                            </span>
                        )}
                    </div>
                </div>

                {/* O QUE ISSO SIGNIFICA NA PRÁTICA */}
                <div
                    className="card"
                    style={{
                        marginBottom: 16,
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: `1px solid ${stateColor}30`,
                    }}
                >
                    <h3 style={{ marginBottom: 10, fontSize: '1.05rem', color: '#F8FAFC', fontWeight: 900 }}>
                        O que isso significa na prática
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#CBD5E1', lineHeight: '1.7', fontSize: '0.95rem' }}>
                        {practical.bullets.map((b, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                                {b}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* VALIDAÇÃO */}
                <div
                    className="card"
                    style={{
                        marginBottom: 16,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <h3 style={{ marginBottom: 10, fontSize: '1.05rem', color: '#F8FAFC', fontWeight: 900 }}>
                        Isso está acontecendo com você?
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {practical.claims.map((c, idx) => {
                            const v = validation[idx] || null;
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        padding: 12,
                                        borderRadius: 14,
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        background: 'rgba(15, 23, 42, 0.55)',
                                    }}
                                >
                                    <div style={{ color: '#E2E8F0', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: 10 }}>
                                        {c}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            onClick={() => setClaim(idx, 'yes')}
                                            style={{
                                                flex: 1,
                                                borderRadius: 12,
                                                padding: '10px 12px',
                                                border: '1px solid rgba(34,197,94,0.35)',
                                                background: v === 'yes' ? 'rgba(34,197,94,0.18)' : 'rgba(0,0,0,0.0)',
                                                color: v === 'yes' ? '#BBF7D0' : '#94A3B8',
                                                fontWeight: 900,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <CheckCircle2 size={18} />
                                            É isso
                                        </button>
                                        <button
                                            onClick={() => setClaim(idx, 'no')}
                                            style={{
                                                flex: 1,
                                                borderRadius: 12,
                                                padding: '10px 12px',
                                                border: '1px solid rgba(239,68,68,0.35)',
                                                background: v === 'no' ? 'rgba(239,68,68,0.16)' : 'rgba(0,0,0,0.0)',
                                                color: v === 'no' ? '#FECACA' : '#94A3B8',
                                                fontWeight: 900,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <XCircle size={18} />
                                            Não bate
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 800 }}>Validação: {todayKey}</span>
                        <span style={{ color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 900 }}>
                            {coherence === null ? 'Coerência: —' : `Coerência: ${coherence}%`}
                        </span>
                    </div>
                </div>

                {/* AÇÃO DO DIA (texto do usuário) */}
                <div
                    ref={actionRef}
                    className="card"
                    style={{
                        marginBottom: 18,
                        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.92), ${stateColor}10)`,
                        border: `1px solid ${stateColor}35`,
                    }}
                >
                    <h3 style={{ marginBottom: 10, fontSize: '1.05rem', color: '#F8FAFC', fontWeight: 950 }}>
                        {practical.actionTitle}
                    </h3>

                    <p style={{ marginTop: 0, marginBottom: 12, color: '#94A3B8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Escreva só 1 frase honesta. Mesmo sem sonho novo, isso alimenta o diagnóstico com precisão.
                    </p>

                    <textarea
                        value={todayText}
                        onChange={(e) => {
                            setTodayText(e.target.value);
                            setTodaySaved(false);
                        }}
                        placeholder={practical.actionPlaceholder}
                        style={{
                            width: '100%',
                            minHeight: 110,
                            borderRadius: 14,
                            padding: 12,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#E2E8F0',
                            outline: 'none',
                            resize: 'vertical',
                            lineHeight: '1.5',
                            fontSize: '0.95rem',
                        }}
                    />

                    <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                        <button
                            onClick={handleSaveTodayText}
                            style={{
                                flex: 1,
                                minWidth: 180,
                                padding: '12px 14px',
                                borderRadius: 14,
                                border: 'none',
                                background: `linear-gradient(90deg, ${stateColor}, rgba(99, 102, 241, 0.85))`,
                                color: '#FFFFFF',
                                fontWeight: 950,
                                cursor: 'pointer',
                            }}
                        >
                            Salvar reflexão
                        </button>

                        <button
                            onClick={handleClearTodayText}
                            style={{
                                padding: '12px 14px',
                                borderRadius: 14,
                                border: '1px solid rgba(255,255,255,0.10)',
                                background: 'transparent',
                                color: '#94A3B8',
                                fontWeight: 900,
                                cursor: 'pointer',
                            }}
                        >
                            Limpar
                        </button>
                    </div>

                    {todaySaved && (
                        <div
                            style={{
                                marginTop: 10,
                                padding: 10,
                                borderRadius: 12,
                                background: 'rgba(34,197,94,0.10)',
                                border: '1px solid rgba(34,197,94,0.18)',
                                color: '#BBF7D0',
                                fontSize: '0.9rem',
                                fontWeight: 900,
                            }}
                        >
                            Salvo. Use isso para gerar o diagnóstico (IA). Amanhã, volte e registre outra frase para refinar.
                        </div>
                    )}
                </div>

                {/* Predomínio emocional (compacto, sem gráfico) */}
                <div className="card" style={{ marginBottom: 10 }}>
                    <h3 style={{ marginBottom: 14, fontSize: '1.1rem' }}>Predomínio Emocional</h3>

                    {topEmotions.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {topEmotions.map((tag, i) => (
                                <span
                                    key={i}
                                    style={{
                                        background: '#F7FAFC',
                                        padding: '8px 16px',
                                        borderRadius: 20,
                                        fontSize: '0.9rem',
                                        color: '#334155',
                                        border: '1px solid #E2E8F0',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
                            Sem emoções detectadas ainda. Registre sonhos (quando tiver) para aumentar precisão.
                        </p>
                    )}
                </div>

                {/* MODAL: Geração IA com limite 2/dia */}
                {showDeepAnalysis && (
                    <div
                        onClick={() => setShowDeepAnalysis(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.55)',
                            zIndex: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(4px)',
                            padding: 16,
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: 420,
                                background: 'rgba(15, 23, 42, 0.95)',
                                borderRadius: 16,
                                padding: 24,
                                border: `1px solid ${stateColor}55`,
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: `${stateColor}20`,
                                    color: stateColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <Zap size={24} fill={stateColor} fillOpacity={0.2} />
                            </div>

                            <h3
                                style={{
                                    fontSize: '1.25rem',
                                    color: '#F8FAFC',
                                    marginBottom: 10,
                                    fontWeight: 900,
                                }}
                            >
                                Diagnóstico Emocional (IA)
                            </h3>

                            <p
                                style={{
                                    fontSize: '0.95rem',
                                    color: '#CBD5E1',
                                    lineHeight: '1.6',
                                    marginBottom: 18,
                                }}
                            >
                                Você pode gerar <b>até 2 diagnósticos por dia</b>. Quanto mais você registrar como está hoje, mais
                                precisa fica a direção.
                            </p>

                            <div
                                style={{
                                    width: '100%',
                                    borderRadius: 14,
                                    padding: 12,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#94A3B8',
                                    fontSize: '0.9rem',
                                    marginBottom: 16,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span>Hoje</span>
                                <span style={{ fontWeight: 900, color: '#E2E8F0' }}>
                                    {diagCount}/{DIAG_LIMIT_PER_DAY}
                                </span>
                            </div>

                            {diagCount >= DIAG_LIMIT_PER_DAY && (
                                <div
                                    style={{
                                        width: '100%',
                                        borderRadius: 14,
                                        padding: 12,
                                        background: 'rgba(239,68,68,0.10)',
                                        border: '1px solid rgba(239,68,68,0.20)',
                                        color: '#FECACA',
                                        fontSize: '0.9rem',
                                        fontWeight: 800,
                                        marginBottom: 14,
                                    }}
                                >
                                    Limite diário atingido. Volte amanhã para refinar o diagnóstico com mais clareza.
                                </div>
                            )}

                            {diagError && (
                                <div
                                    style={{
                                        width: '100%',
                                        borderRadius: 14,
                                        padding: 12,
                                        background: 'rgba(239,68,68,0.10)',
                                        border: '1px solid rgba(239,68,68,0.20)',
                                        color: '#FECACA',
                                        fontSize: '0.9rem',
                                        fontWeight: 800,
                                        marginBottom: 14,
                                    }}
                                >
                                    {diagError}
                                </div>
                            )}

                            <button
                                onClick={generateEmotionalDiagnosis}
                                disabled={isGenerating || diagCount >= DIAG_LIMIT_PER_DAY}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: 14,
                                    background:
                                        isGenerating || diagCount >= DIAG_LIMIT_PER_DAY
                                            ? '#334155'
                                            : 'linear-gradient(90deg, #4F46E5, #4338CA)',
                                    color: isGenerating || diagCount >= DIAG_LIMIT_PER_DAY ? '#94A3B8' : '#FFFFFF',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 900,
                                    cursor:
                                        isGenerating || diagCount >= DIAG_LIMIT_PER_DAY ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                }}
                            >
                                {isGenerating ? (
                                    <>
                                        <Sparkles size={18} className="animate-spin" />
                                        Gerando diagnóstico...
                                    </>
                                ) : (
                                    <>
                                        <Star size={18} fill="currentColor" />
                                        Gerar diagnóstico agora
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setShowDeepAnalysis(false)}
                                style={{
                                    marginTop: 12,
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#64748B',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Stats;

