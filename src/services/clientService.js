import { normalizeClient, onlyDigits } from "../lib/client";
import { supabase } from "../lib/supabase";

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

function normalizeSearchTerm(value) {
  return String(value || "").trim().replace(/[%_,()]/g, " ");
}

export async function listClients(workspaceId, { search = "", status = "active", limit = 100 } = {}) {
  const client = requireClient();
  let query = client
    .schema("orcamento_app")
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true })
    .limit(limit);

  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);

  const term = normalizeSearchTerm(search);

  if (term) {
    const digits = onlyDigits(term);
    const filters = [
      `name.ilike.%${term}%`,
      `trade_name.ilike.%${term}%`,
      `email.ilike.%${term}%`,
    ];

    if (digits) {
      filters.push(`normalized_document.ilike.%${digits}%`);
      filters.push(`normalized_phone.ilike.%${digits}%`);
      filters.push(`normalized_whatsapp.ilike.%${digits}%`);
    }

    query = query.or(filters.join(","));
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(normalizeClient);
}

export async function getClient(clientId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error) throw error;
  return normalizeClient(data);
}

export async function createClient(workspaceId, values) {
  const client = requireClient();
  const payload = normalizeClient(values);

  const { data, error } = await client
    .schema("orcamento_app")
    .from("clients")
    .insert({
      workspace_id: workspaceId,
      ...payload,
    })
    .select("*")
    .single();

  if (error) throw error;
  return normalizeClient(data);
}

export async function updateClient(clientId, values) {
  const client = requireClient();
  const payload = normalizeClient(values);

  const { data, error } = await client
    .schema("orcamento_app")
    .from("clients")
    .update(payload)
    .eq("id", clientId)
    .select("*")
    .single();

  if (error) throw error;
  return normalizeClient(data);
}

export async function setClientActive(clientId, active) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("clients")
    .update({ active: Boolean(active) })
    .eq("id", clientId)
    .select("*")
    .single();

  if (error) throw error;
  return normalizeClient(data);
}

export async function findLikelyDuplicates(workspaceId, values, ignoreClientId = null) {
  const client = requireClient();
  const normalized = normalizeClient(values);
  const document = onlyDigits(normalized.document);
  const whatsapp = onlyDigits(normalized.whatsapp);
  const phone = onlyDigits(normalized.phone);

  if (!document && !whatsapp && !phone) return [];

  let query = client
    .schema("orcamento_app")
    .from("clients")
    .select("id,name,trade_name,document,phone,whatsapp,email,active")
    .eq("workspace_id", workspaceId);

  if (ignoreClientId) query = query.neq("id", ignoreClientId);

  const filters = [];
  if (document) filters.push(`normalized_document.eq.${document}`);
  if (whatsapp) filters.push(`normalized_whatsapp.eq.${whatsapp}`);
  if (phone) filters.push(`normalized_phone.eq.${phone}`);

  query = query.or(filters.join(","));

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(normalizeClient);
}
