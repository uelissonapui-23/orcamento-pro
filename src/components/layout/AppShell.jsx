import { CheckCircle2, ClipboardList, Database, FileText, Home, LogOut, Search, Settings, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import GlobalSearchDialog from "../search/GlobalSearchDialog";
import { useAuth } from "../../contexts/AuthContext";

const main = [
  ["/", "Início", Home],
  ["/orcamentos", "Orçamentos", FileText],
  ["/a-fazer", "A Fazer", ClipboardList],
  ["/entregues", "Entregues", CheckCircle2],
];

const secondary = [
  ["/cadastros/clientes", "Cadastros", Database],
  ["/configuracoes", "Configurações", Settings],
];

function LinkItem({ item, mobile = false }) {
  const [to, label, Icon] = item;

  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => `${mobile ? "bottom-link" : "side-link"} ${isActive ? "active" : ""}`}
    >
      <Icon size={mobile ? 21 : 19} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppShell() {
  const { signOut, user, workspace } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const userName = user?.user_metadata?.full_name || user?.email || "Usuário";

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">O</div>
          <div className="brand-copy">
            <strong>Orçamento App</strong>
            <small title={workspace?.name}>{workspace?.name || "Seu negócio"}</small>
          </div>
        </div>

        <nav>{main.map((item) => <LinkItem key={item[0]} item={item} />)}</nav>
        <div className="side-separator" />
        <nav>{secondary.map((item) => <LinkItem key={item[0]} item={item} />)}</nav>

        <div className="sidebar-account">
          <NavLink className="account-link" to="/perfil">
            <span className="avatar"><UserRound size={17} /></span>
            <span className="account-copy"><strong title={userName}>{userName}</strong><small>Perfil</small></span>
          </NavLink>
          <button className="logout-button" type="button" onClick={() => signOut()} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-mark small">O</div>
            <div className="mobile-brand-copy">
              <strong>Orçamento App</strong>
              <small>{workspace?.name}</small>
            </div>
          </div>

          <button className="topbar-global-search" type="button" onClick={() => setSearchOpen(true)}>
            <Search size={17} />
            <span>Buscar no app</span>
            <kbd>Ctrl K</kbd>
          </button>

          <NavLink className="mobile-profile" to="/perfil" aria-label="Perfil">
            <UserRound size={20} />
          </NavLink>
        </header>

        <main className="content"><Outlet /></main>
      </div>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {main.map((item) => <LinkItem key={item[0]} item={item} mobile />)}
      </nav>

      <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
