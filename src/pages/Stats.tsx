import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { Zap, Brain, Activity, Compass, Trophy, Shield, Star, Lock, Sparkles, AlertCircle, Share2 } from 'lucide-react';
// ... imports

// ... inside Stats component


// Helper para normalizar texto (remove acentos, trim, lowercase)
const normalizeText = (str: string) => {
    return str
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

// Função para calcular o diagnóstico
const getSubconsciousDiagnosis = (dreams: DreamEntry[]) => {
    // 1. Contar emoções (chave normalizada, valor de exibição original)
    const emotionCounts: Record<string, number> = {};
    const emotionDisplay: Record<string, string> = {};

    dreams.forEach(d => {
        if (Array.isArray(d.emotions)) {
            d.emotions.forEach(e => {
                const norm = normalizeText(e);
                if (!norm) return;

                emotionCounts[norm] = (emotionCounts[norm] || 0) + 1;

                // Preservar a versão mais longa (geralmente a com acentos/correta)
                if (!emotionDisplay[norm] || e.length > emotionDisplay[norm].length) {
                    emotionDisplay[norm] = e.trim();
                }
            });
        }
    });

    const topEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key]) => emotionDisplay[key] || key); // recupera a versão bonita

    // 2. Mapeamento de Estado Dominante
    let stateTitle = "Equilíbrio / Indefinido";
    let stateDesc = "Seus sonhos mostram uma variedade de experiências, sugerindo um momento de fluxo natural.";
    let stateColor = "#64748B"; // slate
    let StateIcon = Compass;

    // Palavras-chave simples (normalizadas)
    const keywords = {
        alerta: ['medo', 'ansiedade', 'perseguicao', 'panico', 'susto'],
        transicao: ['confusao', 'estranho', 'viagem', 'novo', 'perdido'],
        bloqueio: ['raiva', 'frustracao', 'preso', 'tristeza', 'morte'],
        clareza: ['alegria', 'luz', 'voo', 'amor', 'paz', 'felicidade']
    };

    let scores = { alerta: 0, transicao: 0, bloqueio: 0, clareza: 0 };

    Object.keys(emotionCounts).forEach(normEmo => {
        const count = emotionCounts[normEmo];
        if (keywords.alerta.some(k => normEmo.includes(k))) scores.alerta += count;
        if (keywords.transicao.some(k => normEmo.includes(k))) scores.transicao += count;
        if (keywords.bloqueio.some(k => normEmo.includes(k))) scores.bloqueio += count;
        if (keywords.clareza.some(k => normEmo.includes(k))) scores.clareza += count;
    });

    const maxScore = Math.max(...Object.values(scores));

    if (maxScore > 0) {
        // Regra de Desempate: Bloqueio > Alerta > Transição > Clareza
        if (scores.bloqueio === maxScore) {
            stateTitle = "Bloqueio Emocional";
            stateDesc = "Símbolos de frustração sugerem que há sentimentos reprimidos buscando vazão através do inconsciente.";
            stateColor = "#EF4444"; // red
            StateIcon = Activity;
        } else if (scores.alerta === maxScore) {
            stateTitle = "Estado de Alerta";
            stateDesc = "Seus sonhos indicam uma atenção elevada ou ansiedade latente, talvez ligada a decisões pendentes.";
            stateColor = "#F59E0B"; // amber
            StateIcon = Zap;
        } else if (scores.transicao === maxScore) {
            stateTitle = "Em Transição";
            stateDesc = "A confusão ou novidade nos sonhos aponta para um período de mudança e adaptação em sua vida desperta.";
            stateColor = "#8B5CF6"; // violet
            StateIcon = Brain;
        } else if (scores.clareza === maxScore) {
            stateTitle = "Clareza & Conexão";
            stateDesc = "Seus sonhos refletem harmonia e expansão, um sinal de boas energias e intuição afiada.";
            stateColor = "#10B981"; // emerald
            StateIcon = Compass;
        }
    }

    return { stateTitle, stateDesc, stateColor, StateIcon, topEmotions };
};

