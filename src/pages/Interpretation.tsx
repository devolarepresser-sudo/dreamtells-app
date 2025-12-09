// src/pages/Interpretation.tsx

import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { DreamEntry } from '../types';
import { ArrowLeft, BookOpen } from 'lucide-react';

type AnyObj = Record<string, any>;

interface InterpretationView {
    dreamTitle: string;
    main: string;
    advice: string;
    symbols: { name: string; meaning?: string }[];
    emotions: string[];
    lifeAreas: string[];
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
            .map((e: any) =>
                typeof e === 'string' ? e.trim() : ''
            )
            .filter((e: string) => e.length > 0)
        : [];

    const lifeAreas = Array.isArray(node.lifeAreas)
        ? node.lifeAreas
            .map((a: any) =>
                typeof a === 'string' ? a.trim() : ''
            )
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
    };
};

const Interpretation: React.FC = () => {
    const { dreams, t } = useApp();
    const navigate = useNavigate();
    const location = useLocation() as { state?: { dreamId?: string } };

    const dreamId = location.state?.dreamId;
    const dream = dreams.find((d) => d.id === dreamId);

    const view = useMemo(() => buildInterpretationView(dream), [dream]);

    // Se não encontrar o sonho
    if (!dream) {
        return (
            <Layout title={t('interpretation_title') || 'Interpretação'}>
                <div
                    style={{
                        padding: 24,
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                    }}
                >
                    <p
                        style={{
                            marginBottom: 16,
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        Não foi possível encontrar este sonho.
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
                        Voltar para o histórico
                    </button>
                </div>
            </Layout>
        );
    }

    const interpretationExists = !!view;

    return (
        <Layout title={t('interpretation_title') || 'Interpretação'}>
            <div
                style={{
                    minHeight: '100vh',
                    padding: '18px 16px 32px',
                    display: 'flex',
                    justifyContent: 'center',
                    background:
                        'radial-gradient(circle at top, #1E293B 0%, #0B1120 45%, #020617 100%)',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: 600,
                        background:
                            'linear-gradient(135deg,#0B1026,#111827)',
                        borderRadius: 24,
                        padding: 24,
                        boxShadow: '0 22px 60px rgba(15,23,42,0.95)',
                        border: '1px solid rgba(148,163,184,0.7)',
                        backdropFilter: 'blur(16px)',
                    }}
                >
                    {/* Cabeçalho */}
                    <div
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
                                    {t('interpretation_title') || 'Interpretação do sonho'}
                                </h2>
                                <p
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'rgba(226,232,240,0.82)',
                                    }}
                                >
                                    Análise detalhada do sonho que você acabou de registrar.
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
                            Ver histórico
                        </button>
                    </div>

                    {/* Bloco: Sonho */}
                    <div
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
                            Sonho
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
                    </div>

                    {/* Se não tiver interpretação encontrada */}
                    {!interpretationExists && (
                        <div
                            style={{
                                padding: 18,
                                borderRadius: 18,
                                background: '#F0F4F8',
                                borderLeft: '4px solid var(--color-primary)',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--color-text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: 6,
                                    fontWeight: 600,
                                }}
                            >
                                Interpretação
                            </h3>
                            <p
                                style={{
                                    color: 'var(--color-text-primary)',
                                    lineHeight: 1.6,
                                    fontSize: '0.95rem',
                                }}
                            >
                                Ainda não foi possível carregar uma interpretação detalhada para
                                este sonho. Tente salvar um novo sonho ou verifique sua conexão.
                            </p>
                        </div>
                    )}

                    {/* Se tiver interpretação, mostra todos os blocos ricos */}
                    {interpretationExists && view && (
                        <>
                            {/* Núcleo da interpretação */}
                            {view.main && (
                                <div
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
                                        Núcleo da interpretação
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
                                </div>
                            )}

                            {/* Simbologia principal */}
                            {view.symbols.length > 0 && (
                                <div
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
                                        Simbologia principal do sonho
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
                                </div>
                            )}

                            {/* Emoções sentidas */}
                            {view.emotions.length > 0 && (
                                <div
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
                                            color: 'var(--color-text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            marginBottom: 6,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Emoções associadas ao sonho
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
                                                    color: '#BFDBFE',
                                                }}
                                            >
                                                {emo}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Áreas da vida */}
                            {view.lifeAreas.length > 0 && (
                                <div
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
                                            color: 'var(--color-text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            marginBottom: 6,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Áreas da vida mais conectadas a este sonho
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
                                                    color: '#A7F3D0',
                                                }}
                                            >
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Conselho / contexto de vida */}
                            {view.advice && (
                                <div
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
                                        Conselho da interpretação / contexto de vida
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
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Interpretation;
