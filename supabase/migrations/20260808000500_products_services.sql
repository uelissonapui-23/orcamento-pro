begin;

create table if not exists orcamento_app.product_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_name_not_blank check (length(trim(name)) > 0)
);

create unique index if not exists product_categories_workspace_name_unique
  on orcamento_app.product_categories (workspace_id, lower(name));

create index if not exists product_categories_workspace_active_idx
  on orcamento_app.product_categories (workspace_id, active, sort_order);

create table if not exists orcamento_app.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  category_id uuid not null references orcamento_app.product_categories(id),
  name text not null,
  description text,
  calculation_mode text not null,
  unit_label text,
  base_price numeric(14,2),
  minimum_price numeric(14,2),
  waste_percent numeric(8,3) not null default 0,
  default_material_id uuid,
  active boolean not null default true,
  configuration_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (length(trim(name)) > 0),
  constraint products_calculation_mode_check check (
    calculation_mode in (
      'square_meter',
      'linear_meter',
      'unit',
      'quantity_tier',
      'fixed',
      'manual',
      'wrapping'
    )
  ),
  constraint products_base_price_nonnegative check (base_price is null or base_price >= 0),
  constraint products_minimum_price_nonnegative check (minimum_price is null or minimum_price >= 0),
  constraint products_waste_percent_range check (waste_percent between 0 and 500)
);

create index if not exists products_workspace_name_idx
  on orcamento_app.products (workspace_id, lower(name));

create index if not exists products_workspace_active_idx
  on orcamento_app.products (workspace_id, active);

create index if not exists products_workspace_category_idx
  on orcamento_app.products (workspace_id, category_id);

create index if not exists products_workspace_mode_idx
  on orcamento_app.products (workspace_id, calculation_mode);

create table if not exists orcamento_app.product_price_tiers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  product_id uuid not null references orcamento_app.products(id) on delete cascade,
  min_quantity integer not null,
  max_quantity integer,
  price numeric(14,2) not null,
  price_mode text not null default 'total',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_price_tiers_min_positive check (min_quantity >= 1),
  constraint product_price_tiers_max_valid check (max_quantity is null or max_quantity >= min_quantity),
  constraint product_price_tiers_price_nonnegative check (price >= 0),
  constraint product_price_tiers_mode_check check (price_mode in ('total', 'unit'))
);

create index if not exists product_price_tiers_product_idx
  on orcamento_app.product_price_tiers (product_id, min_quantity);

create or replace function orcamento_app.normalize_product_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  new.name := trim(new.name);
  new.description := nullif(trim(coalesce(new.description, '')), '');
  new.unit_label := nullif(trim(coalesce(new.unit_label, '')), '');
  new.configuration_json := coalesce(new.configuration_json, '{}'::jsonb);

  if tg_op = 'INSERT' and new.created_by is null then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists products_normalize_fields on orcamento_app.products;
create trigger products_normalize_fields
before insert or update on orcamento_app.products
for each row execute function orcamento_app.normalize_product_fields();

drop trigger if exists product_categories_set_updated_at on orcamento_app.product_categories;
create trigger product_categories_set_updated_at
before update on orcamento_app.product_categories
for each row execute function orcamento_app.set_updated_at();

drop trigger if exists products_set_updated_at on orcamento_app.products;
create trigger products_set_updated_at
before update on orcamento_app.products
for each row execute function orcamento_app.set_updated_at();

alter table orcamento_app.product_categories enable row level security;
alter table orcamento_app.products enable row level security;
alter table orcamento_app.product_price_tiers enable row level security;

