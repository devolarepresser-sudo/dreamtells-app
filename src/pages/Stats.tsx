import { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import {
    Share2,
    CheckCircle2,
    XCircle,
    PenLine,
    RefreshCw,
    Copy,
    Send,
    X,
    Sparkles,
    Activity,
    Shield,
    Trophy,
    Compass,
    Brain,
    Zap,
    AlertCircle,
    Image as ImageIcon
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { hybridStorage } from '../services/hybridStorage';
import { generateStoryCard } from '../services/shareService';
import { getLocalDateString } from '../utils/dateUtils';

/**
 * Diagnóstico Emocional (Stats.tsx)
 * - Une: sonhos (histórico) + validações + texto do dia
 * - Gera um diagnóstico com IA (usando aiService.analyzeGlobalDreams)
 * - Cache diário + limite 2 diagnósticos/dia
 * - Funciona mesmo sem sonho novo (e até sem sonhos) usando texto do dia como “matéria-prima”
 */

// -------------------- helpers --------------------
const normalizeText = (str: string) =>
    String(str || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const getTodayKey = () => getLocalDateString();

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

    let stateKey = 'stats_state_balanced';
    let stateTitleKey = 'stats_state_balanced';
    let stateDescKey = 'stats_state_desc_balanced';
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
            stateKey = 'stats_state_blocked';
            stateTitleKey = 'stats_state_blocked';
            stateDescKey = 'stats_state_desc_blocked';
            stateColor = '#EF4444';
            StateIcon = Activity;
        } else if (scores.alerta === maxScore) {
            stateKey = 'stats_state_alert';
            stateTitleKey = 'stats_state_alert';
            stateDescKey = 'stats_state_desc_alert';
            stateColor = '#F59E0B';
            StateIcon = Zap;
        } else if (scores.transicao === maxScore) {
            stateKey = 'stats_state_transition';
            stateTitleKey = 'stats_state_transition';
            stateDescKey = 'stats_state_desc_transition';
            stateColor = '#8B5CF6';
            StateIcon = Brain;
        } else if (scores.clareza === maxScore) {
            stateKey = 'stats_state_clarity';
            stateTitleKey = 'stats_state_clarity';
            stateDescKey = 'stats_state_desc_clarity';
            stateColor = '#10B981';
            StateIcon = Compass;
        }
    }

    return { stateKey, stateTitleKey, stateDescKey, stateColor, StateIcon, topEmotions };
};

// Conteúdo prático por estado (para validação e ação)
const getPracticalMeaning = (stateKey: string) => {
    const map: Record<
        string,
        { bulletsKeys: string[]; claimsKeys: string[]; actionTitleKey: string; actionPlaceholderKey: string }
    > = {
        'stats_state_alert': {
            bulletsKeys: [
                'stats_alert_bullet_1',
                'stats_alert_bullet_2',
                'stats_alert_bullet_3'
            ],
            claimsKeys: [
                'stats_alert_claim_1',
                'stats_alert_claim_2',
                'stats_alert_claim_3',
                'stats_alert_claim_4'
            ],
            actionTitleKey: 'stats_action_title',
            actionPlaceholderKey: 'stats_placeholder_action_alert',
        },
        'stats_state_blocked': {
            bulletsKeys: [
                'stats_blocked_bullet_1',
                'stats_blocked_bullet_2',
                'stats_blocked_bullet_3'
            ],
            claimsKeys: [
                'stats_blocked_claim_1',
                'stats_blocked_claim_2',
                'stats_blocked_claim_3',
                'stats_blocked_claim_4'
            ],
            actionTitleKey: 'stats_action_title',
            actionPlaceholderKey: 'stats_placeholder_action_blocked',
        },
        'stats_state_transition': {
            bulletsKeys: [
                'stats_transition_bullet_1',
                'stats_transition_bullet_2',
                'stats_transition_bullet_3'
            ],
            claimsKeys: [
                'stats_transition_claim_1',
                'stats_transition_claim_2',
                'stats_transition_claim_3',
                'stats_transition_claim_4'
            ],
            actionTitleKey: 'stats_action_title',
            actionPlaceholderKey: 'stats_placeholder_action_transition',
        },
        'stats_state_clarity': {
            bulletsKeys: [
                'stats_clarity_bullet_1',
                'stats_clarity_bullet_2',
                'stats_clarity_bullet_3'
            ],
            claimsKeys: [
                'stats_clarity_claim_1',
                'stats_clarity_claim_2',
                'stats_clarity_claim_3',
                'stats_clarity_claim_4'
            ],
            actionTitleKey: 'stats_action_title',
            actionPlaceholderKey: 'stats_placeholder_action_clarity',
        },
        'stats_state_balanced': {
            bulletsKeys: [
                'stats_balanced_bullet_1',
                'stats_balanced_bullet_2',
                'stats_balanced_bullet_3'
            ],
            claimsKeys: [
                'stats_balanced_claim_1',
                'stats_balanced_claim_2',
                'stats_balanced_claim_3',
                'stats_balanced_claim_4'
            ],
            actionTitleKey: 'stats_action_title',
            actionPlaceholderKey: 'stats_placeholder_action_balanced',
        },
    };

    return map[stateKey] || map['stats_state_balanced'];
};

