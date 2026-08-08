import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";

export default function SignUp() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setBusy(true);

    try {
      const data = await signUp(form);
      if (data.session) {
        setSuccess("Conta criada. Seu espaço está sendo preparado.");
      } else {
        setSuccess("Conta criada. Confira seu e-mail para confirmar o cadastro.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Criar conta"
      description="Seu primeiro espaço de trabalho será criado automaticamente."
      footer={<>Já tem conta? <Link to="/entrar">Entrar</Link></>}
    >
      <form className="auth-form" onSubmit={submit}>
        {error ? <div className="form-alert error">{error}</div> : null}
        {success ? <div className="form-alert success">{success}</div> : null}

        <label>
          <span>Seu nome</span>
          <input
            autoComplete="name"
            required
            value={form.fullName}
            onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
          />
        </label>

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
            autoComplete="new-password"
            minLength={8}
            required
            value={form.password}
            onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
          />
          <small>Mínimo de 8 caracteres.</small>
        </label>

        <label>
          <span>Confirmar senha</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={form.confirm}
            onChange={(e) => setForm((current) => ({ ...current, confirm: e.target.value }))}
          />
        </label>

        <button className="primary-button full" disabled={busy || Boolean(success)} type="submit">
          {busy ? "Criando..." : "Criar conta"}
        </button>
      </form>
    </AuthLayout>
  );
}
