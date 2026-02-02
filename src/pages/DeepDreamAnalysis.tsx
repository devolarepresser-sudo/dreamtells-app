
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';
import { DreamEntry } from '../types';
import { aiService } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

// Fallback QUESTIONS (serão sobrescritas pela API)
const DEFAULT_QUESTIONS = [
    "O que este sonho diz sobre seu momento atual?",
    "Qual sentimento mais forte ficou ao acordar?",
    "Há algum símbolo que chamou sua atenção?",
    "O que você faria diferente se estivesse no sonho novamente?",
    "Existe alguém no sonho que representa uma parte de você?",
    "Qual mensagem esse sonho tenta te passar?"
];

// Reutilizando estilos base vistos em Interpretation.tsx para consistência
// Adicionado motion.div no render para animar este card
const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 600,
    background: 'linear-gradient(135deg,#0B1026,#111827)',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 22px 60px rgba(15,23,42,0.95)',
    border: '1px solid rgba(148,163,184,0.7)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20
};

const DeepDreamAnalysis: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { dreams, updateDream, language } = useApp();

    const [dream, setDream] = useState<DreamEntry | undefined>(undefined);
    const [questions, setQuestions] = useState<string[]>(DEFAULT_QUESTIONS);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

    useEffect(() => {
        if (id) {
            const found = dreams.find(d => d.id === id);
            if (found) {
                setDream(found);
                // Buscar perguntas assim que tivermos o sonho
                (async () => {
                    setIsLoadingQuestions(true);
                    try {
                        const q = await aiService.getDeepQuestions(found.text, language);
                        if (q && q.length > 0) setQuestions(q);
                    } catch (e) {
                        console.error("Falha ao carregar perguntas dinâmicas:", e);
                    } finally {
                        setIsLoadingQuestions(false);
                    }
                })();
            } else {
                try {
                    const stored = localStorage.getItem('dreamtells_last_interpretation');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (parsed.id === id) {
                            setDream(parsed);
                            // Buscar perguntas
                            (async () => {
                                setIsLoadingQuestions(true);
                                try {
                                    const q = await aiService.getDeepQuestions(parsed.text, language);
                                    if (q && q.length > 0) setQuestions(q);
                                } catch (e) {
                                    console.error("Falha ao carregar perguntas dinâmicas:", e);
                                } finally {
                                    setIsLoadingQuestions(false);
                                }
                            })();
                        }
                    }
                } catch { }
            }
        }
    }, [id, dreams, language]);

    if (!dream || isLoadingQuestions) {
        return (
            <Layout
                title="Carregando..."
                icon={<Sparkles size={18} color="#8B5CF6" />}
            >
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    gap: 16
                }}>
                    <Sparkles size={40} color="#6366F1" className="animate-pulse" />
                    <p style={{ color: '#94A3B8' }}>Invocando sabedoria do inconsciente...</p>
                </div>
            </Layout>
        );
    }

    const QUESTIONS_TO_USE = questions.length > 0 ? questions : DEFAULT_QUESTIONS;

    const handleNext = async () => {
        if (currentStep < QUESTIONS_TO_USE.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Finalizar - Chamar API Real (via aiService refatorado)
            if (!dream) return;

            setIsGenerating(true);
            try {
                const analysisData = await aiService.analyzeDeepDream(
                    dream.text,
                    {
                        main: dream.interpretationMain,
                        advice: dream.advice,
                        symbols: dream.symbols
                    },
                    answers,
                    language
                );

                if (analysisData) {
                    // O retorno agora já é o objeto de análise direto
                    const updatedDream = {
                        ...dream,
                        deepAnalysis: analysisData
                    };
                    await updateDream(dream.id, { deepAnalysis: analysisData });

                    // Sincroniza cache local imediato para a tela de interpretação não quebrar no refresh
                    localStorage.setItem('dreamtells_last_interpretation', JSON.stringify(updatedDream));

                    navigate(`/interpretation`, { state: { dream: updatedDream } });
                } else {
                    throw new Error('Análise não retornada ou incompleta.');
                }
            } catch (err: any) {
                console.error("Erro ao aprofundar:", err);
                const errorMsg = err.message || "Não foi possível gerar o aprofundamento agora.";
                alert(`Erro: ${errorMsg}\n\nPor favor, verifique se sua chave da OpenAI tem saldo ou tente novamente em instantes.`);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const progress = ((currentStep + 1) / QUESTIONS_TO_USE.length) * 100;

    return (
        <Layout
            title="Aprofundamento"
            icon={<Sparkles size={18} color="#8B5CF6" />}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    minHeight: '100vh',
                    padding: '18px 16px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    // Atmosfera mais escura e imersiva para o deep analysis
                    background: 'radial-gradient(circle at center, #0F172A 0%, #020617 100%)',
                }}
            >
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    style={{ width: '100%', maxWidth: 600, display: 'flex', alignItems: 'center', marginBottom: 24 }}
                >
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9CA3AF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <ArrowLeft size={18} />
                        Voltar
                    </button>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    style={cardStyle}
                >
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>
                            Mergulhe no Inconsciente
                        </h2>
                        <p style={{ color: '#94A3B8', lineHeight: 1.5, fontSize: '0.95rem' }}>
                            Para revelar as camadas ocultas deste sonho, responda a algumas perguntas guiadas.
                        </p>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem', color: '#94A3B8' }}>
                            <span>Pergunta {currentStep + 1} de {QUESTIONS_TO_USE.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #6366F1, #818CF8)',
                                }}
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                background: 'rgba(15,23,42,0.6)',
                                border: '1px solid rgba(148,163,184,0.2)',
                                borderRadius: 16,
                                padding: 20,
                                marginTop: 10
                            }}
                        >
                            <h3 style={{ color: '#E2E8F0', fontSize: '1.1rem', marginBottom: 16 }}>
                                {QUESTIONS_TO_USE[currentStep]}
                            </h3>
                            <textarea
                                value={answers[currentStep] || ''}
                                onChange={(e) => setAnswers({ ...answers, [currentStep]: e.target.value })}
                                placeholder="Digite sua resposta aqui..."
                                disabled={isGenerating}
                                style={{
                                    width: '100%',
                                    minHeight: 100,
                                    background: 'rgba(2,6,23,0.5)',
                                    border: '1px solid rgba(148,163,184,0.3)',
                                    borderRadius: 12,
                                    padding: 12,
                                    color: '#F9FAFB',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    resize: 'none',
                                    outline: 'none',
                                    opacity: isGenerating ? 0.5 : 1
                                }}
                            />
                        </motion.div>
                    </AnimatePresence>

                    <motion.button
                        onClick={handleNext}
                        disabled={!answers[currentStep]?.trim() || isGenerating}
                        whileHover={!answers[currentStep]?.trim() || isGenerating ? {} : { scale: 1.02 }}
                        whileTap={!answers[currentStep]?.trim() || isGenerating ? {} : { scale: 0.98 }}
                        style={{
                            marginTop: 10,
                            width: '100%',
                            padding: '14px',
                            borderRadius: 12,
                            border: 'none',
                            background: !answers[currentStep]?.trim() || isGenerating
                                ? 'rgba(71,85,105,0.5)'
                                : 'linear-gradient(90deg, #4F46E5, #4338CA)',
                            color: (!answers[currentStep]?.trim() || isGenerating) ? '#94A3B8' : '#fff',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: (!answers[currentStep]?.trim() || isGenerating) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'background 0.2s', // mantendo transition para cor de fundo
                            boxShadow: (!answers[currentStep]?.trim() || isGenerating)
                                ? 'none'
                                : '0 4px 12px rgba(67, 56, 202, 0.4)'
                        }}
                    >
                        {isGenerating ? (
                            <>
                                Gerando Análise Profunda...
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                    style={{ display: 'flex', alignItems: 'center' }}
                                >
                                    <Sparkles size={20} />
                                </motion.div>
                            </>
                        ) : currentStep < QUESTIONS_TO_USE.length - 1 ? (
                            <>
                                Próxima Pergunta <ChevronRight size={18} />
                            </>
                        ) : (
                            <>
                                Gerar interpretação aprofundada
                                <Sparkles size={18} />
                            </>
                        )}
                    </motion.button>

                </motion.div>
            </motion.div>
        </Layout>
    );
};

export default DeepDreamAnalysis;
