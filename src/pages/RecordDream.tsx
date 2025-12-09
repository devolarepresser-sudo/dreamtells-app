import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { motion } from 'framer-motion';
import { Mic, Send, Loader } from 'lucide-react';
import { FREE_DEV_MODE } from '../config/featureFlags';

// Declaração Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const RecordDream: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(true);
    const [isStopping, setIsStopping] = useState(false);

    const recognitionRef = useRef<any>(null);
    const { addDream, user } = useApp();
    const navigate = useNavigate();

    // Inicializar SpeechRecognition (uma vez só)
    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSpeechSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsRecording(true);
            setIsStopping(false);
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                const r = event.results[i];
                if (r.isFinal) finalTranscript += r[0].transcript + ' ';
            }
            if (finalTranscript) {
                setTranscript((prev) => prev + finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('SpeechRecognition error:', event.error);
            setIsRecording(false);
            setIsStopping(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
            setIsStopping(false);
        };

        recognitionRef.current = recognition;

        return () => {
            try {
                recognition.stop();
            } catch (e) {
                console.error(e);
            }
            setIsRecording(false);
            setIsStopping(false);
        };
    }, []);

    // INICIAR GRAVAÇÃO
    const startRecording = () => {
        if (!isSpeechSupported) {
            alert('Seu navegador não suporta reconhecimento de voz.');
            return;
        }

        if (!recognitionRef.current) {
            alert('Reconhecimento de voz não pôde ser inicializado.');
            return;
        }

        if (isRecording || isStopping) {
            return;
        }

        setTranscript('');
        setIsStopping(false);

        try {
            recognitionRef.current.start();
            // feedback visual imediato
            setIsRecording(true);
        } catch (err: any) {
            console.error('Erro ao iniciar gravação:', err);
            setIsRecording(false);
            setIsStopping(false);
        }
    };

    // PARAR GRAVAÇÃO
    const stopRecording = () => {
        if (!recognitionRef.current) return;
        if (!isRecording && !isStopping) return;

        setIsStopping(true);
        setIsRecording(false);

        try {
            recognitionRef.current.stop();
        } catch (err: any) {
            console.error('Erro ao parar gravação:', err);
            setIsRecording(false);
            setIsStopping(false);
        }
    };

    const handleToggle = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    // ENVIAR PARA ANÁLISE (igual lógica da WriteDream, mas com áudio)
    const handleAnalyze = async () => {
        if (!transcript.trim()) return;

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
            const result = await aiService.analyzeDream(transcript, userId);

            // Salvamento (tipo = 'audio')
            const id = await addDream(transcript, result, 'audio');

            // Mesmo comportamento da WriteDream: navegação SPA
            navigate('/interpretation', { state: { dreamId: id } });
        } catch (err) {
            console.error(err);
            alert('Erro ao interpretar o sonho. Tente novamente.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Layout title="Gravar Sonho" showBack>
            <div
                style={{
                    minHeight: '100vh',
                    padding: '18px 16px 32px',
                    background:
                        'radial-gradient(circle at top, #1E293B 0%, #0B1120 40%, #020617 100%)',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        background: 'linear-gradient(145deg,#0B1026,#111827)',
                        padding: 24,
                        borderRadius: 24,
                        border: '1px solid rgba(148,163,184,0.35)',
                        boxShadow: '0 22px 60px rgba(15,23,42,0.9)',
                    }}
                >
                    <h2
                        style={{
                            color: '#F9FAFB',
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            marginBottom: 12,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        Gravando sonho
                    </h2>

                    <p
                        style={{
                            textAlign: 'left',
                            fontSize: '0.96rem',
                            color: 'rgba(226,232,240,0.82)',
                            marginBottom: 16,
                            lineHeight: 1.6,
                        }}
                    >
                        Toque no botão, descreva seu sonho com naturalidade e depois
                        envie para interpretação.
                    </p>

                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={
                            isRecording
                                ? 'Falando... transcrição em tempo real...'
                                : 'O texto será preenchido automaticamente conforme você fala.'
                        }
                        style={{
                            width: '100%',
                            minHeight: 200,
                            borderRadius: 18,
                            padding: 16,
                            border: '1px solid rgba(148,163,184,0.7)',
                            background: 'radial-gradient(circle at top,#0F172A,#0B1120)',
                            color: '#E5E7EB',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            resize: 'none',
                            outline: 'none',
                            boxShadow: 'inset 0 2px 8px rgba(15,23,42,0.85)',
                        }}
                    />

                    {/* BOTÃO DE GRAVAÇÃO — CENTRALIZADO */}
                    <div
                        style={{
                            marginTop: 30,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <motion.div
                            animate={isRecording ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                            transition={{
                                repeat: isRecording ? Infinity : 0,
                                duration: 1.2,
                            }}
                        >
                            <button
                                onClick={handleToggle}
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: '50%',
                                    background: isRecording
                                        ? 'linear-gradient(135deg,#F87171,#DC2626)'
                                        : 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: '0.15s ease-in-out',
                                    boxShadow: isRecording
                                        ? '0 12px 32px rgba(220,38,38,0.45)'
                                        : '0 12px 32px rgba(90,62,242,0.45)',
                                }}
                            >
                                <Mic size={44} color="#FFF" />
                            </button>
                        </motion.div>
                    </div>

                    {/* TEXTO DE STATUS */}
                    <p
                        style={{
                            marginTop: 12,
                            textAlign: 'center',
                            color: isRecording ? '#F87171' : 'rgba(226,232,240,0.9)',
                            fontSize: '1rem',
                        }}
                    >
                        {isRecording
                            ? 'Gravando... toque para parar'
                            : 'Toque para iniciar gravação'}
                    </p>

                    {/* BOTÃO ENVIAR */}
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !transcript.trim() || isRecording}
                        style={{
                            marginTop: 26,
                            width: '100%',
                            padding: '14px 18px',
                            borderRadius: 999,
                            background:
                                isAnalyzing || !transcript.trim() || isRecording
                                    ? 'linear-gradient(135deg,#4B5563,#6B7280)'
                                    : 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                            border: '1px solid rgba(191,219,254,0.9)',
                            fontWeight: 700,
                            color: '#F9FAFB',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            boxShadow: '0 18px 42px rgba(90,62,242,0.7)',
                            opacity:
                                isAnalyzing || !transcript.trim() || isRecording ? 0.78 : 1,
                            cursor:
                                isAnalyzing || !transcript.trim() || isRecording
                                    ? 'not-allowed'
                                    : 'pointer',
                        }}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader size={20} className="animate-spin" />
                                Interpretando seu sonho de áudio...
                            </>
                        ) : (
                            <>
                                Enviar para Interpretação
                                <Send size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default RecordDream;
