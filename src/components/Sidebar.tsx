import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { X, Home, PenTool, Mic, BookOpen, User, LogOut, Info, BarChart2, Book, Crown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { logout, user, t } = useApp();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/login');
    };

    const menuItems = [
        { icon: Home, label: 'Home', path: '/home' },
        { icon: PenTool, label: t('action_write'), path: '/write' },
        { icon: Mic, label: t('action_record'), path: '/record' },
        { icon: BookOpen, label: t('action_history'), path: '/history' },
    ];

    const premiumItems = [
        { icon: BarChart2, label: 'Estatísticas & Insights', path: '/stats' },
        { icon: Book, label: 'Biblioteca de Símbolos', path: '/symbols' },
    ];

    const settingsItems = [
        { icon: User, label: t('profile_title'), path: '/profile' },
        { icon: Info, label: t('settings_about'), path: '/about' }, // Assuming About page exists or redirects
        { icon: Shield, label: t('settings_privacy'), path: '/terms' }, // Assuming Terms page exists or redirects
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(44, 62, 80, 0.4)',
                            zIndex: 40,
                            backdropFilter: 'blur(4px)'
                        }}
                    />
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, bottom: 0,
                            width: '80%',
                            maxWidth: '300px',
                            background: 'var(--color-white)',
                            zIndex: 50,
                            padding: '32px 24px',
                            boxShadow: 'var(--shadow-soft)',
                            display: 'flex',
                            flexDirection: 'column',
                            borderTopRightRadius: 'var(--radius-xl)',
                            borderBottomRightRadius: 'var(--radius-xl)',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>DreamTells</h2>
                            <button onClick={onClose} style={{ background: '#F7FAFC', padding: '8px', borderRadius: '50%' }}>
                                <X size={24} color="var(--color-text-primary)" />
                            </button>
                        </div>

                        <nav style={{ flex: 1 }}>
                            {menuItems.map((item, index) => (
                                <Link
                                    key={index}
                                    to={item.path}
                                    onClick={onClose}
                                    style={{
                                        display: 'flex', alignItems: 'center', padding: '12px',
                                        textDecoration: 'none', color: 'var(--color-text-primary)',
                                        marginBottom: '4px', borderRadius: 'var(--radius-md)',
                                        fontWeight: 500
                                    }}
                                >
                                    <item.icon size={20} style={{ marginRight: '16px', color: 'var(--color-primary)', opacity: 0.8 }} />
                                    <span>{item.label}</span>
                                </Link>
                            ))}

                            <div style={{ margin: '16px 0', borderTop: '1px solid #EDF2F7', paddingTop: '16px' }}>
                                <p style={{ fontSize: '0.75rem', color: '#A0AEC0', marginBottom: '8px', paddingLeft: '12px', fontWeight: 700, letterSpacing: '1px' }}>PREMIUM</p>
                                {premiumItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        onClick={onClose}
                                        style={{
                                            display: 'flex', alignItems: 'center', padding: '12px',
                                            textDecoration: 'none', color: 'var(--color-text-primary)',
                                            marginBottom: '4px', borderRadius: 'var(--radius-md)',
                                            fontWeight: 500
                                        }}
                                    >
                                        <item.icon size={20} style={{ marginRight: '16px', color: '#F1C40F' }} />
                                        <span>{item.label}</span>
                                        {user?.plan !== 'premium' && <Crown size={12} style={{ marginLeft: 'auto', color: '#CBD5E0' }} />}
                                    </Link>
                                ))}
                            </div>

                            <div style={{ margin: '16px 0', borderTop: '1px solid #EDF2F7', paddingTop: '16px' }}>
                                {settingsItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        onClick={onClose}
                                        style={{
                                            display: 'flex', alignItems: 'center', padding: '12px',
                                            textDecoration: 'none', color: 'var(--color-text-primary)',
                                            marginBottom: '4px', borderRadius: 'var(--radius-md)',
                                            fontWeight: 500
                                        }}
                                    >
                                        <item.icon size={20} style={{ marginRight: '16px', color: '#718096' }} />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        {user && (
                            <button
                                onClick={handleLogout}
                                style={{
                                    display: 'flex', alignItems: 'center', padding: '16px',
                                    background: '#FFF5F5', color: '#E53E3E',
                                    borderRadius: 'var(--radius-md)', marginTop: '24px',
                                    fontWeight: 600
                                }}
                            >
                                <LogOut size={20} style={{ marginRight: '16px' }} />
                                <span>{t('logout')}</span>
                            </button>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
