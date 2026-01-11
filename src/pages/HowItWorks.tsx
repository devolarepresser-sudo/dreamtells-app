import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, Brain, Sparkles, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

const HowItWorks: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useApp();

    const steps = [
        {
            icon: <Mic size={28} color="#46E4E1" />,
            title: t('step_1_title'),
            desc: t('step_1_desc'),
            color: 'rgba(70, 228, 225, 0.15)',
        },
        {
            icon: <Brain size={28} color="#A78BFA" />,
            title: t('step_2_title'),
            desc: t('step_2_desc'),
            color: 'rgba(167, 139, 250, 0.15)',
        },
        {
            icon: <Sparkles size={28} color="#FBBF24" />,
            title: t('step_3_title'),
            desc: t('step_3_desc'),
            color: 'rgba(251, 191, 36, 0.15)',
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 },
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background:
                    'radial-gradient(circle at top, #1E293B 0%, #020617 100%)',
                color: '#F9FAFB',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Central Container to match limits */}
            <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 10 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            marginRight: 16,
                        }}
                    >
                        <ArrowLeft size={20} color="#F9FAFB" />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                        {t('how_it_works_title')}
                    </h1>
                </div>

                {/* Steps Container */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16,
                                padding: 20,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 16,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Blob de fundo sutil no card */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -10,
                                    right: -10,
                                    width: 60,
                                    height: 60,
                                    background: step.color,
                                    borderRadius: '50%',
                                    filter: 'blur(20px)',
                                }}
                            />

                            <div
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: 12,
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                {step.icon}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>
                                    {step.title}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.5 }}>
                                    {step.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Footer Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    style={{ marginTop: 32, paddingBottom: 20 }}
                >
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                            border: 'none',
                            borderRadius: 16,
                            color: 'white',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                        }}
                    >
                        {t('action_login_now')} <LogIn size={20} />
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default HowItWorks;