// Função para calcular o fluxo semanal (últimos 7 dias)
const getWeeklyFlow = (dreams: DreamEntry[]) => {
    // Buckets: Seg, Ter, Qua, Qui, Sex, Sab, Dom
    // Indices: 0,   1,   2,   3,   4,   5,   6
    const counts = [0, 0, 0, 0, 0, 0, 0];
    let validDreamsCount = 0;

    const now = new Date();
    // Zera horas para comparação justa de dia, ou usa timestamp cheio. 
    // Para "últimos 7 dias", vamos pegar o range simples.
    // timestamp do limite (7 dias atrás)
    const sevenDaysAgoTs = now.getTime() - (7 * 24 * 60 * 60 * 1000);

    dreams.forEach(d => {
        let dateObj: Date | null = null;

        // Tenta inferir a data
        if (d.createdAt) dateObj = new Date(d.createdAt);
        else if ((d as any).date) dateObj = new Date((d as any).date);
        // @ts-ignore - suporte flexível a timestamp se existir no objeto
        else if ((d as any).timestamp) dateObj = new Date((d as any).timestamp);

        if (dateObj && !isNaN(dateObj.getTime())) {
            // Verifica se está nos últimos 7 dias
            if (dateObj.getTime() >= sevenDaysAgoTs && dateObj.getTime() <= now.getTime()) {
                const day = dateObj.getDay(); // 0 (Domingo) a 6 (Sábado)

                // Mapear para: Seg(0), Ter(1), ... Sáb(5), Dom(6)
                // 1 -> 0
                // 2 -> 1
                // ...
                // 6 -> 5
                // 0 -> 6

                let idx = day - 1;
                if (idx < 0) idx = 6; // Domingo

                counts[idx]++;
                validDreamsCount++;
            }
        }
    });

    // Se não tiver dados suficientes, fallback
    if (validDreamsCount === 0) {
        return {
            chartData: [40, 70, 30, 85, 50, 60, 90], // Fake para visual
            hasData: false
        };
    }

    // Normalizar
    const max = Math.max(...counts);
    const chartData = counts.map(count => {
        if (max === 0) return 10;
        // Altura mínima 10%, max 100%
        return (count / max) * 90 + 10;
    });

    return { chartData, hasData: true };
};

