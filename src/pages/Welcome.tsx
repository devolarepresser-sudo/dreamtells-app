import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Welcome: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            className="container"
            style={{
                minHeight: '100vh',
                background:
                    'radial-gradient(circle at top, #1E293B 0%, #0B1120 45%, #020617 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Glow de fundo esquerdo */}
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.3, 0.18] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    top: '-15%',
                    left: '-10%',
                    width: '55vw',
                    height: '55vw',
                    background:
                        'radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(15,23,42,0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(32px)',
                    zIndex: 0,
                }}
            />

            {/* Glow de fundo direito */}
            <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.16, 0.28, 0.16] }}
                transition={{
                    duration: 9.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.8,
                }}
                style={{
                    position: 'absolute',
                    bottom: '-18%',
                    right: '-12%',
                    width: '60vw',
                    height: '60vw',
                    background:
                        'radial-gradient(circle, rgba(129,140,248,0.3) 0%, rgba(15,23,42,0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(34px)',
                    zIndex: 0,
                }}
            />

            {/* CONTAINER CENTRAL */}
            <div
                style={{
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: 420,
                }}
            >
                {/* CARD PRINCIPAL */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                        width: '100%',
                        borderRadius: 28,
                        padding: '28px 22px 24px',
                        background:
                            'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,64,175,0.96))',
                        border: '1px solid rgba(148,163,184,0.7)',
                        boxShadow: '0 26px 70px rgba(15,23,42,0.95)',
                        backdropFilter: 'blur(18px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    {/* Logo */}
                    <motion.img
                        src="/logo.png"
                        alt="DreamTells Logo"
                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                            width: 120,
                            marginBottom: 28,
                            filter:
                                'drop-shadow(0 18px 40px rgba(15,23,42,0.9))',
                        }}
                    />

                    {/* Título */}
                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                        style={{
                            fontSize: '1.9rem',
                            fontWeight: 800,
                            color: '#F9FAFB',
                            textAlign: 'center',
                            marginBottom: 14,
                            lineHeight: 1.2,
                            letterSpacing: '-0.04em',
                        }}
                    >
                        Descubra o que seus sonhos revelam sobre você.
                    </motion.h1>

                    {/* Subtítulo */}
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
                        style={{
                            fontSize: '0.98rem',
                            color: 'rgba(226,232,240,0.86)',
                            textAlign: 'center',
                            marginBottom: 26,
                            lineHeight: 1.6,
                        }}
                    >
                        Interpretações profundas, claras e personalizadas — guiadas por
                        uma IA criada para entender sua alma.
                    </motion.p>

                    {/* BOTÃO PRINCIPAL */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.5, delay: 0.55 }}
                        onClick={() => navigate('/login')}
                        style={{
                            width: '100%',
                            padding: '14px 18px',
                            background:
                                'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                            color: '#F9FAFB',
                            border: '1px solid rgba(191,219,254,0.95)',
                            borderRadius: 999,
                            fontSize: '1.02rem',
                            fontWeight: 700,
                            boxShadow:
                                '0 20px 46px rgba(90,62,242,0.78)',
                            cursor: 'pointer',
                            marginBottom: 14,
                        }}
                    >
                        Entrar
                    </motion.button>

                    {/* LINK SECUNDÁRIO */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        onClick={() => navigate('/about')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#A5B4FC',
                            fontSize: '0.94rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        Explorar como funciona <span>→</span>
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
};

export default Welcome;
