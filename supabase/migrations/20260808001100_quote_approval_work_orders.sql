begin;

create table if not exists orcamento_app.work_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  quote_id uuid not null references orcamento_app.quotes(id),
  quote_number bigint not null,
  status text not null default 'pending',
  client_id uuid references orcamento_app.clients(id) on delete set null,
  client_snapshot_json jsonb not null default '{}'::jsonb,
  quote_snapshot_json jsonb not null default '{}'::jsonb,
  items_snapshot_json jsonb not null default '[]'::jsonb,
  total numeric(14,2) not null default 0,
  due_date date,
  approved_at timestamptz not null default now(),
  approved_by uuid references auth.users(id),
  started_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  delivery_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_orders_status_check check (
    status in ('pending','in_progress','ready','delivered','cancelled')
  ),
  constraint work_orders_total_nonnegative check (total >= 0)
);

create unique index if not exists work_orders_workspace_quote_unique
  on orcamento_app.work_orders (workspace_id, quote_id);

create index if not exists work_orders_workspace_status_due_idx
  on orcamento_app.work_orders (workspace_id, status, due_date);

create index if not exists work_orders_workspace_client_idx
  on orcamento_app.work_orders (workspace_id, client_id);

drop trigger if exists work_orders_set_updated_at on orcamento_app.work_orders;
create trigger work_orders_set_updated_at
before update on orcamento_app.work_orders
for each row execute function orcamento_app.set_updated_at();

alter table orcamento_app.work_orders enable row level security;

drop policy if exists work_orders_member_select on orcamento_app.work_orders;
create policy work_orders_member_select
on orcamento_app.work_orders
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

grant select on orcamento_app.work_orders to authenticated;

create or replace function orcamento_app.approve_quote_and_create_work_order(
  p_workspace_id uuid,
  p_quote_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_quote orcamento_app.quotes%rowtype;
  v_work_order_id uuid;
  v_items jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not orcamento_app.is_workspace_member(p_workspace_id) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  -- Serializa a aprovação deste orçamento.
  select *
    into v_quote
  from orcamento_app.quotes
  where id = p_quote_id
    and workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'quote not found or access denied' using errcode = '42501';
  end if;

  -- Idempotência: se já estiver aprovado e o job existir, devolve o mesmo ID.
  if v_quote.status = 'approved' then
    select id
      into v_work_order_id
    from orcamento_app.work_orders
    where workspace_id = p_workspace_id
      and quote_id = p_quote_id;

    if v_work_order_id is not null then
      return v_work_order_id;
    end if;

    raise exception 'approved quote is missing its work order';
  end if;

  if v_quote.status <> 'awaiting_response' then
    raise exception 'only quotes awaiting response can be approved';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', qi.id,
        'product_id', qi.product_id,
        'item_type', qi.item_type,
        'description', qi.description,
        'quantity', qi.quantity,
        'width', qi.width,
        'height', qi.height,
        'area', qi.area,
        'linear_meters', qi.linear_meters,
        'unit_price', qi.unit_price,
        'total_price', qi.total_price,
        'calculation_mode', qi.calculation_mode,
        'calculation_input_json', qi.calculation_input_json,
        'calculation_snapshot_json', qi.calculation_snapshot_json,
        'notes', qi.notes,
        'sort_order', qi.sort_order
      )
      order by qi.sort_order
    ),
    '[]'::jsonb
  )
  into v_items
  from orcamento_app.quote_items qi
  where qi.workspace_id = p_workspace_id
    and qi.quote_id = p_quote_id;

  if jsonb_array_length(v_items) = 0 then
    raise exception 'quote has no items';
  end if;

  insert into orcamento_app.work_orders (
    workspace_id,
    quote_id,
    quote_number,
    status,
    client_id,
    client_snapshot_json,
    quote_snapshot_json,
    items_snapshot_json,
    total,
    due_date,
    approved_at,
    approved_by
  )
  values (
    p_workspace_id,
    v_quote.id,
    v_quote.quote_number,
    'pending',
    v_quote.client_id,
    v_quote.client_snapshot_json,
    jsonb_build_object(
      'quote_number', v_quote.quote_number,
      'client_snapshot_json', v_quote.client_snapshot_json,
      'business_snapshot_json', v_quote.business_snapshot_json,
      'issue_date', v_quote.issue_date,
      'valid_until', v_quote.valid_until,
      'expected_delivery_date', v_quote.expected_delivery_date,
      'payment_terms_snapshot', v_quote.payment_terms_snapshot,
      'message_snapshot', v_quote.message_snapshot,
      'notes_snapshot', v_quote.notes_snapshot,
      'terms_snapshot', v_quote.terms_snapshot,
      'discount_type', v_quote.discount_type,
      'discount_value', v_quote.discount_value,
      'subtotal', v_quote.subtotal,
      'discount_total', v_quote.discount_total,
      'surcharge_total', v_quote.surcharge_total,
      'total', v_quote.total
    ),
    v_items,
    v_quote.total,
    v_quote.expected_delivery_date,
    now(),
    auth.uid()
  )
  returning id into v_work_order_id;

  update orcamento_app.quotes
  set status = 'approved'
  where id = p_quote_id
    and workspace_id = p_workspace_id;

  return v_work_order_id;

exception
  when unique_violation then
    select id
      into v_work_order_id
    from orcamento_app.work_orders
    where workspace_id = p_workspace_id
      and quote_id = p_quote_id;

    if v_work_order_id is not null then
      update orcamento_app.quotes
      set status = 'approved'
      where id = p_quote_id
        and workspace_id = p_workspace_id
        and status = 'awaiting_response';

      return v_work_order_id;
    end if;

    raise;
end;
$$;

revoke all on function orcamento_app.approve_quote_and_create_work_order(uuid, uuid) from public;
grant execute on function orcamento_app.approve_quote_and_create_work_order(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
