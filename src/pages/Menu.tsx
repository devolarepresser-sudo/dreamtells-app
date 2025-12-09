import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import {
    Home,
    PenTool,
    Mic,
    BookOpen,
    User,
    Info,
    BarChart2,
    Book,
    Crown,
    Lock,
    Sparkles,
    LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';

const Menu: React.FC = () => {
    const { logout, user, t, canUsePremium } = useApp();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const hasAccess = canUsePremium();

    const menuItems = [
        { icon: Home, label: t('menu_home'), path: '/home' },
        { icon: PenTool, label: t('action_write'), path: '/write' },
        { icon: Mic, label: t('action_record'), path: '/record' },
        { icon: Sparkles, label: t('menu_interpretation') || 'Interpretação', path: '/interpretation' },
        { icon: BookOpen, label: t('action_history'), path: '/history' },
        // { icon: Heart, label: t('menu_life_context'), path: '/life-context', premium: true },
        // { icon: Sun, label: t('menu_daily_message'), path: '/daily-message', premium: true },
        { icon: BarChart2, label: t('menu_stats'), path: '/stats', premium: true },
        { icon: Book, label: t('menu_symbols'), path: '/symbols', premium: true },
        { icon: Crown, label: t('menu_premium'), path: '/premium', color: '#F1C40F' },
        { icon: User, label: t('menu_profile'), path: '/profile' },
        { icon: Info, label: t('settings_about'), path: '/about' },
    ];

    const handleItemClick = (e: React.MouseEvent, item: any) => {
        if (item.premium && !hasAccess) {
            e.preventDefault();
            navigate('/premium');
        }
    };

    return (
        <Layout
            title={t('menu_title')}           // texto muda conforme idioma
            showBack={true}                   // voltar para tela anterior
            showMenu={false}                  // já estamos no menu, não precisa botão de menu
            icon={<Sparkles size={18} color="#F9FAFB" />} // ícone padrão do menu
        >
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 16px 40px 16px',
                    background:
                        'radial-gradient(circle at top, #020617 0%, #020617 40%, #0B1026 100%)',
                }}
            >
                {/* LISTA DE ITENS DE MENU */}
                <div
                    style={{
                        width: '100%',
                        maxWidth: 480,
                        margin: '0 auto',
                        marginTop: 8,
                    }}
                >
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {menuItems.map((item, index) => {
                            const isLocked = item.premium && !hasAccess;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <Link
                                        to={isLocked ? '#' : item.path}
                                        onClick={(e) => handleItemClick(e, item)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '14px 16px',
                                            borderRadius: 18,
                                            textDecoration: 'none',
                                            background: isLocked
                                                ? 'linear-gradient(135deg, rgba(30,64,175,0.30), rgba(129,140,248,0.28))'
                                                : 'linear-gradient(135deg,#1E3A8A,#3B82F6)',
                                            border: isLocked
                                                ? '1px solid rgba(148,163,184,0.8)'
                                                : '1px solid rgba(191,219,254,0.95)',
                                            color: '#E5E7EB',
                                            boxShadow:
                                                '0 16px 34px rgba(15,23,42,0.7)',
                                            opacity: isLocked ? 0.85 : 1,
                                            backdropFilter: 'blur(12px)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                background: isLocked
                                                    ? 'radial-gradient(circle, rgba(148,163,184,0.35), rgba(15,23,42,0.9))'
                                                    : 'radial-gradient(circle, rgba(255,255,255,0.26), rgba(37,99,235,0.22))',
                                                padding: 10,
                                                borderRadius: 14,
                                                marginRight: 16,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {isLocked ? (
                                                <Lock size={20} color="#CBD5E0" />
                                            ) : (
                                                <item.icon
                                                    size={20}
                                                    color={item.color || '#E5E7EB'}
                                                />
                                            )}
                                        </div>

                                        <span
                                            style={{
                                                fontWeight: 600,
                                                flex: 1,
                                                fontSize: '0.95rem',
                                            }}
                                        >
                                            {item.label}
                                        </span>

                                        {isLocked && (
                                            <Crown
                                                size={14}
                                                color="#FACC15"
                                                style={{ marginLeft: 8 }}
                                            />
                                        )}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* BOTÃO LOGOUT */}
                    {user && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                marginTop: 32,
                                borderRadius: 18,
                                background:
                                    'linear-gradient(135deg,#FCA5A5,#EF4444)',
                                color: '#111827',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(254,202,202,0.95)',
                                cursor: 'pointer',
                                boxShadow:
                                    '0 18px 40px rgba(248,113,113,0.5)',
                            }}
                        >
                            <LogOut size={20} style={{ marginRight: 12 }} />
                            {t('menu_logout')}
                        </motion.button>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Menu;
