import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await signIn(form);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Entrar"
      description="Acesse seus orçamentos e serviços."
      footer={<>Ainda não tem conta? <Link to="/criar-conta">Criar conta</Link></>}
    >
      <form className="auth-form" onSubmit={submit}>
        {error ? <div className="form-alert error">{error}</div> : null}

        <label>
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
          />
        </label>

        <label>
          <span>Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
          />
        </label>

        <div className="auth-form-row">
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
        </div>

        <button className="primary-button full" disabled={busy} type="submit">
          {busy ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </AuthLayout>
  );
}
