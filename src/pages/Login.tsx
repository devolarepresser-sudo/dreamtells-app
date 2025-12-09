import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader } from 'lucide-react';
import { authService } from '../services/authService';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    // Começam sempre vazios
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const [loading, setLoading] = useState(false);

    const { t, user } = useApp();
    const navigate = useNavigate();

    // Redirecionar automaticamente se o usuário já estiver logado (ou logar com sucesso)
    useEffect(() => {
        if (user) {
            navigate('/home');
        }
    }, [user, navigate]);

    // Garante que ao abrir a tela de login os campos estejam SEMPRE vazios
    useEffect(() => {
        if (!user) { // Só limpa se não estiver logado
            setEmail('');
            setPassword('');
            setName('');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                await authService.login(email.trim(), password.trim());
            } else {
                await authService.register(email.trim(), password.trim(), name.trim());
            }
            // Navegação tratada pelo useEffect acima
        } catch (error: any) {
            console.error(error);

            let msg = 'Erro ao autenticar.';
            if (error?.code === 'auth/invalid-credential')
                msg = 'Email ou senha incorretos.';
            else if (error?.code === 'auth/user-not-found')
                msg = 'Usuário não encontrado. Crie uma conta primeiro.';
            else if (error?.code === 'auth/wrong-password')
                msg = 'Senha incorreta.';
            else if (error?.code === 'auth/email-already-in-use')
                msg = 'Este email já está em uso.';
            else if (error?.code === 'auth/weak-password')
                msg = 'A senha deve ter pelo menos 6 caracteres.';
            else if (error?.code === 'auth/operation-not-allowed')
                msg = 'Login por email/senha não habilitado no Firebase.';
            else msg = `Erro: ${error?.message ?? 'desconhecido'}`;

            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    // Continua existindo, mas só preenche quando você clicar
    const fillDevCredentials = () => {
        setEmail('elepresser@gmail.com');
        setPassword('Desenpresser123');
        setName('Presser Dev');
    };

    // Botão de Google com login real
    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await authService.loginWithGoogle();
        } catch (error: any) {
            console.error('Login com Google falhou:', error);
            alert('Erro ao entrar com Google. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title={isLogin ? t('login_title') : t('create_account_title')}>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '24px 0',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        maxWidth: 420,
                        margin: '0 auto',
                        padding: '24px 20px 28px',
                        borderRadius: 24,
                        background:
                            'linear-gradient(135deg, rgba(15,23,42,0.90), rgba(30,64,175,0.85))',
                        border: '1px solid rgba(148,163,184,0.45)',
                        boxShadow: '0 18px 45px rgba(15,23,42,0.9)',
                        backdropFilter: 'blur(18px)',
                    }}
                >
                    {/* TÍTULO + SUBTÍTULO */}
                    <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <h2
                            className="title-lg"
                            style={{
                                marginBottom: 6,
                                fontSize: '1.4rem',
                                fontWeight: 700,
                                letterSpacing: '-0.03em',
                                color: '#ffffff', // texto branco
                            }}
                        >
                            {isLogin ? t('login_title') : t('create_account_title')}
                        </h2>
                        <p
                            className="text-body"
                            style={{
                                color: 'rgba(255,255,255,0.8)', // texto claro
                                fontSize: '0.9rem',
                            }}
                        >
                            {isLogin ? t('login_subtitle') : t('create_account_subtitle')}
                        </p>
                    </div>

                    {/* FORMULÁRIO */}
                    <form
                        onSubmit={handleSubmit}
                        autoComplete="off"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                        }}
                    >
                        {!isLogin && (
                            <div
                                className="input-group"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 12px',
                                    borderRadius: 999,
                                    background: 'rgba(15,23,42,0.9)',
                                    border: '1px solid rgba(148,163,184,0.55)',
                                    boxShadow: '0 10px 30px rgba(15,23,42,0.7)',
                                }}
                            >
                                <User size={18} color="rgba(148,163,184,0.9)" />
                                <input
                                    type="text"
                                    placeholder={t('name_placeholder')}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                    autoComplete="off"
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        color: '#ffffff',
                                        fontSize: '0.95rem',
                                        flex: 1,
                                    }}
                                />
                            </div>
                        )}

                        <div
                            className="input-group"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 999,
                                background: 'rgba(15,23,42,0.9)',
                                border: '1px solid rgba(148,163,184,0.55)',
                                boxShadow: '0 10px 30px rgba(15,23,42,0.7)',
                            }}
                        >
                            <Mail size={18} color="rgba(148,163,184,0.9)" />
                            <input
                                type="email"
                                placeholder={t('email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="off"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    color: '#ffffff',
                                    fontSize: '0.95rem',
                                    flex: 1,
                                }}
                            />
                        </div>

                        <div
                            className="input-group"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 999,
                                background: 'rgba(15,23,42,0.9)',
                                border: '1px solid rgba(148,163,184,0.55)',
                                boxShadow: '0 10px 30px rgba(15,23,42,0.7)',
                            }}
                        >
                            <Lock size={18} color="rgba(148,163,184,0.9)" />
                            <input
                                type="password"
                                placeholder={t('password_placeholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="off"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    color: '#ffffff',
                                    fontSize: '0.95rem',
                                    flex: 1,
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{
                                marginTop: 10,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 999,
                                padding: '12px 16px',
                                background:
                                    'linear-gradient(135deg, var(--color-primary), #4f46e5)',
                                border: 'none',
                                color: '#ffffff',
                                fontWeight: 600,
                                letterSpacing: '0.02em',
                                boxShadow: '0 14px 35px rgba(79,70,229,0.55)',
                                cursor: loading ? 'default' : 'pointer',
                                opacity: loading ? 0.8 : 1,
                            }}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader className="spin" size={20} />
                            ) : (
                                <>
                                    {isLogin ? t('login_button') : t('create_account_button')}
                                    <ArrowRight size={20} style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* BOTÃO LOGIN COM GOOGLE */}
                    <div style={{ marginTop: 12 }}>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                borderRadius: 999,
                                padding: '10px 14px',
                                marginTop: 6,
                                background: '#ffffff',
                                border: 'none',
                                color: '#111827',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                            }}
                        >
                            {/* Bolinha com G improvisado */}
                            <span
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    border: '1px solid #e5e7eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                }}
                            >
                                G
                            </span>
                            Entrar com Google
                        </button>
                    </div>

                    {/* AÇÕES AUXILIARES */}
                    <div style={{ marginTop: 14, textAlign: 'center' }}>
                        <button
                            onClick={fillDevCredentials}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.8)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                textDecoration: 'underline',
                                marginBottom: 6,
                            }}
                            type="button"
                        >
                            Usar credenciais de desenvolvedor
                        </button>
                    </div>

                    <div style={{ marginTop: 4, textAlign: 'center' }}>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                            }}
                            type="button"
                        >
                            {isLogin ? t('no_account_link') : t('have_account_link')}
                        </button>
                    </div>
                </motion.div>

                <style>{`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    /* Placeholders mais claros para fundo escuro */
                    .input-group input::placeholder {
                        color: rgba(255,255,255,0.7);
                    }
                `}</style>
            </div>
        </Layout>
    );
};

export default Login;