const Stats: React.FC = () => {
    const { dreams } = useApp();
    const navigate = useNavigate();



    const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);
    const [globalReport, setGlobalReport] = useState<any>(() => {
        const stored = localStorage.getItem('dreamtells_global_report');
        return stored ? JSON.parse(stored) : null;
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUnlockGlobalAnalysis = async () => {
        if (dreams.length < 2) {
            alert("Você precisa registrar pelo menos 2 sonhos para uma análise de padrões.");
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        try {
            const result = await aiService.analyzeGlobalDreams(dreams);
            setGlobalReport(result);
            localStorage.setItem('dreamtells_global_report', JSON.stringify(result));
            setShowDeepAnalysis(false);
        } catch (err: any) {
            console.error("Erro na análise global:", err);
            setError(err.message || "Não foi possível gerar seu relatório agora.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const diagnosis = useMemo(() => getSubconsciousDiagnosis(dreams), [dreams]);
    const weeklyFlow = useMemo(() => getWeeklyFlow(dreams), [dreams]);

    const { stateTitle, stateDesc, stateColor, StateIcon, topEmotions } = diagnosis;
    const { chartData, hasData } = weeklyFlow;

    const handleShareReport = async () => {
        if (!globalReport) return;

        const textToShare = `✨ *Relatório de Ascensão de Consciência - DreamTells* ✨\n\n🏆 *Fase Atual:* ${globalReport.phaseTitle}\n🛡️ *Arquétipo:* ${globalReport.archetype}\n\n"${globalReport.summary}"\n\n🚀 *Desafio:* ${globalReport.mainChallenge}\n\nDescubra o significado dos seus sonhos em DreamTells!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Minha Jornada no DreamTells',
                    text: textToShare,
                });
            } catch (err) {
                console.warn('Share canceled:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(textToShare);
                alert('Relatório copiado para a área de transferência!');
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

    return (
        <Layout
            title="Diagnóstico Emocional"
            showBack
            icon={<Activity size={18} color="#F9FAFB" />}
        >
            <div style={{ flex: 1, position: 'relative' }}>

                {/* 1. NOVO BLOCO: DIAGNÓSTICO DO SUBCONSCIENTE */}
                <div
                    className="card"
                    style={{
                        marginBottom: 20,
                        background: `linear-gradient(135deg, ${stateColor}20, rgba(15, 23, 42, 0.6))`, // tinted background
                        borderColor: `${stateColor}50`
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            padding: 8,
                            borderRadius: '50%',
                            background: `${stateColor}30`,
                            color: stateColor
                        }}>
                            <StateIcon size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', color: '#F8FAFC', fontWeight: 700 }}>
                            {stateTitle}
                        </h3>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                        {stateDesc}
                    </p>
                </div>

                {/* 2. NOVO BLOCO: INSIGHT DA SEMANA */}
                <div
                    className="card"
                    style={{
                        marginBottom: 20,
                        background: 'linear-gradient(to right, #F8FAFC, #EFF6FF)',
                        borderLeft: '4px solid #3B82F6',
                        padding: 16
                    }}
                >
                    <h3 style={{
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: '#3B82F6',
                        fontWeight: 700,
                        marginBottom: 8
                    }}>
                        Insight da Semana
                    </h3>
                    <p style={{
                        color: '#334155',
                        lineHeight: '1.6',
                        fontSize: '0.95rem',
                        marginBottom: 16
                    }}>
                        {topEmotions.length > 0
                            ? `Quando seus sonhos se intensificam, a emoção de "${topEmotions[0]}" aparece com frequência. Isso pode indicar uma necessidade de atenção para este aspecto em sua vida desperta.`
                            : "Registre mais sonhos para desbloquear insights personalizados sobre seus padrões emocionais."
                        }
                    </p>
                    <button
                        onClick={() => navigate('/write')}
                        style={{
                            background: 'transparent',
                            border: '1px solid #3B82F6',
                            color: '#3B82F6',
                            borderRadius: 999,
                            padding: '8px 16px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        Refletir agora
                    </button>
                </div>

                {/* Card total de Jornadas */}
                <div
                    className="card"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 20,
                    }}
                >
                    <div>
                        <p
                            className="text-muted"
                            style={{ fontSize: '0.9rem' }}
                        >
                            Jornadas do Inconsciente
                        </p>
                        <h2
                            style={{
                                fontSize: '2.5rem',
                                color: 'var(--color-primary)',
                            }}
                        >
                            {dreams.length}
                        </h2>
                    </div>
                    <Brain
                        size={48}
                        color="var(--color-primary)"
                        opacity={0.2}
                    />
                </div>

                {/* Fluxo Semanal (Dados Reais) */}
                <div className="card">
                    <h3
                        style={{
                            marginBottom: 16,
                            fontSize: '1.1rem',
                        }}
                    >
                        Fluxo de Conexão Semanal
                    </h3>
                    <div
                        style={{
                            height: 150,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            paddingBottom: 8,
                        }}
                    >
                        {chartData.map((h, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '10%',
                                    background:
                                        'var(--color-secondary)',
                                    height: `${h}%`,
                                    borderRadius: 4,
                                    opacity: 0.6,
                                }}
                            />
                        ))}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            color: 'var(--color-text-secondary)',
                            marginBottom: hasData ? 0 : 12
                        }}
                    >
                        <span>Seg</span>
                        <span>Ter</span>
                        <span>Qua</span>
                        <span>Qui</span>
                        <span>Sex</span>
                        <span>Sáb</span>
                        <span>Dom</span>
                    </div>

                    {!hasData && (
                        <p style={{
                            textAlign: 'center',
                            fontSize: '0.8rem',
                            color: '#64748B',
                            fontStyle: 'italic'
                        }}>
                            Sem datas suficientes para calcular o fluxo semanal.
                        </p>
                    )}
                </div>

                {/* Predomínio Emocional REAL */}
                <div className="card">
                    <h3
                        style={{
                            marginBottom: 16,
                            fontSize: '1.1rem',
                        }}
                    >
                        Predomínio Emocional
                    </h3>

                    {topEmotions.length > 0 ? (
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                            }}
                        >
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
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
                            Registre mais sonhos para revelar seus padrões emocionais.
                        </p>
                    )}
                </div>

                {/* 5. SEÇÃO DE ANÁLISE GLOBAL (RELATÓRIO DE FASE) */}
                {globalReport ? (
                    <div
                        className="card"
                        style={{
                            marginTop: 30,
                            padding: 24,
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
                            border: '1px solid rgba(90, 62, 242, 0.4)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Glow effect */}
                        <div style={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 100,
                            height: 100,
                            background: 'rgba(90, 62, 242, 0.2)',
                            filter: 'blur(40px)',
                            borderRadius: '50%'
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <Trophy size={24} color="#FBBF24" />
                            <h3 style={{ fontSize: '1.25rem', color: '#F8FAFC', fontWeight: 800 }}>
                                Relatório: {globalReport.phaseTitle}
                            </h3>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 12px',
                                borderRadius: 99,
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: '#818CF8',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                marginBottom: 12
                            }}>
                                <Shield size={14} />
                                Arquétipo Ativo: {globalReport.archetype}
                            </div>
                            <p style={{ color: '#CBD5E1', lineHeight: '1.7', fontSize: '1rem', fontStyle: 'italic' }}>
                                "{globalReport.summary}"
                            </p>
                        </div>

                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 16,
                            padding: 16,
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            marginBottom: 20
                        }}>
                            <h4 style={{ color: '#FCA5A5', fontSize: '0.9rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={16} />
                                Desafio Atual
                            </h4>
                            <p style={{ color: '#E2E8F0', fontSize: '0.95rem' }}>
                                {globalReport.mainChallenge}
                            </p>
                        </div>

                        <div style={{
                            background: 'linear-gradient(90deg, rgba(90, 62, 242, 0.1), transparent)',
                            padding: '16px',
                            borderLeft: '3px solid #6366F1'
                        }}>
                            <h4 style={{ color: '#818CF8', fontSize: '0.9rem', fontWeight: 700, marginBottom: 6 }}>Orientação do Mentor</h4>
                            <p style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 500 }}>
                                {globalReport.advice}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                // Deativado temporariamente para economizar créditos
                                alert("Em breve disponível! \n\nEstamos preparando uma nova versão ainda mais profunda desta análise.");
                            }}
                            style={{
                                marginTop: 24,
                                width: '100%',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#94A3B8',
                                padding: '10px',
                                borderRadius: 12,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                opacity: 0.7
                            }}
                        >
                            Atualizar Análise Global (Em breve)
                        </button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleShareReport}
                            style={{
                                marginTop: 12,
                                width: '100%',
                                padding: '14px 20px',
                                borderRadius: 18,
                                border: 'none',
                                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                boxShadow: '0 8px 20px rgba(236, 72, 153, 0.35)',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                letterSpacing: '0.01em',
                            }}
                        >
                            <Share2 size={18} />
                            Compartilhar minha jornada
                        </motion.button>
                    </div>
                ) : (
                    <div
                        style={{
                            marginTop: 40,
                            marginBottom: 40,
                            textAlign: 'center',
                            padding: '24px 16px'
                        }}
                    >
                        <h4 style={{
                            fontSize: '0.95rem',
                            color: 'var(--color-text-secondary)',
                            fontWeight: 600,
                            marginBottom: 8,
                            opacity: 0.9
                        }}>
                            Análise de Fase de Vida
                        </h4>
                        <p style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-text-secondary)',
                            maxWidth: 300,
                            margin: '0 auto 20px auto',
                            lineHeight: '1.6',
                            opacity: 0.7
                        }}>
                            O que suas histórias noturnas dizem sobre seu momento atual? Descubra o arquétipo que guia sua jornada.
                        </p>
                        <button
                            onClick={() => setShowDeepAnalysis(true)}
                            style={{
                                background: `linear-gradient(135deg, #5A3EF2, #4338CA)`,
                                border: `none`,
                                color: '#F8FAFC',
                                borderRadius: 999,
                                padding: '14px 28px',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                                fontWeight: 700,
                                boxShadow: `0 12px 30px rgba(79, 70, 229, 0.4)`,
                                transition: 'all 0.2s ease-out'
                            }}
                        >
                            <Sparkles size={20} />
                            Revelar Fase de Vida
                        </button>
                    </div>
                )}

                {/* MODAL INTERNO - ANÁLISE PROFUNDA */}
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
                            padding: 16
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
                                textAlign: 'center'
                            }}
                        >
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: `${stateColor}20`,
                                color: stateColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16
                            }}>
                                <Zap size={24} fill={stateColor} fillOpacity={0.2} />
                            </div>

                            <h3 style={{
                                fontSize: '1.25rem',
                                color: '#F8FAFC',
                                marginBottom: 16,
                                fontWeight: 700
                            }}>
                                Análise Profunda
                            </h3>

                            <div style={{
                                fontSize: '0.95rem',
                                color: '#CBD5E1',
                                lineHeight: '1.6',
                                marginBottom: 24
                            }}>
                                <p style={{ marginBottom: 12 }}>
                                    A Análise de Fase de Vida utiliza IA avançada para conectar o histórico de todos os seus sonhos, revelando o arquétipo que está guiando seu momento atual.
                                </p>
                                {dreams.length < 2 && (
                                    <p style={{ color: '#FCA5A5', fontWeight: 600 }}>
                                        Registre pelo menos 2 sonhos para habilitar esta análise.
                                    </p>
                                )}
                                {error && (
                                    <p style={{ color: '#FCA5A5', fontWeight: 600 }}>
                                        {error}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleUnlockGlobalAnalysis}
                                disabled={isAnalyzing || dreams.length < 2}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: 14,
                                    background: isAnalyzing || dreams.length < 2 ? '#334155' : 'linear-gradient(90deg, #4F46E5, #4338CA)',
                                    color: isAnalyzing || dreams.length < 2 ? '#94A3B8' : '#FFFFFF',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    cursor: isAnalyzing || dreams.length < 2 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10
                                }}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Sparkles size={18} className="animate-spin" />
                                        Mapeando Inconsciente...
                                    </>
                                ) : (
                                    <>
                                        <Star size={18} fill="currentColor" />
                                        Gerar Relatório de Fase
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
                                    cursor: 'pointer'
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
