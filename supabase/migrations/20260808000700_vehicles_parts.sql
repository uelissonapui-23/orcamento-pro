begin;

create table if not exists orcamento_app.vehicle_types (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_types_name_not_blank check (length(trim(name)) > 0)
);

create unique index if not exists vehicle_types_workspace_name_unique
  on orcamento_app.vehicle_types (workspace_id, lower(name));

create table if not exists orcamento_app.vehicle_models (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  vehicle_type_id uuid not null references orcamento_app.vehicle_types(id),
  brand text not null,
  model text not null,
  year_from integer,
  year_to integer,
  notes text,
  image_path text,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_models_brand_not_blank check (length(trim(brand)) > 0),
  constraint vehicle_models_model_not_blank check (length(trim(model)) > 0),
  constraint vehicle_models_year_from_valid check (year_from is null or year_from between 1900 and 2200),
  constraint vehicle_models_year_to_valid check (year_to is null or year_to between 1900 and 2200),
  constraint vehicle_models_year_range_valid check (year_from is null or year_to is null or year_to >= year_from)
);

create index if not exists vehicle_models_workspace_lookup_idx
  on orcamento_app.vehicle_models (workspace_id, lower(brand), lower(model));

create index if not exists vehicle_models_workspace_type_idx
  on orcamento_app.vehicle_models (workspace_id, vehicle_type_id, active);

create table if not exists orcamento_app.vehicle_parts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  vehicle_model_id uuid not null references orcamento_app.vehicle_models(id) on delete cascade,
  name text not null,
  area_m2 numeric(12,3) not null,
  difficulty_multiplier numeric(8,3) not null default 1,
  waste_percent numeric(8,3) not null default 10,
  install_minutes integer,
  image_path text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_parts_name_not_blank check (length(trim(name)) > 0),
  constraint vehicle_parts_area_positive check (area_m2 > 0),
  constraint vehicle_parts_difficulty_range check (difficulty_multiplier > 0 and difficulty_multiplier <= 10),
  constraint vehicle_parts_waste_range check (waste_percent between 0 and 500),
  constraint vehicle_parts_install_minutes_nonnegative check (install_minutes is null or install_minutes >= 0)
);

create index if not exists vehicle_parts_model_idx
  on orcamento_app.vehicle_parts (vehicle_model_id, sort_order);

create index if not exists vehicle_parts_workspace_idx
  on orcamento_app.vehicle_parts (workspace_id, active);

create or replace function orcamento_app.normalize_vehicle_model_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  new.brand := trim(new.brand);
  new.model := trim(new.model);
  new.notes := nullif(trim(coalesce(new.notes, '')), '');

  if tg_op = 'INSERT' and new.created_by is null then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$$;

create or replace function orcamento_app.normalize_vehicle_part_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  new.name := trim(new.name);
  return new;
end;
$$;

drop trigger if exists vehicle_types_set_updated_at on orcamento_app.vehicle_types;
create trigger vehicle_types_set_updated_at
before update on orcamento_app.vehicle_types
for each row execute function orcamento_app.set_updated_at();

drop trigger if exists vehicle_models_set_updated_at on orcamento_app.vehicle_models;
create trigger vehicle_models_set_updated_at
before update on orcamento_app.vehicle_models
for each row execute function orcamento_app.set_updated_at();

drop trigger if exists vehicle_parts_set_updated_at on orcamento_app.vehicle_parts;
create trigger vehicle_parts_set_updated_at
before update on orcamento_app.vehicle_parts
for each row execute function orcamento_app.set_updated_at();

drop trigger if exists vehicle_models_normalize on orcamento_app.vehicle_models;
create trigger vehicle_models_normalize
before insert or update on orcamento_app.vehicle_models
for each row execute function orcamento_app.normalize_vehicle_model_fields();

drop trigger if exists vehicle_parts_normalize on orcamento_app.vehicle_parts;
create trigger vehicle_parts_normalize
before insert or update on orcamento_app.vehicle_parts
for each row execute function orcamento_app.normalize_vehicle_part_fields();

alter table orcamento_app.vehicle_types enable row level security;
alter table orcamento_app.vehicle_models enable row level security;
alter table orcamento_app.vehicle_parts enable row level security;

