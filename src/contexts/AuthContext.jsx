import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const AuthContext = createContext(null);

function normalizeError(error) {
  if (!error) return "Erro inesperado.";
  const message = String(error.message || error);

  if (/invalid login credentials/i.test(message)) return "E-mail ou senha inválidos.";
  if (/email not confirmed/i.test(message)) return "Confirme seu e-mail antes de entrar.";
  if (/user already registered/i.test(message)) return "Já existe uma conta com este e-mail.";
  if (/password should be at least/i.test(message)) return "A senha deve ter pelo menos 8 caracteres.";
  if (/rate limit/i.test(message)) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

  return message;
}

async function ensureFoundation() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .schema("orcamento_app")
    .rpc("ensure_user_foundation");

  if (error) throw error;
  return Array.isArray(data) ? data[0] ?? null : data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [foundationLoading, setFoundationLoading] = useState(true);
  const [foundationError, setFoundationError] = useState("");

  const hydrate = useCallback(async (nextSession) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setFoundationError("");

    if (!nextSession?.user || !supabase) {
      setWorkspace(null);
      setFoundationLoading(false);
      return;
    }

    setFoundationLoading(true);

    try {
      const result = await ensureFoundation();
      setWorkspace(
        result
          ? {
              id: result.workspace_id,
              name: result.workspace_name,
              role: result.member_role,
            }
          : null,
      );
    } catch (error) {
      setWorkspace(null);
      setFoundationError(normalizeError(error));
    } finally {
      setFoundationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setFoundationLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) hydrate(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      window.setTimeout(() => {
        if (active) hydrate(nextSession);
      }, 0);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [hydrate]);

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) throw new Error("Supabase ainda não foi configurado.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw new Error(normalizeError(error));
    return data;
  }, []);

  const signUp = useCallback(async ({ fullName, email, password }) => {
    if (!supabase) throw new Error("Supabase ainda não foi configurado.");

    const emailRedirectTo = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) throw new Error(normalizeError(error));
    return data;
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    if (!supabase) throw new Error("Supabase ainda não foi configurado.");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/redefinir-senha` },
    );

    if (error) throw new Error(normalizeError(error));
  }, []);

  const updatePassword = useCallback(async (password) => {
    if (!supabase) throw new Error("Supabase ainda não foi configurado.");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(normalizeError(error));
  }, []);

  const updateProfile = useCallback(async ({ fullName }) => {
    if (!supabase || !user) throw new Error("Sessão inválida.");

    const trimmedName = fullName.trim();
    if (!trimmedName) throw new Error("Informe seu nome.");

    const { error: profileError } = await supabase
      .schema("orcamento_app")
      .from("profiles")
      .update({ full_name: trimmedName })
      .eq("id", user.id);

    if (profileError) throw new Error(normalizeError(profileError));

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });

    if (authError) throw new Error(normalizeError(authError));

    setUser((current) =>
      current
        ? { ...current, user_metadata: { ...current.user_metadata, full_name: trimmedName } }
        : current,
    );
  }, [user]);

  const renameWorkspace = useCallback(async (name) => {
    if (!supabase || !workspace?.id) throw new Error("Workspace não encontrado.");

    const cleanName = name.trim();
    if (!cleanName) throw new Error("Informe o nome do negócio.");

    const { error } = await supabase
      .schema("orcamento_app")
      .from("workspaces")
      .update({ name: cleanName })
      .eq("id", workspace.id);

    if (error) throw new Error(normalizeError(error));

    setWorkspace((current) => (current ? { ...current, name: cleanName } : current));
  }, [workspace]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setFoundationError("");
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(normalizeError(error));
  }, []);

  const refreshFoundation = useCallback(async () => {
    if (!session?.user) return;
    await hydrate(session);
  }, [hydrate, session]);

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      session,
      user,
      workspace,
      loading: foundationLoading,
      foundationError,
      authenticated: Boolean(session?.user),
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      updateProfile,
      renameWorkspace,
      refreshFoundation,
    }),
    [
      session,
      user,
      workspace,
      foundationLoading,
      foundationError,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      updateProfile,
      renameWorkspace,
      refreshFoundation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return value;
}
