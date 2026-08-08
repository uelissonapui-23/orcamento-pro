import { normalizeWorkOrder } from "../lib/workOrder";
import { supabase } from "../lib/supabase";

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

export async function listWorkOrders(workspaceId, { status = "open", limit = 100 } = {}) {
  const client = requireClient();

  let query = client
    .schema("orcamento_app")
    .from("work_orders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status === "open") {
    query = query.in("status", ["pending", "in_progress", "ready"]);
  } else if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(normalizeWorkOrder);
}
