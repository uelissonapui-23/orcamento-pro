import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

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
      await updatePassword(form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Criar nova senha" description="Escolha uma senha nova para sua conta.">
      <form className="auth-form" onSubmit={submit}>
        {error ? <div className="form-alert error">{error}</div> : null}

        <label>
          <span>Nova senha</span>
          <input type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} />
        </label>

        <label>
          <span>Confirmar nova senha</span>
          <input type="password" autoComplete="new-password" minLength={8} required value={form.confirm} onChange={(e) => setForm((c) => ({ ...c, confirm: e.target.value }))} />
        </label>

        <button className="primary-button full" disabled={busy} type="submit">
          {busy ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </AuthLayout>
  );
}
