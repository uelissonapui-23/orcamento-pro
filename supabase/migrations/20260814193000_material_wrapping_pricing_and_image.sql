begin;

alter table orcamento_app.materials
  add column if not exists wrapping_multiplier numeric(12,4) not null default 1,
  add column if not exists wrapping_discount_percent numeric(7,4) not null default 0,
  add column if not exists image_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'materials_wrapping_multiplier_positive'
      and conrelid = 'orcamento_app.materials'::regclass
  ) then
    alter table orcamento_app.materials
      add constraint materials_wrapping_multiplier_positive
      check (wrapping_multiplier > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'materials_wrapping_discount_range'
      and conrelid = 'orcamento_app.materials'::regclass
  ) then
    alter table orcamento_app.materials
      add constraint materials_wrapping_discount_range
      check (wrapping_discount_percent >= 0 and wrapping_discount_percent < 100);
  end if;
end $$;

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

  select * into v_source
  from orcamento_app.materials
  where id = p_material_id;

  if not found or not orcamento_app.is_workspace_member(v_source.workspace_id) then
    raise exception 'material not found or access denied' using errcode = '42501';
  end if;

  insert into orcamento_app.materials (
    workspace_id, category_id, name, unit, roll_width, cost_value, sale_value,
    wrapping_multiplier, wrapping_discount_percent, use_in_wrapping, notes,
    active, created_by
  ) values (
    v_source.workspace_id, v_source.category_id, v_source.name || ' - cópia',
    v_source.unit, v_source.roll_width, v_source.cost_value, v_source.sale_value,
    v_source.wrapping_multiplier, v_source.wrapping_discount_percent,
    v_source.use_in_wrapping, v_source.notes, true, auth.uid()
  ) returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke all on function orcamento_app.duplicate_material(uuid) from public;
grant execute on function orcamento_app.duplicate_material(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