drop policy if exists vehicle_types_member_select on orcamento_app.vehicle_types;
create policy vehicle_types_member_select
on orcamento_app.vehicle_types
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists vehicle_types_member_insert on orcamento_app.vehicle_types;
create policy vehicle_types_member_insert
on orcamento_app.vehicle_types
for insert to authenticated
with check (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists vehicle_types_member_update on orcamento_app.vehicle_types;
create policy vehicle_types_member_update
on orcamento_app.vehicle_types
for update to authenticated
using (orcamento_app.is_workspace_member(workspace_id))
with check (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists vehicle_models_member_select on orcamento_app.vehicle_models;
create policy vehicle_models_member_select
on orcamento_app.vehicle_models
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists vehicle_models_member_update on orcamento_app.vehicle_models;
create policy vehicle_models_member_update
on orcamento_app.vehicle_models
for update to authenticated
using (orcamento_app.is_workspace_member(workspace_id))
with check (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists vehicle_parts_member_select on orcamento_app.vehicle_parts;
create policy vehicle_parts_member_select
on orcamento_app.vehicle_parts
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

grant select, insert, update on orcamento_app.vehicle_types to authenticated;
grant select, update on orcamento_app.vehicle_models to authenticated;
grant select on orcamento_app.vehicle_parts to authenticated;

create or replace function orcamento_app.save_vehicle_model_with_parts(
  p_workspace_id uuid,
  p_model_id uuid,
  p_payload jsonb,
  p_parts jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_model_id uuid;
  v_type_workspace uuid;
  v_part jsonb;
  v_index integer := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not orcamento_app.is_workspace_member(p_workspace_id) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  select workspace_id
    into v_type_workspace
  from orcamento_app.vehicle_types
  where id = nullif(p_payload ->> 'vehicle_type_id', '')::uuid
    and active = true;

  if v_type_workspace is distinct from p_workspace_id then
    raise exception 'invalid vehicle type for workspace' using errcode = '23503';
  end if;

  if p_model_id is null then
    insert into orcamento_app.vehicle_models (
      workspace_id,
      vehicle_type_id,
      brand,
      model,
      year_from,
      year_to,
      notes,
      image_path,
      active,
      created_by
    )
    values (
      p_workspace_id,
      (p_payload ->> 'vehicle_type_id')::uuid,
      trim(p_payload ->> 'brand'),
      trim(p_payload ->> 'model'),
      nullif(p_payload ->> 'year_from', '')::integer,
      nullif(p_payload ->> 'year_to', '')::integer,
      nullif(trim(coalesce(p_payload ->> 'notes', '')), ''),
      nullif(trim(coalesce(p_payload ->> 'image_path', '')), ''),
      coalesce((p_payload ->> 'active')::boolean, true),
      auth.uid()
    )
    returning id into v_model_id;
  else
    update orcamento_app.vehicle_models
    set
      vehicle_type_id = (p_payload ->> 'vehicle_type_id')::uuid,
      brand = trim(p_payload ->> 'brand'),
      model = trim(p_payload ->> 'model'),
      year_from = nullif(p_payload ->> 'year_from', '')::integer,
      year_to = nullif(p_payload ->> 'year_to', '')::integer,
      notes = nullif(trim(coalesce(p_payload ->> 'notes', '')), '')
    where id = p_model_id
      and workspace_id = p_workspace_id
    returning id into v_model_id;

    if v_model_id is null then
      raise exception 'vehicle model not found or access denied' using errcode = '42501';
    end if;
  end if;

  delete from orcamento_app.vehicle_parts
  where vehicle_model_id = v_model_id
    and workspace_id = p_workspace_id;

  for v_part in select value from jsonb_array_elements(coalesce(p_parts, '[]'::jsonb))
  loop
    v_index := v_index + 1;

    insert into orcamento_app.vehicle_parts (
      workspace_id,
      vehicle_model_id,
      name,
      area_m2,
      difficulty_multiplier,
      waste_percent,
      install_minutes,
      image_path,
      active,
      sort_order
    )
    values (
      p_workspace_id,
      v_model_id,
      trim(v_part ->> 'name'),
      (v_part ->> 'area_m2')::numeric,
      coalesce(nullif(v_part ->> 'difficulty_multiplier', '')::numeric, 1),
      coalesce(nullif(v_part ->> 'waste_percent', '')::numeric, 10),
      nullif(v_part ->> 'install_minutes', '')::integer,
      nullif(trim(coalesce(v_part ->> 'image_path', '')), ''),
      coalesce((v_part ->> 'active')::boolean, true),
      v_index - 1
    );
  end loop;

  return v_model_id;
end;
$$;

revoke all on function orcamento_app.save_vehicle_model_with_parts(uuid, uuid, jsonb, jsonb) from public;
grant execute on function orcamento_app.save_vehicle_model_with_parts(uuid, uuid, jsonb, jsonb) to authenticated;

create or replace function orcamento_app.duplicate_vehicle_model(p_model_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_source orcamento_app.vehicle_models%rowtype;
  v_new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
    into v_source
  from orcamento_app.vehicle_models
  where id = p_model_id;

  if not found or not orcamento_app.is_workspace_member(v_source.workspace_id) then
    raise exception 'vehicle model not found or access denied' using errcode = '42501';
  end if;

  insert into orcamento_app.vehicle_models (
    workspace_id,
    vehicle_type_id,
    brand,
    model,
    year_from,
    year_to,
    notes,
    active,
    created_by
  )
  values (
    v_source.workspace_id,
    v_source.vehicle_type_id,
    v_source.brand,
    v_source.model || ' - cópia',
    v_source.year_from,
    v_source.year_to,
    v_source.notes,
    true,
    auth.uid()
  )
  returning id into v_new_id;

  insert into orcamento_app.vehicle_parts (
    workspace_id,
    vehicle_model_id,
    name,
    area_m2,
    difficulty_multiplier,
    waste_percent,
    install_minutes,
    active,
    sort_order
  )
  select
    workspace_id,
    v_new_id,
    name,
    area_m2,
    difficulty_multiplier,
    waste_percent,
    install_minutes,
    active,
    sort_order
  from orcamento_app.vehicle_parts
  where vehicle_model_id = p_model_id
  order by sort_order;

  return v_new_id;
end;
$$;

revoke all on function orcamento_app.duplicate_vehicle_model(uuid) from public;
grant execute on function orcamento_app.duplicate_vehicle_model(uuid) to authenticated;

create or replace function orcamento_app.copy_vehicle_parts(
  p_source_model_id uuid,
  p_target_model_id uuid
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
declare
  v_source_workspace uuid;
  v_target_workspace uuid;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select workspace_id into v_source_workspace
  from orcamento_app.vehicle_models
  where id = p_source_model_id;

  select workspace_id into v_target_workspace
  from orcamento_app.vehicle_models
  where id = p_target_model_id;

  if v_source_workspace is null or v_target_workspace is null then
    raise exception 'vehicle model not found' using errcode = '42501';
  end if;

  if v_source_workspace is distinct from v_target_workspace
     or not orcamento_app.is_workspace_member(v_source_workspace) then
    raise exception 'workspace access denied' using errcode = '42501';
  end if;

  if p_source_model_id = p_target_model_id then
    raise exception 'source and target must differ';
  end if;

  delete from orcamento_app.vehicle_parts
  where vehicle_model_id = p_target_model_id
    and workspace_id = v_target_workspace;

  insert into orcamento_app.vehicle_parts (
    workspace_id,
    vehicle_model_id,
    name,
    area_m2,
    difficulty_multiplier,
    waste_percent,
    install_minutes,
    active,
    sort_order
  )
  select
    workspace_id,
    p_target_model_id,
    name,
    area_m2,
    difficulty_multiplier,
    waste_percent,
    install_minutes,
    active,
    sort_order
  from orcamento_app.vehicle_parts
  where vehicle_model_id = p_source_model_id
    and workspace_id = v_source_workspace
  order by sort_order;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function orcamento_app.copy_vehicle_parts(uuid, uuid) from public;
grant execute on function orcamento_app.copy_vehicle_parts(uuid, uuid) to authenticated;

create or replace function orcamento_app.create_default_vehicle_types()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  insert into orcamento_app.vehicle_types (workspace_id, name, sort_order)
  values
    (new.id, 'Carro', 0),
    (new.id, 'Caminhonete', 1),
    (new.id, 'Van', 2),
    (new.id, 'Moto', 3);
  return new;
end;
$$;

drop trigger if exists workspace_create_default_vehicle_types on orcamento_app.workspaces;
create trigger workspace_create_default_vehicle_types
after insert on orcamento_app.workspaces
for each row execute function orcamento_app.create_default_vehicle_types();

insert into orcamento_app.vehicle_types (workspace_id, name, sort_order)
select w.id, defaults.name, defaults.sort_order
from orcamento_app.workspaces w
cross join (
  values
    ('Carro', 0),
    ('Caminhonete', 1),
    ('Van', 2),
    ('Moto', 3)
) as defaults(name, sort_order)
where not exists (
  select 1
  from orcamento_app.vehicle_types vt
  where vt.workspace_id = w.id
    and lower(vt.name) = lower(defaults.name)
);

notify pgrst, 'reload schema';

commit;
