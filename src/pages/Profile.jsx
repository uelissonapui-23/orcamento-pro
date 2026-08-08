import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const { user, workspace, updateProfile, renameWorkspace } = useAuth();
  const initialName = user?.user_metadata?.full_name || "";
  const [fullName, setFullName] = useState(initialName);
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => setFullName(initialName), [initialName]);
  useEffect(() => setWorkspaceName(workspace?.name || ""), [workspace?.name]);

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setBusy(true);

    try {
      await updateProfile({ fullName });
      if (workspaceName.trim() !== workspace?.name) {
        await renameWorkspace(workspaceName);
      }
      setStatus({ type: "success", message: "Perfil atualizado." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONTA</p>
          <h1>Perfil</h1>
          <p>Dados básicos da sua conta e do seu espaço de trabalho.</p>
        </div>
      </div>

      <form className="settings-card" onSubmit={submit}>
        {status.message ? <div className={`form-alert ${status.type}`}>{status.message}</div> : null}

        <div className="form-grid">
          <label>
            <span>Nome</span>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>

          <label>
            <span>E-mail</span>
            <input disabled value={user?.email || ""} />
          </label>

          <label className="full-span">
            <span>Nome do negócio / espaço</span>
            <input required value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
            <small>Esse nome poderá aparecer nas configurações e no cabeçalho do app.</small>
          </label>
        </div>

        <div className="form-actions">
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </section>
  );
}