type YesNo = 'yes' | 'no';
type DailyValidation = Record<number, YesNo | null>;

const DIAG_LIMIT_PER_DAY = 2;

const Stats: React.FC = () => {
    const { dreams, user, t } = useApp();

    // -------------------- diagnóstico (controle de estado) --------------------


    // Heurística de estado (rápido)
    const heuristic = useMemo(() => getSubconsciousDiagnosis(Array.isArray(dreams) ? dreams : []), [dreams]);
    const { stateKey, stateTitleKey, stateDescKey, stateColor, StateIcon, topEmotions } = heuristic;
    // @ts-ignore
    const practical = useMemo(() => getPracticalMeaning(stateKey), [stateKey]);

    // Chaves diárias
    // Chaves diárias (Removendo o [] do useMemo para garantir que se o dia mudar em background, a chave atualize)
    const todayKey = getTodayKey();
    const diagCountKey = `dreamtells_emodiag_count_${todayKey}`;
    const diagCacheKey = `dreamtells_emodiag_cache_${todayKey}`;
    const validationKey = `dreamtells_emodiag_validation_${todayKey}`;
    const microKey = `dreamtells_emodiag_micro_${todayKey}`;

    // Limite de diagnósticos/dia
    const [diagCount, setDiagCount] = useState<number>(0);
    const canGenerate = diagCount < DIAG_LIMIT_PER_DAY;

    // Texto do dia (entrada do usuário)
    const [todayText, setTodayText] = useState<string>('');
    const [todaySaved, setTodaySaved] = useState<boolean>(false);

    // Validações
    const [validation, setValidation] = useState<DailyValidation>({});

    // Diagnóstico IA (cache diário)
    const [diagnosisAI, setDiagnosisAI] = useState<any>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [showShareMenu, setShowShareMenu] = useState(false);

    // Modal do “fase de vida” (usamos como motor de diagnóstico IA — já funciona no seu backend)
    const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);

    const actionRef = useRef<HTMLDivElement | null>(null);

    // Carregar dados iniciais (async)
    useEffect(() => {
        const load = async () => {
            const count = await hybridStorage.getItem(diagCountKey);
            const micro = await hybridStorage.getItem(microKey);
            const validations = await hybridStorage.getItem(validationKey);
            const cache = await hybridStorage.getItem(diagCacheKey);

            if (count) {
                const num = Number(count);
                setDiagCount(isNaN(num) ? 0 : num);
            }
            if (micro) {
                const parsed = safeJsonParse(micro, '');
                setTodayText(parsed);
                setTodaySaved(!!parsed);
            }
            if (validations) setValidation(safeJsonParse(validations, {}));
            if (cache) setDiagnosisAI(safeJsonParse(cache, null));
        };
        load();
    }, [diagCountKey, microKey, validationKey, diagCacheKey]);

    // Debugging (apenas dev)
    useEffect(() => {
        // @ts-ignore
        if (import.meta.env?.DEV) {
            console.log('[DEBUG DIAG] State:', {
                todayKey,
                diagCount,
                canGenerate,
                hasDreams: dreams.length,
                hasDiagnosis: !!diagnosisAI
            });
        }
    }, [todayKey, diagCount, canGenerate, dreams.length, diagnosisAI]);

    // Texto curto “diagnóstico do dia” (heurística)
    const heuristicSummary = useMemo(() => {
        const top = topEmotions?.[0];
        // @ts-ignore
        const stateTitleTranslated = t(stateTitleKey);

        if (!Array.isArray(dreams) || dreams.length === 0) {
            // @ts-ignore
            return t('stats_heuristic_empty', { state: stateTitleTranslated });
        }
        if (!top) {
            // @ts-ignore
            return t('stats_heuristic_no_emotions', { state: stateTitleTranslated });
        }
        // @ts-ignore
        return t('stats_heuristic_with_emotions', { state: stateTitleTranslated, top });
    }, [dreams, stateTitleKey, topEmotions, t]);

    // Salvar texto do dia (sem IA)
    const handleSaveTodayText = async () => {
        const txt = (todayText || '').trim();
        if (!txt) {
            // @ts-ignore
            alert(t('stats_write_error'));
            return;
        }
        await hybridStorage.setItem(microKey, JSON.stringify(txt));
        setTodaySaved(true);
    };

    // Limpar texto do dia
    const handleClearTodayText = async () => {
        setTodayText('');
        setTodaySaved(false);
        await hybridStorage.removeItem(microKey);
    };

    // Marcar validações
    const setClaim = async (idx: number, value: YesNo) => {
        const next: DailyValidation = { ...validation, [idx]: validation[idx] === value ? null : value };
        setValidation(next);
        await hybridStorage.setItem(validationKey, JSON.stringify(next));
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
        // @ts-ignore
        const baseText = (todayText || '').trim() || t('stats_today_placeholder');
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
    }, [recentDreams, todayText, t]);

    // Geração IA: usa o motor existente (analyzeGlobalDreams) como “diagnóstico”
    // Ele vai retornar algo como: phaseTitle / archetype / summary / mainChallenge / advice
    const generateEmotionalDiagnosis = async () => {
        if (!canGenerate) {
            // @ts-ignore
            alert(t('stats_diag_error_limit'));
            return;
        }

        setIsGenerating(true);
        setAiError(null);

        try {
            // 1. Coletar Mapa do Inconsciente (dados profundos)
            const map = await hybridStorage.getUnconsciousMap();
            const mapSummary = map ? `
                - Identidade: ${map.axisIdentity?.status || '?'}
                - Segurança: ${map.axisSecurity?.status || '?'}
                - Vínculos: ${(map.axisBond?.status || []).join(', ') || '?'}
                - Movimento: ${map.axisMovement?.status || '?'}
                - Desejo: ${map.axisDesire?.status || '?'}
                - Energia: ${map.axisEnergy?.status || '?'}
            `.trim() : 'Não preenchido';

            // @ts-ignore
            const translatedStateTitle = t(stateTitleKey);
            const language = user?.preferences?.language || 'pt';

            const signals = {
                dreamText:
                    // @ts-ignore
                    `${t('stats_diag_signals_intro')}\n` +
                    `CONTEXTO DO MAPA DO INCONSCIENTE:\n${mapSummary}\n\n` +
                    `SINAIS ATUAIS:\n` +
                    `- Estado (heurístico): ${translatedStateTitle}\n` +
                    `- Emoções dominantes: ${(topEmotions || []).slice(0, 3).join(', ') || '—'}\n` +
                    `- Reflexão de hoje: ${(todayText || '').trim() || '—'}\n` +
                    `- Validações (sim/não): ${JSON.stringify(validation)}\n\n` +
                    `INSTRUÇÃO TERAPÊUTICA PROFUNDA:\n` +
                    `Não seja prolixo. Aja como um terapeuta provocador e profundo. \n` +
                    `Cruze os sonhos com o Mapa do Inconsciente e a reflexão de hoje. \n` +
                    `Identifique o "elefante na sala". No 'summary', traga uma verdade que a pessoa está evitando. \n` +
                    `Na 'advice' (direção prática), não dê ordens; faça uma pergunta ou proponha um micro-desafio que force a pessoa a decidir por si mesma. \n` +
                    `Mantenha o tom sóbrio, empático mas direto.\n`,
                // @ts-ignore
                dreamTitle: t('stats_diag_signals_title'),
                interpretationMain: '',
                advice: '',
                emotions: [],
                createdAt: new Date().toISOString(),
            };

            const payloadDreams = [...dreamsForAI, signals];
            const userId = user?.id || 'dev-guest';

            // Chama a IA já usada no app (backend atual)
            const result = await aiService.generateEmotionalDiagnosis({
                dreams: payloadDreams,
                userId,
                language
            });

            setDiagnosisAI(result);
            await hybridStorage.setItem(diagCacheKey, JSON.stringify(result));

            const nextCount = diagCount + 1;
            setDiagCount(nextCount);
            await hybridStorage.setItem(diagCountKey, String(nextCount));

            // @ts-ignore
            if (import.meta.env?.DEV) {
                console.log('[DEBUG DIAG] Success:', result);
            }

            setShowDeepAnalysis(false);
        } catch (err: any) {
            // Captura a mensagem real do erro (ex: 404, 500 ou mensagem do backend)
            const errorDetail = err?.message || String(err);
            console.error('[DEBUG DIAG] Error Detail:', errorDetail);

            const msg = `${t('stats_diag_error_generic') || 'Erro na geração'}: ${errorDetail}`;
            setAiError(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    // Share do diagnóstico gerado (Formato Magnético para Texto)
    const getShareText = () => {
        if (!diagnosisAI) return '';
        const userName = user?.name || 'Explorador(a)';
        const archetype = diagnosisAI.archetype || '—';
        const summary = diagnosisAI.summary || diagnosisAI.description || '';
        const challenge = diagnosisAI.mainChallenge || (Array.isArray(diagnosisAI.keyChallenges) ? diagnosisAI.keyChallenges[0] : '') || '';
        const guidance = diagnosisAI.advice || diagnosisAI.guidance || '';

        // @ts-ignore
        return t('stats_share_text', {
            userName,
            archetype,
            summary,
            challenge: challenge || '-',
            guidance: guidance || '-'
        });
    };

    const handleShareImage = async () => {
        if (!diagnosisAI) return;
        setIsGeneratingImage(true);
        setShowShareMenu(false);

        try {
            const blob = await generateStoryCard({
                // @ts-ignore
                title: t('stats_title'),
                subtitle: t('stats_diag_subtype_label', { archetype: '' }).replace(': ', '').replace(':', '').trim(),
                mainValue: diagnosisAI.archetype || 'Explorador',
                summary: diagnosisAI.summary || diagnosisAI.description || '',
                footerText: 'Decifre seu inconsciente',
                ctaText: 'DreamTells App',
                // @ts-ignore
                badgeText: t('share_badge_full_analysis')
            });

            if (blob) {
                const file = new File([blob], 'dreamtells-diagnosis.png', { type: 'image/png' });
                // @ts-ignore
                const title = t('stats_share_title');

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: title,
                            text: 'Meu diagnóstico emocional no DreamTells ✨'
                        });
                    } catch (e) {
                        // user cancelled
                    }
                } else {
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                }
            }
        } catch (err) {
            console.error('Canvas error:', err);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleShareNative = async () => {
        const textToShare = getShareText();
        setShowShareMenu(false);
        const shareTitle = t('stats_share_title');
        if (navigator.share) {
            try {
                await navigator.share({ title: shareTitle, text: textToShare });
            } catch {
                // ignore cancel
            }
        } else {
            handleCopy();
        }
    };

    const handleCopy = async () => {
        const textToShare = getShareText();
        setShowShareMenu(false);
        try {
            await navigator.clipboard.writeText(textToShare);
            alert(t('stats_share_copied'));
        } catch {
            alert(t('stats_share_error'));
        }
    };

    // Auto-scroll para a ação
    const goToAction = () => actionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return (
        <Layout
            title={t('menu_dashboard')}
            showBack
            icon={<Activity size={18} className="icon-white" />}
            iconClass="menuIconTile-insights"
        >    <div style={{ flex: 1, position: 'relative' }}>
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
                            {/* @ts-ignore */}
                            <h3 style={{ fontSize: '1.2rem', color: '#F8FAFC', fontWeight: 900, margin: 0 }}>{t(stateTitleKey)}</h3>
                            <span style={{ color: 'rgba(226,232,240,0.75)', fontSize: '0.82rem', marginTop: 2 }}>
                                Hoje: {todayKey} • Sonhos no app: {Array.isArray(dreams) ? dreams.length : 0}
                            </span>
                        </div>
                    </div>

                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', fontSize: '0.95rem', margin: 0 }}>
                        {/* @ts-ignore */}
                        {t(stateDescKey)}
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

                    <p dangerouslySetInnerHTML={{ __html: heuristicSummary }} style={{ color: '#334155', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: 14 }}>
                        {/* heuristicSummary já traduzido */}
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
                            {/* @ts-ignore */}
                            {t('stats_button_write_today')}
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
                        {/* @ts-ignore */}
                        {t('stats_card_practical_title')}
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#CBD5E1', lineHeight: '1.7', fontSize: '0.95rem' }}>
                        {practical.bulletsKeys.map((bKey: string, i: number) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                                {/* @ts-ignore */}
                                {t(bKey)}
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
                        {/* @ts-ignore */}
                        {t('stats_card_validation_title')}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {practical.claimsKeys.map((cKey: string, idx: number) => {
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
                                        {/* @ts-ignore */}
                                        {t(cKey)}
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
                                            }}
                                        >
                                            <CheckCircle2 size={16} style={{ marginRight: 6 }} />
                                            {/* @ts-ignore */}
                                            {t('common_yes')}
                                        </button>
                                        <button
                                            onClick={() => setClaim(idx, 'no')}
                                            style={{
                                                flex: 1,
                                                borderRadius: 12,
                                                padding: '10px 12px',
                                                border: '1px solid rgba(248,113,113,0.35)',
                                                background: v === 'no' ? 'rgba(248,113,113,0.18)' : 'rgba(0,0,0,0.0)',
                                                color: v === 'no' ? '#FCA5A5' : '#94A3B8',
                                                fontWeight: 900,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <XCircle size={16} style={{ marginRight: 6 }} />
                                            {/* @ts-ignore */}
                                            {t('common_no')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AREA DE AÇÃO (MICRO-HÁBITO) */}
                <div
                    ref={actionRef}
                    className="card"
                    style={{
                        marginBottom: 16,
                        background: 'linear-gradient(to bottom, #1E293B, #0F172A)',
                        border: '1px solid #3B82F6',
                        boxShadow: '0 0 40px rgba(59, 130, 246, 0.1)',
                    }}
                >
                    <h3 style={{ marginBottom: 14, fontSize: '1.1rem', color: '#60A5FA', fontWeight: 900 }}>
                        {/* @ts-ignore */}
                        {t(practical.actionTitleKey)}
                    </h3>

                    {!todaySaved ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <textarea
                                value={todayText}
                                onChange={(e) => setTodayText(e.target.value)}
                                // @ts-ignore
                                placeholder={t(practical.actionPlaceholderKey)}
                                style={{
                                    width: '100%',
                                    minHeight: 120,
                                    borderRadius: 16,
                                    padding: 16,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(148,163,184,0.3)',
                                    color: '#E2E8F0',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    resize: 'none',
                                    outline: 'none',
                                }}
                            />
                            <button
                                onClick={handleSaveTodayText}
                                style={{
                                    alignSelf: 'flex-end',
                                    background: '#3B82F6',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: 99,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                                }}
                            >
                                {/* @ts-ignore */}
                                {t('common_save')}
                            </button>
                        </div>
                    ) : (
                        <div
                            style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: 16,
                                padding: 16,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <CheckCircle2 size={20} color="#4ADE80" />
                                <span style={{ color: '#4ADE80', fontWeight: 800 }}>Registrado hoje!</span>
                            </div>
                            <p style={{ color: '#E2E8F0', fontStyle: 'italic', margin: 0 }}>"{todayText}"</p>
                            <button
                                onClick={handleClearTodayText}
                                style={{
                                    marginTop: 12,
                                    background: 'transparent',
                                    border: '1px solid rgba(148,163,184,0.3)',
                                    color: '#94A3B8',
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                }}
                            >
                                {/* @ts-ignore */}
                                {t('common_edit')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Diagnóstico IA (resultado do dia) */}
                <div
                    className="card"
                    style={{
                        marginBottom: 100, // espaço final
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
                                    {/* @ts-ignore */}
                                    {t('stats_card_diagnosis_title', { title: diagnosisAI.phaseTitle || diagnosisAI.phaseName || '—' })}
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
                                    {/* @ts-ignore */}
                                    {t('stats_diag_subtype_label', { archetype: diagnosisAI.archetype || '—' })}
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
                                        {/* @ts-ignore */}
                                        {t('stats_diag_critical_point')}
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
                                    {/* @ts-ignore */}
                                    {t('stats_diag_direction_label')}
                                </h4>
                                <p style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                                    {diagnosisAI.advice || diagnosisAI.guidance || '—'}
                                </p>

                                <p style={{ marginTop: 10, color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                    {/* @ts-ignore */}
                                    {t('stats_diag_hook_label')}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: 190 }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowShareMenu(!showShareMenu)}
                                        style={{
                                            width: '100%',
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
                                        {/* @ts-ignore */}
                                        {t('stats_button_share')}
                                    </motion.button>

                                    <AnimatePresence>
                                        {showShareMenu && (
                                            <>
                                                <div
                                                    onClick={() => setShowShareMenu(false)}
                                                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '100%',
                                                        left: 0,
                                                        right: 0,
                                                        marginBottom: 12,
                                                        background: '#1E293B',
                                                        borderRadius: 20,
                                                        padding: 8,
                                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        zIndex: 100,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 4
                                                    }}
                                                >
                                                    <button
                                                        onClick={handleShareImage}
                                                        disabled={isGeneratingImage}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            padding: '12px 16px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#F1F5F9',
                                                            fontSize: '0.95rem',
                                                            fontWeight: 600,
                                                            cursor: isGeneratingImage ? 'default' : 'pointer',
                                                            borderRadius: 12,
                                                            textAlign: 'left',
                                                            opacity: isGeneratingImage ? 0.6 : 1
                                                        }}
                                                    >
                                                        <ImageIcon size={18} color="#6366F1" />
                                                        {/* @ts-ignore */}
                                                        {isGeneratingImage ? t('stats_share_image_loading') : t('stats_share_image_button')}
                                                    </button>

                                                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 8px' }} />

                                                    <button
                                                        onClick={handleShareNative}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            padding: '12px 16px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#F1F5F9',
                                                            fontSize: '0.95rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            borderRadius: 12,
                                                            textAlign: 'left'
                                                        }}
                                                    >
                                                        <Send size={18} color="#8B5CF6" />
                                                        {/* @ts-ignore */}
                                                        {t('stats_share_send')}
                                                    </button>

                                                    <button
                                                        onClick={handleCopy}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            padding: '12px 16px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#F1F5F9',
                                                            fontSize: '0.95rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            borderRadius: 12,
                                                            textAlign: 'left'
                                                        }}
                                                    >
                                                        <Copy size={18} color="#EC4899" />
                                                        {/* @ts-ignore */}
                                                        {t('stats_share_copy')}
                                                    </button>
                                                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 8px' }} />
                                                    <button
                                                        onClick={() => setShowShareMenu(false)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            padding: '12px 16px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#94A3B8',
                                                            fontSize: '0.9rem',
                                                            cursor: 'pointer',
                                                            borderRadius: 12,
                                                            textAlign: 'left'
                                                        }}
                                                    >
                                                        <X size={18} />
                                                        {/* @ts-ignore */}
                                                        {t('common_cancel')}
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

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
                                    <RefreshCw size={18} />
                                    {/* @ts-ignore */}
                                    {t('stats_button_update')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 style={{ fontSize: '1.1rem', color: '#F8FAFC', fontWeight: 900, marginBottom: 8 }}>
                                {/* @ts-ignore */}
                                {t('stats_card_diagnosis_empty_title')}
                            </h3>
                            <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: 14 }}>
                                {/* @ts-ignore */}
                                {t('stats_card_diagnosis_desc')}
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
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
                                {/* @ts-ignore */}
                                {t('stats_button_generate')}
                            </motion.button>

                            {aiError && (
                                <div style={{
                                    marginTop: 16,
                                    padding: 12,
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: 12
                                }}>
                                    <p style={{ color: '#FCA5A5', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                                        {aiError}
                                    </p>
                                </div>
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
            </div>

            {/* MODAL DE DEEP ANALYSIS (usado para gerar o diagnóstico) */}
            {showDeepAnalysis && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            width: '100%',
                            maxWidth: 400,
                            background: '#0F172A',
                            borderRadius: 24,
                            padding: 24,
                            border: '1px solid rgba(148,163,184,0.2)',
                            textAlign: 'center',
                            position: 'relative',
                        }}
                    >
                        {!isGenerating ? (
                            <>
                                <h3 style={{ color: '#F8FAFC', fontSize: '1.4rem', fontWeight: 900, marginBottom: 16 }}>
                                    {/* @ts-ignore */}
                                    {t('stats_button_generate')}
                                </h3>
                                <p style={{ color: '#CBD5E1', lineHeight: '1.6', marginBottom: 24 }}>
                                    {/* @ts-ignore */}
                                    {t('stats_card_diagnosis_desc')}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <button
                                        onClick={generateEmotionalDiagnosis}
                                        style={{
                                            background: 'linear-gradient(135deg, #5A3EF2, #4F46E5)',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '16px',
                                            borderRadius: 16,
                                            fontWeight: 800,
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)',
                                        }}
                                    >
                                        {/* @ts-ignore */}
                                        {t('stats_button_generate')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeepAnalysis(false);
                                            setAiError(null);
                                        }}
                                        style={{
                                            background: 'transparent',
                                            color: '#94A3B8',
                                            border: 'none',
                                            padding: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {/* @ts-ignore */}
                                        {t('common_cancel')}
                                    </button>
                                </div>

                                {aiError && (
                                    <div style={{
                                        marginTop: 20,
                                        padding: 12,
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: 12,
                                        textAlign: 'left'
                                    }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                            <AlertCircle size={14} color="#FCA5A5" />
                                            <span style={{ color: '#F8FAFC', fontSize: '0.85rem', fontWeight: 800 }}>Falha na Análise</span>
                                        </div>
                                        <p style={{ color: '#FCA5A5', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>
                                            {aiError}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ padding: '40px 0' }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    style={{
                                        display: 'inline-block',
                                        marginBottom: 20
                                    }}
                                >
                                    <RefreshCw size={48} color="#6366F1" />
                                </motion.div>
                                <h3 style={{ color: '#F8FAFC', fontSize: '1.2rem', fontWeight: 800 }}>
                                    {/* @ts-ignore */}
                                    Analisando profundamente...
                                </h3>
                                <p style={{ color: '#94A3B8', marginTop: 8 }}>
                                    Estamos conectando seus sonhos ao seu Mapa do Inconsciente. Isso pode levar até 1-2 minutos em algumas conexões. Não feche o app.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </Layout>
    );
};

export default Stats;
