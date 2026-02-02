import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useTranslation } from 'react-i18next';

import { hybridStorage, UnconsciousMap as IUnconsciousMap } from '../services/hybridStorage';
import { motion } from 'framer-motion';
import { Compass, Check, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Componentes visuais
const RenderOption = ({
    selected,
    label,
    onClick
}: { selected: boolean; label: string; onClick: () => void }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        type="button"
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
    placeholder
}: { value: string; onChange: (e: any) => void; placeholder: string }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={100}
        style={{
            width: '100%',
            padding: 12,
            borderRadius: 12,
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(148,163,184,0.3)',
            color: '#F1F5F9',
            fontSize: '0.9rem',
            marginTop: 8,
            marginBottom: 24
        }}
    />
);

const Section = ({
    title,
    children
}: { title: string; children: React.ReactNode }) => (
    <section style={{ marginBottom: 40 }}>
        <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#F8FAFC',
            borderLeft: '4px solid #818CF8',
            paddingLeft: 12,
            marginBottom: 20
        }}>
            {title}
        </h3>
        <div style={{ paddingLeft: 0 }}>
            {children}
        </div>
    </section>
);

const Question = ({ children }: { children: React.ReactNode }) => (
    <p style={{ color: '#E2E8F0', marginBottom: 16, fontSize: '1rem', fontWeight: 500 }}>{children}</p>
);

