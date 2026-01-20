import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Menu as MenuIcon, ChevronLeft } from "lucide-react";

interface LayoutProps {
    children: ReactNode;
    title?: string | ReactNode;
    showBack?: boolean; // mostra botão voltar à esquerda
    showMenu?: boolean; // mostra botão menu à direita
    icon?: ReactNode; // ícone na frente do título
    multiline?: boolean; // permitir múltiplas linhas no título
    className?: string; // ✅ permite className (corrige o erro do Menu.tsx)
}

const Layout = ({
    children,
    title = "DreamTells",
    showBack = false,
    showMenu = true,
    icon,
    multiline = false,
    className,
}: LayoutProps) => {
    const navigate = useNavigate();

    const handleBack = () => navigate(-1);
    const handleMenu = () => navigate("/menu");

    return (
        <div className={`container globalBackgroundPremium ${className ?? ""}`}>
            {/* HEADER PREMIUM FIXO */}
            <header
                className="headerPremium"
                style={{
                    position: "fixed",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "100%",
                    maxWidth: 480,
                    padding: multiline ? "0 12px 14px" : "16px 12px 14px",
                    // ✅ Suporte a Safe Area (Notch/Status Bar)
                    paddingTop: "max(16px, env(safe-area-inset-top))",
                    background: "transparent",
                    border: "none",
                    boxShadow: "none",
                    backdropFilter: "none",
                    height: "auto", // Deixa auto para crescer com o padding extra
                }}
            >
                <div
                    className="headerPremium-inner"
                    style={{
                        width: "100%",
                        borderRadius: 18, // ✅ Sempre redondo agora, pedido do usuário
                        padding: multiline ? "20px 20px 24px" : "26px 20px",
                        background:
                            "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.98))",
                        border: "1px solid rgba(148,163,184,0.8)",
                        boxShadow: "0 18px 46px rgba(15,23,42,0.95)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                    }}
                >
                    {/* ESQUERDA – VOLTAR (OPCIONAL) */}
                    <div
                        style={{
                            width: 40,
                            display: "flex",
                            justifyContent: "flex-start",
                        }}
                    >
                        {showBack ? (
                            <button
                                onClick={handleBack}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "999px",
                                    border: "1px solid rgba(191,219,254,0.9)",
                                    background:
                                        "radial-gradient(circle, rgba(59,130,246,0.45), rgba(15,23,42,0.96))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                }}
                                aria-label="Voltar"
                                type="button"
                            >
                                <ChevronLeft size={18} color="#E5E7EB" />
                            </button>
                        ) : null}
                    </div>

                    {/* CENTRO – ÍCONE + TÍTULO */}
                    <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                        <div className="headerTitlePremium">
                            {icon && (
                                <div className="headerIconTile">
                                    <div className="headerIconTile-inner">{icon}</div>
                                </div>
                            )}
                            <span
                                className="headerTitleText"
                                style={
                                    multiline
                                        ? {
                                            whiteSpace: "normal",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            textAlign: "center",
                                            lineHeight: 1.2,
                                            fontSize: "0.95rem",
                                        }
                                        : undefined
                                }
                            >
                                {title}
                            </span>
                        </div>
                    </div>

                    {/* DIREITA – MENU (OPCIONAL) */}
                    <div
                        style={{
                            width: 40,
                            display: "flex",
                            justifyContent: "flex-end",
                        }}
                    >
                        {showMenu ? (
                            <button
                                onClick={handleMenu}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "999px",
                                    border: "1px solid rgba(191,219,254,0.9)",
                                    background:
                                        "radial-gradient(circle, rgba(59,130,246,0.45), rgba(15,23,42,0.96))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                }}
                                aria-label="Menu"
                                type="button"
                            >
                                <MenuIcon size={18} color="#E5E7EB" />
                            </button>
                        ) : null}
                    </div>
                </div>
            </header>

            {/* CONTEÚDO DAS PÁGINAS – espaço pro header fixo */}
            <main
                className="page-content"
                style={{
                    // ✅ Empurra o conteúdo para baixo considerando o notch + altura do header
                    paddingTop: `calc(${multiline ? 136 : 126}px + env(safe-area-inset-top))`,
                }}
            >
                {children}
            </main>
        </div>
    );
};

export default Layout;
