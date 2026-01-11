import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { User, Globe, LogOut, Crown } from 'lucide-react';
import { Language } from '../types';
import Paywall from '../components/Paywall';
import { AnimatePresence } from 'framer-motion';

const Profile: React.FC = () => {
    const { user, logout, language, setLanguage, t, canUsePremium } = useApp();
    const [showPaywall, setShowPaywall] = useState(false);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as Language);
    };

    const hasAccess = canUsePremium();

    return (
        <Layout
            title={t('profile_title')}
            showBack
            icon={<User size={18} color="#F9FAFB" />}
        >
            <AnimatePresence>
                {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
            </AnimatePresence>

            <div
                style={{
                    minHeight: '100vh',
                    padding: '18px 16px 32px',
                    background:
                        'transparent',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                {/* ✅ Wrapper SEM “card de página inteira” (sem moldura, sem apertar conteúdo) */}
                <div
                    style={{
                        width: '100%',
                        maxWidth: 480,
                        padding: 0,
                    }}
                >
                    {/* FOTO / INFORMAÇÕES */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: 32,
                            paddingTop: 8,
                        }}
                    >
                        {/* Avatar premium */}
                        <div
                            style={{
                                width: 110,
                                height: 110,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.4rem',
                                fontWeight: 700,
                                color: '#FFF',
                                boxShadow: '0 12px 32px rgba(90,62,242,0.55)',
                                position: 'relative',
                            }}
                        >
                            {user?.name?.[0] || 'D'}

                            {hasAccess && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        background: '#F1C40F',
                                        borderRadius: '50%',
                                        padding: 6,
                                        border: '2px solid #FFF',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    <Crown size={16} color="#FFF" />
                                </div>
                            )}
                        </div>

                        <h2
                            style={{
                                marginTop: 14,
                                fontSize: '1.4rem',
                                fontWeight: 800,
                                color: '#F9FAFB',
                            }}
                        >
                            {user?.name || 'Dreamer'}
                        </h2>

                        <p style={{ color: 'rgba(226,232,240,0.7)' }}>{user?.email}</p>

                        {/* Status Premium */}
                        <div style={{ marginTop: 18 }}>
                            {hasAccess ? (
                                <span
                                    style={{
                                        background: 'linear-gradient(135deg,#F1C40F,#FACC15)',
                                        padding: '6px 14px',
                                        borderRadius: 12,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: '#111',
                                    }}
                                >
                                    PREMIUM ATIVO
                                </span>
                            ) : (
                                <button
                                    onClick={() => setShowPaywall(true)}
                                    style={{
                                        color: '#60A5FA',
                                        fontWeight: 600,
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Ativar Premium
                                </button>
                            )}
                        </div>
                    </div>

                    {/* CARTÃO DE CONFIGURAÇÕES */}
                    <div
                        style={{
                            background: 'linear-gradient(135deg,#0F172A,#1E293B)',
                            borderRadius: 20,
                            border: '1px solid rgba(148,163,184,0.35)',
                            padding: 0,
                            overflow: 'hidden',
                            boxShadow: '0 12px 32px rgba(15,23,42,0.5)',
                        }}
                    >
                        {/* Nome */}
                        <div
                            style={{
                                padding: '20px 24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(148,163,184,0.2)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <User size={20} color="#9CA3AF" style={{ marginRight: 16 }} />
                                <span style={{ color: '#F9FAFB', fontWeight: 500 }}>
                                    {t('name_placeholder')}
                                </span>
                            </div>
                            <span style={{ color: 'rgba(226,232,240,0.7)', fontSize: '0.9rem' }}>
                                {user?.name}
                            </span>
                        </div>

                        {/* Idioma */}
                        <div
                            style={{
                                padding: '20px 24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Globe size={20} color="#9CA3AF" style={{ marginRight: 16 }} />
                                <span style={{ color: '#F9FAFB', fontWeight: 500 }}>
                                    {t('settings_language')}
                                </span>
                            </div>

                            <select
                                value={language}
                                onChange={handleLanguageChange}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#60A5FA',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                }}
                            >
                                <option value="pt">Português</option>
                                <option value="es">Español</option>
                                <option value="en">English</option>
                                <option value="fr">Français</option>
                                <option value="it">Italiano</option>
                                <option value="de">Deutsch</option>
                            </select>
                        </div>
                    </div>

                    {/* BOTÃO LOGOUT */}
                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'linear-gradient(135deg,#FCA5A5,#EF4444)',
                            color: '#111827',
                            fontWeight: 700,
                            borderRadius: 18,
                            marginTop: 32,
                            border: '1px solid rgba(254,202,202,0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 18px 40px rgba(248,113,113,0.5)',
                            cursor: 'pointer',
                        }}
                    >
                        <LogOut size={20} style={{ marginRight: 10 }} />
                        {t('logout')}
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
