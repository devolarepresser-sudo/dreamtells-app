import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { motion } from 'framer-motion';
import { Mic, Send, Loader } from 'lucide-react';
import { FREE_DEV_MODE } from '../config/featureFlags';

import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

// Declaração Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const STOP_TIMEOUT_MS = 10000;

const RecordDream: React.FC = () => {
    // Refs para persistência (não quebra no re-render)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Mantendo SpeechRecognition (Web)
    const recognitionRef = useRef<any>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Controle interno para loading (evita travamento de botão)
    const [isLoadingRecording, setIsLoadingRecording] = useState(false);

    const { addDream, user, language, t } = useApp();
    const navigate = useNavigate();

    // ✅ Buffers para NATIVE (Android/iOS)
    const finalAccumRef = useRef('');     // texto “confirmado” acumulado
    const partialRef = useRef('');        // preview do que está falando agora
    const acceptingRef = useRef(false);   // bloqueia eventos atrasados após stop
    const shouldRecordRef = useRef(false); // Mantém a intenção de gravação (para auto-restart)

    // Anti duplo click/tap
    const lastTapRef = useRef(0);

    // Map simple language code to full locale for SpeechRecognition
    const getSpeechLocale = (lang: string) => {
        switch (lang) {
            case 'en': return 'en-US';
            case 'es': return 'es-ES';
            case 'fr': return 'fr-FR';
            case 'it': return 'it-IT';
            case 'de': return 'de-DE';
            case 'pt':
            default: return 'pt-BR';
        }
    };

    const normalize = (s: string) => (s || '').replace(/\s+/g, ' ').trim();

    const updateTextareaFromBuffers = () => {
        const full = normalize(`${finalAccumRef.current} ${partialRef.current}`);
        setTranscript(full);
    };

    const safeStopNativeSpeech = async () => {
        try {
            await Promise.race([
                SpeechRecognition.stop(),
                new Promise((resolve) => setTimeout(resolve, STOP_TIMEOUT_MS)),
            ]);
        } catch (e) {
            console.warn('[RecordDream] SpeechRecognition.stop erro:', e);
        }
    };

    // Inicializar SpeechRecognition (Setup)
    useEffect(() => {
        const isNative = Capacitor.isNativePlatform();

        // --- NATIVE (Android/iOS) ---
        if (isNative) {
            (async () => {
                try { await SpeechRecognition.removeAllListeners(); } catch { }

                // ✅ Preview (tempo real)
                SpeechRecognition.addListener("partialResults", (data) => {
                    if (!acceptingRef.current) return;

                    const text = data.matches?.[0] ?? "";
                    if (!text) return;

                    // NÃO sobrescreve o finalAccum: só preview
                    partialRef.current = text;
                    updateTextareaFromBuffers();
                });

                // ✅ Resultado final (mais estável que partial)
                SpeechRecognition.addListener("partialResults", (data) => {
                    if (!acceptingRef.current) return;

                    const text = data.matches?.[0] ?? "";
                    if (!text) return;

                    const fa = normalize(finalAccumRef.current);

                    // Regra robusta:
                    // - se o texto novo já contém o acumulado, ele provavelmente é mais completo -> substitui finalAccum
                    // - senão, concatena
                    if (!fa) {
                        finalAccumRef.current = text;
                    } else if (text.includes(fa)) {
                        finalAccumRef.current = text;
                    } else if (!fa.endsWith(text)) {
                        finalAccumRef.current = normalize(`${fa} ${text}`);
                    }

                    partialRef.current = '';
                    updateTextareaFromBuffers();
                });
                // ✅ Auto-restart quando para por silêncio (NATIVO)
                SpeechRecognition.addListener("listeningState", (data) => {
                    if (data.status === "stopped" && shouldRecordRef.current) {
                        console.log('[RecordDream] Native silence detected, restarting...');
                        SpeechRecognition.start({
                            language: getSpeechLocale(language),
                            maxResults: 5,
                            partialResults: true,
                            popup: false,
                        }).catch(e => console.warn('[RecordDream] Auto-restart error:', e));
                    }
                });
            })();

            return () => {
                acceptingRef.current = false;
            };
        }

        // --- WEB (Browser) ---
        const SpeechRecognitionWeb = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionWeb) {
            console.warn('SpeechRecognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognitionWeb();
        recognition.lang = getSpeechLocale(language);
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                const r = event.results[i];
                if (r.isFinal) finalTranscript += r[0].transcript + ' ';
            }
            if (finalTranscript) {
                setTranscript((prev) => normalize(`${prev} ${finalTranscript}`));
            }
        };

        recognition.onerror = (event: any) => {
            console.warn('SpeechRecognition error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setIsRecording(false);
                setIsLoadingRecording(false);
            }
        };

        recognition.onend = () => {
            if (shouldRecordRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    console.warn('SpeechRecognition auto-restart failed:', e);
                }
            } else {
                setIsRecording(false);
                setIsLoadingRecording(false);
            }
        };

        recognitionRef.current = recognition;
    }, [language]);

    // ✅ Ajusta altura do textarea automaticamente
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [transcript]);

    // Lógica de Gravação
    const startRecording = async () => {
        setIsLoadingRecording(true);
        try {
            const isNative = Capacitor.isNativePlatform();

            finalAccumRef.current = '';
            partialRef.current = '';
            acceptingRef.current = true;
            shouldRecordRef.current = true;
            setTranscript('');

            // ✅ 1) Áudio (MediaRecorder) - SOMENTE WEB
            if (!isNative) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    streamRef.current = stream;
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorderRef.current = mediaRecorder;
                    chunksRef.current = [];
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) chunksRef.current.push(e.data);
                    };
                    mediaRecorder.start();
                } catch (audioErr) {
                    console.warn('MediaRecorder falhou, mas seguindo com transcrição:', audioErr);
                }
            }

            // ✅ 2) Transcrição
            if (isNative) {
                const perm = await SpeechRecognition.requestPermissions();
                if (perm.speechRecognition !== 'granted') {
                    alert(t('record_error_permission'));
                    setIsLoadingRecording(false);
                    acceptingRef.current = false;
                    return;
                }

                // ✅ IMPORTANTE: capture erro do start (pra não falhar “mudo”)
                try {
                    await SpeechRecognition.start({
                        language: getSpeechLocale(language),
                        maxResults: 5,
                        prompt: 'Fale seu sonho...',
                        partialResults: true,
                        popup: false,
                    });
                } catch (e) {
                    console.warn('[RecordDream] SpeechRecognition.start erro:', e);
                    alert(t('record_error_start'));
                    acceptingRef.current = false;
                    setIsLoadingRecording(false);
                    return;
                }
            } else {
                if (recognitionRef.current) {
                    try { recognitionRef.current.start(); } catch (e) {
                        console.warn('SpeechRecognition start error:', e);
                    }
                }
            }

            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
            alert(t('record_error_generic'));
            setIsRecording(false);
            acceptingRef.current = false;
        } finally {
            setIsLoadingRecording(false);
        }
    };


    const stopRecording = async () => {
        setIsLoadingRecording(true);

        // ✅ trava updates atrasados e “congela” o texto completo
        acceptingRef.current = false;
        shouldRecordRef.current = false;
        const frozen = normalize(`${finalAccumRef.current} ${partialRef.current}`) || normalize(transcript);
        setTranscript(frozen);

        // ✅ UI PARA AGORA (não espera plugin)
        setIsRecording(false);

        try {
            const isNative = Capacitor.isNativePlatform();

            // Stop Audio
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }

            // Stop Transcription
            if (isNative) {
                // ✅ não deixa o stop travar o app
                safeStopNativeSpeech();
            } else {
                if (recognitionRef.current) {
                    try {
                        recognitionRef.current.stop();
                    } catch (e) {
                        console.warn('SpeechRecognition stop error:', e);
                    }
                }
            }
        } catch (err) {
            console.error('Error stopping recording:', err);
        } finally {
            setIsLoadingRecording(false);
        }
    };

    const handleToggleRecording = async () => {
        const now = Date.now();
        if (now - lastTapRef.current < 350) return; // anti duplo-toque
        lastTapRef.current = now;

        if (isLoadingRecording) return;

        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    };

    const handleAnalyze = async () => {
        // ✅ manda pra IA o texto mais completo possível
        const textToAnalyze = normalize(`${finalAccumRef.current} ${partialRef.current}`) || normalize(transcript);
        if (!textToAnalyze) return;

        if (!user && !FREE_DEV_MODE) {
            navigate('/login');
            return;
        }

        if (!aiService || typeof aiService.analyzeDream !== 'function') {
            alert(t('error_internal_ai'));
            return;
        }

        setIsAnalyzing(true);

        try {
            const userId = user?.id || 'dev-guest';

            // 1) IA SEMPRE roda primeiro - Passando o idioma atual
            const result = await aiService.analyzeDream(textToAnalyze, userId, language);

            // 2) Tenta salvar no Firestore — mas não deixa erro travar a navegação
            let id = 'temp-audio-' + Date.now();
            try {
                // @ts-ignore - Garantia runtime
                if (addDream) {
                    // Timeout de 2 segundos para o save
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Save Timeout')), 12000)
                    );

                    // Race: Salvar vs Timeout
                    id = await Promise.race([
                        addDream(textToAnalyze, result, 'audio'),
                        timeoutPromise
                    ]) as string;
                }
            } catch (saveErr) {
                console.warn(
                    '[RecordDream] Salvar sonho demorou demais ou falhou (Offline), seguindo para resultado:',
                    saveErr
                );
                // Se der timeout, seguimos com o ID temporário gerado acima
            }

            // 3) SEMPRE navega para interpretação — com interpretação completa
            console.log('[RecordDream] Navegando para interpretação:', id);
            navigate('/interpretation', {
                state: { dreamId: id, dream: { id, text: textToAnalyze, ...result } }
            });
        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Erro ao interpretar: ${msg}`);

        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Layout
            title={
                <span dangerouslySetInnerHTML={{ __html: t('record_page_title') }} />
            }
            multiline
            showBack
            icon={<Mic size={18} color="#F9FAFB" />}
        >
            <div
                style={{
                    minHeight: '100vh',
                    background: 'transparent',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: '100%',
                        background: 'linear-gradient(145deg,#0B1026,#111827)',
                        padding: 20,
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
                        {t('record_recording_title')}
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
                        {t('record_instructions')}
                    </p>

                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={
                            isRecording
                                ? t('record_placeholder_recording')
                                : t('record_placeholder_waiting')
                        }
                        ref={textareaRef}
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
                            overflow: 'hidden',
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
                                type="button"
                                onClick={handleToggleRecording}
                                disabled={isLoadingRecording}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    background: isRecording
                                        ? 'linear-gradient(135deg,#F87171,#DC2626)'
                                        : 'linear-gradient(135deg,#5A3EF2,#46E4E1)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: isLoadingRecording ? 'wait' : 'pointer',
                                    transition: '0.15s ease-in-out',
                                    boxShadow: isRecording
                                        ? '0 12px 32px rgba(220,38,38,0.45)'
                                        : '0 12px 32px rgba(90,62,242,0.45)',
                                    touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                                aria-pressed={isRecording}
                                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
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
                        {isRecording ? t('record_status_recording') : t('record_status_start')}
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
                            opacity: isAnalyzing || !transcript.trim() || isRecording ? 0.78 : 1,
                            cursor:
                                isAnalyzing || !transcript.trim() || isRecording ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isAnalyzing ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Loader size={20} />
                                </motion.div>
                                {t('record_analyzing_button')}
                            </>
                        ) : (
                            <>
                                {t('record_analyze_button')}
                                <Send size={20} />
                            </>
                        )}
                    </button>

                    {isAnalyzing && (
                        <div
                            style={{
                                marginTop: 14,
                                padding: '10px 14px',
                                borderRadius: 16,
                                background: 'rgba(30,41,59,0.7)',
                                border: '1px solid rgba(148,163,184,0.55)',
                                color: '#E2E8F0',
                                fontSize: '0.82rem',
                                lineHeight: 1.5,
                                boxShadow: '0 10px 26px rgba(15,23,42,0.85)',
                                backdropFilter: 'blur(6px)',
                            }}
                        >
                            {t('record_analyzing_card')}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default RecordDream;
