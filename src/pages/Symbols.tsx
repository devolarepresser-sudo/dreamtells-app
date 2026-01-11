import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { Search, Bookmark, Sparkles, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AggregatedSymbol {
    name: string;
    meanings: Set<string>;
    count: number;
    lastSeen: string;
}

const Symbols: React.FC = () => {
    const { t, dreams, user } = useApp();
    const [search, setSearch] = useState('');
    const [selectedSymbol, setSelectedSymbol] = useState<AggregatedSymbol | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

    // 1. AGREGAÇÃO DE SÍMBOLOS DINÂMICA
    const aggregatedSymbols = useMemo(() => {
        const map = new Map<string, AggregatedSymbol>();

        dreams.forEach((dream) => {
            if (!dream.symbols || !Array.isArray(dream.symbols)) return;

            dream.symbols.forEach((s) => {
                const normalizedName = s.name.trim();
                const key = normalizedName.toLowerCase();

                if (!map.has(key)) {
                    map.set(key, {
                        name: normalizedName, // preserva capitulação da primeira ocorrência
                        meanings: new Set([s.meaning]),
                        count: 1,
                        lastSeen: dream.createdAt,
                    });
                } else {
                    const entry = map.get(key)!;
                    entry.count += 1;
                    entry.meanings.add(s.meaning);
                    if (new Date(dream.createdAt) > new Date(entry.lastSeen)) {
                        entry.lastSeen = dream.createdAt;
                    }
                }
            });
        });

        // Converter para array e ordenar
        return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }, [dreams]);

    // Filtro de busca
    const filtered = aggregatedSymbols.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    // Handler para análise profunda
    const handleSelectSymbol = async (symbol: AggregatedSymbol) => {
        setSelectedSymbol(symbol);
        setAiAnalysis(null);
        setIsLoadingAnalysis(true);

        try {
            const userId = user?.id || 'guest';
            // Chama a IA para explicar o símbolo
            const analysis = await aiService.analyzeSymbol(symbol.name, userId);
            setAiAnalysis(analysis);
        } catch (error) {
            console.error(error);
            setAiAnalysis('Não foi possível analisar este símbolo no momento.');
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    const closeModal = () => {
        setSelectedSymbol(null);
        setAiAnalysis(null);
    };

    return (
        <Layout
            title={t('menu_symbols')}
            showBack
            icon={<Sparkles size={18} color="#F9FAFB" />}
        >
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    padding: '8px 0 32px',
                }}
            >
                <div
                    style={{
                        maxWidth: 640,
                        margin: '0 auto',
                        padding: '0 16px',
                    }}
                >
                    {/* HEADLINE */}
                    <div style={{ marginBottom: 20 }}>
                        <h2
                            style={{
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: '#E5E7EB',
                                marginBottom: 4,
                            }}
                        >
                            Símbolos dos seus sonhos
                        </h2>
                        <p
                            style={{
                                color: 'rgba(226,232,240,0.7)',
                                fontSize: '0.9rem',
                                lineHeight: 1.4,
                            }}
                        >
                            Aqui aparecem apenas símbolos que já foram identificados em sonhos
                            interpretados pela IA.
                        </p>
                    </div>

                    {/* BUSCA */}
                    <div
                        style={{
                            position: 'relative',
                            marginBottom: 24,
                        }}
                    >
                        <Search
                            size={20}
                            style={{
                                position: 'absolute',
                                left: 18,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9CA3AF',
                                pointerEvents: 'none',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Buscar em seus símbolos..."
                            className="input-field"
                            style={{
                                width: '100%',
                                paddingLeft: 46,
                                paddingRight: 16,
                                height: 44,
                                borderRadius: 999,
                                border: '1px solid rgba(148,163,184,0.6)',
                                background: 'rgba(15,23,42,0.85)',
                                color: '#F9FAFB',
                                fontSize: '0.9rem',
                                outline: 'none',
                            }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* LISTA VAZIA */}
                    {filtered.length === 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                marginTop: 40,
                                padding: 20,
                                color: 'rgba(148,163,184,0.7)',
                                fontSize: '0.9rem',
                            }}
                        >
                            {aggregatedSymbols.length === 0 ? (
                                <p>
                                    Nenhum símbolo encontrado ainda. <br />
                                    Interprete seus sonhos para popular esta lista.
                                </p>
                            ) : (
                                <p>Nenhum símbolo corresponde à busca.</p>
                            )}
                        </div>
                    )}

                    {/* LISTA DE SÍMBOLOS */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                            paddingBottom: 40,
                        }}
                    >
                        {filtered.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => handleSelectSymbol(s)}
                                className="card"
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: 18,
                                    padding: 14,
                                    background:
                                        'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.7))',
                                    border: '1px solid rgba(148,163,184,0.25)',
                                    boxShadow: '0 10px 30px rgba(15,23,42,0.8)',
                                }}
                                whileHover={{
                                    scale: 1.01,
                                    borderColor: 'rgba(96,165,250,0.7)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 6,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <h3
                                            style={{
                                                fontSize: '1.05rem',
                                                fontWeight: 700,
                                                color: '#F9FAFB',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {s.name}
                                        </h3>
                                        {s.count > 1 && (
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    background: 'rgba(30,58,138,0.7)',
                                                    color: '#BFDBFE',
                                                    padding: '2px 8px',
                                                    borderRadius: 999,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {s.count}x
                                            </span>
                                        )}
                                    </div>
                                    <Sparkles size={18} color="#60A5FA" style={{ opacity: 0.8 }} />
                                </div>

                                {/* Prévia do significado */}
                                <p
                                    style={{
                                        color: 'rgba(203,213,225,0.9)',
                                        lineHeight: 1.5,
                                        fontSize: '0.9rem',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {Array.from(s.meanings)[0]}
                                </p>

                                <div
                                    style={{
                                        marginTop: 10,
                                        fontSize: '0.8rem',
                                        color: '#60A5FA',
                                        fontWeight: 600,
                                    }}
                                >
                                    Toque para análise profunda
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* MODAL DE DETALHES DO SÍMBOLO */}
                <AnimatePresence>
                    {selectedSymbol && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeModal}
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.8)',
                                    zIndex: 50,
                                    backdropFilter: 'blur(4px)',
                                }}
                            />

                            {/* Drawer / Modal */}
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                style={{
                                    position: 'fixed',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: '#020617',
                                    borderTopLeftRadius: 24,
                                    borderTopRightRadius: 24,
                                    padding: '20px 20px 32px',
                                    zIndex: 51,
                                    borderTop: '1px solid rgba(148,163,184,0.3)',
                                    boxShadow: '0 -10px 40px rgba(0,0,0,0.9)',
                                    maxHeight: '85vh',
                                    overflowY: 'auto',
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: 640,
                                        margin: '0 auto',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 18,
                                        }}
                                    >
                                        <h2
                                            style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 800,
                                                color: '#F9FAFB',
                                                textTransform: 'capitalize',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                            }}
                                        >
                                            {selectedSymbol.name}
                                            <Bookmark size={22} color="#60A5FA" fill="#60A5FA" />
                                        </h2>
                                        <button
                                            onClick={closeModal}
                                            style={{
                                                background: 'rgba(255,255,255,0.08)',
                                                border: 'none',
                                                borderRadius: '999px',
                                                width: 34,
                                                height: 34,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <X size={18} color="#FFF" />
                                        </button>
                                    </div>

                                    {/* Conteúdo da Análise */}
                                    <div style={{ color: '#E2E8F0', lineHeight: 1.7 }}>
                                        {isLoadingAnalysis ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    padding: '32px 0',
                                                }}
                                            >
                                                <Loader className="animate-spin" size={30} color="#60A5FA" />
                                                <p
                                                    style={{
                                                        marginTop: 14,
                                                        color: '#94A3B8',
                                                        fontSize: '0.9rem',
                                                    }}
                                                >
                                                    Consultando o oráculo simbólico...
                                                </p>
                                            </div>
                                        ) : aiAnalysis ? (
                                            <div className="animate-fade-in">
                                                <h4
                                                    style={{
                                                        color: '#93C5FD',
                                                        textTransform: 'uppercase',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        marginBottom: 10,
                                                        letterSpacing: '0.12em',
                                                    }}
                                                >
                                                    Simbolismo Profundo
                                                </h4>
                                                <p
                                                    style={{
                                                        fontSize: '0.95rem',
                                                        textAlign: 'justify',
                                                        marginBottom: 22,
                                                    }}
                                                >
                                                    {aiAnalysis}
                                                </p>

                                                <div
                                                    style={{
                                                        padding: 14,
                                                        background: 'rgba(15,23,42,0.9)',
                                                        borderRadius: 16,
                                                        border: '1px solid rgba(148,163,184,0.35)',
                                                    }}
                                                >
                                                    <h4
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color: '#CBD5E1',
                                                            marginBottom: 6,
                                                        }}
                                                    >
                                                        Aparições recentes:
                                                    </h4>
                                                    <ul
                                                        style={{
                                                            paddingLeft: 20,
                                                            margin: 0,
                                                            color: '#94A3B8',
                                                            fontSize: '0.85rem',
                                                        }}
                                                    >
                                                        {Array.from(selectedSymbol.meanings).map((m, idx) => (
                                                            <li key={idx} style={{ marginBottom: 4 }}>
                                                                {m}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ color: '#EF4444', fontSize: '0.9rem' }}>
                                                Erro ao carregar análise. Tente novamente.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Estilos auxiliares para animações */}
                <style>{`
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    .animate-fade-in {
                        animation: fadeIn 0.3s ease-out;
                    }
                    @keyframes fadeIn {
                        0% { opacity: 0; transform: translateY(4px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        </Layout>
    );
};

export default Symbols;
