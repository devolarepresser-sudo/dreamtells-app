
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Brain, Lightbulb, Zap, ChevronRight, Moon, Sparkles, Compass, Key, Library } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 80, damping: 20 }
    }
};

const KnowledgeBase: React.FC = () => {
    const { t } = useApp();
    const navigate = useNavigate();

    const sections = [
        {
            title: t('knowledge_sec_memory_title' as any),
            desc: t('knowledge_sec_memory_desc' as any),
            icon: <Moon size={24} color="#A855F7" />,
            tips: [
                { title: t('knowledge_memory_tip1_title' as any), desc: t('knowledge_memory_tip1_desc' as any), icon: <Zap size={18} color="#FBBF24" /> },
                { title: t('knowledge_memory_tip2_title' as any), desc: t('knowledge_memory_tip2_desc' as any), icon: <Sparkles size={18} color="#6366F1" /> }
            ]
        },
        {
            title: t('knowledge_sec_desc_title' as any),
            desc: t('knowledge_sec_desc_desc' as any),
            icon: <Key size={24} color="#10B981" />,
            tips: [
                { title: t('knowledge_desc_tip1_title' as any), desc: t('knowledge_desc_tip1_desc' as any), icon: <Compass size={18} color="#3B82F6" /> },
                { title: t('knowledge_desc_tip2_title' as any), desc: t('knowledge_desc_tip2_desc' as any), icon: <Lightbulb size={18} color="#EC4899" /> }
            ]
        }
    ];

    const apps = [
        { title: t('knowledge_tools_interp_title' as any), desc: t('knowledge_tools_interp_desc' as any), icon: <Sparkles size={20} color="#6366F1" />, path: '/record' },
        { title: t('knowledge_tools_map_title' as any), desc: t('knowledge_tools_map_desc' as any), icon: <Brain size={20} color="#A855F7" />, path: '/unconscious-map' },
        { title: t('knowledge_tools_daily_title' as any), desc: t('knowledge_tools_daily_desc' as any), icon: <Zap size={20} color="#FBBF24" />, path: '/daily-message' }
    ];

    return (
        <Layout
            title={t('menu_knowledge')}
            showBack
            icon={<Library size={18} className="icon-white" />}
            iconClass="menuIconTile-knowledge"
        >    <motion.div
            variants={containerVariants as any}
            initial="hidden"
            animate="visible"
            style={{ padding: '0 20px 60px', maxWidth: 600, margin: '0 auto' }}
        >
                {/* Hero / Manifesto Section */}
                <motion.div variants={itemVariants as any} style={{ marginBottom: 48, marginTop: 24, textAlign: 'center' }}>
                    <div style={{
                        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 100%)',
                        padding: '40px 20px',
                        borderRadius: 32,
                        marginBottom: 32,
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: 16, letterSpacing: '-0.02em' }}>
                            {t('knowledge_title' as any)}
                        </h2>
                        <p style={{ color: '#94A3B8', fontSize: '1.1rem', lineHeight: 1.6 }}>
                            {t('knowledge_intro' as any)}
                        </p>
                    </div>

                    <div style={{ textAlign: 'left', padding: '0 8px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#E2E8F0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Compass size={20} color="#F472B6" />
                            {t('knowledge_manifesto_title' as any)}
                        </h3>
                        <p style={{ fontSize: '1rem', color: '#CBD5E1', lineHeight: 1.7, margin: 0 }}>
                            {t('knowledge_manifesto_desc' as any)}
                        </p>
                    </div>
                </motion.div>

                {/* Knowledge Sections */}
                {sections.map((section, idx) => (
                    <motion.div key={idx} variants={itemVariants as any} style={{ marginBottom: 48 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingLeft: 8 }}>
                            <div style={{ padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>{section.icon}</div>
                            <div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>{section.title}</h3>
                                <p style={{ fontSize: '0.95rem', color: '#94A3B8', margin: 0 }}>{section.desc}</p>
                            </div>
                        </div>

                        <div style={{
                            padding: '24px',
                            background: 'rgba(30, 41, 59, 0.4)',
                            borderRadius: 24,
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            {section.tips.map((tip, tIdx) => (
                                <React.Fragment key={tIdx}>
                                    <div style={{
                                        display: 'flex',
                                        gap: 16
                                    }}>
                                        <div style={{ marginTop: 2 }}>{tip.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#E2E8F0', marginBottom: 6 }}>{tip.title}</h4>
                                            <p style={{ fontSize: '0.95rem', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>{tip.desc}</p>
                                        </div>
                                    </div>
                                    {tIdx < section.tips.length - 1 && (
                                        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '24px 0' }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>
                ))}

                {/* Tools Guide */}
                <motion.div variants={itemVariants as any}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F1F5F9', marginBottom: 24, paddingLeft: 8 }}>{t('knowledge_sec_tools_title' as any)}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {apps.map((app, idx) => (
                            <motion.div
                                key={idx}
                                onClick={() => navigate(app.path)}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(30,41,59,0.7)', translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '20px 24px',
                                    background: 'linear-gradient(135deg, rgba(30,41,59,0.5), rgba(15,23,42,0.5))',
                                    borderRadius: 20,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {app.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>{app.title}</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#94A3B8', margin: 0 }}>{app.desc}</p>
                                </div>
                                <ChevronRight size={20} color="rgba(255,255,255,0.2)" />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </Layout>
    );
};

export default KnowledgeBase;
