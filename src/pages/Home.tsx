import type { Variants } from "framer-motion";
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { BookOpen, Crown, Lock, Home as HomeIcon, Sparkles, Trophy, Zap, Compass, ChevronRight, Mic, Library } from 'lucide-react';
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


    // Cálculos de Gamificação: Caminho do Herói
    const stats = useMemo(() => {
        const dreamsCount = dreams.length;
        const deepAnalysisCount = dreams.filter(d => d.deepAnalysis).length;

        // Algoritmo de Nível de Conexão
        let level = 1;
        let nextMilestone = t('gamification_milestone_l1');
        let progress = (dreamsCount / 3) * 100;
        let title = t('gamification_title_l1');

        if (dreamsCount >= 3) {
            level = 2;
            nextMilestone = t('gamification_milestone_l2');
            progress = deepAnalysisCount > 0 ? 100 : 50;
            title = t('gamification_title_l2');
        }

        if (dreamsCount >= 3 && deepAnalysisCount >= 1) {
            level = 3;
            nextMilestone = t('gamification_milestone_l3');
            progress = (dreamsCount / 10) * 100;
            title = t('gamification_title_l3');
        }

        if (dreamsCount >= 10 && deepAnalysisCount >= 2) {
            level = 4;
            nextMilestone = t('gamification_milestone_l4');
            progress = 100;
            title = t('gamification_title_l4');
        }

        return { level, nextMilestone, progress: Math.min(progress, 100), title };
    }, [dreams, t]);

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
            showBack={false}
            showMenu={true}
            icon={<HomeIcon size={18} className="icon-white" />}
            iconClass="menuIconTile-home"
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                {/* Avatar Pequeno na Home */}
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: '50%',
                                        background: user?.photoURL
                                            ? `url(${user.photoURL}) center/cover no-repeat`
                                            : 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: '#FFF',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        flexShrink: 0,
                                        border: '1.5px solid rgba(255,255,255,0.2)'
                                    }}
                                >
                                    {!user?.photoURL && (user?.name?.[0] || 'D')}
                                </div>

                                <p
                                    style={{
                                        fontSize: '0.85rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        color: 'rgba(226,232,240,0.9)',
                                        fontWeight: 600,
                                        margin: 0
                                    }}
                                >
                                    {user
                                        ? `${t('home_welcome')}, ${user.name || 'Explorador(a)'}`
                                        : t('home_welcome_generic')}
                                </p>
                            </div>

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
                                        {t('gamification_level', { level: stats.level, title: stats.title })}
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

                    {/* AÇÕES PRINCIPAIS - AGORA O GUIA É O PRIMEIRO DE TODOS */}
                    <motion.div
                        variants={itemVariants}
                        onClick={() => navigate('/guia')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            marginBottom: 24,
                            padding: '16px 20px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: 20,
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ flex: 1, paddingRight: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <div className="headerIconTile menuIconTile-knowledge" style={{ width: 32, height: 32 }}>
                                    <Library size={16} className="icon-white" />
                                </div>
                                <h4 style={{ color: '#F9FAFB', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                                    {t('menu_knowledge')}
                                </h4>
                            </div>
                            <p style={{ color: '#818CF8', fontSize: '0.85rem', margin: '4px 0 0 42px', lineHeight: 1.4 }}>
                                Explore o guia completo para navegar no seu inconsciente.
                            </p>
                        </div>
                        <ChevronRight size={20} color="#818CF8" />
                    </motion.div>

                    {/* MAPA DO INCONSCIENTE */}
                    <motion.div
                        variants={itemVariants}
                        onClick={() => navigate('/unconscious-map')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            marginBottom: 24,
                            padding: '16px 20px',
                            background: 'rgba(168, 85, 247, 0.1)',
                            borderRadius: 20,
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ flex: 1, paddingRight: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <div className="headerIconTile menuIconTile-map" style={{ width: 32, height: 32 }}>
                                    <Compass size={16} className="icon-white" />
                                </div>
                                <h4 style={{ color: '#F9FAFB', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                                    {t('map_card_home_title')}
                                </h4>
                            </div>
                            <p style={{ color: '#D8B4FE', fontSize: '0.8rem', margin: '4px 0 0 42px', lineHeight: 1.4 }}>
                                {t('map_card_home_desc')}
                            </p>
                        </div>
                        <ChevronRight size={18} color="#A855F7" />
                    </motion.div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>

                        {/* Interpretar Agora (Unificado com Gravação) */}
                        <motion.div
                            variants={itemVariants}
                            onClick={() => navigate('/record')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                padding: '16px 20px',
                                background: 'rgba(6, 182, 212, 0.1)', // Mantive o Ciano que você gostou para gravação
                                borderRadius: 20,
                                border: '1px solid rgba(6, 182, 212, 0.4)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ flex: 1, paddingRight: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <div className="headerIconTile menuIconTile-audio" style={{ width: 32, height: 32 }}>
                                        <Mic size={16} className="icon-white" />
                                    </div>
                                    <h4 style={{ color: '#F9FAFB', fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                                        Interpretar Agora
                                    </h4>
                                </div>
                                <p style={{ color: '#67E8F9', fontSize: '0.85rem', margin: '4px 0 0 42px', lineHeight: 1.4, opacity: 0.9 }}>
                                    Narre seu sonho ou escreva para revelar os mistérios agora.
                                </p>
                            </div>
                            <ChevronRight size={20} color="#06B6D4" />
                        </motion.div>

                        {/* Histórico de Sonhos (Minha Jornada) - AGORA COM MESMA COR */}
                        <motion.div
                            variants={itemVariants}
                            onClick={() => navigate('/history')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                padding: '16px 20px',
                                background: 'rgba(99, 102, 241, 0.1)', // Unificado com a cor do Guia/Premium
                                borderRadius: 20,
                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ flex: 1, paddingRight: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <div className="headerIconTile menuIconTile-write" style={{ width: 32, height: 32 }}>
                                        <BookOpen size={16} className="icon-white" />
                                    </div>
                                    <h4 style={{ color: '#F9FAFB', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                                        {t('action_history')}
                                    </h4>
                                </div>
                                <p style={{ color: '#818CF8', fontSize: '0.85rem', margin: '4px 0 0 42px', lineHeight: 1.4 }}>
                                    Revise suas memórias e padrões emocionais passados.
                                </p>
                            </div>
                            <ChevronRight size={20} color="#818CF8" />
                        </motion.div>
                    </div>

                    {/* BADGE PLANO (Movido para o final) */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 26,
                            padding: '12px 20px',
                            borderRadius: 20,
                            background: hasAccess
                                ? 'rgba(246,211,118,0.08)'
                                : 'rgba(148,163,184,0.08)',
                            border: hasAccess
                                ? '1px solid rgba(246,211,118,0.3)'
                                : '1px solid rgba(148,163,184,0.3)',
                        }}
                    >
                        <div
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 10,
                                background: hasAccess
                                    ? 'linear-gradient(135deg,#F6D376,#F1C40F)'
                                    : 'linear-gradient(135deg,#A0AEC0,#64748B)',
                            }}
                        >
                            {hasAccess ? (
                                <Crown size={14} color="#1F2933" />
                            ) : (
                                <Lock size={14} color="#0B1120" />
                            )}
                        </div>
                        <span
                            style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: hasAccess ? '#F6E1A4' : '#E2E8F0',
                                opacity: 0.9
                            }}
                        >
                            {hasAccess ? t('premium_active') : t('premium_expired')}
                        </span>
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
                                {t('premium_teaser_journey')}
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

            </motion.div >
        </Layout >
    );
};

export default Home;
