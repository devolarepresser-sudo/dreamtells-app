import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Mic, BookOpen, Crown, X, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

import { FREE_DEV_MODE } from '../config/featureFlags';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user, t, canUsePremium, isLoading } = useApp();
    const [showInterpretModal, setShowInterpretModal] = useState(false);

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
                {/* Simple loading spinner or skeleton */}
            </div>
        );
    }

    return (
        <Layout title="DreamTells">
            <div
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
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            marginBottom: 28,
                            borderRadius: 24,
                            padding: '18px 18px 20px',
                            background:
                                'linear-gradient(135deg, #151A3A 0%, #5A3EF2 45%, #46E4E1 100%)',
                            boxShadow:
                                '0 20px 55px rgba(15,23,42,0.55)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
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

                    {/* BADGE PLANO */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
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
                                display: 'flex',
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
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                            marginBottom: 28,
                        }}
                    >
                        {/* Interpretar */}
                        <button
                            onClick={() => setShowInterpretModal(true)}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '1.05rem',
                                borderRadius: 999,
                                padding: '13px 18px',
                                background:
                                    'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                border: 'none',
                                color: '#F9FAFB',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                boxShadow:
                                    '0 16px 40px rgba(90,62,242,0.6)',
                                cursor: 'pointer',
                            }}
                        >
                            {t('action_interpret')}
                        </button>

                        {/* Histórico */}
                        <button
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
                        >
                            <BookOpen size={18} style={{ marginRight: 10 }} />
                            {t('action_history')}
                        </button>
                    </motion.div>

                    {/* Teaser premium */}
                    {!hasAccess && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
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
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{
                                    type: 'spring',
                                    damping: 24,
                                    stiffness: 260,
                                }}
                                style={{
                                    position: 'fixed',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background:
                                        'linear-gradient(135deg,#111827,#020617)',
                                    borderTopLeftRadius: 24,
                                    borderTopRightRadius: 24,
                                    padding: '22px 20px 26px',
                                    zIndex: 60,
                                    maxWidth: 480,
                                    margin: '0 auto',
                                    boxShadow:
                                        '0 -20px 46px rgba(0,0,0,0.8)',
                                    border:
                                        '1px solid rgba(148,163,184,0.5)',
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
                                    <button
                                        onClick={() => {
                                            setShowInterpretModal(false);
                                            navigate('/write');
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
                                    >
                                        <PenTool size={20} style={{ marginRight: 10 }} />
                                        {t('action_write')}
                                    </button>
                                    <button
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
                                    >
                                        <Mic size={20} style={{ marginRight: 10 }} />
                                        {t('action_record')}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default Home;
