import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

const { url, key } = getSupabaseEnv();

export const isSupabaseConfigured = Boolean(url && key);

export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;
