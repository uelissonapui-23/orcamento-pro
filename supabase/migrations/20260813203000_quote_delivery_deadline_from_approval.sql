begin;

-- Orçamentos continuam armazenando a data técnica calculada para manter
-- compatibilidade com o histórico existente, mas ela representa um PRAZO.
-- Ao aprovar, a data real da ordem de serviço passa a ser recalculada a partir
-- da aprovação, evitando prometer uma data vencida quando o cliente demora.
create or replace function orcamento_app.quote_delivery_days(
  p_issue_date date,
  p_expected_delivery_date date
)
returns integer
language sql
immutable
as $$
  select case
    when p_issue_date is null or p_expected_delivery_date is null then 0
    else greatest(0, p_expected_delivery_date - p_issue_date)
  end;
$$;

create or replace function orcamento_app.set_work_order_due_date_from_quote_deadline()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_issue_date date;
  v_expected_delivery_date date;
  v_days integer;
begin
  if new.quote_id is null then
    return new;
  end if;

  select q.issue_date, q.expected_delivery_date
    into v_issue_date, v_expected_delivery_date
  from orcamento_app.quotes q
  where q.id = new.quote_id
    and q.workspace_id = new.workspace_id;

  if found and v_expected_delivery_date is not null then
    v_days := orcamento_app.quote_delivery_days(v_issue_date, v_expected_delivery_date);
    new.due_date := current_date + v_days;
  end if;

  return new;
end;
$$;

drop trigger if exists work_orders_due_date_from_quote_deadline
  on orcamento_app.work_orders;

create trigger work_orders_due_date_from_quote_deadline
before insert on orcamento_app.work_orders
for each row
execute function orcamento_app.set_work_order_due_date_from_quote_deadline();

-- Corrige também a duplicação: o orçamento duplicado mantém a QUANTIDADE de
-- dias do original, mas recalcula a data técnica a partir da nova emissão.
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
  v_delivery_days integer;
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

  v_delivery_days := orcamento_app.quote_delivery_days(
    v_source.issue_date,
    v_source.expected_delivery_date
  );

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
    case when v_delivery_days > 0 then current_date + v_delivery_days else null end,
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

commit;
