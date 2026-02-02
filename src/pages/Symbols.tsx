import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { hybridStorage } from '../services/hybridStorage';
import {
    Search, Bookmark, Sparkles, X, Loader, Book, ChevronRight,
    Waves, Flame, Home, User, PawPrint, Bird, TreeDeciduous, Coins,
    Heart, Sword, Mountain, Moon, Sun, Cloud, Eye, Key, BookOpen,
    Car, Ghost, Skull, Clock, Compass, Activity, Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AggregatedSymbol {
    name: string;
    meanings: Set<string>;
    count: number;
    lastSeen: string;
}

// MAPEADOR DE ÍCONES INTELIGENTE
const SymbolIcon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 20, color = "#60A5FA" }) => {
    const n = name.toLowerCase();

    // Água
    if (n.includes('água') || n.includes('mar') || n.includes('rio') || n.includes('oceano') || n.includes('chuva')) return <Waves size={size} color={color} />;
    // Fogo
    if (n.includes('fogo') || n.includes('incêndio') || n.includes('brasa') || n.includes('chama')) return <Flame size={size} color={color} />;
    // Lugares
    if (n.includes('casa') || n.includes('prédio') || n.includes('lar') || n.includes('quarto') || n.includes('apartamento')) return <Home size={size} color={color} />;
    // Seres
    if (n.includes('pessoa') || n.includes('homem') || n.includes('mulher') || n.includes('criança') || n.includes('bebê')) return <User size={size} color={color} />;
    // Animais
    if (n.includes('animal') || n.includes('cachorro') || n.includes('gato') || n.includes('cão') || n.includes('leão')) return <PawPrint size={size} color={color} />;
    if (n.includes('pássaro') || n.includes('ave') || n.includes('voar') || n.includes('asa')) return <Bird size={size} color={color} />;
    // Natureza
    if (n.includes('árvore') || n.includes('floresta') || n.includes('mata') || n.includes('planta') || n.includes('flor')) return <TreeDeciduous size={size} color={color} />;
    if (n.includes('montanha') || n.includes('serra') || n.includes('monte')) return <Mountain size={size} color={color} />;
    if (n.includes('céu') || n.includes('nuvem')) return <Cloud size={size} color={color} />;
    if (n.includes('sol') || n.includes('dia') || n.includes('luz')) return <Sun size={size} color={color} />;
    if (n.includes('lua') || n.includes('noite') || n.includes('estrela')) return <Moon size={size} color={color} />;
    if (n.includes('vento') || n.includes('ar')) return <Wind size={size} color={color} />;
    // Emoções e Abstrações
    if (n.includes('coração') || n.includes('amor') || n.includes('paixão') || n.includes('beijo')) return <Heart size={size} color={color} />;
    if (n.includes('medo') || n.includes('fantasma') || n.includes('monstro') || n.includes('sombra')) return <Ghost size={size} color={color} />;
    if (n.includes('morte') || n.includes('caveira') || n.includes('caixão')) return <Skull size={size} color={color} />;
    if (n.includes('tempo') || n.includes('relógio') || n.includes('hora')) return <Clock size={size} color={color} />;
    // Ação e Objetos
    if (n.includes('luta') || n.includes('briga') || n.includes('arma') || n.includes('faca') || n.includes('espada')) return <Sword size={size} color={color} />;
    if (n.includes('dinheiro') || n.includes('moeda') || n.includes('ouro') || n.includes('riqueza')) return <Coins size={size} color={color} />;
    if (n.includes('chave') || n.includes('cadeado') || n.includes('porta')) return <Key size={size} color={color} />;
    if (n.includes('carro') || n.includes('dirigir') || n.includes('veículo') || n.includes('estrada')) return <Car size={size} color={color} />;
    if (n.includes('livro') || n.includes('estudar') || n.includes('escola') || n.includes('ler')) return <BookOpen size={size} color={color} />;
    if (n.includes('olho') || n.includes('ver') || n.includes('olhar')) return <Eye size={size} color={color} />;
    if (n.includes('caminho') || n.includes('bússola') || n.includes('norte')) return <Compass size={size} color={color} />;
    if (n.includes('saúde') || n.includes('hospital') || n.includes('médico')) return <Activity size={size} color={color} />;

    return <Sparkles size={size} color={color} />;
};

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
                        name: normalizedName,
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

        return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }, [dreams]);

    const filtered = aggregatedSymbols.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectSymbol = async (symbol: AggregatedSymbol) => {
        setSelectedSymbol(symbol);
        setAiAnalysis(null);
        setIsLoadingAnalysis(true);

        try {
            const cachedDefs = await hybridStorage.getSymbolDefinitions();
            const normalizedKey = symbol.name.toLowerCase();

            if (cachedDefs[normalizedKey]) {
                setAiAnalysis(cachedDefs[normalizedKey]);
                return;
            }

            const userId = user?.id || 'guest';
            const analysis = await aiService.analyzeSymbol(symbol.name, userId);

            setAiAnalysis(analysis);
            await hybridStorage.saveSymbolDefinition(symbol.name, analysis);
        } catch (error) {
            console.error(error);
            setAiAnalysis("Houve uma interrupção na conexão com sua sabedoria interna.");
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    const closeModal = () => {
        setSelectedSymbol(null);
        setAiAnalysis(null);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <Layout
            title={t('menu_symbols')}
            showBack
            icon={<Book size={18} className="icon-white" />}
            iconClass="menuIconTile-symbols"
        >
            {/* GRADIENT OVERLAY */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                margin: '0 auto',
                width: '100%',
                maxWidth: 470,
                height: '40vh',
                background: 'linear-gradient(to bottom, rgba(79, 70, 229, 0.15), transparent)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{
                flex: 1,
                position: 'relative',
                padding: '16px 0 40px',
                zIndex: 1
            }}>
                <div style={{
                    maxWidth: 640,
                    margin: '0 auto',
                    padding: '0 20px',
                }}>

                    {/* BUSCA MÍSTICA */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            position: 'relative',
                            marginBottom: 28,
                        }}
                    >
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: 16,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94A3B8',
                                pointerEvents: 'none',
                                opacity: 0.7
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Busque na sua sabedoria profunda..."
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                borderRadius: 16,
                                border: '1px solid rgba(148,163,184,0.2)',
                                background: 'rgba(15,23,42,0.6)',
                                backdropFilter: 'blur(10px)',
                                color: '#F9FAFB',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                            }}
                            className="search-input-focus"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </motion.div>

                    {/* LISTA DE SÍMBOLOS */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                    >
                        {filtered.length === 0 && (
                            <motion.div variants={itemVariants} style={{ textAlign: 'center', padding: '40px 0', opacity: 0.6 }}>
                                <p>{t('symbols_no_match')}</p>
                            </motion.div>
                        )}

                        {filtered.map((s) => (
                            <motion.div
                                key={s.name}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(30,41,59,0.5)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSelectSymbol(s)}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: 20,
                                    padding: '18px',
                                    background: 'rgba(15,23,42,0.4)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(148,163,184,0.1)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* SUBTLE GLOW EFFECT */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '1px',
                                    background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.3), transparent)'
                                }} />

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 8,
                                    gap: 12,
                                    width: '100%'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid rgba(148,163,184,0.1)',
                                            flexShrink: 0
                                        }}>
                                            <SymbolIcon name={s.name} size={18} />
                                        </div>
                                        <h3 style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            color: '#F9FAFB',
                                            textTransform: 'capitalize',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            flex: 1,
                                            minWidth: 0
                                        }}>{s.name}</h3>
                                        {s.count > 1 && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: 'rgba(96,165,250,0.15)',
                                                color: '#93C5FD',
                                                padding: '2px 8px',
                                                borderRadius: 20,
                                                fontWeight: 700,
                                                border: '1px solid rgba(96,165,250,0.2)'
                                            }}>{s.count} ritos</span>
                                        )}
                                    </div>
                                    <ChevronRight size={18} color="#475569" />
                                </div>

                                <p style={{
                                    color: '#94A3B8',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {Array.from(s.meanings)[0]}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* MODAL DE REVELAÇÃO PROFUNDA */}
            <AnimatePresence>
                {selectedSymbol && (
                    <>
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
                                background: 'rgba(2, 6, 23, 0.85)',
                                zIndex: 100,
                                backdropFilter: 'blur(12px)',
                            }}
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="hide-scrollbar"
                            style={{
                                position: 'fixed',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                margin: '0 auto',
                                width: '100%',
                                maxWidth: 470,
                                background: 'linear-gradient(to bottom, #0F172A, #020617)',
                                borderTopLeftRadius: 32,
                                borderTopRightRadius: 32,
                                padding: '24px 24px 48px',
                                zIndex: 101,
                                borderTop: '1px solid rgba(148,163,184,0.2)',
                                boxShadow: '0 -20px 40px rgba(0,0,0,0.4)',
                                maxHeight: '95vh',
                                overflowY: 'auto',
                                overflowX: 'hidden'
                            }}
                        >
                            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                                {/* HANDLE */}
                                <div style={{
                                    width: 40,
                                    height: 4,
                                    background: 'rgba(148,163,184,0.2)',
                                    borderRadius: 2,
                                    margin: '0 auto 24px'
                                }} onClick={closeModal} />

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: 32,
                                    gap: 16,
                                    width: '100%'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 54,
                                            height: 54,
                                            borderRadius: 16,
                                            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.15))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid rgba(148,163,184,0.2)',
                                            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                                        }}>
                                            <SymbolIcon name={selectedSymbol.name} size={28} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: '#60A5FA',
                                                fontWeight: 700,
                                                letterSpacing: '0.1em',
                                                textTransform: 'uppercase',
                                                marginBottom: 8
                                            }}>Símbolo Recorrente</div>
                                            <h2 style={{
                                                fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                                                fontWeight: 800,
                                                color: '#F9FAFB',
                                                textTransform: 'capitalize',
                                                lineHeight: 1.1,
                                                wordBreak: 'break-word'
                                            }}>{selectedSymbol.name}</h2>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '50%',
                                            width: 44,
                                            height: 44,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#94A3B8'
                                        }}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div style={{ color: '#E2E8F0', lineHeight: 1.8 }}>
                                    {isLoadingAnalysis ? (
                                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                            <Loader className="animate-spin" size={32} color="#60A5FA" />
                                            <p style={{ marginTop: 20, color: '#94A3B8', fontWeight: 500 }}>
                                                {t('symbols_analysis_loading')}
                                            </p>
                                        </div>
                                    ) : aiAnalysis ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="analysis-content"
                                        >
                                            <div style={{
                                                padding: '24px',
                                                background: 'rgba(30,41,59,0.3)',
                                                borderRadius: 24,
                                                border: '1px solid rgba(148,163,184,0.1)',
                                                marginBottom: 32,
                                                fontSize: '1.05rem',
                                                color: '#CBD5E1',
                                                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)',
                                                wordBreak: 'break-word',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                <Sparkles size={20} color="#60A5FA" style={{ marginBottom: 16 }} />
                                                {aiAnalysis}
                                            </div>

                                            <div style={{ marginBottom: 12 }}>
                                                <h4 style={{
                                                    fontSize: '0.9rem',
                                                    color: '#60A5FA',
                                                    fontWeight: 700,
                                                    marginBottom: 16,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8
                                                }}>
                                                    <Bookmark size={16} />
                                                    Manifestações na sua Jornada
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {Array.from(selectedSymbol.meanings).map((m, idx) => (
                                                        <div key={idx} style={{
                                                            padding: '14px 18px',
                                                            background: 'rgba(15,23,42,0.5)',
                                                            borderRadius: 16,
                                                            borderLeft: '3px solid #3B82F6',
                                                            fontSize: '0.95rem',
                                                            color: '#94A3B8',
                                                            wordBreak: 'break-word'
                                                        }}>
                                                            {m}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div style={{ padding: '40px 0', textAlign: 'center', color: '#EF4444' }}>
                                            {t('symbols_error_loading')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style>{`
                .search-input-focus:focus {
                    border-color: rgba(96,165,250,0.5) !important;
                    box-shadow: 0 0 0 2px rgba(96,165,250,0.1), 0 8px 32px rgba(0,0,0,0.3) !important;
                    background: rgba(15,23,42,0.8) !important;
                }
                .animate-spin {
                    animation: spin 1.2s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </Layout>
    );
};

export default Symbols;
