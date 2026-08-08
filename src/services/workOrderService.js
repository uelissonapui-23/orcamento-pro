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


export async function startWorkOrder(workspaceId, workOrderId) {
  const client = requireClient();
  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("start_work_order", {
      p_workspace_id: workspaceId,
      p_work_order_id: workOrderId,
    });
  if (error) throw error;
  return data;
}

export async function markWorkOrderReady(workspaceId, workOrderId) {
  const client = requireClient();
  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("mark_work_order_ready", {
      p_workspace_id: workspaceId,
      p_work_order_id: workOrderId,
    });
  if (error) throw error;
  return data;
}

export async function deliverWorkOrder(workspaceId, workOrderId, notes = "") {
  const client = requireClient();
  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("deliver_work_order", {
      p_workspace_id: workspaceId,
      p_work_order_id: workOrderId,
      p_notes: String(notes || "").trim(),
    });
  if (error) throw error;
  return data;
}

export async function updateWorkOrderDueDate(workspaceId, workOrderId, dueDate) {
  const client = requireClient();
  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("update_work_order_due_date", {
      p_workspace_id: workspaceId,
      p_work_order_id: workOrderId,
      p_due_date: dueDate || null,
    });
  if (error) throw error;
  return data;
}