const UnconsciousMap: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState('');

    const [mapData, setMapData] = useState<IUnconsciousMap>({
        axisIdentity: { status: '', note: '' },
        axisSecurity: { status: '', note: '' },
        axisBond: { status: [], note: '' },
        axisMovement: { status: '', note: '' },
        axisDesire: { status: '', note: '' },
        axisEnergy: { status: '', note: '' }
    });

    useEffect(() => {
        const load = async () => {
            const data = await hybridStorage.getUnconsciousMap();
            if (data && Object.keys(data).length > 0) {
                // Merge seguro
                setMapData(prev => ({
                    ...prev,
                    ...data,
                    // Garante que campos novos existam se o dado for antigo (migration implícita)
                    axisIdentity: data.axisIdentity || { status: '', note: '' },
                    axisSecurity: data.axisSecurity || { status: '', note: '' },
                    axisBond: data.axisBond || { status: [], note: '' },
                    axisMovement: data.axisMovement || { status: '', note: '' },
                    axisDesire: data.axisDesire || { status: '', note: '' },
                    axisEnergy: data.axisEnergy || { status: '', note: '' }
                }));
            }
            setIsLoading(false);
        };
        load();
    }, []);

    const updateStatus = (axis: keyof IUnconsciousMap, val: string) => {
        setMapData(prev => ({
            ...prev,
            [axis]: {
                ...(prev[axis] as any),
                status: val
            }
        }));
    };

    const updateNote = (axis: keyof IUnconsciousMap, val: string) => {
        setMapData(prev => ({
            ...prev,
            [axis]: {
                ...(prev[axis] as any),
                note: val
            }
        }));
    };

    const toggleBondStatus = (val: string) => {
        setMapData(prev => {
            const current = prev.axisBond?.status || [];
            let newStatus;
            if (current.includes(val)) {
                newStatus = current.filter(i => i !== val);
            } else {
                if (current.length >= 2) return prev; // Max 2
                newStatus = [...current, val];
            }
            return {
                ...prev,
                axisBond: {
                    ...prev.axisBond!,
                    status: newStatus
                }
            };
        });
    };

    const handleSave = async () => {
        // Validação mínima: pelo menos 1 eixo preenchido
        const hasData = mapData.axisIdentity?.status || mapData.axisSecurity?.status;

        if (!hasData) {
            setMsg(t('map_v2_msg_error'));
            setTimeout(() => setMsg(''), 3000);
            return;
        }

        setIsLoading(true);
        await hybridStorage.saveUnconsciousMap({
            ...mapData,
            lastUpdated: new Date().toISOString()
        });

        setIsLoading(false);
        setMsg(t('map_v2_msg_success'));
        setTimeout(() => {
            setMsg('');
            navigate('/home');
        }, 1500);
    };

    if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#FFF' }}>{t('map_v2_loading')}</div>;

    return (
        <Layout
            title={t('map_title')}
            showBack
            icon={<Compass size={18} className="icon-white" />}
            iconClass="menuIconTile-map"
        >    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 4px 60px' }}>

                <p style={{
                    color: '#94A3B8',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    marginBottom: 32,
                    padding: '16px',
                    background: 'rgba(30,41,59,0.3)',
                    borderRadius: 12,
                    whiteSpace: 'pre-line'
                }}>
                    {t('map_v2_intro')}
                </p>

                {/* EIXO 1 */}
                <Section title={t('map_v2_axis_1_title')}>
                    <Question>{t('map_v2_axis_1_question')}</Question>
                    {[
                        t('map_v2_axis_1_opt_1'),
                        t('map_v2_axis_1_opt_2'),
                        t('map_v2_axis_1_opt_3'),
                        t('map_v2_axis_1_opt_4'),
                        t('map_v2_axis_1_opt_5')
                    ].map(opt => (
                        <RenderOption
                            key={opt}
                            label={opt}
                            selected={mapData.axisIdentity?.status === opt}
                            onClick={() => updateStatus('axisIdentity', opt)}
                        />
                    ))}
                    <RenderInput
                        placeholder={t('map_v2_axis_1_placeholder')}
                        value={mapData.axisIdentity?.note || ''}
                        onChange={(e) => updateNote('axisIdentity', e.target.value)}
                    />
                </Section>

                {/* EIXO 2 */}
                <Section title={t('map_v2_axis_2_title')}>
                    <Question>{t('map_v2_axis_2_question')}</Question>
                    {[
                        t('map_v2_axis_2_opt_1'),
                        t('map_v2_axis_2_opt_2'),
                        t('map_v2_axis_2_opt_3'),
                        t('map_v2_axis_2_opt_4'),
                        t('map_v2_axis_2_opt_5')
                    ].map(opt => (
                        <RenderOption
                            key={opt}
                            label={opt}
                            selected={mapData.axisSecurity?.status === opt}
                            onClick={() => updateStatus('axisSecurity', opt)}
                        />
                    ))}
                    <RenderInput
                        placeholder={t('map_v2_axis_2_placeholder')}
                        value={mapData.axisSecurity?.note || ''}
                        onChange={(e) => updateNote('axisSecurity', e.target.value)}
                    />
                </Section>

                {/* EIXO 3 */}
                <Section title={t('map_v2_axis_3_title')}>
                    <Question>{t('map_v2_axis_3_question')}</Question>
                    {[
                        t('map_v2_axis_3_opt_1'),
                        t('map_v2_axis_3_opt_2'),
                        t('map_v2_axis_3_opt_3'),
                        t('map_v2_axis_3_opt_4'),
                        t('map_v2_axis_3_opt_5'),
                        t('map_v2_axis_3_opt_6')
                    ].map(opt => (
                        <RenderOption
                            key={opt}
                            label={opt}
                            selected={mapData.axisBond?.status?.includes(opt) || false}
                            onClick={() => toggleBondStatus(opt)}
                        />
                    ))}
                    <RenderInput
                        placeholder={t('map_v2_axis_3_placeholder')}
                        value={mapData.axisBond?.note || ''}
                        onChange={(e) => updateNote('axisBond', e.target.value)}
                    />
                </Section>

                {/* EIXO 4 */}
                <Section title={t('map_v2_axis_4_title')}>
                    <Question>{t('map_v2_axis_4_question')}</Question>
                    {[
                        t('map_v2_axis_4_opt_1'),
                        t('map_v2_axis_4_opt_2'),
                        t('map_v2_axis_4_opt_3'),
                        t('map_v2_axis_4_opt_4'),
                        t('map_v2_axis_4_opt_5')
                    ].map(opt => (
                        <RenderOption
                            key={opt}
                            label={opt}
                            selected={mapData.axisMovement?.status === opt}
                            onClick={() => updateStatus('axisMovement', opt)}
                        />
                    ))}
                    <RenderInput
                        placeholder={t('map_v2_axis_4_placeholder')}
                        value={mapData.axisMovement?.note || ''}
                        onChange={(e) => updateNote('axisMovement', e.target.value)}
                    />
                </Section>

                {/* EIXO 5 */}
                <Section title={t('map_v2_axis_5_title')}>
                    <Question>{t('map_v2_axis_5_question')}</Question>
                    {[
                        t('map_v2_axis_5_opt_1'),
                        t('map_v2_axis_5_opt_2'),
                        t('map_v2_axis_5_opt_3'),
                        t('map_v2_axis_5_opt_4'),
                        t('map_v2_axis_5_opt_5')
                    ].map(opt => (
                        <RenderOption
                            key={opt}
                            label={opt}
                            selected={mapData.axisDesire?.status === opt}
                            onClick={() => updateStatus('axisDesire', opt)}
                        />
                    ))}
                    <RenderInput
                        placeholder={t('map_v2_axis_5_placeholder')}
                        value={mapData.axisDesire?.note || ''}
                        onChange={(e) => updateNote('axisDesire', e.target.value)}
                    />
                </Section>

                {/* EIXO 6 */}
                <Section title={t('map_v2_axis_6_title')}>
                    <Question>{t('map_v2_axis_6_question')}</Question>
                    {[
                        t('map_v2_axis_6_opt_1'),
                        t('map_v2_axis_6_opt_2'),
                        t('map_v2_axis_6_opt_3'),
                        t('map_v2_axis_6_opt_4'),
                        t('map_v2_axis_6_opt_5')
                    ].map(opt => (
                        <RenderOption
                            key={opt}
                            label={opt}
                            selected={mapData.axisEnergy?.status === opt}
                            onClick={() => updateStatus('axisEnergy', opt)}
                        />
                    ))}
                    <RenderInput
                        placeholder={t('map_v2_axis_6_placeholder')}
                        value={mapData.axisEnergy?.note || ''}
                        onChange={(e) => updateNote('axisEnergy', e.target.value)}
                    />
                </Section>

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
                    {t('map_v2_save')}
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
