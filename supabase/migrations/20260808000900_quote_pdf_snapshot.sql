begin;

alter table orcamento_app.quotes
  add column if not exists business_snapshot_json jsonb not null default '{}'::jsonb;

create or replace function orcamento_app.save_quote_with_items(
  p_workspace_id uuid,
  p_quote_id uuid,
  p_payload jsonb,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_quote_id uuid;
  v_quote_number bigint;
  v_client_workspace uuid;
  v_status text;
  v_discount_type text;
  v_item jsonb;
  v_index integer := 0;
  v_product_workspace uuid;
  v_subtotal numeric := 0;
  v_item_total numeric;
  v_discount_input numeric;
  v_discount_total numeric;
  v_surcharge numeric;
  v_total numeric;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not orcamento_app.is_workspace_member(p_workspace_id) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  select workspace_id
    into v_client_workspace
  from orcamento_app.clients
  where id = nullif(p_payload ->> 'client_id', '')::uuid
    and active = true;

  if v_client_workspace is distinct from p_workspace_id then
    raise exception 'invalid client for workspace' using errcode = '23503';
  end if;

  v_status := coalesce(nullif(p_payload ->> 'status', ''), 'draft');
  if v_status not in ('draft','awaiting_response','approved','cancelled') then
    raise exception 'invalid quote status';
  end if;

  v_discount_type := coalesce(nullif(p_payload ->> 'discount_type', ''), 'fixed');
  if v_discount_type not in ('fixed','percent') then
    raise exception 'invalid discount type';
  end if;

  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'quote requires at least one item';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_item_total := coalesce(nullif(v_item ->> 'total_price', '')::numeric, 0);

    if v_item_total < 0 then
      raise exception 'item total cannot be negative';
    end if;

    if nullif(v_item ->> 'product_id', '') is not null then
      select workspace_id into v_product_workspace
      from orcamento_app.products
      where id = (v_item ->> 'product_id')::uuid;

      if v_product_workspace is distinct from p_workspace_id then
        raise exception 'invalid product for workspace' using errcode = '23503';
      end if;
    end if;

    v_subtotal := v_subtotal + v_item_total;
  end loop;

  v_surcharge := greatest(0, coalesce(nullif(p_payload ->> 'surcharge_value', '')::numeric, 0));
  v_discount_input := greatest(0, coalesce(nullif(p_payload ->> 'discount_value', '')::numeric, 0));

  if v_discount_type = 'percent' then
    if v_discount_input > 100 then
      raise exception 'percentage discount cannot exceed 100';
    end if;
    v_discount_total := round(v_subtotal * v_discount_input / 100, 2);
  else
    v_discount_total := v_discount_input;
  end if;

  v_discount_total := least(v_discount_total, v_subtotal + v_surcharge);
  v_total := greatest(0, round(v_subtotal + v_surcharge - v_discount_total, 2));

  if p_quote_id is null then
    perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text, 0));

    select coalesce(max(quote_number), 0) + 1
      into v_quote_number
    from orcamento_app.quotes
    where workspace_id = p_workspace_id;

    insert into orcamento_app.quotes (
      workspace_id, quote_number, status, client_id,
      client_snapshot_json, business_snapshot_json,
      issue_date, valid_until, expected_delivery_date,
      payment_terms_snapshot, message_snapshot, notes_snapshot, terms_snapshot,
      discount_type, discount_value, subtotal, discount_total,
      surcharge_value, surcharge_total, total, created_by
    )
    values (
      p_workspace_id, v_quote_number, v_status,
      (p_payload ->> 'client_id')::uuid,
      coalesce(p_payload -> 'client_snapshot_json', '{}'::jsonb),
      coalesce(p_payload -> 'business_snapshot_json', '{}'::jsonb),
      (p_payload ->> 'issue_date')::date,
      (p_payload ->> 'valid_until')::date,
      nullif(p_payload ->> 'expected_delivery_date', '')::date,
      nullif(p_payload ->> 'payment_terms_snapshot', ''),
      nullif(p_payload ->> 'message_snapshot', ''),
      nullif(p_payload ->> 'notes_snapshot', ''),
      nullif(p_payload ->> 'terms_snapshot', ''),
      v_discount_type, v_discount_input, round(v_subtotal, 2), v_discount_total,
      v_surcharge, v_surcharge, v_total, auth.uid()
    )
    returning id into v_quote_id;
  else
    update orcamento_app.quotes
    set
      status = v_status,
      client_id = (p_payload ->> 'client_id')::uuid,
      client_snapshot_json = coalesce(p_payload -> 'client_snapshot_json', '{}'::jsonb),
      business_snapshot_json = case
        when business_snapshot_json = '{}'::jsonb
          then coalesce(p_payload -> 'business_snapshot_json', '{}'::jsonb)
        else business_snapshot_json
      end,
      issue_date = (p_payload ->> 'issue_date')::date,
      valid_until = (p_payload ->> 'valid_until')::date,
      expected_delivery_date = nullif(p_payload ->> 'expected_delivery_date', '')::date,
      payment_terms_snapshot = nullif(p_payload ->> 'payment_terms_snapshot', ''),
      message_snapshot = nullif(p_payload ->> 'message_snapshot', ''),
      notes_snapshot = nullif(p_payload ->> 'notes_snapshot', ''),
      terms_snapshot = nullif(p_payload ->> 'terms_snapshot', ''),
      discount_type = v_discount_type,
      discount_value = v_discount_input,
      subtotal = round(v_subtotal, 2),
      discount_total = v_discount_total,
      surcharge_value = v_surcharge,
      surcharge_total = v_surcharge,
      total = v_total
    where id = p_quote_id
      and workspace_id = p_workspace_id
      and status in ('draft','awaiting_response')
    returning id into v_quote_id;

    if v_quote_id is null then
      raise exception 'quote not found, locked or access denied' using errcode = '42501';
    end if;

    delete from orcamento_app.quote_items
    where quote_id = v_quote_id
      and workspace_id = p_workspace_id;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_index := v_index + 1;

    insert into orcamento_app.quote_items (
      workspace_id, quote_id, product_id, item_type, description, quantity,
      width, height, area, linear_meters, unit_price, total_price,
      calculation_mode, calculation_input_json, calculation_snapshot_json,
      notes, sort_order
    )
    values (
      p_workspace_id,
      v_quote_id,
      nullif(v_item ->> 'product_id', '')::uuid,
      coalesce(nullif(v_item ->> 'item_type', ''), 'product'),
      trim(v_item ->> 'description'),
      coalesce(nullif(v_item ->> 'quantity', '')::numeric, 1),
      nullif(v_item ->> 'width', '')::numeric,
      nullif(v_item ->> 'height', '')::numeric,
      nullif(v_item ->> 'area', '')::numeric,
      nullif(v_item ->> 'linear_meters', '')::numeric,
      coalesce(nullif(v_item ->> 'unit_price', '')::numeric, 0),
      coalesce(nullif(v_item ->> 'total_price', '')::numeric, 0),
      v_item ->> 'calculation_mode',
      coalesce(v_item -> 'calculation_input_json', '{}'::jsonb),
      coalesce(v_item -> 'calculation_snapshot_json', '{}'::jsonb),
      nullif(v_item ->> 'notes', ''),
      v_index - 1
    );
  end loop;

  return v_quote_id;
end;
$$;

revoke all on function orcamento_app.save_quote_with_items(uuid, uuid, jsonb, jsonb) from public;
grant execute on function orcamento_app.save_quote_with_items(uuid, uuid, jsonb, jsonb) to authenticated;

notify pgrst, 'reload schema';

commit;
