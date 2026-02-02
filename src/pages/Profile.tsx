import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { User, Globe, LogOut } from 'lucide-react';
import { Language } from '../types';
import Paywall from '../components/Paywall';
import { AnimatePresence } from 'framer-motion';

const Profile: React.FC = () => {
    const { user, logout, language, setLanguage, t, canUsePremium, updateProfile } = useApp();
    const [showPaywall, setShowPaywall] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as Language);
    };

    const hasAccess = canUsePremium();

    const handleSaveName = async () => {
        if (newName.trim() && user) {
            try {
                await updateProfile(newName.trim());
                setIsEditingName(false);
            } catch (error) {
                console.error("Erro ao atualizar nome:", error);
            }
        } else {
            setIsEditingName(false);
        }
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                try {
                    await updateProfile(user.name, base64String);
                } catch (error) {
                    console.error("Erro ao atualizar foto:", error);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Layout
            title={t('profile_title')}
            showBack
            icon={<User size={18} className="icon-white" />}
            iconClass="menuIconTile-profile"
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
                        {/* Avatar com upload */}
                        <div
                            onClick={handlePhotoClick}
                            style={{
                                width: 110,
                                height: 110,
                                borderRadius: '50%',
                                background: user?.photoURL
                                    ? `url(${user.photoURL}) center/cover no-repeat`
                                    : 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.4rem',
                                fontWeight: 700,
                                color: '#FFF',
                                boxShadow: '0 12px 32px rgba(90,62,242,0.55)',
                                position: 'relative',
                                cursor: 'pointer',
                                overflow: 'hidden'
                            }}
                        >
                            {!user?.photoURL && (user?.name?.[0] || 'D')}

                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />

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
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <User size={20} color="#9CA3AF" style={{ marginRight: 16 }} />
                                <span style={{ color: '#F9FAFB', fontWeight: 500, marginRight: 8, whiteSpace: 'nowrap' }}>
                                    {t('name_placeholder')}
                                </span>

                                {isEditingName ? (
                                    <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            autoFocus
                                            style={{
                                                background: 'rgba(30,41,59,0.8)',
                                                border: '1px solid #60A5FA',
                                                borderRadius: 8,
                                                padding: '4px 12px',
                                                color: '#FFF',
                                                fontSize: '0.9rem',
                                                width: '100%',
                                                outline: 'none'
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveName();
                                                if (e.key === 'Escape') setIsEditingName(false);
                                            }}
                                        />
                                        <button
                                            onClick={handleSaveName}
                                            style={{ background: '#10B981', border: 'none', borderRadius: 6, color: '#FFF', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                        >
                                            {t('common_save')}
                                        </button>
                                        <button
                                            onClick={() => { setIsEditingName(false); setNewName(user?.name || ''); }}
                                            style={{ background: 'transparent', border: '1px solid #EF4444', borderRadius: 6, color: '#EF4444', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                        >
                                            {t('common_cancel')}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ color: 'rgba(226,232,240,0.7)', fontSize: '0.9rem' }}>
                                            {user?.name}
                                        </span>
                                        <button
                                            onClick={() => { setIsEditingName(true); setNewName(user?.name || ''); }}
                                            style={{ background: 'transparent', border: 'none', color: '#60A5FA', padding: '4px 8px', cursor: 'pointer', marginLeft: 4, visibility: 'visible' }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
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
