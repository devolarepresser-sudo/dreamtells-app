import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { hybridStorage, UnconsciousMap as IUnconsciousMap } from '../services/hybridStorage';
import { motion } from 'framer-motion';
import { Compass, Check, Save, Globe, User, Briefcase, Heart, Book, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Componentes visuais (movidos para fora do componente para evitar recriação) ---
const RenderOption = ({
    selected,
    label,
    onClick
}: { selected: boolean; label: string; onClick: () => void }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        type="button" // Adicionado para evitar submissão acidental
        style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: 8,
            borderRadius: 12,
            background: selected
                ? 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))'
                : 'rgba(30,41,59,0.5)',
            border: selected ? '1px solid #818CF8' : '1px solid rgba(148,163,184,0.2)',
            color: selected ? '#E0E7FF' : '#94A3B8',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        }}
    >
        <span style={{ fontWeight: selected ? 600 : 400 }}>{label}</span>
        {selected && <Check size={16} color="#818CF8" />}
    </motion.button>
);

const RenderInput = ({
    value,
    onChange,
    placeholder,
    multiline = false
}: { value: string; onChange: (e: any) => void; placeholder: string; multiline?: boolean }) => (
    multiline ? (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: '100%',
                padding: 12,
                borderRadius: 12,
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(148,163,184,0.3)',
                color: '#F1F5F9',
                fontSize: '0.9rem',
                minHeight: 80,
                resize: 'none',
                fontFamily: 'inherit',
                marginTop: 8
            }}
        />
    ) : (
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: '100%',
                padding: 12,
                borderRadius: 12,
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(148,163,184,0.3)',
                color: '#F1F5F9',
                fontSize: '0.9rem',
                marginTop: 8
            }}
        />
    )
);

const Section = ({
    title,
    icon: Icon,
    children
}: { title: string; icon: any; children: React.ReactNode }) => (
    <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
                padding: 8,
                borderRadius: 8,
                background: 'rgba(99,102,241,0.1)',
                color: '#818CF8'
            }}>
                <Icon size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC' }}>{title}</h3>
        </div>
        <div style={{ paddingLeft: 0 }}>
            {children}
        </div>
    </section>
);

const SubTitle = ({ children }: { children: React.ReactNode }) => (
    <p style={{ color: '#CBD5E1', marginBottom: 10, marginTop: 16, fontSize: '0.9rem', fontWeight: 500 }}>{children}</p>
);

