import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Trash2, Heart, Search, BookOpen } from 'lucide-react';
import { DreamEntry } from '../types';

const History: React.FC = () => {
    const { dreams, t, clearDreams, deleteDream, toggleFavorite } = useApp();
    const navigate = useNavigate();
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

    const handleDreamClick = (dream: DreamEntry) => {
        // Navega para a tela de interpretação passando o objeto completo
        // Se a tela de interpretação espera formatar do jeito que ela faz (com buildInterpretationView),
        // basta passar o dreamEntry que lá ela se vira.
        navigate('/interpretation', {
            state: {
                dreamId: dream.id,
                dream: dream
            }
        });
    };

    return (
        <Layout
            title={t('history_title')}
            icon={<BookOpen size={18} color="#F9FAFB" />}
        >
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
                            placeholder="Buscar..."
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
                                onClick={() => handleDreamClick(dream)}
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
                                            handleDreamClick(dream);
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

                                {/* Botão Favorito - Restaurado */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(dream.id);
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 2,
                                    }}
                                >
                                    <Heart
                                        size={22}
                                        fill={dream.isFavorite ? '#F87171' : 'none'}
                                        color={dream.isFavorite ? '#F87171' : '#64748B'}
                                    />
                                </button>

                                {/* Botão Excluir Individual */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm("Deseja apagar este sonho permanentemente?")) {
                                            deleteDream(dream.id);
                                        }
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: 2,
                                    }}
                                >
                                    <Trash2 size={18} color="#94A3B8" />
                                </button>

                                <ChevronRight
                                    size={18}
                                    color="#9CA3AF"
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default History;
