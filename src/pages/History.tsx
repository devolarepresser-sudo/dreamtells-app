import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Trash2, Heart, X, Search } from 'lucide-react';
import { DreamEntry } from '../types';

const History: React.FC = () => {
    const { dreams, t, toggleFavorite, deleteDream, clearDreams } = useApp();
    const [selectedDream, setSelectedDream] = useState<DreamEntry | null>(null);
    const [filter, setFilter] = useState<'all' | 'favorites'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        });
    };

    // ---- NOVO: função central para extrair a interpretação de vários formatos possíveis ----
    const extractInterpretation = (dream: DreamEntry): string => {
        const d: any = dream;

        // 1) Campos diretos em string
        const direct =
            d.interpretation ??
            d.analysis ??
            d.aiText ??
            d.aiResult ??
            d.result ??
            d.summary;

        if (typeof direct === 'string' && direct.trim()) {
            return direct;
        }

        // 2) Campos aninhados em objeto (caso o resultado venha estruturado)
        const nestedSource =
            (typeof d.interpretation === 'object' && d.interpretation) ||
            (typeof d.analysis === 'object' && d.analysis) ||
            (typeof d.aiResult === 'object' && d.aiResult) ||
            (typeof d.result === 'object' && d.result) ||
            null;

        if (nestedSource) {
            if (typeof nestedSource.interpretation === 'string' && nestedSource.interpretation.trim()) {
                return nestedSource.interpretation;
            }
            if (typeof nestedSource.full === 'string' && nestedSource.full.trim()) {
                return nestedSource.full;
            }
            if (typeof nestedSource.text === 'string' && nestedSource.text.trim()) {
                return nestedSource.text;
            }
        }

        return '';
    };

    // Preview da interpretação (compatível com vários formatos)
    const getDreamPreview = (dream: DreamEntry) => {
        const text = extractInterpretation(dream);
        if (!text) return '';
        return text.length > 80 ? `${text.slice(0, 80)}…` : text;
    };

    const getDreamInterpretation = (dream: DreamEntry) => {
        return extractInterpretation(dream);
    };

    const filteredDreams = useMemo(
        () =>
            dreams.filter((d) => {
                const matchesFilter =
                    filter === 'all' || (filter === 'favorites' && d.isFavorite);
                const matchesSearch = d.text
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
                return matchesFilter && matchesSearch;
            }),
        [dreams, filter, searchTerm]
    );

    return (
        <Layout title={t('history_title')}>
            <div style={{ flex: 1 }}>
                {/* TOPO: busca + filtro favoritos */}
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        marginBottom: 24,
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            flex: 1,
                        }}
                    >
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#A0AEC0',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="input-field"
                            style={{
                                paddingLeft: 40,
                                marginBottom: 0,
                                height: 44,
                                borderRadius: 999,
                                border: '1px solid rgba(148,163,184,0.6)',
                                background: 'rgba(15,23,42,0.8)',
                                color: 'var(--color-text-primary)',
                                boxShadow: '0 10px 30px rgba(15,23,42,0.7)',
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() =>
                            setFilter(filter === 'all' ? 'favorites' : 'all')
                        }
                        style={{
                            background:
                                filter === 'favorites'
                                    ? 'var(--color-primary)'
                                    : 'rgba(15,23,42,0.9)',
                            color:
                                filter === 'favorites'
                                    ? 'white'
                                    : 'var(--color-text-secondary)',
                            padding: '0 14px',
                            borderRadius: 999,
                            fontWeight: 600,
                            boxShadow: '0 10px 30px rgba(15,23,42,0.7)',
                            border: '1px solid rgba(148,163,184,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 44,
                            cursor: 'pointer',
                        }}
                    >
                        <Heart
                            size={20}
                            fill={filter === 'favorites' ? 'white' : 'none'}
                        />
                    </button>
                </div>

                {/* BOTÃO APAGAR TUDO (Somente se houver sonhos) */}
                {dreams.length > 0 && (
                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <button
                            type="button"
                            onClick={() => {
                                if (
                                    window.confirm(
                                        'Tem certeza de que deseja apagar todo o histórico de sonhos? Esta ação não pode ser desfeita.'
                                    )
                                ) {
                                    clearDreams();
                                    setSelectedDream(null);
                                }
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px 14px',
                                borderRadius: 999,
                                border: '1px solid rgba(248,113,113,0.9)',
                                background: 'rgba(254,242,242,0.96)',
                                color: '#B91C1C',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 8px 22px rgba(248,113,113,0.45)',
                            }}
                        >
                            <Trash2 size={14} style={{ marginRight: 6 }} />
                            Apagar todo o histórico
                        </button>
                    </div>
                )}

                {/* LISTA / VAZIO */}
                {filteredDreams.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            marginTop: 60,
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        <p>{t('history_empty')}</p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                        }}
                    >
                        {filteredDreams.map((dream, index) => (
                            <motion.div
                                key={dream.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="card"
                                onClick={() => setSelectedDream(dream)}
                                style={{
                                    padding: 14,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: 0,
                                    borderRadius: 18,
                                    background:
                                        'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,64,175,0.90))',
                                    border:
                                        '1px solid rgba(148,163,184,0.55)',
                                    boxShadow:
                                        '0 14px 38px rgba(15,23,42,0.95)',
                                }}
                            >
                                {/* Bloco da data */}
                                <div
                                    style={{
                                        background:
                                            'rgba(30,64,175,0.15)',
                                        padding: 10,
                                        borderRadius: 14,
                                        marginRight: 14,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: 64,
                                    }}
                                >
                                    <Calendar
                                        size={16}
                                        color="#60A5FA"
                                    />
                                    <span
                                        style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            marginTop: 4,
                                            color: '#BFDBFE',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {formatDate(dream.createdAt)}
                                    </span>
                                </div>

                                {/* Texto + preview */}
                                <div
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <p
                                        style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            fontWeight: 600,
                                            color: '#E5E7EB',
                                            marginBottom: 4,
                                            fontSize: '0.95rem',
                                        }}
                                    >
                                        {dream.text}
                                    </p>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginTop: 2,
                                            gap: 6,
                                        }}
                                    >
                                        {dream.isFavorite && (
                                            <Heart
                                                size={12}
                                                fill="#F87171"
                                                color="#F87171"
                                            />
                                        )}
                                        <p
                                            style={{
                                                fontSize: '0.8rem',
                                                color: '#9CA3AF',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {getDreamPreview(dream)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDream(dream);
                                        }}
                                        style={{
                                            marginTop: 8,
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            borderRadius: 8,
                                            padding: '4px 10px',
                                            color: '#60A5FA',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            display: 'inline-block'
                                        }}
                                    >
                                        Ver interpretação
                                    </button>
                                </div>

                                <ChevronRight
                                    size={18}
                                    color="#9CA3AF"
                                />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* MODAL DETALHES DO SONHO */}
                <AnimatePresence>
                    {selectedDream && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.7)',
                                zIndex: 50,
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                backdropFilter: 'blur(6px)',
                            }}
                            onClick={() => setSelectedDream(null)}
                        >
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{
                                    type: 'spring',
                                    damping: 26,
                                    stiffness: 220,
                                }}
                                style={{
                                    background: 'var(--color-white)',
                                    width: '100%',
                                    maxWidth: 480,
                                    borderTopLeftRadius: 24,
                                    borderTopRightRadius: 24,
                                    padding: '24px 20px 28px',
                                    maxHeight: '90vh',
                                    overflowY: 'auto',
                                    boxShadow:
                                        '0 -18px 40px rgba(15,23,42,0.8)',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Cabeçalho modal */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 18,
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            color: '#1F2933',
                                        }}
                                    >
                                        Dream Details
                                    </h3>
                                    <button
                                        onClick={() =>
                                            setSelectedDream(null)
                                        }
                                        style={{
                                            background: '#F7FAFC',
                                            padding: 8,
                                            borderRadius: '50%',
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow:
                                                '0 8px 24px rgba(15,23,42,0.18)',
                                        }}
                                    >
                                        <X
                                            size={20}
                                            color="var(--color-text-secondary)"
                                        />
                                    </button>
                                </div>

                                {/* Texto do sonho */}
                                <div style={{ marginBottom: 20 }}>
                                    <h4
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--color-text-secondary)',
                                            marginBottom: 6,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Dream
                                    </h4>
                                    <p
                                        style={{
                                            lineHeight: 1.6,
                                            color: 'var(--color-text-primary)',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        {selectedDream.text}
                                    </p>
                                </div>

                                {/* Interpretação */}
                                <div style={{ marginBottom: 24 }}>
                                    <h4
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--color-text-secondary)',
                                            marginBottom: 6,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Interpretation
                                    </h4>
                                    <div
                                        style={{
                                            background: '#F0F4F8',
                                            padding: 18,
                                            borderRadius: 16,
                                            borderLeft:
                                                '4px solid var(--color-primary)',
                                        }}
                                    >
                                        <p
                                            style={{
                                                lineHeight: 1.6,
                                                color: 'var(--color-text-primary)',
                                            }}
                                        >
                                            {getDreamInterpretation(
                                                selectedDream
                                            ) || 'Nenhuma interpretação salva para este sonho.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 10,
                                    }}
                                >
                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            toggleFavorite(
                                                selectedDream.id
                                            );
                                            setSelectedDream({
                                                ...selectedDream,
                                                isFavorite:
                                                    !selectedDream.isFavorite,
                                            });
                                        }}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderRadius: 999,
                                            border:
                                                '1px solid rgba(148,163,184,0.8)',
                                            padding: '10px 14px',
                                            background: '#F9FAFB',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Heart
                                            size={20}
                                            style={{ marginRight: 8 }}
                                            fill={
                                                selectedDream.isFavorite
                                                    ? '#E53E3E'
                                                    : 'none'
                                            }
                                            color={
                                                selectedDream.isFavorite
                                                    ? '#E53E3E'
                                                    : 'currentColor'
                                            }
                                        />
                                        Favorite
                                    </button>

                                    <button
                                        className="btn-secondary"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm(t('confirm_delete') || 'Tem certeza que deseja excluir?')) {
                                                await deleteDream(selectedDream.id);
                                                setSelectedDream(null);
                                            }
                                        }}
                                        style={{
                                            flex: 0.5,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderRadius: 999,
                                            borderColor: '#FEB2B2',
                                            color: '#E53E3E',
                                            background: '#FFF5F5',
                                            padding: '10px 12px',
                                            border: '1px solid #FEB2B2',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default History;
