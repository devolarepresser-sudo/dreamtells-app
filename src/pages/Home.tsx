import type { Variants } from "framer-motion";
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, BookOpen, Crown, X, Lock, Home as HomeIcon, Sparkles, Trophy, Zap, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';

import { FREE_DEV_MODE } from '../config/featureFlags';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 70,
            damping: 15,
        },
    },
};

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user, t, canUsePremium, isLoading, dreams } = useApp();
    const [showInterpretModal, setShowInterpretModal] = useState(false);

    // Cálculos de Gamificação: Caminho do Herói
    const stats = useMemo(() => {
        const dreamsCount = dreams.length;
        const deepAnalysisCount = dreams.filter(d => d.deepAnalysis).length;

        // Algoritmo de Nível de Conexão
        let level = 1;
        let nextMilestone = "3 Sonhos para o Nível 2";
        let progress = (dreamsCount / 3) * 100;
        let title = "Explorador Novato";

        if (dreamsCount >= 3) {
            level = 2;
            nextMilestone = "Primeira Análise Profunda para o Nível 3";
            progress = deepAnalysisCount > 0 ? 100 : 50;
            title = "Aventureiro Onírico";
        }

        if (dreamsCount >= 3 && deepAnalysisCount >= 1) {
            level = 3;
            nextMilestone = "10 Sonhos para o Nível Arquetípico";
            progress = (dreamsCount / 10) * 100;
            title = "Mestre dos Símbolos";
        }

        if (dreamsCount >= 10 && deepAnalysisCount >= 2) {
            level = 4;
            nextMilestone = "A Conexão Suprema foi atingida!";
            progress = 100;
            title = "Sábio Arquetípico";
        }

        return { level, nextMilestone, progress: Math.min(progress, 100), title };
    }, [dreams]);

    const hasAccess = FREE_DEV_MODE ? true : canUsePremium();

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Sparkles className="animate-spin" color="#6366F1" size={40} />
            </div>
        );
    }

    return (
        <Layout
            title="DreamTells"
            icon={<HomeIcon size={18} color="#F9FAFB" />}
        >
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    style={{
                        maxWidth: 480,
                        margin: '0 auto',
                        padding: '12px 0 32px',
                    }}
                >
                    {/* HERO */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            marginBottom: 28,
                            borderRadius: 24,
                            padding: '18px 18px 20px',
                            background:
                                'linear-gradient(135deg, #0F172A 0%, #312E81 40%, #5A3EF2 70%, #46E4E1 100%)',
                            boxShadow:
                                '0 25px 50px -12px rgba(90, 62, 242, 0.35)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.22), transparent 60%)',
                                opacity: 0.9,
                                pointerEvents: 'none',
                            }}
                        />
                        <div style={{ position: 'relative' }}>
                            <p
                                style={{
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.14em',
                                    color: 'rgba(226,232,240,0.9)',
                                    marginBottom: 6,
                                    fontWeight: 600,
                                }}
                            >
                                {user
                                    ? `${t('home_welcome')}, ${user.name || 'Explorador(a)'}`
                                    : t('home_welcome_generic')}
                            </p>
                            <h2
                                style={{
                                    fontSize: '1.8rem',
                                    fontWeight: 800,
                                    color: '#F9FAFB',
                                    marginBottom: 10,
                                    lineHeight: 1.15,
                                    letterSpacing: '-0.04em',
                                }}
                            >
                                {t('home_hero_title')}
                            </h2>
                            <p
                                style={{
                                    fontSize: '0.98rem',
                                    lineHeight: 1.6,
                                    color: 'rgba(241,245,249,0.9)',
                                }}
                            >
                                {t('home_hero_body')}
                            </p>
                        </div>
                    </motion.div>

                    {/* SISTEMA DE PROGRESSÃO: CAMINHO DO HERÓI */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            marginBottom: 24,
                            padding: '16px 20px',
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: 20,
                            border: '1px solid rgba(90, 62, 242, 0.2)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
                                }}>
                                    <Trophy size={16} color="#FFF" fill="#FFF" />
                                </div>
                                <div>
                                    <h4 style={{ color: '#F8FAFC', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Nível {stats.level}: {stats.title}
                                    </h4>
                                    <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{stats.nextMilestone}</p>
                                </div>
                            </div>
                            <Zap size={18} color="#FBBF24" fill="#FBBF24" opacity={0.8} />
                        </div>

                        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #5A3EF2, #46E4E1)',
                                    boxShadow: '0 0 10px rgba(90, 62, 242, 0.5)'
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* BADGE PLANO */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: 26,
                            padding: '10px 14px',
                            borderRadius: 999,
                            background: hasAccess
                                ? 'rgba(246,211,118,0.12)'
                                : 'rgba(148,163,184,0.12)',
                            border: hasAccess
                                ? '1px solid rgba(246,211,118,0.65)'
                                : '1px solid rgba(148,163,184,0.55)',
                            boxShadow: hasAccess
                                ? '0 10px 26px rgba(246,211,118,0.35)'
                                : '0 10px 26px rgba(15,23,42,0.55)',
                        }}
                    >
                        <div
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                display: 'flex', // Fixed: removed stray '.'
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 10,
                                background: hasAccess
                                    ? 'linear-gradient(135deg,#F6D376,#F1C40F)'
                                    : 'linear-gradient(135deg,#A0AEC0,#64748B)',
                                boxShadow: hasAccess
                                    ? '0 8px 20px rgba(246,211,118,0.55)'
                                    : '0 8px 20px rgba(15,23,42,0.65)',
                            }}
                        >
                            {hasAccess ? (
                                <Crown size={16} color="#1F2933" />
                            ) : (
                                <Lock size={16} color="#0B1120" />
                            )}
                        </div>
                        <span
                            style={{
                                fontSize: '0.86rem',
                                fontWeight: 600,
                                color: hasAccess ? '#F6E1A4' : '#E2E8F0',
                            }}
                        >
                            {hasAccess ? 'Premium Ativo' : 'Trial Expirado'}
                        </span>
                    </motion.div>

                    {/* AÇÕES PRINCIPAIS */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                            marginBottom: 28,
                        }}
                    >
                        {/* Interpretar */}
                        <motion.button
                            onClick={() => setShowInterpretModal(true)}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '1.1rem',
                                borderRadius: 20,
                                padding: '16px 20px',
                                background:
                                    'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                border: 'none',
                                color: '#F9FAFB',
                                fontWeight: 800,
                                letterSpacing: '0.01em',
                                boxShadow:
                                    '0 12px 32px rgba(90,62,242,0.45)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            whileTap={{ scale: 0.96 }}
                            whileHover={{
                                scale: 1.02,
                                boxShadow: '0 16px 40px rgba(90,62,242,0.6)',
                            }}
                        >
                            <Sparkles size={20} style={{ marginRight: 10 }} />
                            {t('action_interpret')}
                        </motion.button>

                        {/* Histórico */}
                        <motion.button
                            onClick={() => navigate('/history')}
                            className="btn-secondary"
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 999,
                                padding: '11px 16px',
                                background: 'rgba(15,23,42,0.96)',
                                border: '1px solid rgba(148,163,184,0.85)',
                                color: '#E5E7EB',
                                fontWeight: 600,
                                boxShadow: '0 12px 30px rgba(15,23,42,0.9)',
                                cursor: 'pointer',
                            }}
                            whileTap={{ scale: 0.98 }}
                            whileHover={{
                                scale: 1.01,
                                background: 'rgba(30,41,59,1)',
                            }}
                        >
                            <BookOpen size={18} style={{ marginRight: 10 }} />
                            {t('action_history')}
                        </motion.button>
                    </motion.div>

                    {/* Teaser premium */}
                    {!hasAccess && (
                        <motion.div
                            variants={itemVariants}
                            style={{
                                textAlign: 'center',
                                marginTop: 'auto',
                                paddingTop: 8,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 10,
                                }}
                            >
                                Sua jornada continua com o Premium.
                            </p>
                            <button
                                onClick={() => navigate('/premium')}
                                style={{
                                    color: '#46E4E1',
                                    fontWeight: 700,
                                    fontSize: '0.98rem',
                                    textDecoration: 'underline',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {t('premium_teaser')}
                            </button>
                        </motion.div>
                    )}
                </div>

                {/* MODAL INTERPRETAR */}
                <AnimatePresence>
                    {showInterpretModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowInterpretModal(false)}
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.6)',
                                    zIndex: 50,
                                    backdropFilter: 'blur(6px)',
                                }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                                transition={{
                                    type: 'spring',
                                    damping: 24,
                                    stiffness: 260,
                                }}
                                style={{
                                    position: 'fixed',
                                    top: '50%',
                                    left: '50%',
                                    // transform removed to avoid conflict with motion props
                                    background:
                                        'linear-gradient(135deg,#111827,#020617)',
                                    borderRadius: 24,
                                    padding: '22px 20px 26px',
                                    zIndex: 60,
                                    width: '90%',
                                    maxWidth: 420,
                                    boxShadow:
                                        '0 25px 50px -12px rgba(0,0,0,0.8)',
                                    border:
                                        '1px solid rgba(148,163,184,0.3)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 18,
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            color: '#E5E7EB',
                                        }}
                                    >
                                        Como deseja interpretar?
                                    </h3>
                                    <button
                                        onClick={() => setShowInterpretModal(false)}
                                        style={{
                                            background: 'rgba(15,23,42,0.95)',
                                            borderRadius: '50%',
                                            padding: 8,
                                            border: '1px solid rgba(148,163,184,0.7)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <X size={20} color="#E5E7EB" />
                                    </button>
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gap: 12,
                                    }}
                                >
                                    <motion.button
                                        onClick={() => {
                                            setShowInterpretModal(false);
                                            navigate('/record');
                                        }}
                                        className="btn-secondary"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 999,
                                            padding: '11px 14px',
                                            background: 'rgba(15,23,42,0.96)',
                                            border: '1px solid rgba(148,163,184,0.85)',
                                            color: '#E5E7EB',
                                            boxShadow: '0 12px 30px rgba(15,23,42,0.9)',
                                            cursor: 'pointer',
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Mic size={20} style={{ marginRight: 10 }} />
                                        {t('action_record')}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </motion.div>
        </Layout>
    );
};

export default Home;
