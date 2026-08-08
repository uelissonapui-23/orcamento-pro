begin;

alter table orcamento_app.quotes
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id),
  add column if not exists cancellation_reason text;

create index if not exists quotes_workspace_cancelled_idx
  on orcamento_app.quotes (workspace_id, cancelled_at desc)
  where status = 'cancelled';

create or replace function orcamento_app.duplicate_quote(
  p_workspace_id uuid,
  p_quote_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_source orcamento_app.quotes%rowtype;
  v_new_id uuid;
  v_new_number bigint;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not orcamento_app.is_workspace_member(p_workspace_id) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  select *
    into v_source
  from orcamento_app.quotes
  where id = p_quote_id
    and workspace_id = p_workspace_id;

  if not found then
    raise exception 'quote not found or access denied' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text, 0));

  select coalesce(max(quote_number), 0) + 1
    into v_new_number
  from orcamento_app.quotes
  where workspace_id = p_workspace_id;

  insert into orcamento_app.quotes (
    workspace_id,
    quote_number,
    status,
    client_id,
    client_snapshot_json,
    business_snapshot_json,
    issue_date,
    valid_until,
    expected_delivery_date,
    payment_terms_snapshot,
    message_snapshot,
    notes_snapshot,
    terms_snapshot,
    discount_type,
    discount_value,
    subtotal,
    discount_total,
    surcharge_value,
    surcharge_total,
    total,
    created_by
  )
  values (
    p_workspace_id,
    v_new_number,
    'draft',
    v_source.client_id,
    v_source.client_snapshot_json,
    v_source.business_snapshot_json,
    current_date,
    greatest(current_date, current_date + (v_source.valid_until - v_source.issue_date)),
    v_source.expected_delivery_date,
    v_source.payment_terms_snapshot,
    v_source.message_snapshot,
    v_source.notes_snapshot,
    v_source.terms_snapshot,
    v_source.discount_type,
    v_source.discount_value,
    v_source.subtotal,
    v_source.discount_total,
    v_source.surcharge_value,
    v_source.surcharge_total,
    v_source.total,
    auth.uid()
  )
  returning id into v_new_id;

  insert into orcamento_app.quote_items (
    workspace_id,
    quote_id,
    product_id,
    item_type,
    description,
    quantity,
    width,
    height,
    area,
    linear_meters,
    unit_price,
    total_price,
    calculation_mode,
    calculation_input_json,
    calculation_snapshot_json,
    notes,
    sort_order
  )
  select
    workspace_id,
    v_new_id,
    product_id,
    item_type,
    description,
    quantity,
    width,
    height,
    area,
    linear_meters,
    unit_price,
    total_price,
    calculation_mode,
    calculation_input_json,
    calculation_snapshot_json,
    notes,
    sort_order
  from orcamento_app.quote_items
  where quote_id = p_quote_id
    and workspace_id = p_workspace_id
  order by sort_order;

  return v_new_id;
end;
$$;

revoke all on function orcamento_app.duplicate_quote(uuid, uuid) from public;
grant execute on function orcamento_app.duplicate_quote(uuid, uuid) to authenticated;

create or replace function orcamento_app.cancel_quote(
  p_workspace_id uuid,
  p_quote_id uuid,
  p_reason text default ''
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

  update orcamento_app.quotes
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    cancellation_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_quote_id
    and workspace_id = p_workspace_id
    and status in ('draft','awaiting_response')
  returning id into v_id;

  if v_id is null then
    raise exception 'quote cannot be cancelled or was not found' using errcode = '42501';
  end if;

  return v_id;
end;
$$;

revoke all on function orcamento_app.cancel_quote(uuid, uuid, text) from public;
grant execute on function orcamento_app.cancel_quote(uuid, uuid, text) to authenticated;

create or replace function orcamento_app.reopen_quote(
  p_workspace_id uuid,
  p_quote_id uuid
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

  update orcamento_app.quotes
  set
    status = 'draft',
    cancelled_at = null,
    cancelled_by = null,
    cancellation_reason = null
  where id = p_quote_id
    and workspace_id = p_workspace_id
    and status = 'cancelled'
  returning id into v_id;

  if v_id is null then
    raise exception 'quote cannot be reopened or was not found' using errcode = '42501';
  end if;

  return v_id;
end;
$$;

revoke all on function orcamento_app.reopen_quote(uuid, uuid) from public;
grant execute on function orcamento_app.reopen_quote(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
