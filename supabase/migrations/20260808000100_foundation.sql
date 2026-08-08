create schema if not exists orcamento_app;

create table if not exists orcamento_app.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orcamento_app.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orcamento_app.workspace_members (
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table orcamento_app.profiles enable row level security;
alter table orcamento_app.workspaces enable row level security;
alter table orcamento_app.workspace_members enable row level security;

create or replace function orcamento_app.is_workspace_member(p_workspace_id uuid)
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
  );
$$;

revoke all on function orcamento_app.is_workspace_member(uuid) from public;
grant execute on function orcamento_app.is_workspace_member(uuid) to authenticated;

drop policy if exists profiles_select_self on orcamento_app.profiles;
create policy profiles_select_self on orcamento_app.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_self on orcamento_app.profiles;
create policy profiles_update_self on orcamento_app.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists workspaces_member_select on orcamento_app.workspaces;
create policy workspaces_member_select on orcamento_app.workspaces
for select to authenticated using (orcamento_app.is_workspace_member(id));

drop policy if exists workspace_members_member_select on orcamento_app.workspace_members;
create policy workspace_members_member_select on orcamento_app.workspace_members
for select to authenticated using (orcamento_app.is_workspace_member(workspace_id));

grant usage on schema orcamento_app to authenticated;
grant select, update on orcamento_app.profiles to authenticated;
grant select on orcamento_app.workspaces, orcamento_app.workspace_members to authenticated;

comment on schema orcamento_app is 'Schema isolado do novo aplicativo de orçamentos.';
