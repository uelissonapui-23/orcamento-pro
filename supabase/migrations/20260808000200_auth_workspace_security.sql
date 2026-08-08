begin;

create schema if not exists orcamento_app;

create or replace function orcamento_app.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on orcamento_app.profiles;
create trigger profiles_set_updated_at
before update on orcamento_app.profiles
for each row execute function orcamento_app.set_updated_at();

drop trigger if exists workspaces_set_updated_at on orcamento_app.workspaces;
create trigger workspaces_set_updated_at
before update on orcamento_app.workspaces
for each row execute function orcamento_app.set_updated_at();

create or replace function orcamento_app.is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
  select exists (
    select 1
    from orcamento_app.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.active = true
      and wm.role in ('owner', 'admin')
  );
$$;

revoke all on function orcamento_app.is_workspace_admin(uuid) from public;
grant execute on function orcamento_app.is_workspace_admin(uuid) to authenticated;

create or replace function orcamento_app.bootstrap_user(
  p_user_id uuid,
  p_email text,
  p_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth, orcamento_app
as $$
declare
  v_workspace_id uuid;
  v_name text;
begin
  if p_user_id is null then
    raise exception 'user id ausente';
  end if;

  v_name := nullif(trim(coalesce(p_full_name, '')), '');

  insert into orcamento_app.profiles (id, full_name)
  values (p_user_id, coalesce(v_name, split_part(coalesce(p_email, ''), '@', 1), 'Usuário'))
  on conflict (id) do update
    set full_name = coalesce(nullif(excluded.full_name, ''), orcamento_app.profiles.full_name);

  select wm.workspace_id
    into v_workspace_id
  from orcamento_app.workspace_members wm
  where wm.user_id = p_user_id
    and wm.active = true
  order by
    case wm.role when 'owner' then 0 when 'admin' then 1 else 2 end,
    wm.created_at
  limit 1;

  if v_workspace_id is null then
    insert into orcamento_app.workspaces (name, owner_user_id)
    values (
      case
        when v_name is not null then v_name || ' — Orçamentos'
        else 'Meu negócio'
      end,
      p_user_id
    )
    returning id into v_workspace_id;

    insert into orcamento_app.workspace_members (workspace_id, user_id, role, active)
    values (v_workspace_id, p_user_id, 'owner', true)
    on conflict (workspace_id, user_id) do update
      set role = 'owner', active = true;
  end if;

  return v_workspace_id;
end;
$$;

revoke all on function orcamento_app.bootstrap_user(uuid, text, text) from public;

create or replace function orcamento_app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, orcamento_app
as $$
begin
  perform orcamento_app.bootstrap_user(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_orcamento_app on auth.users;
create trigger on_auth_user_created_orcamento_app
after insert on auth.users
for each row execute function orcamento_app.handle_new_auth_user();

create or replace function orcamento_app.ensure_user_foundation()
returns table (
  workspace_id uuid,
  workspace_name text,
  member_role text
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth, orcamento_app
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_full_name text;
  v_workspace_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select u.email, coalesce(u.raw_user_meta_data ->> 'full_name', '')
    into v_email, v_full_name
  from auth.users u
  where u.id = v_uid;

  if not found then
    raise exception 'authenticated user not found' using errcode = '42501';
  end if;

  v_workspace_id := orcamento_app.bootstrap_user(v_uid, v_email, v_full_name);

  return query
  select w.id, w.name, wm.role
  from orcamento_app.workspaces w
  join orcamento_app.workspace_members wm
    on wm.workspace_id = w.id
   and wm.user_id = v_uid
   and wm.active = true
  where w.id = v_workspace_id
    and w.active = true
  limit 1;
end;
$$;

revoke all on function orcamento_app.ensure_user_foundation() from public;
grant execute on function orcamento_app.ensure_user_foundation() to authenticated;

drop policy if exists workspaces_member_select on orcamento_app.workspaces;
create policy workspaces_member_select
on orcamento_app.workspaces
for select to authenticated
using (
  active = true
  and orcamento_app.is_workspace_member(id)
);

create or replace function orcamento_app.protect_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  if new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'workspace owner cannot be changed by normal update'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists workspaces_protect_owner on orcamento_app.workspaces;
create trigger workspaces_protect_owner
before update on orcamento_app.workspaces
for each row execute function orcamento_app.protect_workspace_owner();

drop policy if exists workspaces_admin_update on orcamento_app.workspaces;
create policy workspaces_admin_update
on orcamento_app.workspaces
for update to authenticated
using (orcamento_app.is_workspace_admin(id))
with check (orcamento_app.is_workspace_admin(id));

drop policy if exists workspace_members_member_select on orcamento_app.workspace_members;
create policy workspace_members_member_select
on orcamento_app.workspace_members
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists workspace_members_admin_insert on orcamento_app.workspace_members;
create policy workspace_members_admin_insert
on orcamento_app.workspace_members
for insert to authenticated
with check (
  orcamento_app.is_workspace_admin(workspace_id)
  and role in ('admin', 'member')
);

drop policy if exists workspace_members_admin_update on orcamento_app.workspace_members;
create policy workspace_members_admin_update
on orcamento_app.workspace_members
for update to authenticated
using (orcamento_app.is_workspace_admin(workspace_id))
with check (
  orcamento_app.is_workspace_admin(workspace_id)
  and not (
    user_id = (
      select w.owner_user_id
      from orcamento_app.workspaces w
      where w.id = workspace_id
    )
    and role <> 'owner'
  )
);

drop policy if exists workspace_members_admin_delete on orcamento_app.workspace_members;
create policy workspace_members_admin_delete
on orcamento_app.workspace_members
for delete to authenticated
using (
  orcamento_app.is_workspace_admin(workspace_id)
  and user_id <> (
    select w.owner_user_id
    from orcamento_app.workspaces w
    where w.id = workspace_id
  )
);

grant usage on schema orcamento_app to authenticated;
grant select, update on orcamento_app.profiles to authenticated;
grant select, update on orcamento_app.workspaces to authenticated;
grant select, insert, update, delete on orcamento_app.workspace_members to authenticated;

-- Corrige contas já existentes antes da criação do trigger.
do $$
declare
  r record;
begin
  for r in
    select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', '') as full_name
    from auth.users u
  loop
    perform orcamento_app.bootstrap_user(r.id, r.email, r.full_name);
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;
