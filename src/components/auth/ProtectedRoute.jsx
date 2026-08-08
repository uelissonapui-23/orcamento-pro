import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { authenticated, configured, foundationError, loading, workspace } = useAuth();

  if (!configured) {
    return (
      <div className="full-state">
        <div className="state-card">
          <strong>Supabase ainda não configurado</strong>
          <p>Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="full-state">
        <div className="state-card">
          <div className="spinner" />
          <strong>Preparando seu espaço...</strong>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/entrar" state={{ from: location.pathname }} replace />;
  }

  if (foundationError || !workspace) {
    return (
      <div className="full-state">
        <div className="state-card error">
          <strong>Não foi possível preparar seu espaço</strong>
          <p>{foundationError || "Nenhum workspace ativo foi encontrado para esta conta."}</p>
        </div>
      </div>
    );
  }

  return children;
}
