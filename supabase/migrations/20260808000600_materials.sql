begin;

create table if not exists orcamento_app.material_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_categories_name_not_blank check (length(trim(name)) > 0)
);

create unique index if not exists material_categories_workspace_name_unique
  on orcamento_app.material_categories (workspace_id, lower(name));

create index if not exists material_categories_workspace_active_idx
  on orcamento_app.material_categories (workspace_id, active, sort_order);

create table if not exists orcamento_app.materials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  category_id uuid not null references orcamento_app.material_categories(id),
  name text not null,
  unit text not null default 'm²',
  roll_width numeric(10,3),
  cost_value numeric(14,2),
  sale_value numeric(14,2),
  use_in_wrapping boolean not null default false,
  notes text,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint materials_name_not_blank check (length(trim(name)) > 0),
  constraint materials_unit_not_blank check (length(trim(unit)) > 0),
  constraint materials_roll_width_positive check (roll_width is null or roll_width > 0),
  constraint materials_cost_nonnegative check (cost_value is null or cost_value >= 0),
  constraint materials_sale_nonnegative check (sale_value is null or sale_value >= 0),
  constraint materials_wrapping_requires_width check (not use_in_wrapping or roll_width is not null)
);

create index if not exists materials_workspace_name_idx
  on orcamento_app.materials (workspace_id, lower(name));

create index if not exists materials_workspace_active_idx
  on orcamento_app.materials (workspace_id, active);

create index if not exists materials_workspace_category_idx
  on orcamento_app.materials (workspace_id, category_id);

create index if not exists materials_workspace_wrapping_idx
  on orcamento_app.materials (workspace_id, use_in_wrapping, active);

create or replace function orcamento_app.normalize_material_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  new.name := trim(new.name);
  new.unit := trim(new.unit);
  new.notes := nullif(trim(coalesce(new.notes, '')), '');

  if tg_op = 'INSERT' and new.created_by is null then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists materials_normalize_fields on orcamento_app.materials;
create trigger materials_normalize_fields
before insert or update on orcamento_app.materials
for each row execute function orcamento_app.normalize_material_fields();

drop trigger if exists material_categories_set_updated_at on orcamento_app.material_categories;
create trigger material_categories_set_updated_at
before update on orcamento_app.material_categories
for each row execute function orcamento_app.set_updated_at();

drop trigger if exists materials_set_updated_at on orcamento_app.materials;
create trigger materials_set_updated_at
before update on orcamento_app.materials
for each row execute function orcamento_app.set_updated_at();

alter table orcamento_app.material_categories enable row level security;
alter table orcamento_app.materials enable row level security;

drop policy if exists material_categories_member_select on orcamento_app.material_categories;
create policy material_categories_member_select
on orcamento_app.material_categories
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists material_categories_member_insert on orcamento_app.material_categories;
create policy material_categories_member_insert
on orcamento_app.material_categories
for insert to authenticated
with check (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists material_categories_member_update on orcamento_app.material_categories;
create policy material_categories_member_update
on orcamento_app.material_categories
for update to authenticated
using (orcamento_app.is_workspace_member(workspace_id))
with check (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists materials_member_select on orcamento_app.materials;
create policy materials_member_select
on orcamento_app.materials
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists materials_member_insert on orcamento_app.materials;
create policy materials_member_insert
on orcamento_app.materials
for insert to authenticated
with check (
  orcamento_app.is_workspace_member(workspace_id)
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists materials_member_update on orcamento_app.materials;
create policy materials_member_update
on orcamento_app.materials
for update to authenticated
using (orcamento_app.is_workspace_member(workspace_id))
with check (orcamento_app.is_workspace_member(workspace_id));

grant select, insert, update on orcamento_app.material_categories to authenticated;
grant select, insert, update on orcamento_app.materials to authenticated;

-- Liga products.default_material_id agora que materials existe.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_default_material_id_fkey'
      and conrelid = 'orcamento_app.products'::regclass
  ) then
    alter table orcamento_app.products
      add constraint products_default_material_id_fkey
      foreign key (default_material_id)
      references orcamento_app.materials(id)
      on delete set null;
  end if;
end $$;

create index if not exists products_default_material_idx
  on orcamento_app.products (default_material_id)
  where default_material_id is not null;

create or replace function orcamento_app.duplicate_material(p_material_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_source orcamento_app.materials%rowtype;
  v_new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
    into v_source
  from orcamento_app.materials
  where id = p_material_id;

  if not found or not orcamento_app.is_workspace_member(v_source.workspace_id) then
    raise exception 'material not found or access denied' using errcode = '42501';
  end if;

  insert into orcamento_app.materials (
    workspace_id,
    category_id,
    name,
    unit,
    roll_width,
    cost_value,
    sale_value,
    use_in_wrapping,
    notes,
    active,
    created_by
  )
  values (
    v_source.workspace_id,
    v_source.category_id,
    v_source.name || ' - cópia',
    v_source.unit,
    v_source.roll_width,
    v_source.cost_value,
    v_source.sale_value,
    v_source.use_in_wrapping,
    v_source.notes,
    true,
    auth.uid()
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke all on function orcamento_app.duplicate_material(uuid) from public;
grant execute on function orcamento_app.duplicate_material(uuid) to authenticated;

create or replace function orcamento_app.create_default_material_category()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  if not exists (
    select 1
    from orcamento_app.material_categories mc
    where mc.workspace_id = new.id
      and lower(mc.name) = 'geral'
  ) then
    insert into orcamento_app.material_categories (workspace_id, name, sort_order)
    values (new.id, 'Geral', 0);
  end if;
  return new;
end;
$$;

drop trigger if exists workspace_create_default_material_category on orcamento_app.workspaces;
create trigger workspace_create_default_material_category
after insert on orcamento_app.workspaces
for each row execute function orcamento_app.create_default_material_category();

insert into orcamento_app.material_categories (workspace_id, name, sort_order)
select w.id, 'Geral', 0
from orcamento_app.workspaces w
where not exists (
  select 1
  from orcamento_app.material_categories mc
  where mc.workspace_id = w.id
    and lower(mc.name) = 'geral'
);

-- Atualiza a RPC da Fase 5 para persistir e validar material padrão.
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
  v_default_material_id uuid;
  v_material_workspace uuid;
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

  v_default_material_id := nullif(p_payload ->> 'default_material_id', '')::uuid;

  if v_default_material_id is not null then
    select workspace_id
      into v_material_workspace
    from orcamento_app.materials
    where id = v_default_material_id
      and active = true;

    if v_material_workspace is distinct from p_workspace_id then
      raise exception 'invalid default material for workspace' using errcode = '23503';
    end if;
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
      default_material_id,
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
      v_default_material_id,
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
      default_material_id = v_default_material_id,
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

notify pgrst, 'reload schema';

commit;
