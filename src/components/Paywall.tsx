import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from './Layout';
import { startPremiumPurchase } from '../services/billingService';
import { CheckCircle2, Sparkles, Brain, Mic, History, TrendingUp, Shield } from 'lucide-react';

import { FREE_DEV_MODE } from '../config/featureFlags';

interface PaywallProps {
    onClose?: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ onClose }) => {
    const { activatePremium, user } = useApp();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    if (FREE_DEV_MODE) {
        return (
            <Layout title="Premium" showBack={true}>
                <div
                    style={{
                        minHeight: '100vh',
                        padding: '18px 16px 32px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                            'radial-gradient(circle at top, #020617 0%, #020617 40%, #0B1026 100%)',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 480,
                            background: 'linear-gradient(135deg,#0B1026,#111827)',
                            borderRadius: 24,
                            padding: 24,
                            boxShadow: '0 22px 60px rgba(15,23,42,0.95)',
                            border: '1px solid rgba(148,163,184,0.7)',
                            backdropFilter: 'blur(16px)',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: '999px',
                                margin: '0 auto 18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background:
                                    'radial-gradient(circle at 30% 0%, #FFFFFF, #F1C40F 50%, #F59E0B 100%)',
                                boxShadow: '0 0 26px rgba(250, 204, 21, 0.85)',
                            }}
                        >
                            <Sparkles size={36} color="#0B1026" />
                        </div>

                        <h2
                            style={{
                                marginBottom: 12,
                                color: '#F9FAFB',
                                fontSize: '1.4rem',
                                fontWeight: 800,
                                letterSpacing: '-0.03em',
                            }}
                        >
                            Modo de Testes Gratuito
                        </h2>

                        <p
                            style={{
                                marginBottom: 24,
                                color: 'rgba(226,232,240,0.88)',
                                lineHeight: 1.6,
                                fontSize: '0.95rem',
                            }}
                        >
                            Nesta fase de testes, todos os recursos Premium estão liberados gratuitamente.
                            <br />
                            Aproveite para explorar todas as funcionalidades!
                        </p>

                        <button
                            onClick={() => (onClose ? onClose() : navigate('/home'))}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                color: '#F9FAFB',
                                border: '1px solid rgba(191,219,254,0.9)',
                                padding: '14px 18px',
                                borderRadius: 999,
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 18px 42px rgba(90,62,242,0.7)',
                            }}
                        >
                            Voltar para o App
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    const handleUpgrade = async () => {
        setIsProcessing(true);

        try {
            const result = await startPremiumPurchase();

            if (result === 'success') {
                await activatePremium();
                alert('✅ Premium ativado com sucesso! Aproveite todos os recursos.');
                if (onClose) onClose();
                else navigate('/home');
            } else if (result === 'cancel') {
                console.log('[Paywall] Usuário cancelou a compra Premium');
            } else {
                alert('❌ Não foi possível completar a compra. Por favor, tente novamente mais tarde.');
            }
        } catch (error) {
            console.error('[Paywall] Erro ao processar compra:', error);
            alert('❌ Ocorreu um erro inesperado. Tente novamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Detectar estados do trial
    const trialExpired =
        user && user.trialEnd && new Date(user.trialEnd) < new Date() && !user.isPremium;
    const stillOnTrial =
        user && user.trialEnd && new Date(user.trialEnd) >= new Date() && user.isTrialActive;
    const isPremium = user?.isPremium || user?.plan === 'premium' || user?.plan === 'master';
    const isMaster = user?.plan === 'master';

    return (
        <Layout title="Premium" showBack={true}>
            <div
                style={{
                    minHeight: '100vh',
                    padding: '18px 16px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background:
                        'radial-gradient(circle at top, #020617 0%, #020617 40%, #0B1026 100%)',
                }}
            >
                <div
                    style={{
                        flex: 1,
                        width: '100%',
                        maxWidth: 480,
                        display: 'flex',
                        flexDirection: 'column',
                        margin: '0 auto',
                    }}
                >
                    {/* Master Access Badge */}
                    {isMaster && (
                        <div
                            style={{
                                background: 'linear-gradient(90deg, #F1C40F 0%, #D35400 100%)',
                                color: 'white',
                                textAlign: 'center',
                                padding: '8px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                borderRadius: 12,
                                marginBottom: 16,
                                boxShadow: '0 12px 28px rgba(217,119,6,0.55)',
                            }}
                        >
                            ACESSO MASTER – PREMIUM DESBLOQUEADO
                        </div>
                    )}

                    {/* Trial Expired Banner */}
                    {trialExpired && (
                        <div
                            style={{
                                background:
                                    'linear-gradient(135deg, rgba(254,202,202,0.95), rgba(248,113,113,0.95))',
                                color: '#111827',
                                textAlign: 'center',
                                padding: '12px 16px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                borderRadius: 16,
                                marginBottom: 16,
                                border: '1px solid rgba(254,226,226,0.95)',
                                lineHeight: 1.5,
                                boxShadow: '0 14px 32px rgba(239,68,68,0.55)',
                            }}
                        >
                            ⏰ Seu período de 7 dias Premium terminou.
                            <br />
                            Para continuar interpretando seus sonhos com a IA, ative o DreamTells Premium.
                        </div>
                    )}

                    {/* Still on Trial Banner */}
                    {stillOnTrial && (
                        <div
                            style={{
                                background:
                                    'linear-gradient(135deg, rgba(224,231,255,0.98), rgba(199,210,254,0.98))',
                                color: '#1E1B4B',
                                textAlign: 'center',
                                padding: '12px 16px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                borderRadius: 16,
                                marginBottom: 16,
                                border: '1px solid rgba(165,180,252,0.95)',
                                lineHeight: 1.5,
                                boxShadow: '0 14px 32px rgba(79,70,229,0.5)',
                            }}
                        >
                            ✨ Você está aproveitando o período de teste Premium.
                            <br />
                            Em breve ele termina — garanta seu acesso contínuo ativando o plano Premium.
                        </div>
                    )}

                    {/* Already Premium State */}
                    {isPremium && !isMaster && (
                        <div
                            style={{
                                background:
                                    'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.4))',
                                color: '#ECFDF5',
                                textAlign: 'center',
                                padding: 16,
                                fontSize: '1rem',
                                fontWeight: 700,
                                borderRadius: 16,
                                marginBottom: 16,
                                border: '1px solid rgba(45,212,191,0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: '0 16px 38px rgba(5,150,105,0.65)',
                            }}
                        >
                            <CheckCircle2 size={24} />
                            Você já é Premium ✅
                        </div>
                    )}

                    {/* Main Content Card */}
                    {!isPremium && (
                        <div
                            style={{
                                background: 'linear-gradient(135deg,#0B1026,#111827)',
                                borderRadius: 24,
                                padding: 24,
                                boxShadow: '0 22px 60px rgba(15,23,42,0.95)',
                                marginBottom: 32,
                                border: '1px solid rgba(148,163,184,0.7)',
                                backdropFilter: 'blur(18px)',
                            }}
                        >
                            {/* Header */}
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div
                                    style={{
                                        width: 72,
                                        height: 72,
                                        background:
                                            'radial-gradient(circle at 30% 0%, #FFFFFF, #8B5CF6 45%, #6366F1 100%)',
                                        borderRadius: '50%',
                                        margin: '0 auto 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 16px 32px rgba(79,70,229,0.75)',
                                    }}
                                >
                                    <Sparkles size={32} color="#0B1026" />
                                </div>

                                <h1
                                    style={{
                                        fontSize: '1.4rem',
                                        fontWeight: 800,
                                        color: '#F9FAFB',
                                        marginBottom: 8,
                                        lineHeight: 1.3,
                                        letterSpacing: '-0.03em',
                                    }}
                                >
                                    Continue sua jornada com o DreamTells Premium
                                </h1>

                                <p
                                    style={{
                                        fontSize: '0.9rem',
                                        color: 'rgba(226,232,240,0.88)',
                                        lineHeight: 1.6,
                                        marginBottom: 0,
                                    }}
                                >
                                    A análise dos seus sonhos não é entretenimento — é um mapa emocional da sua vida.
                                    Com o Premium, você mantém a porta aberta para entender sinais, padrões e mensagens
                                    que o seu inconsciente está tentando te mostrar todas as noites.
                                </p>
                            </div>

                            {/* Benefits Section */}
                            <div
                                style={{
                                    background: 'rgba(15,23,42,0.9)',
                                    borderRadius: 16,
                                    border: '1px solid rgba(148,163,184,0.9)',
                                    padding: 16,
                                    marginBottom: 16,
                                }}
                            >
                                <h2
                                    style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        color: '#E5E7EB',
                                        marginBottom: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <Brain size={18} color="#A855F7" />
                                    Você desbloqueia com o DreamTells Premium:
                                </h2>

                                <ul
                                    style={{
                                        fontSize: '0.85rem',
                                        color: 'rgba(209,213,219,0.95)',
                                        lineHeight: 1.8,
                                        margin: 0,
                                        paddingLeft: 20,
                                        listStyle: 'none',
                                    }}
                                >
                                    <li
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <span style={{ color: '#A855F7', fontWeight: 'bold' }}>•</span>
                                        <span>Interpretações ilimitadas com IA avançada</span>
                                    </li>
                                    <li
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <span style={{ color: '#A855F7', fontWeight: 'bold' }}>•</span>
                                        <span>Análise emocional profunda dos seus sonhos recorrentes</span>
                                    </li>
                                    <li
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <span style={{ color: '#A855F7', fontWeight: 'bold' }}>•</span>
                                        <span>Gravação por voz com transcrição automática</span>
                                    </li>
                                    <li
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <span style={{ color: '#A855F7', fontWeight: 'bold' }}>•</span>
                                        <span>
                                            Histórico completo para acompanhar sua evolução ao longo do tempo
                                        </span>
                                    </li>
                                    <li
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                        }}
                                    >
                                        <span style={{ color: '#A855F7', fontWeight: 'bold' }}>•</span>
                                        <span>Insights e padrões que conectam sonhos diferentes entre si</span>
                                    </li>
                                </ul>
                            </div>

                            {/* How it Works */}
                            <div
                                style={{
                                    background:
                                        'linear-gradient(135deg, rgba(224,231,255,0.16), rgba(129,140,248,0.18))',
                                    borderRadius: 16,
                                    padding: 14,
                                    marginBottom: 20,
                                    fontSize: '0.85rem',
                                    color: '#E5E7EB',
                                    border: '1px solid rgba(129,140,248,0.6)',
                                }}
                            >
                                <p
                                    style={{
                                        fontWeight: 700,
                                        marginBottom: 8,
                                        color: '#E0E7FF',
                                    }}
                                >
                                    Como funciona o acesso Premium:
                                </p>
                                <p style={{ margin: 0, lineHeight: 1.7 }}>
                                    • Você paga pelo acesso completo ao DreamTells Premium.
                                    <br />
                                    • Pode interpretar quantos sonhos quiser, sempre que quiser.
                                    <br />
                                    • Pode cancelar quando desejar diretamente pela sua conta Google Play.
                                </p>
                            </div>

                            {/* Price */}
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        justifyContent: 'center',
                                        gap: 4,
                                        marginBottom: 4,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '2rem',
                                            fontWeight: 800,
                                            color: '#F9FAFB',
                                        }}
                                    >
                                        R$ 9,90
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.9rem',
                                            color: '#9CA3AF',
                                        }}
                                    >
                                        / mês
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontSize: '0.75rem',
                                        color: '#6B7280',
                                        margin: 0,
                                    }}
                                >
                                    Preço de lançamento
                                </p>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={handleUpgrade}
                                disabled={isProcessing}
                                style={{
                                    width: '100%',
                                    background: isProcessing
                                        ? 'linear-gradient(135deg,#4B5563,#6B7280)'
                                        : 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                    color: 'white',
                                    border: '1px solid rgba(191,219,254,0.9)',
                                    borderRadius: 999,
                                    padding: '14px 24px',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    opacity: isProcessing ? 0.7 : 1,
                                    boxShadow: isProcessing
                                        ? '0 10px 20px rgba(75,85,99,0.4)'
                                        : '0 20px 46px rgba(90,62,242,0.75)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {isProcessing ? 'Processando...' : 'Continuar como usuário Premium'}
                            </button>

                            {/* Trust Message */}
                            <p
                                style={{
                                    fontSize: '0.7rem',
                                    color: '#9CA3AF',
                                    textAlign: 'center',
                                    marginTop: 12,
                                    lineHeight: 1.5,
                                    marginBottom: 0,
                                }}
                            >
                                <Shield
                                    size={12}
                                    style={{
                                        display: 'inline',
                                        marginRight: 4,
                                        verticalAlign: 'middle',
                                    }}
                                />
                                O pagamento é processado com segurança pela Google Play. Você pode cancelar a renovação
                                automática a qualquer momento pela sua conta Google.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Paywall;
