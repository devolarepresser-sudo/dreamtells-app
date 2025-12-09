import React from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { BarChart2 } from 'lucide-react';

const Stats: React.FC = () => {
    const { dreams, t } = useApp();

    // Em modo de testes tudo liberado
    // Em modo de testes tudo liberado
    // const hasAccess = FREE_DEV_MODE ? true : canUsePremium();

    return (
        <Layout title={t('menu_stats')} showBack>
            <div style={{ flex: 1 }}>
                {/* Card total de sonhos */}
                <div
                    className="card"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 20,
                    }}
                >
                    <div>
                        <p
                            className="text-muted"
                            style={{ fontSize: '0.9rem' }}
                        >
                            {t('stats_total_dreams') || 'Total de Sonhos'}
                        </p>
                        <h2
                            style={{
                                fontSize: '2.5rem',
                                color: 'var(--color-primary)',
                            }}
                        >
                            {dreams.length}
                        </h2>
                    </div>
                    <BarChart2
                        size={48}
                        color="var(--color-primary)"
                        opacity={0.2}
                    />
                </div>

                {/* Gráfico fake de frequência semanal */}
                <div className="card">
                    <h3
                        style={{
                            marginBottom: 16,
                            fontSize: '1.1rem',
                        }}
                    >
                        Frequência dos sonhos
                    </h3>
                    <div
                        style={{
                            height: 150,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            paddingBottom: 8,
                        }}
                    >
                        {[40, 70, 30, 85, 50, 60, 90].map((h, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '10%',
                                    background:
                                        'var(--color-secondary)',
                                    height: `${h}%`,
                                    borderRadius: 4,
                                    opacity: 0.6,
                                }}
                            />
                        ))}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        <span>Seg</span>
                        <span>Ter</span>
                        <span>Qua</span>
                        <span>Qui</span>
                        <span>Sex</span>
                        <span>Sáb</span>
                        <span>Dom</span>
                    </div>
                </div>

                {/* Emoções recorrentes – placeholder */}
                <div className="card">
                    <h3
                        style={{
                            marginBottom: 16,
                            fontSize: '1.1rem',
                        }}
                    >
                        Emoções recorrentes
                    </h3>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                        }}
                    >
                        {[
                            'Ansiedade',
                            'Liberdade',
                            'Medo',
                            'Alegria',
                            'Confusão',
                        ].map((tag, i) => (
                            <span
                                key={i}
                                style={{
                                    background: '#F7FAFC',
                                    padding: '8px 16px',
                                    borderRadius: 20,
                                    fontSize: '0.9rem',
                                    color: 'var(--color-text-primary)',
                                    border: '1px solid #E2E8F0',
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Stats;
