import { supabase } from "../lib/supabase";

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

function startOfTodayIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function dateOnly(value) {
  if (!value) return null;
  return new Date(`${value}T12:00:00`);
}

function urgency(order) {
  if (!order?.due_date) return "none";
  const due = dateOnly(order.due_date);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.ceil((due - today) / 86400000);

  if (diff < 0) return "overdue";
  if (diff <= 2) return "soon";
  return "normal";
}

export async function loadDashboard(workspaceId) {
  const client = requireClient();

  const [
    awaitingResult,
    openOrdersResult,
    deliveredTodayResult,
  ] = await Promise.all([
    client
      .schema("orcamento_app")
      .from("quotes")
      .select("id,quote_number,client_snapshot_json,total,valid_until,updated_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "awaiting_response")
      .order("updated_at", { ascending: false })
      .limit(8),

    client
      .schema("orcamento_app")
      .from("work_orders")
      .select("id,quote_id,quote_number,status,client_snapshot_json,total,due_date,approved_at")
      .eq("workspace_id", workspaceId)
      .in("status", ["pending", "in_progress", "ready"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(20),

    client
      .schema("orcamento_app")
      .from("work_orders")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("status", "delivered")
      .gte("delivered_at", startOfTodayIso()),
  ]);

  if (awaitingResult.error) throw awaitingResult.error;
  if (openOrdersResult.error) throw openOrdersResult.error;
  if (deliveredTodayResult.error) throw deliveredTodayResult.error;

  const awaiting = awaitingResult.data || [];
  const openOrders = openOrdersResult.data || [];
  const overdue = openOrders.filter((order) => urgency(order) === "overdue");
  const dueSoon = openOrders.filter((order) => urgency(order) === "soon");

  return {
    counts: {
      awaiting: awaiting.length,
      open: openOrders.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      deliveredToday: (deliveredTodayResult.data || []).length,
    },
    awaiting,
    openOrders,
    overdue: overdue.slice(0, 6),
    dueSoon: dueSoon.slice(0, 6),
  };
}
