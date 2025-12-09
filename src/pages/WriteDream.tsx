import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { Send, Loader, PenTool } from 'lucide-react';
import { FREE_DEV_MODE } from '../config/featureFlags';

const WriteDream: React.FC = () => {
    const [dreamText, setDreamText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const navigate = useNavigate();
    const { addDream, user, t } = useApp();

    const handleAnalyze = async () => {
        if (!dreamText.trim()) return;

        try {
            // Garantir login
            if (!user && !FREE_DEV_MODE) {
                navigate('/login');
                return;
            }

            // Garantir IA configurada
            if (!aiService || typeof aiService.analyzeDream !== 'function') {
                alert('Erro interno da IA. Tente novamente mais tarde.');
                return;
            }

            setIsAnalyzing(true);

            // Interpretação
            const userId = user?.id || 'dev-guest';
            const result = await aiService.analyzeDream(dreamText, userId);

            // Salvamento
            const id = await addDream(dreamText, result, 'text');

            // Usar navegação SPA
            navigate('/interpretation', { state: { dreamId: id } });

        } catch (error) {
            console.error(error);
            alert('Erro ao interpretar o sonho. Tente novamente.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Layout
            title={t('action_write')}            // muda conforme idioma (pt/es/en)
            showBack={true}                      // botão voltar
            showMenu={true}                      // botão menu
            icon={<PenTool size={18} color="#F9FAFB" />} // mesmo ícone do menu
        >
            <div
                style={{
                    minHeight: '100vh',
                    padding: '18px 16px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background:
                        'radial-gradient(circle at top, #1E293B 0%, #0B1120 45%, #020617 100%)',
                }}
            >
                {/* CONTEÚDO PRINCIPAL – sem header duplicado */}
                <div
                    style={{
                        width: '100%',
                        maxWidth: 600,
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            background:
                                'linear-gradient(135deg,#0B1026,#111827)',
                            borderRadius: 24,
                            padding: 24,
                            boxShadow:
                                '0 22px 60px rgba(15,23,42,0.95)',
                            border: '1px solid rgba(148,163,184,0.7)',
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        <h2
                            style={{
                                textAlign: 'left',
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                color: '#F9FAFB',
                                marginBottom: 8,
                                letterSpacing: '-0.03em',
                            }}
                        >
                            {t('action_write')}
                        </h2>

                        <p
                            style={{
                                textAlign: 'left',
                                fontSize: '0.96rem',
                                color: 'rgba(226,232,240,0.82)',
                                marginBottom: 20,
                                lineHeight: 1.6,
                            }}
                        >
                            Escreva todos os detalhes que lembrar.
                            Quanto mais completo, mais precisa será sua interpretação.
                        </p>

                        <textarea
                            value={dreamText}
                            onChange={(e) => setDreamText(e.target.value)}
                            placeholder="Digite aqui sua experiência..."
                            style={{
                                width: '100%',
                                minHeight: '230px',
                                padding: '16px',
                                borderRadius: 18,
                                border: '1px solid rgba(148,163,184,0.8)',
                                background:
                                    'radial-gradient(circle at top, rgba(15,23,42,0.96), rgba(15,23,42,0.98))',
                                fontSize: '0.98rem',
                                lineHeight: 1.6,
                                color: '#E5E7EB',
                                resize: 'none',
                                outline: 'none',
                                boxShadow:
                                    'inset 0 2px 8px rgba(15,23,42,0.85)',
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                fontFamily: 'inherit',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#60A5FA';
                                e.target.style.boxShadow =
                                    '0 0 0 1px rgba(96,165,250,0.8), inset 0 2px 8px rgba(15,23,42,0.9)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor =
                                    'rgba(148,163,184,0.8)';
                                e.target.style.boxShadow =
                                    'inset 0 2px 8px rgba(15,23,42,0.85)';
                            }}
                        />

                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !dreamText.trim()}
                            style={{
                                width: '100%',
                                marginTop: 22,
                                padding: '14px 18px',
                                borderRadius: 999,
                                background:
                                    isAnalyzing || !dreamText.trim()
                                        ? 'linear-gradient(135deg,#4B5563,#6B7280)'
                                        : 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                color: '#F9FAFB',
                                fontSize: '1rem',
                                fontWeight: 700,
                                border: '1px solid rgba(191,219,254,0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor:
                                    isAnalyzing || !dreamText.trim()
                                        ? 'not-allowed'
                                        : 'pointer',
                                opacity:
                                    isAnalyzing || !dreamText.trim()
                                        ? 0.78
                                        : 1,
                                boxShadow:
                                    '0 18px 42px rgba(90,62,242,0.7)',
                                transition:
                                    'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
                            }}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader
                                        size={20}
                                        className="animate-spin"
                                        style={{ marginRight: 10 }}
                                    />
                                    Interpretando seu sonho...
                                </>
                            ) : (
                                <>
                                    <span style={{ marginRight: 10 }}>
                                        {t('action_interpret') || 'Interpretar Sonho'}
                                    </span>
                                    <Send size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default WriteDream;
