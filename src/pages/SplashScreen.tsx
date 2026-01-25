import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import logo from '../assets/logo.png';

const SplashScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user, setLanguage } = useApp();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) {
                navigate('/home');
                return;
            }

            const storedLang = localStorage.getItem('dreamtells_lang');

            if (storedLang) {
                navigate('/welcome');
            } else {
                const deviceLang = navigator.language.slice(0, 2).toLowerCase();
                const supportedLangs = ['pt', 'es', 'en', 'fr', 'it', 'de'];

                if (supportedLangs.includes(deviceLang)) {
                    setLanguage(deviceLang as any);
                    navigate('/welcome');
                } else {
                    navigate('/language');
                }
            }
        }, 3500); // Um pouco mais de tempo para apreciar o design premium
        return () => clearTimeout(timer);
    }, [navigate, user, setLanguage]);

    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#020617',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Atmosfera Cósmica */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    background: 'radial-gradient(circle at center, #1E293B 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    zIndex: 1
                }}
            />

            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                {/* Logo Oficial DreamTells */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    style={{ marginBottom: 32 }}
                >
                    <div style={{
                        width: 180,
                        height: 180,
                        margin: '0 auto',
                        position: 'relative'
                    }}>
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            style={{
                                position: 'absolute',
                                inset: -20,
                                background: 'radial-gradient(circle, rgba(148,163,184,0.15) 0%, transparent 70%)',
                                borderRadius: '50%'
                            }}
                        />
                        <img
                            src={logo}
                            alt="DreamTells Logo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                borderRadius: '50%',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(148,163,184,0.1)'
                            }}
                        />
                    </div>
                </motion.div>

                {/* Tipografia Premium */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        color: '#F8FAFC',
                        marginBottom: 8,
                        textShadow: '0 10px 20px rgba(0,0,0,0.3)'
                    }}>
                        DreamTells
                    </h1>
                    <div style={{
                        height: 2,
                        width: 40,
                        background: 'linear-gradient(90deg, transparent, #94A3B8, transparent)',
                        margin: '0 auto 16px'
                    }} />
                    <p style={{
                        fontSize: '1rem',
                        color: '#94A3B8',
                        letterSpacing: '0.4em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        opacity: 0.8
                    }}>
                        Sonhos
                    </p>
                </motion.div>

                {/* Tagline e Loading */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 1 }}
                    style={{ marginTop: 48 }}
                >
                    <p style={{
                        fontSize: '0.9rem',
                        color: '#64748B',
                        fontStyle: 'italic',
                        marginBottom: 24,
                        maxWidth: 280,
                        margin: '0 auto 24px'
                    }}>
                        "Cada sonho é um portal para si mesmo."
                    </p>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                animate={{
                                    opacity: [0.2, 1, 0.2],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                                style={{
                                    width: 6,
                                    height: 6,
                                    background: '#94A3B8',
                                    borderRadius: '50%'
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SplashScreen;
