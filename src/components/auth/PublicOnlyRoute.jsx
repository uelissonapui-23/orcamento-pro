import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { authenticated, loading } = useAuth();

  if (loading) return <div className="full-state"><div className="spinner" /></div>;
  if (authenticated) return <Navigate to="/" replace />;

  return children;
}
