import { useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';

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
    const { dreams, user, t, language } = useApp();

    // -------------------- diagnóstico (controle de estado) --------------------
    const [diagError, setDiagError] = useState<string | null>(null);

    // Heurística de estado (rápido)
    const heuristic = useMemo(() => getSubconsciousDiagnosis(Array.isArray(dreams) ? dreams : []), [dreams]);
    const { stateKey, stateTitleKey, stateDescKey, stateColor, StateIcon, topEmotions } = heuristic;
    // @ts-ignore
    const practical = useMemo(() => getPracticalMeaning(stateKey), [stateKey]);

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
    const handleSaveTodayText = () => {
        const txt = (todayText || '').trim();
        if (!txt) {
            // @ts-ignore
            alert(t('stats_write_error'));
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
            // A ideia: “forçar contexto” pro modelo analisando sonhos + texto do dia + validações
            // Como o backend atual recebe só dreams, colocamos esses sinais dentro do array (bem leve, sem quebrar schema).
            // @ts-ignore
            const translatedStateTitle = t(stateTitleKey);
            const signals = {
                dreamText:
                    // @ts-ignore
                    `${t('stats_diag_signals_intro')}\n` +
                    `- Estado (heurístico): ${translatedStateTitle}\n` +
                    `- Emoções dominantes: ${(topEmotions || []).slice(0, 3).join(', ') || '—'}\n` +
                    `- Como estou hoje: ${(todayText || '').trim() || '—'}\n` +
                    `- Validações (sim/não): ${JSON.stringify(validation)}\n` +
                    `INSTRUÇÃO: gere um diagnóstico emocional claro e uma direção prática.\n`,
                // @ts-ignore
                dreamTitle: t('stats_diag_signals_title'),
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

        // @ts-ignore
        const textToShare = t('stats_share_text', {
            title,
            archetype,
            summary,
            challenge: challenge || '-',
            guidance: guidance || '-'
        });

        // @ts-ignore
        const shareTitle = t('stats_share_title');

        if (navigator.share) {
            try {
                await navigator.share({ title: shareTitle, text: textToShare });
            } catch {
                // ignore cancel
            }
        } else {
            try {
                await navigator.clipboard.writeText(textToShare);
                // @ts-ignore
                alert(t('stats_share_copied'));
            } catch {
                // @ts-ignore
                alert(t('stats_share_error'));
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
                                    {/* @ts-ignore */}
                                    {t('stats_button_share')}
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
                                {/* @ts-ignore */}
                                {t('stats_button_generate')}
                            </button>

                            {aiError && (
                                <p style={{ marginTop: 10, color: '#FCA5A5', fontSize: '0.9rem', fontWeight: 800 }}>
                                    {/* @ts-ignore */}
                                    {t('stats_diag_error_generic')}
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
                                        onClick={() => setShowDeepAnalysis(false)}
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
                                    <RefreshCcw size={48} color="#6366F1" />
                                </motion.div>
                                <h3 style={{ color: '#F8FAFC', fontSize: '1.2rem', fontWeight: 800 }}>
                                    Analisando contexto...
                                </h3>
                                <p style={{ color: '#94A3B8', marginTop: 8 }}>
                                    Isso pode levar alguns segundos.
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
