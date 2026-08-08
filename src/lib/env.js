export function getSupabaseEnv() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
  };
}
