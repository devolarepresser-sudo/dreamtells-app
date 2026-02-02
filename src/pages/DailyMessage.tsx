import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { Sun, Loader, Share2, Copy, Send, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLocalDateString } from '../utils/dateUtils';
import { generateStoryCard } from '../services/shareService';

const DailyMessage: React.FC = () => {
    const { dreams, t, dailyMessage, setDailyMessage, user } = useApp();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Unificamos o formato de data para YYYY-MM-DD (compatível com AppContext)
    const today = getLocalDateString();
    const hasMessageToday = dailyMessage?.date === today;

    const handleGenerate = async () => {
        // Se quiser obrigar ter sonho, coloque lógica aqui dentro desse if.
        if (!dreams || dreams.length === 0) {
            // opcional: hoje não estamos bloqueando se não tiver sonho
            // apenas seguimos com a geração normal
        }

        // ESSA LINHA ESTAVA TE MATANDO: se o idioma der bug, nada acontece.
        // Ela não é necessária para gerar a mensagem, então REMOVEMOS.
        // if (!language) return;

        setIsLoading(true);
        setError(null);

        try {
            const userId = user?.id || 'dev-guest';
            const response: any = await aiService.generateDailyMessage(userId);

            // A resposta pode vir dentro de .data ou plana. 
            // Tentamos pegar reflection/message/text para o campo principal.
            const oracle = response.data || response;

            setDailyMessage({
                date: today,
                message: oracle.reflection || oracle.message || oracle.text || response.message || '',
                title: oracle.title || '',
                practice: oracle.practice || '',
                archetype: oracle.archetype || ''
            });
        } catch (error: any) {
            console.error('[DailyMessage] Erro ao gerar mensagem:', error);
            setError(
                error?.message || t('daily_msg_error_generating') || 'Não foi possível gerar sua mensagem.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const getShareText = () => {
        if (!dailyMessage) return '';
        const userName = user?.name || 'Explorador(a)';
        return `✨ *DreamTells* ✨\n👤 Inspirado(a): ${userName}\n\n☀️ *${t('daily_message_title').toUpperCase()}*\n\n"${dailyMessage.title}"\n\n☀️ *${t('daily_msg_share_content_msg')}:*\n${dailyMessage.message}\n\n💡 *${t('daily_msg_share_content_practice')}:*\n${dailyMessage.practice}\n\n---\n🌈 *Decifre seu subconsciente também:*\n🔗 https://www.dreamtells.com`;
    };

    const handleShareImage = async () => {
        if (!dailyMessage) return;
        setIsGeneratingImage(true);
        setShowShareMenu(false);

        try {
            const blob = await generateStoryCard({
                title: t('daily_message_title'),
                subtitle: dailyMessage.archetype || t('daily_msg_default_title'),
                mainValue: dailyMessage.title || 'Sabedoria do Dia',
                summary: dailyMessage.message,
                footerText: 'Semente de sabedoria diária',
                ctaText: 'DreamTells App',
                badgeText: 'Inspirado em seus sonhos',
                theme: 'sun'
            });

            if (blob) {
                const file = new File([blob], 'daily-message.png', { type: 'image/png' });
                const title = t('daily_msg_share_title');

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: title,
                        text: 'Minha mensagem do dia no DreamTells ✨'
                    });
                } else {
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                }
            }
        } catch (err) {
            console.error('[DailyMessage] Error generating image card:', err);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleShareNative = async () => {
        const textToShare = getShareText();
        setShowShareMenu(false);
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('daily_msg_share_title'),
                    text: textToShare,
                });
            } catch (err) {
                console.warn('Share canceled or failed:', err);
            }
        } else {
            handleCopy();
        }
    };

    const handleCopy = async () => {
        const textToShare = getShareText();
        setShowShareMenu(false);
        try {
            await navigator.clipboard.writeText(textToShare);
            alert(t('copy_success'));
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Layout
            title={t('menu_daily_message')}
            showBack
            icon={<Sun size={18} className="icon-white" />}
            iconClass="menuIconTile-daily"
        >
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px',
                }}
            >
                {/* Ícone do sol / aura */}
                < div style={{ marginBottom: 32, position: 'relative' }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            repeat: Infinity,
                            duration: 20,
                            ease: 'linear',
                        }}
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background:
                                'conic-gradient(from 0deg,#F6E05E,#F6AD55,#F6E05E)',
                            opacity: 0.2,
                            position: 'absolute',
                            top: -10,
                            left: -10,
                        }}
                    />
                    <div
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            background: '#F6E05E',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 40px rgba(246,224,94,0.4)',
                            position: 'relative',
                        }}
                    >
                        <Sun size={48} color="white" />
                    </div>
                </div >

                {/* Conteúdo principal */}
                {
                    hasMessageToday && dailyMessage ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card"
                            style={{
                                width: '100%',
                                textAlign: 'center',
                                padding: '32px 24px',
                                background: 'rgba(15, 23, 42, 0.95)',
                                border: '1px solid rgba(246, 224, 94, 0.4)',
                                borderRadius: 24,
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Faixa do Arquétipo */}
                            {dailyMessage.archetype && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '4px 0',
                                    background: 'linear-gradient(90deg, transparent, rgba(246, 224, 94, 0.2), transparent)',
                                    fontSize: '0.65rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: 2,
                                    color: '#F6E05E',
                                    fontWeight: 600
                                }}>
                                    {dailyMessage.archetype}
                                </div>
                            )}

                            <h3
                                style={{
                                    fontSize: '1.4rem',
                                    color: '#F6E05E',
                                    marginBottom: 20,
                                    marginTop: 12,
                                    fontWeight: 700,
                                    letterSpacing: -0.5
                                }}
                            >
                                {dailyMessage.title || t('daily_msg_default_title')}
                            </h3>

                            {/* Indicador de Personalização */}
                            <div style={{
                                fontSize: '0.7rem',
                                color: '#60A5FA',
                                marginBottom: 16,
                                fontStyle: 'italic',
                                opacity: 0.8
                            }}>
                                ✨ Inspirado em seus sonhos e momento atual
                            </div>

                            <div style={{
                                width: 40,
                                height: 2,
                                background: '#F6E05E',
                                margin: '0 auto 24px',
                                opacity: 0.5
                            }} />

                            <p
                                style={{
                                    fontSize: '1.05rem',
                                    lineHeight: 1.7,
                                    color: '#BFDBFE',
                                    marginBottom: 24,
                                    textAlign: 'justify'
                                }}
                            >
                                {dailyMessage.message}
                            </p>

                            {dailyMessage.practice && (
                                <div style={{
                                    background: 'rgba(246, 224, 94, 0.05)',
                                    padding: '16px',
                                    borderRadius: 16,
                                    borderLeft: '3px solid #F6E05E',
                                    textAlign: 'left',
                                    marginBottom: 24
                                }}>
                                    <span style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        color: '#F6E05E',
                                        fontWeight: 700,
                                        marginBottom: 4,
                                        textTransform: 'uppercase'
                                    }}>
                                        {t('daily_msg_mindfulness_label')}
                                    </span>
                                    <p style={{ fontSize: '0.9rem', color: '#E5E7EB', lineHeight: 1.5 }}>
                                        {dailyMessage.practice}
                                    </p>
                                </div>
                            )}

                            <div style={{ position: 'relative', width: '100%', marginTop: 8 }}>
                                <button
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        color: '#F6E05E',
                                        background: 'rgba(246, 224, 94, 0.1)',
                                        border: '1px solid rgba(246, 224, 94, 0.3)',
                                        borderRadius: 12,
                                        padding: '12px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    <Share2 size={16} style={{ marginRight: 8 }} />{' '}
                                    {t('daily_msg_share_button')}
                                </button>

                                <AnimatePresence>
                                    {showShareMenu && (
                                        <>
                                            <div
                                                onClick={() => setShowShareMenu(false)}
                                                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    marginBottom: 12,
                                                    background: '#1E293B',
                                                    borderRadius: 20,
                                                    padding: 8,
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    zIndex: 100,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 4
                                                }}
                                            >
                                                <button
                                                    onClick={handleShareNative}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        padding: '12px 16px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#F1F5F9',
                                                        fontSize: '0.95rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        borderRadius: 12,
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <Send size={18} color="#F6E05E" />
                                                    Enviar para...
                                                </button>
                                                <button
                                                    onClick={handleShareImage}
                                                    disabled={isGeneratingImage}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        padding: '12px 16px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: isGeneratingImage ? '#4B5563' : '#F1F5F9',
                                                        fontSize: '0.95rem',
                                                        fontWeight: 600,
                                                        cursor: isGeneratingImage ? 'default' : 'pointer',
                                                        borderRadius: 12,
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    {isGeneratingImage ? (
                                                        <Loader size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                                                    ) : (
                                                        <ImageIcon size={18} color="#60A5FA" />
                                                    )}
                                                    {isGeneratingImage ? t('stats_share_image_loading') : t('stats_share_image_button')}
                                                </button>
                                                <button
                                                    onClick={handleCopy}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        padding: '12px 16px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#F1F5F9',
                                                        fontSize: '0.95rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        borderRadius: 12,
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <Copy size={18} color="#F6AD55" />
                                                    Copiar texto
                                                </button>
                                                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 8px' }} />
                                                <button
                                                    onClick={() => setShowShareMenu(false)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        padding: '12px 16px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#94A3B8',
                                                        fontSize: '0.9rem',
                                                        cursor: 'pointer',
                                                        borderRadius: 12,
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <X size={18} />
                                                    Cancelar
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                width: '100%',
                            }}
                        >
                            <p
                                className="text-muted"
                                style={{ marginBottom: 32, lineHeight: 1.6, color: '#94A3B8' }}
                            >
                                {t('daily_msg_placeholder_text')}
                            </p>

                            {error && (
                                <div
                                    style={{
                                        color: '#991B1B',
                                        background: '#FEE2E2',
                                        padding: '12px',
                                        borderRadius: 8,
                                        marginBottom: 24,
                                        border: '1px solid #F87171',
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                className="btn-primary"
                                onClick={handleGenerate}
                                disabled={isLoading}
                                style={{
                                    background:
                                        'linear-gradient(90deg,#F6E05E 0%,#F6AD55 100%)',
                                    boxShadow:
                                        '0 10px 20px rgba(246,173,85,0.3)',
                                    borderRadius: 999,
                                    padding: '14px 22px',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader
                                            size={20}
                                            className="spin"
                                            style={{
                                                marginRight: 12,
                                                animation: 'spin 1s linear infinite',
                                            }}
                                        />
                                        {t('daily_msg_loading')}
                                    </>
                                ) : (
                                    t('daily_message_generate')
                                )}
                            </button>
                        </div>
                    )
                }

                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div >
        </Layout >
    );
};

export default DailyMessage;
