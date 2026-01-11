import React from 'react';
import { Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { Language } from '../types';

const LanguageSelect: React.FC = () => {
    const { setLanguage, t } = useApp();
    const navigate = useNavigate();

    const handleSelect = (lang: Language) => {
        setLanguage(lang);
    };

    const handleContinue = () => {
        navigate('/welcome');
    };

    const languages: { code: Language; label: string }[] = [
        { code: 'pt', label: 'Português' },
        { code: 'es', label: 'Español' },
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'it', label: 'Italiano' },
        { code: 'de', label: 'Deutsch' }
    ];

    return (
        <Layout
            title={t('language_select_title')}
            showBack
            icon={<Globe size={18} color="#F9FAFB" />}
        >
            <div
                style={{
                    minHeight: '100vh',
                    padding: '24px 16px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background:
                        'radial-gradient(circle at top, #020617 0%, #020617 40%, #0B1026 100%)',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', maxWidth: 480 }}
                >
                    {/* Título */}
                    <h2
                        style={{
                            textAlign: 'center',
                            fontSize: '1.7rem',
                            fontWeight: 800,
                            color: '#F1F5F9',
                            marginBottom: 48,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {t('language_select_title')}
                    </h2>

                    {/* Lista de idiomas (cards premium) */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 18,
                            marginBottom: 48,
                        }}
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                style={{
                                    width: '100%',
                                    padding: '18px 20px',
                                    borderRadius: 20,
                                    border: '1px solid rgba(148,163,184,0.45)',
                                    background: 'linear-gradient(135deg,#0B1026,#111827)',
                                    color: '#E2E8F0',
                                    fontSize: '1.05rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 18px 38px rgba(15,23,42,0.7)',
                                    backdropFilter: 'blur(14px)',
                                    transition: '0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow =
                                        '0 22px 50px rgba(90,62,242,0.55)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow =
                                        '0 18px 38px rgba(15,23,42,0.7)';
                                }}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>

                    {/* Botão CONTINUAR – padrão DreamTells */}
                    <button
                        onClick={handleContinue}
                        style={{
                            width: '100%',
                            borderRadius: 999,
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                            color: '#F8FAFC',
                            border: '1px solid rgba(191,219,254,0.9)',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 22px 50px rgba(90,62,242,0.65)',
                            transition: '0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow =
                                '0 26px 60px rgba(90,62,242,0.85)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow =
                                '0 22px 50px rgba(90,62,242,0.65)';
                        }}
                    >
                        {t('continue')}
                    </button>
                </motion.div>
            </div>
        </Layout>
    );
};

export default LanguageSelect;
