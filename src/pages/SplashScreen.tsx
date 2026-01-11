import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SplashScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user, setLanguage } = useApp();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) {
                navigate('/home');
                return;
            }

            // Se já tem idioma no contexto (carregado do storage), segue
            // Mas precisamos distinguir se é "default state" ou "saved state"
            // O AppContext carrega do storage na inicialização.
            // Se o storage retornou algo, o "language" já estará setado corretamente.
            // Porem, se for a primeira vez, o AppContext inicia com 'pt' (default state).
            // Vamos verificar o storage DIRETAMENTE aqui para ter certeza se é user choice ou default.

            const storedLang = localStorage.getItem('dreamtells_lang');

            if (storedLang) {
                // Usuário já escolheu antes -> Segue fluxo normal
                navigate('/welcome');
            } else {
                // Primeira vez -> Tenta auto-detectar
                const deviceLang = navigator.language.slice(0, 2).toLowerCase();
                const supportedLangs = ['pt', 'es', 'en', 'fr', 'it', 'de'];

                if (supportedLangs.includes(deviceLang)) {
                    // Sucesso: Detectou idioma suportado
                    setLanguage(deviceLang as any);
                    navigate('/welcome');
                } else {
                    // Fallback: Dispositivo em idioma não suportado (ex: Russo) -> Vai para seleção manual
                    // (Opcional: Poderiamos setar 'en' e ir direto, mas deixar escolher é gentil)
                    navigate('/language');
                }
            }
        }, 2000); // Reduzi um pouco o tempo para agilizar
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
                padding: '24px 16px',
                background:
                    'radial-gradient(circle at top, #1E293B 0%, #020617 40%, #000000 100%)',
                overflow: 'hidden',
            }}
        >
            {/* Glow de fundo */}
            <div
                style={{
                    position: 'absolute',
                    width: 420,
                    height: 420,
                    borderRadius: '50%',
                    background:
                        'radial-gradient(circle, rgba(96,165,250,0.22), transparent 60%)',
                    filter: 'blur(6px)',
                    top: '-80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Card principal */}
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 520,
                    borderRadius: 28,
                    padding: '26px 22px 28px',
                    background:
                        'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))',
                    border: '1px solid rgba(148,163,184,0.7)',
                    boxShadow:
                        '0 26px 70px rgba(15,23,42,0.98), 0 0 0 1px rgba(15,23,42,0.8)',
                    backdropFilter: 'blur(18px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Logo animado */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.8 }}
                    style={{ position: 'relative', marginBottom: 22 }}
                >
                    {/* Anel externo pulsando */}
                    <motion.div
                        animate={{ opacity: [0.25, 0.6, 0.25], scale: [1, 1.08, 1] }}
                        transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        style={{
                            position: 'absolute',
                            inset: -12,
                            borderRadius: '50%',
                            background:
                                'conic-gradient(from 140deg, rgba(96,165,250,0.2), rgba(129,140,248,0.5), rgba(45,212,191,0.3), rgba(96,165,250,0.2))',
                            filter: 'blur(4px)',
                        }}
                    />

                    {/* Círculo principal do logo */}
                    <div
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background:
                                'radial-gradient(circle at 30% 20%, #E5E7EB 0%, #CBD5F5 28%, #0B1120 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow:
                                '0 22px 60px rgba(15,23,42,0.95), 0 0 0 1px rgba(148,163,184,0.6)',
                        }}
                    >
                        <Moon
                            size={60}
                            color="#0F172A"
                            fill="#0F172A"
                            style={{ opacity: 0.9 }}
                        />
                    </div>
                </motion.div>

                {/* Nome do app */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.7 }}
                    style={{ textAlign: 'center', marginBottom: 12 }}
                >
                    <h1
                        style={{
                            fontSize: '2.1rem',
                            fontWeight: 800,
                            letterSpacing: '-0.06em',
                            color: '#F9FAFB',
                            marginBottom: 4,
                        }}
                    >
                        DreamTells
                    </h1>
                    <p
                        style={{
                            fontSize: '0.95rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.28em',
                            color: 'rgba(191,219,254,0.92)',
                        }}
                    >
                        Sonhos
                    </p>
                </motion.div>

                {/* Frase impacto */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.8 }}
                    style={{
                        fontSize: '0.95rem',
                        color: 'rgba(226,232,240,0.85)',
                        textAlign: 'center',
                        maxWidth: 360,
                        lineHeight: 1.6,
                        marginBottom: 22,
                    }}
                >
                    Cada sonho é uma mensagem.
                    Nós ajudamos você a entender o que a sua noite está tentando dizer.
                </motion.p>

                {/* Loader suave embaixo */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.6 }}
                    style={{
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 4,
                    }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.18,
                            }}
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background:
                                    i === 1
                                        ? 'rgba(96,165,250,0.95)'
                                        : 'rgba(148,163,184,0.9)',
                                boxShadow:
                                    i === 1
                                        ? '0 0 14px rgba(96,165,250,0.9)'
                                        : '0 0 10px rgba(148,163,184,0.8)',
                            }}
                        />
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SplashScreen;
