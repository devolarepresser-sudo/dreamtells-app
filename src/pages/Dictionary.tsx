import React from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { GraduationCap, Book, User, Shield, Users, Zap, Compass } from 'lucide-react';

const DictionaryCard = ({
    icon: Icon,
    title,
    description,
    color,
    delay
}: {
    icon: any;
    title: string;
    description: string;
    color: string;
    delay: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        style={{
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start'
        }}
    >
        <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${color}40`
        }}>
            <Icon size={24} color={color} />
        </div>
        <div>
            <h3 style={{
                color: '#F8FAFC',
                fontSize: '1.1rem',
                fontWeight: 800,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8
            }}>
                {title}
            </h3>
            <p style={{
                color: '#94A3B8',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                margin: 0
            }}>
                {description}
            </p>
        </div>
    </motion.div>
);

const Dictionary: React.FC = () => {
    const { t } = useApp();

    const terms = [
        {
            icon: User,
            title: t('dict_carl_jung_title'),
            description: t('dict_carl_jung_desc'),
            color: '#6366F1'
        },
        {
            icon: Shield,
            title: t('dict_archetype_title'),
            description: t('dict_archetype_desc'),
            color: '#F59E0B'
        },
        {
            icon: Users,
            title: t('dict_collective_unconscious_title'),
            description: t('dict_collective_unconscious_desc'),
            color: '#10B981'
        },
        {
            icon: Zap,
            title: t('dict_shadow_title'),
            description: t('dict_shadow_desc'),
            color: '#EC4899'
        },
        {
            icon: Book,
            title: t('dict_persona_title'),
            description: t('dict_persona_desc'),
            color: '#0EA5E9'
        },
        {
            icon: Compass,
            title: t('dict_anima_animus_title'),
            description: t('dict_anima_animus_desc'),
            color: '#A855F7'
        },
        {
            icon: GraduationCap,
            title: t('dict_individuation_title'),
            description: t('dict_individuation_desc'),
            color: '#F43F5E'
        }
    ];

    return (
        <Layout
            title={t('menu_dictionary')}
            showBack
            icon={<GraduationCap size={18} className="icon-white" />}
            iconClass="menuIconTile-dictionary"
        >
            <div style={{ maxWidth: 600, margin: '0 auto', padding: '10px 4px 80px' }}>
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        padding: '24px 20px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                        borderRadius: 24,
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        marginBottom: 32,
                        textAlign: 'center'
                    }}
                >
                    <GraduationCap size={40} color="#818CF8" style={{ marginBottom: 16 }} />
                    <h2 style={{ color: '#F8FAFC', fontSize: '1.4rem', fontWeight: 900, marginBottom: 8 }}>
                        {t('dict_title')}
                    </h2>
                    <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                        {t('dict_intro')}
                    </p>
                </motion.div>

                <div style={{ padding: '0 8px' }}>
                    {terms.map((term, index) => (
                        <DictionaryCard
                            key={index}
                            icon={term.icon}
                            title={term.title}
                            description={term.description}
                            color={term.color}
                            delay={0.1 + index * 0.08}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    style={{
                        marginTop: 20,
                        textAlign: 'center',
                        padding: '20px',
                        color: '#64748B',
                        fontSize: '0.85rem',
                        fontStyle: 'italic'
                    }}
                >
                    "Quem olha para fora sonha; quem olha para dentro desperta." — C.G. Jung
                </motion.div>
            </div>
        </Layout>
    );
};

export default Dictionary;
