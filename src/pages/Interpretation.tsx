// src/pages/Interpretation.tsx

import type { Variants } from "framer-motion";
import React, { useMemo, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { DreamEntry } from '../types';
import { ArrowLeft, BookOpen, Sparkles, ChevronRight, Share2, Copy, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AnyObj = Record<string, any>;

// Chave usada no localStorage para persistir o último sonho interpretado
const LAST_INTERPRETATION_KEY = 'dreamtells_last_interpretation';

interface InterpretationView {
    dreamTitle: string;
    main: string;
    advice: string;
    symbols: { name: string; meaning?: string }[];
    emotions: string[];
    lifeAreas: string[];

    // New Expert-Level Fields
    coreOfDream?: string;
    evidence?: string[];
    decodingLayers?: {
        emotional?: string;
        relational?: string;
        archetypal?: string;
        individuation?: string;
    };
    alternativeHypotheses?: string[];
    criticalPoint?: string;
    practicalDirection?: {
        minimalAction?: string;
        integrationExercise?: string;
        anchorPhrase?: string;
    };
    responsibleAlert?: string;

    deepAnalysis?: {
        deepInsights: { title: string; content: string }[];
        patterns: string[];
        finalIntegration: string;
    };
}

// Verifica se um objeto "parece" um InterpretationResult
const looksLikeInterpretation = (val: AnyObj | null | undefined): boolean => {
    if (!val || typeof val !== 'object') return false;

    return (
        typeof val.interpretationMain === 'string' ||
        typeof val.advice === 'string' ||
        Array.isArray(val.symbols) ||
        Array.isArray(val.emotions) ||
        Array.isArray(val.lifeAreas)
    );
};

// Procura recursivamente dentro do dream um nó que tenha campos do InterpretationResult
const findInterpretationNode = (
    source: AnyObj | null | undefined,
    depth: number = 0
): AnyObj | null => {
    if (!source || typeof source !== 'object') return null;
    if (depth > 4) return null; // proteção básica

    if (looksLikeInterpretation(source)) {
        return source;
    }

    for (const key of Object.keys(source)) {
        const value = source[key];
        if (value && typeof value === 'object') {
            const found = findInterpretationNode(value as AnyObj, depth + 1);
            if (found) return found;
        }
    }

    return null;
};

// Constrói uma visão amigável a partir do DreamEntry
const buildInterpretationView = (dream?: DreamEntry): InterpretationView | null => {
    if (!dream) return null;

    const d: AnyObj = dream as AnyObj;

    // 1) Se por acaso o DreamEntry já tiver campos diretos:
    const directCandidate: AnyObj = {
        dreamTitle: d.dreamTitle,
        interpretationMain: d.interpretationMain,
        advice: d.advice,
        symbols: d.symbols,
        emotions: d.emotions,
        lifeAreas: d.lifeAreas,
    };

    let node: AnyObj | null = null;

    if (looksLikeInterpretation(directCandidate)) {
        node = { ...d, ...directCandidate };
    } else {
        // 2) Caso contrário, procura recursivamente onde o addDream guardou o resultado
        node = findInterpretationNode(d) || null;
    }

    if (!node) return null;

    const dreamTitle =
        typeof node.dreamTitle === 'string' && node.dreamTitle.trim()
            ? node.dreamTitle.trim()
            : '';

    const main =
        typeof node.interpretationMain === 'string' && node.interpretationMain.trim()
            ? node.interpretationMain.trim()
            : '';

    const advice =
        typeof node.advice === 'string' && node.advice.trim()
            ? node.advice.trim()
            : '';

    const symbolsRaw = Array.isArray(node.symbols) ? node.symbols : [];
    const symbols = symbolsRaw
        .map((s: any) => {
            if (!s) return null;
            if (typeof s === 'string') {
                return { name: s, meaning: '' };
            }
            const name =
                typeof s.name === 'string' && s.name.trim()
                    ? s.name.trim()
                    : '';
            const meaning =
                typeof s.meaning === 'string' && s.meaning.trim()
                    ? s.meaning.trim()
                    : '';
            if (!name && !meaning) return null;
            return { name, meaning };
        })
        .filter(Boolean) as { name: string; meaning?: string }[];

    const emotions = Array.isArray(node.emotions)
        ? node.emotions
            .map((e: any) => (typeof e === 'string' ? e.trim() : ''))
            .filter((e: string) => e.length > 0)
        : [];

    const lifeAreas = Array.isArray(node.lifeAreas)
        ? node.lifeAreas
            .map((a: any) => (typeof a === 'string' ? a.trim() : ''))
            .filter((a: string) => a.length > 0)
        : [];

    // Se não tiver nada relevante, retorna null
    if (!main && !advice && symbols.length === 0 && emotions.length === 0 && lifeAreas.length === 0) {
        return null;
    }

    return {
        dreamTitle,
        main,
        advice,
        symbols,
        emotions,
        lifeAreas,

        // New Expert Fields
        coreOfDream: node.coreOfDream,
        evidence: Array.isArray(node.evidence) ? node.evidence : undefined,
        decodingLayers: node.decodingLayers,
        alternativeHypotheses: Array.isArray(node.alternativeHypotheses) ? node.alternativeHypotheses : undefined,
        criticalPoint: node.criticalPoint,
        practicalDirection: node.practicalDirection,
        responsibleAlert: node.responsibleAlert,

        deepAnalysis: dream.deepAnalysis,
    };
};

// Animação de container (stagger) e items (fade/slide)
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.35,
            delayChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 50,
            damping: 15,
        },
    },
};

