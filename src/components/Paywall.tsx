import React, { useState } from 'react';
import Layout from './Layout';
import { useApp } from '../context/AppContext';
import { Sparkles, Mic, Shield, Crown, ChevronRight, Activity, Library, Compass, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaywallProps {
    onClose?: () => void;
}

const Paywall: React.FC<PaywallProps> = () => {
    const { t } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = () => {
        setIsLoading(true);
        setTimeout(() => {
            alert(t('paywall_payment_soon'));
            setIsLoading(false);
        }, 1500);
    };

    const features = [
        {
            icon: <Activity size={24} color="#3B82F6" />,
            title: t('paywall_feature_emotional_diag_title'),
            desc: t('paywall_feature_emotional_diag_desc'),
            color: "rgba(59, 130, 246, 0.1)",
            border: "rgba(59, 130, 246, 0.3)"
        },
        {
            icon: <Compass size={24} color="#A855F7" />,
            title: t('paywall_feature_unconscious_dive_title'),
            desc: t('paywall_feature_unconscious_dive_desc'),
            color: "rgba(168, 85, 247, 0.1)",
            border: "rgba(168, 85, 247, 0.3)"
        },
        {
            icon: <Sun size={24} color="#F6E05E" />,
            title: t('paywall_feature_daily_msg_title'),
            desc: t('paywall_feature_daily_msg_desc'),
            color: "rgba(246, 224, 94, 0.1)",
            border: "rgba(246, 224, 94, 0.3)"
        },
        {
            icon: <Library size={24} color="#818CF8" />,
            title: t('paywall_feature_symbols_lib_title'),
            desc: t('paywall_feature_symbols_lib_desc'),
            color: "rgba(129, 140, 248, 0.1)",
            border: "rgba(129, 140, 248, 0.3)"
        },
        {
            icon: <Mic size={24} color="#06B6D4" />,
            title: t('paywall_feature_voice_title'),
            desc: t('paywall_feature_voice_desc'),
            color: "rgba(6, 182, 212, 0.1)",
            border: "rgba(6, 182, 212, 0.3)"
        },
        {
            icon: <Sparkles size={24} color="#8B5CF6" />,
            title: "Interpretações Ilimitadas",
            desc: "Acesse o poder total da IA sem limites diários.",
            color: "rgba(139, 92, 246, 0.1)",
            border: "rgba(139, 92, 246, 0.3)"
        },
        {
            icon: <Shield size={24} color="#94A3B8" />,
            title: "Privacidade total",
            desc: "Seus dados são criptografados.",
            color: "rgba(148, 163, 184, 0.1)",
            border: "rgba(148, 163, 184, 0.3)"
        }
    ];

    return (
        <Layout
            title="Premium"
            showBack={true}
            icon={<Crown size={18} className="icon-dark" />}
            iconClass="menuIconTile-premium"
        >
            <div
                style={{
                    minHeight: '100vh',
                    padding: '12px 0 40px', // Reduced side padding here, handled by global or inner
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'transparent', // Outer is transparent
                }}
            >
                {/* INNER CARD with Rounded Corners */}
                <div style={{
                    width: '100%',
                    maxWidth: 480,
                    background: 'radial-gradient(circle at top, #1E1B4B 0%, #020617 70%)',
                    borderRadius: 24, // The requested rounded corners
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden' // Ensure glow doesn't spill out
                }}>

                    {/* HERO SECTION */}
                    <div style={{
                        width: '100%',
                        textAlign: 'center',
                        marginTop: 0, // Reset margin since we have padding in container
                        marginBottom: 32,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative'
                    }}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{ marginBottom: 20, position: 'relative' }}
                        >
                            {/* Glow effect */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 140,
                                height: 140,
                                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
                                borderRadius: '50%',
                                filter: 'blur(20px)',
                                zIndex: 0
                            }} />

                            <img
                                src="/logo_gold.png"
                                alt="DreamTells Premium"
                                style={{
                                    width: 110,
                                    height: 110,
                                    objectFit: 'contain',
                                    position: 'relative',
                                    zIndex: 1,
                                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                                }}
                            />
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                fontSize: '1.75rem',
                                fontWeight: 800,
                                background: 'linear-gradient(to right, #FDE68A, #F59E0B, #D97706)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: 12,
                                lineHeight: 1.2,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {t('paywall_hero_title')}
                        </motion.h1>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                fontSize: '1rem',
                                color: '#CBD5E1',
                                lineHeight: 1.6,
                                maxWidth: '90%',
                                margin: 0,
                            }}
                        >
                            {t('paywall_hero_subtitle_start')} <span style={{ color: '#FCD34D', fontWeight: 600 }}>{t('paywall_hero_subtitle_highlight')}</span> {t('paywall_hero_subtitle_end')}
                        </motion.p>
                    </div>

                    {/* FEATURE GRID */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: 16,
                        width: '100%',
                        marginBottom: 32
                    }}>
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 + (idx * 0.1) }}
                                style={{
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    border: `1px solid ${feature.border}`,
                                    borderRadius: 16,
                                    padding: 16,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 16,
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                }}
                            >
                                <div style={{
                                    background: feature.color,
                                    padding: 10,
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {feature.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        color: '#F1F5F9',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        marginBottom: 4
                                    }}>
                                        {feature.title}
                                    </h3>
                                    <p style={{
                                        color: '#94A3B8',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                        margin: 0
                                    }}>
                                        {feature.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>


                    {/* CTA BUTTON */}
                    <div style={{
                        width: '100%',
                        zIndex: 10
                    }}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubscribe}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: 16,
                                padding: '18px',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                boxShadow: '0 10px 30px rgba(180, 83, 9, 0.4)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isLoading ? (
                                <span>{t('paywall_processing')}</span>
                            ) : (
                                <>
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, height: '1px',
                                        background: 'rgba(255,255,255,0.3)'
                                    }} />
                                    <span>{t('paywall_cta_start')}</span>
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Paywall;
