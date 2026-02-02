import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { Info } from 'lucide-react';

const AboutTerms: React.FC = () => {
    const { t } = useApp();
    const [activeTab, setActiveTab] = useState<'about' | 'terms' | 'privacy'>('about');

    const tabs = [
        { id: 'about', label: t('about_tab') },
        { id: 'terms', label: t('terms_tab') },
        { id: 'privacy', label: t('privacy_tab') },
    ];

    return (
        <Layout
            title={t('settings_about')}
            showBack
            icon={<Info size={18} className="icon-white" />}
            iconClass="menuIconTile-about"
        >
            <div style={{ flex: 1 }}>
                {/* NAV DAS ABAS – contraste melhorado */}
                <div
                    style={{
                        display: 'flex',
                        marginBottom: '24px',
                        background: 'rgba(15,23,42,0.92)',
                        borderRadius: '14px',
                        padding: '4px',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(148,163,184,0.7)',
                        boxShadow: '0 18px 45px rgba(15,23,42,0.9)',
                    }}
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    flex: 1,
                                    padding: '10px 10px',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    background: isActive
                                        ? 'linear-gradient(135deg,#F9FAFB,#E5E7EB)'
                                        : 'transparent',
                                    color: isActive
                                        ? '#111827'
                                        : 'rgba(229,231,235,0.9)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.18s ease',
                                    boxShadow: isActive
                                        ? '0 10px 25px rgba(15,23,42,0.35)'
                                        : 'none',
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* CONTEÚDO */}
                <div
                    className="card"
                    style={{
                        padding: '24px',
                        background: 'rgba(255,255,255,0.96)',
                        borderRadius: 16,
                        boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
                        color: '#1A202C',
                    }}
                >
                    {activeTab === 'about' && (
                        <div>
                            <h3
                                style={{
                                    marginBottom: '16px',
                                    color: 'var(--color-primary)',
                                    fontWeight: 700,
                                }}
                            >
                                DreamTells Sonhos
                            </h3>

                            <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
                                O DreamTells é uma ferramenta de autoconhecimento inspirada na
                                psicologia analítica de Carl Jung e em abordagens modernas de
                                interpretação simbólica. O objetivo é ajudar você a se conectar
                                com seu inconsciente através da observação e interpretação dos seus sonhos.
                            </p>

                            <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
                                Utilizamos inteligência artificial avançada para identificar
                                padrões, símbolos e temas emocionais presentes nos relatos dos sonhos,
                                oferecendo insights que podem apoiar sua jornada de crescimento pessoal,
                                reflexão e tomada de consciência.
                            </p>

                            <p style={{ lineHeight: '1.6' }}>
                                O DreamTells não substitui terapia, aconselhamento psicológico
                                ou acompanhamento médico. Ele foi criado como um espaço seguro de registro,
                                reflexão e ampliação de percepção sobre si mesmo.
                            </p>
                        </div>
                    )}

                    {activeTab === 'terms' && (
                        <div>
                            <h3
                                style={{
                                    marginBottom: '16px',
                                    color: 'var(--color-primary)',
                                    fontWeight: 700,
                                }}
                            >
                                Termos de Uso
                            </h3>

                            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
                                1. O DreamTells é uma ferramenta de autoconhecimento e não oferece
                                diagnósticos médicos, psiquiátricos ou psicológicos. Qualquer decisão
                                sobre saúde física ou mental deve ser tomada com profissionais qualificados.
                            </p>

                            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
                                2. As interpretações são geradas por inteligência artificial com base
                                no texto informado pelo usuário. Elas devem ser usadas apenas como
                                apoio à reflexão pessoal, sem caráter de verdade absoluta, previsão de futuro
                                ou garantia de resultados.
                            </p>

                            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
                                3. O usuário é responsável pelo conteúdo que registra no aplicativo.
                                Não é permitido inserir conteúdos ilegais, ofensivos, que violem direitos
                                de terceiros ou que incentivem violência, ódio ou discriminação.
                            </p>

                            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
                                4. O aplicativo não deve ser utilizado em situações de emergência
                                (por exemplo, risco imediato de vida ou saúde). Em casos assim, procure
                                imediatamente os serviços de emergência e profissionais de saúde da sua região.
                            </p>

                            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
                                5. Podemos atualizar periodicamente estes Termos de Uso para melhorar o
                                serviço ou adequar o aplicativo a exigências legais. Sempre que houver
                                mudanças relevantes, indicaremos a data da última atualização dentro do app.
                            </p>

                            <p style={{ lineHeight: '1.6' }}>
                                6. Ao utilizar o DreamTells, você declara que leu, compreendeu e
                                concorda com estes Termos de Uso e com a nossa Política de Privacidade.
                            </p>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div>
                            <h3
                                style={{
                                    marginBottom: '16px',
                                    color: 'var(--color-primary)',
                                    fontWeight: 700,
                                }}
                            >
                                Privacidade
                            </h3>

                            <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
                                Entendemos que seus sonhos e experiências pessoais são dados sensíveis.
                                Por isso, tratamos essas informações com cuidado e respeito, usando apenas
                                o necessário para o funcionamento do aplicativo e para gerar as interpretações.
                            </p>

                            <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
                                Nesta versão, os seus registros são armazenados no próprio aplicativo
                                para exibição no histórico e são enviados a serviços de inteligência artificial
                                (como a OpenAI ou provedores equivalentes) apenas no momento da interpretação.
                                Esses dados são usados exclusivamente para gerar a resposta solicitada.
                            </p>

                            <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
                                Não vendemos suas informações pessoais e não compartilhamos seus sonhos
                                com terceiros para fins de marketing. Podemos utilizar dados agregados e
                                anonimizados (sem identificar você) para melhorar a qualidade do serviço,
                                por exemplo, entendendo padrões gerais de uso.
                            </p>

                            <p style={{ lineHeight: '1.6' }}>
                                Você pode, a qualquer momento, apagar seus sonhos do histórico dentro do app.
                                Caso, no futuro, sejam disponibilizados recursos de conta em nuvem ou
                                sincronização entre dispositivos, informaremos de forma clara como seus
                                dados serão armazenados e quais opções de controle e exclusão estarão
                                disponíveis para você.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AboutTerms;
