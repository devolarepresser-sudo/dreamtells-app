// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { Heart, Loader, Sparkles } from 'lucide-react';

const LifeContext: React.FC = () => {
    const { dreams, language, t, user } = useApp();
    const [lifeText, setLifeText] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('dreamtells_life_context');
            if (savedData) {
                const { text, result } = JSON.parse(savedData);
                if (typeof text === 'string') setLifeText(text);
                if (typeof result === 'string') setAnalysis(result);
            }
        } catch (e) {
            console.error('[LifeContext] Error loading saved context:', e);
        }
    }, []);

    const handleAnalyze = async () => {
        if (!lifeText.trim()) return;

        try {
            setIsLoading(true);
            setError(null);

            const userId = user?.id || 'dev-guest';

            const result = await aiService.analyzeLifeContextWithDreams(
                lifeText,
                dreams || [],
                language || 'pt',
                userId
            );

            setAnalysis(result);

            // Save to localStorage
            localStorage.setItem(
                'dreamtells_life_context',
                JSON.stringify({
                    text: lifeText,
                    result: result,
                })
            );
        } catch (err) {
            console.error('[LifeContext] Erro ao analisar contexto:', err);
            setError('Não foi possível analisar o contexto agora. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout title={t('life_context_title')} showBack>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    paddingBottom: 24,
                }}
            >
                {/* Intro */}
                <p
                    className="text-body text-muted"
                    style={{ marginBottom: 24, lineHeight: 1.6 }}
                >
                    {t('life_context_placeholder')}
                </p>

                {/* Campo de texto */}
                <div
                    className="card"
                    style={{
                        padding: 16,
                        marginBottom: 24,
                        background: 'rgba(15,23,42,0.96)',
                        borderRadius: 20,
                        border: '1px solid rgba(148,163,184,0.7)',
                    }}
                >
                    <textarea
                        value={lifeText}
                        onChange={(e) => setLifeText(e.target.value)}
                        placeholder={t('life_context_placeholder')}
                        style={{
                            width: '100%',
                            minHeight: 120,
                            border: 'none',
                            resize: 'none',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            background: 'transparent',
                            color: '#E5E7EB',
                            outline: 'none',
                        }}
                    />
                </div>

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

                {/* Botão analisar */}
                <button
                    className="btn-primary"
                    onClick={handleAnalyze}
                    disabled={isLoading || !lifeText.trim()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 999,
                        padding: '14px 18px',
                        background:
                            isLoading || !lifeText.trim()
                                ? 'linear-gradient(135deg,#4B5563,#6B7280)'
                                : 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                        border: '1px solid rgba(191,219,254,0.9)',
                        color: '#F9FAFB',
                        fontWeight: 700,
                        cursor:
                            isLoading || !lifeText.trim() ? 'not-allowed' : 'pointer',
                        opacity: isLoading || !lifeText.trim() ? 0.78 : 1,
                        boxShadow: '0 18px 42px rgba(90,62,242,0.7)',
                    }}
                >
                    {isLoading ? (
                        <>
                            <Loader
                                size={20}
                                style={{
                                    marginRight: 12,
                                    animation: 'spin 1s linear infinite',
                                }}
                            />
                            {t('interpret_loading')}
                        </>
                    ) : (
                        <>
                            <Heart size={20} style={{ marginRight: 12 }} />
                            {t('life_context_analyze')}
                        </>
                    )}
                </button>

                {/* Resultado */}
                {analysis && (
                    <div
                        className="card"
                        style={{
                            marginTop: 32,
                            background:
                                'linear-gradient(180deg,#FFF 0%,#FFF5F7 100%)',
                            border: '1px solid #FED7E2',
                            borderRadius: 20,
                            padding: 20,
                            animation: 'fadeIn 0.5s ease-out',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <Sparkles
                                size={20}
                                color="#D53F8C"
                                style={{ marginRight: 8 }}
                            />
                            <h3
                                style={{
                                    fontSize: '1.1rem',
                                    color: '#D53F8C',
                                }}
                            >
                                Análise Contextual
                            </h3>
                        </div>
                        <p
                            style={{
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                color: '#1F2937',
                            }}
                        >
                            {analysis}
                        </p>
                    </div>
                )}

                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
            </div>
        </Layout>
    );
};

export default LifeContext;