const Interpretation: React.FC = () => {
    const { dreams, user, t } = useApp();
    const navigate = useNavigate();
    const location = useLocation() as { state?: { dreamId?: string; dream?: DreamEntry } };

    // Estado para guardar o sonho salvo do localStorage (fallback)
    const [savedDream, setSavedDream] = useState<DreamEntry | undefined>(undefined);
    const [showShareMenu, setShowShareMenu] = useState(false);

    const dreamFromState = location.state?.dream as DreamEntry | undefined;
    const dreamId = dreamFromState?.id ?? location.state?.dreamId;

    // Prioridade: state > dreams array > savedDream do localStorage
    const dream = dreamFromState ?? dreams.find((d) => d.id === dreamId) ?? savedDream;

    // Carregar do localStorage na montagem
    useEffect(() => {
        try {
            const stored = localStorage.getItem(LAST_INTERPRETATION_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as DreamEntry;
                setSavedDream(parsed);
            }
        } catch {
            // Se der erro no JSON, ignora
        }
    }, []);


    // Salvar no localStorage quando tiver um sonho válido vindo do state ou array
    useEffect(() => {
        const currentDream = dreamFromState ?? dreams.find((d) => d.id === dreamId);
        if (currentDream) {
            try {
                localStorage.setItem(LAST_INTERPRETATION_KEY, JSON.stringify(currentDream));
                setSavedDream(currentDream);
            } catch {
                // Se der erro ao salvar, ignora
            }
        }
    }, [dreamFromState, dreamId, dreams]);

    const view = useMemo(() => buildInterpretationView(dream), [dream]);

    const getShareText = () => {
        const userName = user?.name || 'Explorador(a)';
        let text = `✨ *DreamTells* ✨\n👤 Explorador(a): ${userName}\n\n🔮 *${t('menu_interpretation').toUpperCase()}*\n\n"${dream.text}"\n\n✨ *${t('interp_section_core')}:*\n${view.main}\n\n💡 *${t('interp_section_advice')}:*\n${view.advice}`;

        if (view.deepAnalysis) {
            text += `\n\n🔍 *Aprofundamento (Mergulho no Inconsciente):*`;
            view.deepAnalysis.deepInsights.forEach(insight => {
                text += `\n- *${insight.title}:* ${insight.content}`;
            });
            if (view.deepAnalysis.finalIntegration) {
                text += `\n\n*${t('interp_share_final_integration')}* ${view.deepAnalysis.finalIntegration}`;
            }
        }
        text += `\n\n---\n🌌 *E você, já descobriu o que o DreamTells diz sobre você?*`;
        return text;
    };

    const handleShareNative = async () => {
        const textToShare = getShareText();
        setShowShareMenu(false);
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('interp_share_title'),
                    text: textToShare,
                });
            } catch (err) {
                console.warn('Share canceled or failed:', err);
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
            alert(t('copy_success'));
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Se não encontrar o sonho
    if (!dream) {
        return (
            <Layout
                title={t('interp_page_title')}
                icon={<Sparkles size={18} color="#F9FAFB" />}
            >
                <div
                    style={{
                        padding: 24,
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        background: 'transparent',
                    }}
                >
                    <p
                        style={{
                            marginBottom: 16,
                            color: '#CBD5E1',
                        }}
                    >
                        {t('interp_not_found')}
                    </p>
                    <button
                        onClick={() => navigate('/history')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 18px',
                            borderRadius: 999,
                            border: '1px solid rgba(148,163,184,0.9)',
                            background: 'rgba(15,23,42,0.92)',
                            color: '#E5E7EB',
                            cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(15,23,42,0.8)',
                        }}
                    >
                        <ArrowLeft size={18} />
                        {t('interp_back_history')}
                    </button>
                </div>
            </Layout >
        );
    }

    const interpretationExists = !!view;

    return (
        <Layout
            title={t('interp_page_title')}
            icon={<Sparkles size={18} color="#F9FAFB" />}
        >
            <div
                style={{
                    minHeight: '100vh',
                    padding: '12px 6px 32px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center', // Adicionado para garantir centralização vertical
                    background: 'transparent',
                }}
            >
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    style={{
                        width: '100%',
                        maxWidth: 600,
                        background: 'linear-gradient(135deg,#0B1026,#111827)',
                        borderRadius: 24,
                        padding: 24,
                        boxShadow: '0 20px 60px rgba(15,23,42,0.95)',
                        border: '1px solid rgba(148,163,184,0.7)',
                        backdropFilter: 'blur(16px)',
                    }}
                >
                    {/* Cabeçalho */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 20,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background:
                                        'radial-gradient(circle at 30% 0%, #38BDF8, #4F46E5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <BookOpen size={18} color="#F9FAFB" />
                            </div>
                            <div>
                                <h2
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        color: '#F9FAFB',
                                        letterSpacing: '-0.03em',
                                    }}
                                >
                                    {t('interp_page_title')}
                                </h2>
                                <p
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'rgba(226,232,240,0.82)',
                                    }}
                                >
                                    {t('interp_page_subtitle')}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/history')}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#9CA3AF',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                            }}
                        >
                            {t('interp_view_history')}
                        </button>
                    </motion.div>

                    {/* Bloco: Sonho */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            marginBottom: 20,
                            padding: 16,
                            borderRadius: 18,
                            background:
                                'radial-gradient(circle at top, rgba(15,23,42,0.96), rgba(15,23,42,0.98))',
                            border: '1px solid rgba(148,163,184,0.7)',
                        }}
                    >
                        <h3
                            style={{
                                fontSize: '0.8rem',
                                color: 'rgba(148,163,184,0.9)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: 6,
                            }}
                        >
                            {t('interp_dream_recorded')}
                        </h3>
                        <p
                            style={{
                                color: '#E5E7EB',
                                lineHeight: 1.6,
                                fontSize: '0.95rem',
                            }}
                        >
                            {dream.text}
                        </p>
                    </motion.div>

                    {/* Se não tiver interpretação encontrada */}
                    {!interpretationExists && (
                        <motion.div
                            variants={itemVariants}
                            style={{
                                padding: 18,
                                borderRadius: 18,
                                background: '#F0F4F8',
                                borderLeft: '4px solid #6366F1',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '0.8rem',
                                    color: '#475569',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: 6,
                                    fontWeight: 600,
                                }}
                            >
                                {t('interp_unavailable_title')}
                            </h3>
                            <p
                                style={{
                                    color: '#1F2937',
                                    lineHeight: 1.6,
                                    fontSize: '0.95rem',
                                }}
                            >
                                {t('interp_unavailable_desc')}
                            </p>
                        </motion.div>
                    )}

                    {/* Se tiver interpretação, mostra todos os blocos ricos */}
                    {interpretationExists && view && (
                        <>
                            {/* Núcleo da interpretação */}
                            {view.main && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        padding: 16,
                                        borderRadius: 18,
                                        background: '#EEF2FF',
                                        borderLeft: '4px solid #6366F1',
                                        marginBottom: 14,
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: '0.8rem',
                                            color: '#4F46E5',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            marginBottom: 6,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {t('interp_section_core')}
                                    </h3>
                                    <p
                                        style={{
                                            color: '#1F2937',
                                            lineHeight: 1.6,
                                            fontSize: '0.95rem',
                                            whiteSpace: 'pre-line',
                                        }}
                                    >
                                        {view.main}
                                    </p>
                                </motion.div>
                            )}

                            {/* Simbologia principal */}
                            {view.symbols.length > 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        padding: 16,
                                        borderRadius: 18,
                                        background: '#ECFEFF',
                                        borderLeft: '4px solid #06B6D4',
                                        marginBottom: 14,
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: '0.8rem',
                                            color: '#0E7490',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            marginBottom: 6,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {t('interp_section_symbols')}
                                    </h3>
                                    <ul
                                        style={{
                                            margin: 0,
                                            paddingLeft: 18,
                                            color: '#0F172A',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {view.symbols.map((s, idx) => (
                                            <li key={idx}>
                                                <strong>{s.name}</strong>
                                                {s.meaning ? ` — ${s.meaning}` : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}

                            {/* Emoções sentidas */}
                            {view.emotions.length > 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        padding: 16,
                                        borderRadius: 18,
                                        background: '#F9FAFB',
                                        border: '1px solid rgba(148,163,184,0.7)',
                                        marginBottom: 14,
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: '0.8rem',
                                            color: '#475569',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            marginBottom: 6,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {t('interp_section_emotions')}
                                    </h3>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                        }}
                                    >
                                        {view.emotions.map((emo, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 999,
                                                    background: 'rgba(59,130,246,0.1)',
                                                    border: '1px solid rgba(59,130,246,0.4)',
                                                    fontSize: '0.8rem',
                                                    color: '#1D4ED8', // antes era azul muito claro; agora mais forte e legível
                                                }}
                                            >
                                                {emo}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Áreas da vida */}
                            {view.lifeAreas.length > 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        padding: 16,
                                        borderRadius: 18,
                                        background: '#F9FAFB',
                                        border: '1px solid rgba(148,163,184,0.7)',
                                        marginBottom: 14,
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: '0.8rem',
                                            color: '#475569',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            marginBottom: 6,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {t('interp_section_life_areas')}
                                    </h3>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                        }}
                                    >
                                        {view.lifeAreas.map((area, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 999,
                                                    background: 'rgba(16,185,129,0.08)',
                                                    border: '1px solid rgba(16,185,129,0.4)',
                                                    fontSize: '0.8rem',
                                                    color: '#047857', // antes era verde muito claro; agora verde escuro legível
                                                }}
                                            >
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Conselho / contexto de vida */}
                            {view.advice && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        padding: 16,
                                        borderRadius: 18,
                                        background: '#ECFDF5',
                                        borderLeft: '4px solid #10B981',
                                        marginBottom: 4,
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: '0.8rem',
                                            color: '#047857',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            marginBottom: 6,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {t('interp_section_advice')}
                                    </h3>
                                    <p
                                        style={{
                                            color: '#064E3B',
                                            lineHeight: 1.6,
                                            fontSize: '0.95rem',
                                            whiteSpace: 'pre-line',
                                        }}
                                    >
                                        {view.advice}
                                    </p>
                                </motion.div>
                            )}

                            {/* ========== NOVOS BLOCOS ESPECIALISTA ========== */}

                            {/* Alerta Responsável */}
                            {view.responsibleAlert && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        padding: 18,
                                        borderRadius: 18,
                                        background: '#FEF2F2',
                                        borderLeft: '4px solid #EF4444',
                                        marginBottom: 20,
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
                                    }}
                                >
                                    <h3 style={{ fontSize: '0.85rem', color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700 }}>
                                        ⚠️ {t('interp_responsible_alert')}
                                    </h3>
                                    <p style={{ color: '#7F1D1D', lineHeight: 1.6, fontSize: '0.95rem', whiteSpace: 'pre-line', margin: 0 }}>
                                        {view.responsibleAlert}
                                    </p>
                                </motion.div>
                            )}

                            {/* Núcleo do Sonho */}
                            {view.coreOfDream && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        padding: 18,
                                        borderRadius: 18,
                                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                                        marginBottom: 14,
                                        boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)'
                                    }}
                                >
                                    <h3 style={{ fontSize: '0.85rem', color: '#E0E7FF', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10, fontWeight: 800 }}>
                                        🎯 {t('interp_core_dream')}
                                    </h3>
                                    <p style={{ color: '#FFFFFF', lineHeight: 1.7, fontSize: '1rem', fontWeight: 500, whiteSpace: 'pre-line' }}>
                                        {view.coreOfDream}
                                    </p>
                                </motion.div>
                            )}

                            {/* Evidências */}
                            {view.evidence && view.evidence.length > 0 && (
                                <motion.div variants={itemVariants} style={{ padding: 16, borderRadius: 18, background: '#F8FAFC', border: '1px solid rgba(100, 116, 139, 0.3)', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, fontWeight: 600 }}>
                                        📋 {t('interp_evidence')}
                                    </h3>
                                    <ul style={{ margin: 0, paddingLeft: 20, color: '#1E293B', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        {view.evidence.map((ev, idx) => (
                                            <li key={idx} style={{ marginBottom: 6 }}>{ev}</li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}

                            {/* Decodificação em Camadas */}
                            {view.decodingLayers && (
                                <motion.div variants={itemVariants} style={{ padding: 18, borderRadius: 18, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: '1px solid rgba(148, 163, 184, 0.3)', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: '0.85rem', color: '#A5B4FC', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16, fontWeight: 700 }}>
                                        🔍 {t('interp_decoding')}
                                    </h3>

                                    {view.decodingLayers.emotional && (
                                        <div style={{ marginBottom: 14 }}>
                                            <h4 style={{ color: '#FDE68A', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>💛 {t('interp_layer_emotional')}</h4>
                                            <p style={{ color: '#E0E7FF', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{view.decodingLayers.emotional}</p>
                                        </div>
                                    )}

                                    {view.decodingLayers.relational && (
                                        <div style={{ marginBottom: 14 }}>
                                            <h4 style={{ color: '#FBCFE8', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>❤️ {t('interp_layer_relational')}</h4>
                                            <p style={{ color: '#E0E7FF', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{view.decodingLayers.relational}</p>
                                        </div>
                                    )}

                                    {view.decodingLayers.archetypal && (
                                        <div style={{ marginBottom: 14 }}>
                                            <h4 style={{ color: '#A7F3D0', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>🌀 {t('interp_layer_archetypal')}</h4>
                                            <p style={{ color: '#E0E7FF', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{view.decodingLayers.archetypal}</p>
                                        </div>
                                    )}

                                    {view.decodingLayers.individuation && (
                                        <div>
                                            <h4 style={{ color: '#CFFAFE', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>⭐ {t('interp_layer_individuation')}</h4>
                                            <p style={{ color: '#E0E7FF', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{view.decodingLayers.individuation}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Ponto Crítico */}
                            {view.criticalPoint && (
                                <motion.div variants={itemVariants} style={{ padding: 16, borderRadius: 18, background: '#FFFBEB', borderLeft: '4px solid #F59E0B', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: '0.8rem', color: '#92400E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700 }}>
                                        ⚡ {t('interp_critical_point')}
                                    </h3>
                                    <p style={{ color: '#78350F', lineHeight: 1.6, fontSize: '1rem', fontWeight: 600, fontStyle: 'italic', margin: 0 }}>
                                        {view.criticalPoint}
                                    </p>
                                </motion.div>
                            )}

                            {/* Direção Prática */}
                            {view.practicalDirection && (
                                <motion.div variants={itemVariants} style={{ padding: 18, borderRadius: 18, background: '#ECFDF5', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: '0.85rem', color: '#047857', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14, fontWeight: 700 }}>
                                        🎯 {t('interp_practical_direction')}
                                    </h3>

                                    {view.practicalDirection.minimalAction && (
                                        <div style={{ marginBottom: 12, padding: 12, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 12 }}>
                                            <h4 style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>✅ {t('interp_minimal_action')}</h4>
                                            <p style={{ color: '#064E3B', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{view.practicalDirection.minimalAction}</p>
                                        </div>
                                    )}

                                    {view.practicalDirection.integrationExercise && (
                                        <div style={{ marginBottom: 12, padding: 12, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 12 }}>
                                            <h4 style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>🧘 {t('interp_integration_exercise')}</h4>
                                            <p style={{ color: '#064E3B', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{view.practicalDirection.integrationExercise}</p>
                                        </div>
                                    )}

                                    {view.practicalDirection.anchorPhrase && (
                                        <div style={{ padding: 14, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: 12 }}>
                                            <h4 style={{ color: '#D1FAE5', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>💬 {t('interp_anchor_phrase')}</h4>
                                            <p style={{ color: '#FFFFFF', fontSize: '1rem', lineHeight: 1.6, margin: 0, fontWeight: 600, textAlign: 'center', fontStyle: 'italic' }}>
                                                "{view.practicalDirection.anchorPhrase}"
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Hipóteses Alternativas */}
                            {view.alternativeHypotheses && view.alternativeHypotheses.length > 0 && (
                                <motion.div variants={itemVariants} style={{ padding: 16, borderRadius: 18, background: '#FDF4FF', border: '1px solid rgba(168, 85, 247, 0.3)', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: '0.8rem', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, fontWeight: 600 }}>
                                        🔀 {t('interp_alternative_hypotheses')}
                                    </h3>
                                    <ul style={{ margin: 0, paddingLeft: 20, color: '#581C87', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        {view.alternativeHypotheses.map((hyp, idx) => (
                                            <li key={idx} style={{ marginBottom: 8 }}>{hyp}</li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}

                            {/* Bloco de Análise Profunda (Shadow Work) */}
                            {view.deepAnalysis && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        marginTop: 24,
                                        padding: 20,
                                        borderRadius: 20,
                                        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(67, 56, 202, 0.2))',
                                        border: '1px solid rgba(99, 102, 241, 0.4)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                        <Sparkles size={20} color="#818CF8" />
                                        <h3
                                            style={{
                                                fontSize: '1.1rem',
                                                color: '#E0E7FF',
                                                fontWeight: 700,
                                                margin: 0,
                                                letterSpacing: '-0.02em',
                                            }}
                                        >
                                            Mergulho no Inconsciente
                                        </h3>
                                    </div>

                                    {view.deepAnalysis.deepInsights.map((insight, idx) => (
                                        <div key={idx} style={{ marginBottom: 16 }}>
                                            <h4 style={{ color: '#A5B4FC', fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                                                {insight.title}
                                            </h4>
                                            <p style={{ color: '#C7D2FE', fontSize: '0.9rem', lineHeight: 1.6, marginTop: 0 }}>
                                                {insight.content}
                                            </p>
                                        </div>
                                    ))}

                                    {view.deepAnalysis.finalIntegration && (
                                        <div style={{
                                            padding: 14,
                                            background: 'rgba(30, 27, 75, 0.4)',
                                            borderRadius: 12,
                                            borderLeft: '3px solid #6366F1'
                                        }}>
                                            <p style={{ color: '#E0E7FF', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>
                                                "{view.deepAnalysis.finalIntegration}"
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}



                            <div style={{ position: 'relative', width: '100%', marginTop: 24 }}>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(236, 72, 153, 0.5)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: 18,
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', // Pink to Purple
                                        color: '#FFFFFF',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 20px rgba(236, 72, 153, 0.35)',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 12,
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    <Share2 size={22} />
                                    Compartilhar descoberta
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
                                                    Enviar para...
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
                                                    Copiar texto
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
                                                    Cancelar
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Botão para Aprofundar Sonho (Reativado) */}
                            {!view.deepAnalysis && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(90, 62, 242, 0.6)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate(`/deep-analysis/${dream.id}`)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '14px 28px',
                                            borderRadius: 999,
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #5A3EF2 0%, #46E4E1 100%)',
                                            color: '#FFFFFF',
                                            cursor: 'pointer',
                                            boxShadow: '0 8px 24px rgba(90, 62, 242, 0.4)',
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            width: '100%', // Match width strategy if desired, or keep centered pill
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Sparkles size={20} />
                                        Aprofunde mais o seu sonho
                                        <ChevronRight size={18} />
                                    </motion.button>
                                </motion.div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </Layout>
    );
};

export default Interpretation;
