begin;

create or replace function orcamento_app.start_work_order(
  p_workspace_id uuid,
  p_work_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not orcamento_app.is_workspace_member(p_workspace_id) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  update orcamento_app.work_orders
  set
    status = 'in_progress',
    started_at = coalesce(started_at, now())
  where id = p_work_order_id
    and workspace_id = p_workspace_id
    and status = 'pending'
  returning id into v_id;

  if v_id is null then
    raise exception 'work order cannot be started or was not found' using errcode = '42501';
  end if;

  return v_id;
end;
$$;

revoke all on function orcamento_app.start_work_order(uuid, uuid) from public;
grant execute on function orcamento_app.start_work_order(uuid, uuid) to authenticated;

create or replace function orcamento_app.mark_work_order_ready(
  p_workspace_id uuid,
  p_work_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not orcamento_app.is_workspace_member(p_workspace_id) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  update orcamento_app.work_orders
  set
    status = 'ready',
    ready_at = coalesce(ready_at, now())
  where id = p_work_order_id
    and workspace_id = p_workspace_id
    and status = 'in_progress'
  returning id into v_id;

  if v_id is null then
    raise exception 'work order cannot be marked ready or was not found' using errcode = '42501';
  end if;

  return v_id;
end;
$$;

revoke all on function orcamento_app.mark_work_order_ready(uuid, uuid) from public;
grant execute on function orcamento_app.mark_work_order_ready(uuid, uuid) to authenticated;

create or replace function orcamento_app.deliver_work_order(
  p_workspace_id uuid,
  p_work_order_id uuid,
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not orcamento_app.is_workspace_member(p_workspace_id) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  update orcamento_app.work_orders
  set
    status = 'delivered',
    delivered_at = coalesce(delivered_at, now()),
    delivery_notes = nullif(trim(coalesce(p_notes, '')), '')
  where id = p_work_order_id
    and workspace_id = p_workspace_id
    and status = 'ready'
  returning id into v_id;

  if v_id is null then
    raise exception 'work order cannot be delivered or was not found' using errcode = '42501';
  end if;

  return v_id;
end;
$$;

revoke all on function orcamento_app.deliver_work_order(uuid, uuid, text) from public;
grant execute on function orcamento_app.deliver_work_order(uuid, uuid, text) to authenticated;

create or replace function orcamento_app.update_work_order_due_date(
  p_workspace_id uuid,
  p_work_order_id uuid,
  p_due_date date
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not orcamento_app.is_workspace_member(p_workspace_id) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  update orcamento_app.work_orders
  set due_date = p_due_date
  where id = p_work_order_id
    and workspace_id = p_workspace_id
    and status in ('pending','in_progress','ready')
  returning id into v_id;

  if v_id is null then
    raise exception 'work order cannot change due date or was not found' using errcode = '42501';
  end if;

  return v_id;
end;
$$;

revoke all on function orcamento_app.update_work_order_due_date(uuid, uuid, date) from public;
grant execute on function orcamento_app.update_work_order_due_date(uuid, uuid, date) to authenticated;

notify pgrst, 'reload schema';

commit;