drop policy if exists product_categories_member_select on orcamento_app.product_categories;
create policy product_categories_member_select
on orcamento_app.product_categories
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists product_categories_member_insert on orcamento_app.product_categories;
create policy product_categories_member_insert
on orcamento_app.product_categories
for insert to authenticated
with check (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists product_categories_member_update on orcamento_app.product_categories;
create policy product_categories_member_update
on orcamento_app.product_categories
for update to authenticated
using (orcamento_app.is_workspace_member(workspace_id))
with check (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists products_member_select on orcamento_app.products;
create policy products_member_select
on orcamento_app.products
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists products_member_update on orcamento_app.products;
create policy products_member_update
on orcamento_app.products
for update to authenticated
using (orcamento_app.is_workspace_member(workspace_id))
with check (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists product_price_tiers_member_select on orcamento_app.product_price_tiers;
create policy product_price_tiers_member_select
on orcamento_app.product_price_tiers
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

grant select, insert, update on orcamento_app.product_categories to authenticated;
grant select, update on orcamento_app.products to authenticated;
grant select on orcamento_app.product_price_tiers to authenticated;

create or replace function orcamento_app.save_product_with_tiers(
  p_workspace_id uuid,
  p_product_id uuid,
  p_payload jsonb,
  p_tiers jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_product_id uuid;
  v_mode text;
  v_category_workspace uuid;
  v_tier jsonb;
  v_index integer := 0;
  v_previous_max integer := 0;
  v_min integer;
  v_max integer;
  v_price numeric;
  v_price_mode text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not orcamento_app.is_workspace_member(p_workspace_id) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  select workspace_id
    into v_category_workspace
  from orcamento_app.product_categories
  where id = nullif(p_payload ->> 'category_id', '')::uuid
    and active = true;

  if v_category_workspace is distinct from p_workspace_id then
    raise exception 'invalid category for workspace' using errcode = '23503';
  end if;

  v_mode := p_payload ->> 'calculation_mode';

  if v_mode not in ('square_meter','linear_meter','unit','quantity_tier','fixed','manual','wrapping') then
    raise exception 'invalid calculation mode';
  end if;

  if p_product_id is null then
    insert into orcamento_app.products (
      workspace_id,
      category_id,
      name,
      description,
      calculation_mode,
      unit_label,
      base_price,
      minimum_price,
      waste_percent,
      active,
      configuration_json,
      created_by
    )
    values (
      p_workspace_id,
      (p_payload ->> 'category_id')::uuid,
      trim(p_payload ->> 'name'),
      nullif(trim(coalesce(p_payload ->> 'description', '')), ''),
      v_mode,
      nullif(trim(coalesce(p_payload ->> 'unit_label', '')), ''),
      nullif(p_payload ->> 'base_price', '')::numeric,
      nullif(p_payload ->> 'minimum_price', '')::numeric,
      coalesce(nullif(p_payload ->> 'waste_percent', '')::numeric, 0),
      coalesce((p_payload ->> 'active')::boolean, true),
      coalesce(p_payload -> 'configuration_json', '{}'::jsonb),
      auth.uid()
    )
    returning id into v_product_id;
  else
    update orcamento_app.products
    set
      category_id = (p_payload ->> 'category_id')::uuid,
      name = trim(p_payload ->> 'name'),
      description = nullif(trim(coalesce(p_payload ->> 'description', '')), ''),
      calculation_mode = v_mode,
      unit_label = nullif(trim(coalesce(p_payload ->> 'unit_label', '')), ''),
      base_price = nullif(p_payload ->> 'base_price', '')::numeric,
      minimum_price = nullif(p_payload ->> 'minimum_price', '')::numeric,
      waste_percent = coalesce(nullif(p_payload ->> 'waste_percent', '')::numeric, 0),
      configuration_json = coalesce(p_payload -> 'configuration_json', '{}'::jsonb)
    where id = p_product_id
      and workspace_id = p_workspace_id
    returning id into v_product_id;

    if v_product_id is null then
      raise exception 'product not found or access denied' using errcode = '42501';
    end if;
  end if;

  delete from orcamento_app.product_price_tiers
  where product_id = v_product_id
    and workspace_id = p_workspace_id;

  if v_mode = 'quantity_tier' then
    if jsonb_typeof(coalesce(p_tiers, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_tiers, '[]'::jsonb)) = 0 then
      raise exception 'quantity tier product requires at least one tier';
    end if;

    for v_tier in select value from jsonb_array_elements(p_tiers)
    loop
      v_index := v_index + 1;
      v_min := greatest(1, (v_tier ->> 'min_quantity')::integer);
      v_max := nullif(v_tier ->> 'max_quantity', '')::integer;
      v_price := (v_tier ->> 'price')::numeric;
      v_price_mode := coalesce(nullif(v_tier ->> 'price_mode', ''), 'total');

      if v_max is not null and v_max < v_min then
        raise exception 'tier max quantity is lower than min quantity';
      end if;

      if v_index > 1 and v_min <= v_previous_max then
        raise exception 'quantity tiers overlap';
      end if;

      if v_price < 0 then
        raise exception 'tier price cannot be negative';
      end if;

      if v_price_mode not in ('total', 'unit') then
        raise exception 'invalid tier price mode';
      end if;

      insert into orcamento_app.product_price_tiers (
        workspace_id,
        product_id,
        min_quantity,
        max_quantity,
        price,
        price_mode,
        sort_order
      )
      values (
        p_workspace_id,
        v_product_id,
        v_min,
        v_max,
        v_price,
        v_price_mode,
        v_index
      );

      v_previous_max := coalesce(v_max, 2147483647);
    end loop;
  end if;

  return v_product_id;
end;
$$;

revoke all on function orcamento_app.save_product_with_tiers(uuid, uuid, jsonb, jsonb) from public;
grant execute on function orcamento_app.save_product_with_tiers(uuid, uuid, jsonb, jsonb) to authenticated;

create or replace function orcamento_app.duplicate_product(p_product_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_source orcamento_app.products%rowtype;
  v_new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
    into v_source
  from orcamento_app.products
  where id = p_product_id;

  if not found or not orcamento_app.is_workspace_member(v_source.workspace_id) then
    raise exception 'product not found or access denied' using errcode = '42501';
  end if;

  insert into orcamento_app.products (
    workspace_id,
    category_id,
    name,
    description,
    calculation_mode,
    unit_label,
    base_price,
    minimum_price,
    waste_percent,
    default_material_id,
    active,
    configuration_json,
    created_by
  )
  values (
    v_source.workspace_id,
    v_source.category_id,
    v_source.name || ' - cópia',
    v_source.description,
    v_source.calculation_mode,
    v_source.unit_label,
    v_source.base_price,
    v_source.minimum_price,
    v_source.waste_percent,
    v_source.default_material_id,
    true,
    v_source.configuration_json,
    auth.uid()
  )
  returning id into v_new_id;

  insert into orcamento_app.product_price_tiers (
    workspace_id,
    product_id,
    min_quantity,
    max_quantity,
    price,
    price_mode,
    sort_order
  )
  select
    workspace_id,
    v_new_id,
    min_quantity,
    max_quantity,
    price,
    price_mode,
    sort_order
  from orcamento_app.product_price_tiers
  where product_id = p_product_id
  order by sort_order, min_quantity;

  return v_new_id;
end;
$$;

revoke all on function orcamento_app.duplicate_product(uuid) from public;
grant execute on function orcamento_app.duplicate_product(uuid) to authenticated;

create or replace function orcamento_app.create_default_product_category()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  if not exists (
    select 1
    from orcamento_app.product_categories pc
    where pc.workspace_id = new.id
      and lower(pc.name) = 'geral'
  ) then
    insert into orcamento_app.product_categories (workspace_id, name, sort_order)
    values (new.id, 'Geral', 0);
  end if;
  return new;
end;
$$;

drop trigger if exists workspace_create_default_product_category on orcamento_app.workspaces;
create trigger workspace_create_default_product_category
after insert on orcamento_app.workspaces
for each row execute function orcamento_app.create_default_product_category();

insert into orcamento_app.product_categories (workspace_id, name, sort_order)
select w.id, 'Geral', 0
from orcamento_app.workspaces w
where not exists (
  select 1
  from orcamento_app.product_categories pc
  where pc.workspace_id = w.id
    and lower(pc.name) = 'geral'
);

notify pgrst, 'reload schema';

commit;
