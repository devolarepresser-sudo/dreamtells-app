// @ts-nocheck
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { motion } from 'framer-motion';
import { Sun, Loader, Copy } from 'lucide-react';

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
            const msg = await aiService.generateDailyMessage(userId); // <- isso retorna STRING

            // AQUI estava o erro: você fazia setDailyMessage(msg)
            // e depois esperava dailyMessage.date / dailyMessage.message.
            // Agora salvamos no formato que a tela realmente usa:
            setDailyMessage({
                date: today,
                message: msg,
            });
        } catch (error) {
            console.error('[DailyMessage] Erro ao gerar mensagem:', error);
            setError(
                t('error_generic') || 'Não foi possível gerar a mensagem agora.'
            );
        } finally {
            setIsLoading(false);
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
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card"
                        style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '32px 24px',
                            background:
                                'linear-gradient(135deg,#FFF 0%,#FFFBEB 100%)',
                            border: '1px solid #F6E05E',
                            borderRadius: 24,
                        }}
                    >
                        <h3
                            style={{
                                fontSize: '1.2rem',
                                color: '#D69E2E',
                                marginBottom: 16,
                            }}
                        >
                            {t('daily_message_today') || 'Sua mensagem de hoje'}
                        </h3>
                        <p
                            style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.6,
                                color: '#744210',
                                fontStyle: 'italic',
                            }}
                        >
                            "{dailyMessage.message}"
                        </p>
                        <button
                            onClick={() =>
                                navigator.clipboard.writeText(
                                    dailyMessage.message || ''
                                )
                            }
                            style={{
                                marginTop: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                color: '#D69E2E',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                        >
                            <Copy size={16} style={{ marginRight: 8 }} />{' '}
                            {t('copy_success')}
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
                            style={{ marginBottom: 32, lineHeight: 1.6 }}
                        >
                            Receba uma orientação positiva baseada nos seus sonhos
                            recentes.
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
                                    Gerando...
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
