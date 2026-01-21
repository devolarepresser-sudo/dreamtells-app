import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { motion } from 'framer-motion';
import { Sun, Loader, Share2 } from 'lucide-react';

const DailyMessage: React.FC = () => {
    const { dreams, language, t, dailyMessage, setDailyMessage, user } = useApp();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mantemos esse formato de data porque é o que você já usa no estado:
    const today = new Date().toDateString();
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
            const response: any = await aiService.generateDailyMessage(userId); // <- Isso agora retorna o objeto data

            const oracle = response.data || { reflection: response.message };

            // AQUI estava o erro: você fazia setDailyMessage(msg)
            // e depois esperava dailyMessage.date / dailyMessage.message.
            // Agora salvamos no formato que a tela realmente usa:
            setDailyMessage({
                date: today,
                message: oracle.reflection || response.message,
                title: oracle.title,
                practice: oracle.practice,
                archetype: oracle.archetype
            });
        } catch (error) {
            console.error('[DailyMessage] Erro ao gerar mensagem:', error);
            setError(
                t('error_generic') || t('daily_msg_error_generating')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        if (!dailyMessage) return;

        const textToShare = `🌙 *${t('interp_share_title')}*\n\n☀️ *${t('daily_msg_share_content_msg')}*\n${dailyMessage.message}\n\n💡 *${t('daily_msg_share_content_practice')}*\n${dailyMessage.practice}`;

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
            try {
                await navigator.clipboard.writeText(textToShare);
                alert(t('copy_success'));
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    return (
        <Layout title={t('daily_message_title')} showBack>
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
                <div style={{ marginBottom: 32, position: 'relative' }}>
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
                </div>

                {/* Conteúdo principal */}
                {hasMessageToday && dailyMessage ? (
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

                        <button
                            onClick={handleShare}
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
                                marginTop: 8
                            }}
                        >
                            <Share2 size={16} style={{ marginRight: 8 }} />{' '}
                            {t('daily_msg_share_button')}
                        </button>
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
                )}

                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        </Layout>
    );
};

export default DailyMessage;
