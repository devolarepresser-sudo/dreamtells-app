import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useApp } from "../context/AppContext";
import {
    Home,
    Mic,
    BookOpen,
    User,
    Info,
    Activity,
    Book,
    Crown,
    Lock,
    Sparkles,
    LogOut,
    Sun,
    Compass,
    GraduationCap,
    Library,
    LayoutGrid
} from "lucide-react";
import { motion } from "framer-motion";

type MenuItem = {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    path: string;
    tileClass: string;
    isPremiumTile?: boolean; // ✅ substitui premium
};

const Menu = () => {
    const { logout, user, t, canUsePremium } = useApp();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const hasAccess = canUsePremium();

    const menuItems: MenuItem[] = [
        { icon: Home, label: t("menu_home"), path: "/home", tileClass: "menuIconTile-home" },
        { icon: Mic, label: t("action_record"), path: "/record", tileClass: "menuIconTile-audio" },
        {
            icon: Sparkles,
            label: t("menu_interpretation") || "Interpretação",
            path: "/interpretation",
            tileClass: "menuIconTile-interpretation",
        },
        { icon: Sun, label: t("menu_daily_message") || "Mensagem do Dia", path: "/daily-message", tileClass: "menuIconTile-daily" },
        { icon: BookOpen, label: t("action_history"), path: "/history", tileClass: "menuIconTile-write" },

        // Premium features (unlocked)
        { icon: Activity, label: t("menu_stats"), path: "/stats", tileClass: "menuIconTile-insights", isPremiumTile: true },
        { icon: Book, label: t("menu_symbols"), path: "/symbols", tileClass: "menuIconTile-symbols", isPremiumTile: true },
        { icon: Compass, label: t("map_title"), path: "/unconscious-map", tileClass: "menuIconTile-map", isPremiumTile: true },

        { icon: GraduationCap, label: t("menu_dictionary") || "Dicionário da Alma", path: "/dictionary", tileClass: "menuIconTile-dictionary" },
        { icon: Library, label: t("menu_knowledge") || "Guia de Uso", path: "/guia", tileClass: "menuIconTile-knowledge" },

        // Premium page (always visible)
        { icon: Crown, label: t("menu_premium"), path: "/premium", tileClass: "menuIconTile-premium", isPremiumTile: true },

        { icon: User, label: t("menu_profile"), path: "/profile", tileClass: "menuIconTile-profile" },
        { icon: Info, label: t("settings_about"), path: "/about", tileClass: "menuIconTile-about" },
    ];

    const handleItemClick = (e: React.MouseEvent, item: MenuItem) => {
        const isLocked = !!item.isPremiumTile && !hasAccess;
        if (isLocked) {
            e.preventDefault();
            navigate("/premium");
        }
    };

    return (
        <Layout
            title={t("menu_title")}
            showBack={true}
            showMenu={false}
            icon={<LayoutGrid size={18} className="icon-white" />}
        >
            {/* CSS local pra garantir contraste e cores sem depender do resto */}
            <style>
                {
                    `
          .menuIconTile{
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          /* Ícones */
          .menuIconDefault{
            color: #FFFFFF;
            stroke-width: 2;
          }

          /* Ícone em tile premium (dourado) precisa ser escuro pra aparecer */
          .menuIconPremium{
            color: #1F2937;
            stroke-width: 2.3;
          }

          .menuIconLock{
            color: #CBD5E0;
            opacity: 0.9;
            stroke-width: 2;
          }
        `}
            </style >

            <div
                style={{
                    width: "100%",
                    maxWidth: 480,
                    margin: "0 auto",
                    background: "transparent",
                }}
            >
                {/* LISTA DE ITENS DE MENU */}
                <div
                    style={{
                        width: "100%",
                        maxWidth: 480,
                        margin: "0 auto",
                    }}
                >
                    <div style={{ display: "grid", gap: "12px" }}>
                        {menuItems.map((item, index) => {
                            const isLocked = !!item.isPremiumTile && !hasAccess;
                            const isPremiumTile = !!item.isPremiumTile;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <Link
                                        to={isLocked ? "/premium" : item.path}
                                        className="menuButtonPremium"
                                        onClick={(e) => handleItemClick(e, item)}
                                        style={{
                                            textDecoration: "none",
                                            opacity: isLocked ? 0.85 : 1,
                                        }}
                                    >
                                        <div className={`menuIconTile ${item.tileClass}`} style={{ marginRight: 16 }}>
                                            {isLocked ? (
                                                <Lock size={20} className="menuIconLock" />
                                            ) : (
                                                <item.icon
                                                    size={20}
                                                    className={isPremiumTile ? "menuIconPremium" : "menuIconDefault"}
                                                />
                                            )}
                                        </div>

                                        <span className="menuButtonText" style={{ flex: 1 }}>
                                            {item.label}
                                        </span>

                                        {isLocked && <Crown size={14} color="#FACC15" style={{ marginLeft: 8 }} />}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* BOTÃO LOGOUT */}
                    {user && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            onClick={handleLogout}
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                marginTop: 32,
                                borderRadius: 18,
                                background: "linear-gradient(135deg,#FCA5A5,#EF4444)",
                                color: "#111827",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid rgba(254,202,202,0.95)",
                                cursor: "pointer",
                                boxShadow: "0 18px 40px rgba(248,113,113,0.5)",
                            }}
                            type="button"
                        >
                            <div className="menuIconTile menuIconTile-profile" style={{ marginRight: 12 }}>
                                <LogOut size={20} className="menuIconDefault" />
                            </div>
                            {t("menu_logout")}
                        </motion.button>
                    )}
                </div>
            </div>
        </Layout >
    );
};

export default Menu;