const UnconsciousMap: React.FC = () => {
    const { t } = useApp();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState('');

    const [mapData, setMapData] = useState<IUnconsciousMap>({
        // Eixo 1
        identity: { type: '', description: '' },
        age: '',
        // Eixo 2
        origin: { birthPlace: '', emotionalOrigin: '', currentPlace: '', feelingInCurrentPlace: '', feelingDescription: '' },
        // Eixo 3
        relationship: { status: '', feelings: [], unresolvedPast: '', unresolvedDescription: '' },
        // Eixo 4
        work: { status: '', feelings: [], identityMatch: '' },
        // Eixo 5
        future: { desire: '', movement: '' },
        // Eixo 6
        religion: { type: '', description: '' }
    });

    useEffect(() => {
        const load = async () => {
            const data = await hybridStorage.getUnconsciousMap();
            if (data && Object.keys(data).length > 0) {
                // Merge para garantir que objetos novos não fiquem undefined
                setMapData(prev => ({
                    ...prev,
                    ...data,
                    identity: { type: data.identity?.type || '', description: data.identity?.description || '' },
                    origin: {
                        birthPlace: data.origin?.birthPlace || '',
                        emotionalOrigin: data.origin?.emotionalOrigin || '',
                        currentPlace: data.origin?.currentPlace || '',
                        feelingInCurrentPlace: data.origin?.feelingInCurrentPlace || '',
                        feelingDescription: data.origin?.feelingDescription || ''
                    },
                    relationship: {
                        status: data.relationship?.status || '',
                        feelings: data.relationship?.feelings || [],
                        unresolvedPast: data.relationship?.unresolvedPast || '',
                        unresolvedDescription: data.relationship?.unresolvedDescription || ''
                    },
                    work: {
                        status: data.work?.status || '',
                        feelings: data.work?.feelings || [],
                        identityMatch: data.work?.identityMatch || ''
                    },
                    future: {
                        desire: data.future?.desire || '',
                        movement: data.future?.movement || ''
                    },
                    religion: { type: data.religion?.type || '', description: data.religion?.description || '' }
                }));
            }
            setIsLoading(false);
        };
        load();
    }, []);

    // Helper para atualizar estado aninhado
    const updateDeep = (section: keyof IUnconsciousMap, field: string, value: any) => {
        setMapData(prev => {
            const currentSection = prev[section] as any || {};
            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [field]: value
                }
            };
        });
    };

    // Helper para toggle em arrays (multi-select)
    const toggleArrayItem = (section: keyof IUnconsciousMap, field: string, itemValue: string) => {
        setMapData(prev => {
            const currentSection = prev[section] as any || {};
            const currentArray = (currentSection[field] as string[]) || [];

            let newArray;
            if (currentArray.includes(itemValue)) {
                newArray = currentArray.filter(i => i !== itemValue);
            } else {
                newArray = [...currentArray, itemValue];
            }

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [field]: newArray
                }
            };
        });
    };

    const handleSave = async () => {
        // Validação básica (pelo menos identidade e idade)
        if (!mapData.age || !mapData.identity?.type) {
            setMsg(t('common_fill_required') || 'Preencha os campos obrigatórios');
            setTimeout(() => setMsg(''), 3000);
            return;
        }

        setIsLoading(true);
        await hybridStorage.saveUnconsciousMap({
            ...mapData,
            lastUpdated: new Date().toISOString()
        });

        setIsLoading(false);
        setMsg(t('map_saved'));
        setTimeout(() => {
            setMsg('');
            navigate('/home');
        }, 1500);
    };



    if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#FFF' }}>Carregando mapa...</div>;

    return (
        <Layout title={t('map_title')} showBack icon={<Compass size={20} />}>
            <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 4px 60px' }}>

                <p style={{
                    color: '#94A3B8',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    marginBottom: 32,
                    padding: '16px',
                    background: 'rgba(30,41,59,0.3)',
                    borderRadius: 12
                }}>
                    {t('map_intro')}
                </p>

                {/* --- EIXO 1: Identidade & Corpo --- */}
                <Section title={t('map_section_identity')} icon={User}>

                    <SubTitle>{t('map_q_identity')}</SubTitle>
                    {[
                        { v: 'man', l: t('map_opt_man') },
                        { v: 'woman', l: t('map_opt_woman') },
                        { v: 'non_binary', l: t('map_opt_nonbinary') },
                        { v: 'trans', l: t('map_opt_trans') },
                        { v: 'none', l: t('map_opt_no_label') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.identity?.type === opt.v}
                            onClick={() => updateDeep('identity', 'type', opt.v)}
                        />
                    ))}
                    <RenderInput
                        multiline
                        placeholder={t('map_ph_identity_desc')}
                        value={mapData.identity?.description || ''}
                        onChange={(e) => updateDeep('identity', 'description', e.target.value)}
                    />

                    <SubTitle>{t('map_q_age')}</SubTitle>
                    <input
                        type="number"
                        value={mapData.age}
                        onChange={(e) => setMapData(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="Ex: 28"
                        style={{
                            width: '100%',
                            padding: 12,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.8)',
                            border: '1px solid rgba(148,163,184,0.3)',
                            color: '#F1F5F9',
                            fontSize: '1.2rem',
                            maxWidth: 100
                        }}
                    />
                </Section>

                {/* --- EIXO 2: Origem & Lugar --- */}
                <Section title={t('map_section_origin')} icon={Globe}>

                    <SubTitle>{t('map_q_birth_place')}</SubTitle>
                    <RenderInput
                        placeholder="Cidade / País"
                        value={mapData.origin?.birthPlace || ''}
                        onChange={(e) => updateDeep('origin', 'birthPlace', e.target.value)}
                    />

                    <SubTitle>{t('map_q_emotional_origin')}</SubTitle>
                    <RenderInput
                        placeholder={t('map_ph_origin_hint')}
                        value={mapData.origin?.emotionalOrigin || ''}
                        onChange={(e) => updateDeep('origin', 'emotionalOrigin', e.target.value)}
                    />

                    <SubTitle>{t('map_q_current_place')}</SubTitle>
                    <RenderInput
                        placeholder="Onde vive hoje"
                        value={mapData.origin?.currentPlace || ''}
                        onChange={(e) => updateDeep('origin', 'currentPlace', e.target.value)}
                    />

                    <SubTitle>{t('map_q_feeling_place')}</SubTitle>
                    {[
                        { v: 'rooted', l: t('map_opt_rooted') },
                        { v: 'foreigner', l: t('map_opt_foreigner') },
                        { v: 'trapped', l: t('map_opt_trapped') },
                        { v: 'transition', l: t('map_opt_transition_place') },
                        { v: 'home', l: t('map_opt_home') },
                        { v: 'displaced', l: t('map_opt_displaced') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.origin?.feelingInCurrentPlace === opt.v}
                            onClick={() => updateDeep('origin', 'feelingInCurrentPlace', opt.v)}
                        />
                    ))}
                </Section>

                {/* --- EIXO 3: Relacionamento --- */}
                <Section title={t('map_section_rel')} icon={Heart}>

                    <SubTitle>{t('map_q_rel_status')}</SubTitle>
                    {[
                        { v: 'single', l: t('map_opt_single') },
                        { v: 'dating', l: t('map_opt_dating') },
                        { v: 'married', l: t('map_opt_married') },
                        { v: 'separated', l: t('map_opt_separated') },
                        { v: 'breakup', l: t('map_opt_breakup') },
                        { v: 'undefined', l: t('map_opt_undefined') },
                        { v: 'alone_choice', l: t('map_opt_alone_choice') },
                        { v: 'alone_hard', l: t('map_opt_alone_hard') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.relationship?.status === opt.v}
                            onClick={() => updateDeep('relationship', 'status', opt.v)}
                        />
                    ))}

                    <SubTitle>{t('map_q_rel_feeling')}</SubTitle>
                    {[
                        { v: 'security', l: t('map_opt_security') },
                        { v: 'dependency', l: t('map_opt_dependency') },
                        { v: 'conflict', l: t('map_opt_conflict_rel') },
                        { v: 'distance', l: t('map_opt_distance') },
                        { v: 'passion', l: t('map_opt_passion') },
                        { v: 'fear_loss', l: t('map_opt_fear_loss') },
                        { v: 'fear_intimacy', l: t('map_opt_fear_intimacy') },
                        { v: 'loneliness', l: t('map_opt_loneliness') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.relationship?.feelings?.includes(opt.v) || false}
                            onClick={() => toggleArrayItem('relationship', 'feelings', opt.v)}
                        />
                    ))}

                    <SubTitle>{t('map_q_unresolved')}</SubTitle>
                    {[
                        { v: 'yes', l: t('map_opt_yes_unresolved') },
                        { v: 'no', l: t('map_opt_no_unresolved') },
                        { v: 'maybe', l: t('map_opt_dont_know') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.relationship?.unresolvedPast === opt.v}
                            onClick={() => updateDeep('relationship', 'unresolvedPast', opt.v)}
                        />
                    ))}
                </Section>

                {/* --- EIXO 4: Trabalho --- */}
                <Section title={t('map_section_work')} icon={Briefcase}>

                    <SubTitle>{t('map_q_work_status')}</SubTitle>
                    {[
                        { v: 'yes', l: t('map_opt_working_yes') },
                        { v: 'no', l: t('map_opt_working_no') },
                        { v: 'transition', l: t('map_opt_working_transition') },
                        { v: 'studying', l: t('map_opt_studying') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.work?.status === opt.v}
                            onClick={() => updateDeep('work', 'status', opt.v)}
                        />
                    ))}

                    <SubTitle>{t('map_q_work_feeling')}</SubTitle>
                    {[
                        { v: 'fulfilled', l: t('map_opt_fulfilled') },
                        { v: 'overwhelmed', l: t('map_opt_overwhelmed') },
                        { v: 'undervalued', l: t('map_opt_undervalued') },
                        { v: 'stagnant', l: t('map_opt_stagnant') },
                        { v: 'fear_change', l: t('map_opt_fear_change') },
                        { v: 'desire_unlived', l: t('map_opt_desire_unlived') },
                        { v: 'growing', l: t('map_opt_growing') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.work?.feelings?.includes(opt.v) || false}
                            onClick={() => toggleArrayItem('work', 'feelings', opt.v)}
                        />
                    ))}

                    <SubTitle>{t('map_q_work_identity')}</SubTitle>
                    {[
                        { v: 'yes', l: t('map_opt_id_yes') },
                        { v: 'partial', l: t('map_opt_id_partial') },
                        { v: 'no', l: t('map_opt_id_no') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.work?.identityMatch === opt.v}
                            onClick={() => updateDeep('work', 'identityMatch', opt.v)}
                        />
                    ))}
                </Section>

                {/* --- EIXO 5: Desejo & Futuro --- */}
                <Section title={t('map_section_future')} icon={Target}>
                    <SubTitle>{t('map_q_desire')}</SubTitle>
                    <RenderInput
                        multiline
                        placeholder={t('map_ph_desire')}
                        value={mapData.future?.desire || ''}
                        onChange={(e) => updateDeep('future', 'desire', e.target.value)}
                    />

                    <SubTitle>{t('map_q_movement')}</SubTitle>
                    {[
                        { v: 'towards', l: t('map_opt_mov_towards') },
                        { v: 'stopped', l: t('map_opt_mov_stopped') },
                        { v: 'against', l: t('map_opt_mov_against') },
                        { v: 'unsure', l: t('map_opt_mov_unsure') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.future?.movement === opt.v}
                            onClick={() => updateDeep('future', 'movement', opt.v)}
                        />
                    ))}
                </Section>

                {/* --- EIXO 6: Espiritualidade --- */}
                <Section title={t('map_section_religion')} icon={Book}>
                    <SubTitle>{t('map_q_religion')}</SubTitle>
                    {[
                        { v: 'none', l: t('map_opt_none') },
                        { v: 'spiritual', l: t('map_opt_spiritual') },
                        { v: 'religious', l: t('map_opt_religious') },
                        { v: 'conflict', l: t('map_opt_conflict') },
                        { v: 'rebuilding', l: t('map_opt_rebuilding') }
                    ].map(opt => (
                        <RenderOption
                            key={opt.v}
                            label={opt.l}
                            selected={mapData.religion?.type === opt.v}
                            onClick={() => updateDeep('religion', 'type', opt.v)}
                        />
                    ))}
                    <RenderInput
                        placeholder={t('map_ph_religion_desc')}
                        value={mapData.religion?.description || ''}
                        onChange={(e) => updateDeep('religion', 'description', e.target.value)}
                    />
                </Section>

                {/* Ação Salvar */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSave}
                    style={{
                        width: '100%',
                        marginTop: 20,
                        padding: '16px',
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        border: 'none',
                        borderRadius: 16,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10
                    }}
                >
                    <Save size={20} />
                    {t('map_save')}
                </motion.button>

                {msg && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: 16, textAlign: 'center', color: '#4ADE80', fontWeight: 600 }}
                    >
                        {msg}
                    </motion.div>
                )}

            </div>
        </Layout>
    );
};

export default UnconsciousMap;
