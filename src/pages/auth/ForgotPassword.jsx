import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await requestPasswordReset(email);
      setMessage("Se existir uma conta com esse e-mail, enviaremos as instruções de redefinição.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar senha"
      description="Informe seu e-mail para receber o link de redefinição."
      footer={<Link to="/entrar">Voltar para entrar</Link>}
    >
      <form className="auth-form" onSubmit={submit}>
        {error ? <div className="form-alert error">{error}</div> : null}
        {message ? <div className="form-alert success">{message}</div> : null}

        <label>
          <span>E-mail</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <button className="primary-button full" disabled={busy} type="submit">
          {busy ? "Enviando..." : "Enviar link"}
        </button>
      </form>
    </AuthLayout>
  );
}
