import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, ChevronLeft } from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
    title?: string;
    showBack?: boolean;   // mostra botão voltar à esquerda
    showMenu?: boolean;   // mostra botão menu à direita
    icon?: ReactNode;     // ícone na frente do título
}

const Layout: React.FC<LayoutProps> = ({
    children,
    title = 'DreamTells',
    showBack = false,
    showMenu = true,
    icon,
}) => {
    const navigate = useNavigate();

    const handleBack = () => navigate(-1);
    const handleMenu = () => navigate('/menu');

    return (
        // removido paddingTop exagerado que criava um buraco
        <div className="container">
            {/* HEADER PREMIUM FIXO */}
            <header
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: 480,
                    padding: '12px 12px 14px',
                    zIndex: 40,
                }}
            >
                <div
                    style={{
                        width: '100%',
                        borderRadius: 999,
                        padding: '14px 20px', // mais alto e proporcional
                        background:
                            'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.98))',
                        border: '1px solid rgba(148,163,184,0.8)',
                        boxShadow: '0 18px 46px rgba(15,23,42,0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                    }}
                >
                    {/* ESQUERDA – VOLTAR (OPCIONAL) */}
                    <div
                        style={{
                            width: 40,
                            display: 'flex',
                            justifyContent: 'flex-start',
                        }}
                    >
                        {showBack ? (
                            <button
                                onClick={handleBack}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '999px',
                                    border: '1px solid rgba(191,219,254,0.9)',
                                    background:
                                        'radial-gradient(circle, rgba(59,130,246,0.45), rgba(15,23,42,0.96))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <ChevronLeft size={18} color="#E5E7EB" />
                            </button>
                        ) : null}
                    </div>

                    {/* CENTRO – ÍCONE + TÍTULO */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            minWidth: 0,
                        }}
                    >
                        {icon && (
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {icon}
                            </span>
                        )}
                        <h1
                            style={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                color: '#F9FAFB',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                letterSpacing: '-0.03em',
                            }}
                        >
                            {title}
                        </h1>
                    </div>

                    {/* DIREITA – MENU (OPCIONAL) */}
                    <div
                        style={{
                            width: 40,
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}
                    >
                        {showMenu ? (
                            <button
                                onClick={handleMenu}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '999px',
                                    border: '1px solid rgba(191,219,254,0.9)',
                                    background:
                                        'radial-gradient(circle, rgba(59,130,246,0.45), rgba(15,23,42,0.96))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <MenuIcon size={18} color="#E5E7EB" />
                            </button>
                        ) : null}
                    </div>
                </div>
            </header>

            {/* CONTEÚDO DAS PÁGINAS – espaço exato pro header fixo */}
            <main
                className="page-content"
                style={{
                    paddingTop: 96, // suficiente pra não esconder conteúdo, com gap bem menor
                }}
            >
                {children}
            </main>
        </div>
    );
};

export default Layout;
