begin;

create table if not exists orcamento_app.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  name text not null,
  trade_name text,
  document text,
  normalized_document text,
  phone text,
  normalized_phone text,
  whatsapp text,
  normalized_whatsapp text,
  email text,
  postal_code text,
  street text,
  address_number text,
  complement text,
  district text,
  city text,
  state text,
  notes text,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_not_blank check (length(trim(name)) > 0),
  constraint clients_state_length check (state is null or length(state) <= 2)
);

create index if not exists clients_workspace_name_idx
  on orcamento_app.clients (workspace_id, lower(name));

create index if not exists clients_workspace_active_idx
  on orcamento_app.clients (workspace_id, active);

create index if not exists clients_workspace_document_idx
  on orcamento_app.clients (workspace_id, normalized_document)
  where normalized_document is not null and normalized_document <> '';

create index if not exists clients_workspace_phone_idx
  on orcamento_app.clients (workspace_id, normalized_phone)
  where normalized_phone is not null and normalized_phone <> '';

create index if not exists clients_workspace_whatsapp_idx
  on orcamento_app.clients (workspace_id, normalized_whatsapp)
  where normalized_whatsapp is not null and normalized_whatsapp <> '';

create unique index if not exists clients_document_unique
  on orcamento_app.clients (workspace_id, normalized_document)
  where normalized_document is not null and normalized_document <> '';

create or replace function orcamento_app.normalize_client_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  new.name := trim(new.name);
  new.trade_name := nullif(trim(coalesce(new.trade_name, '')), '');
  new.document := nullif(trim(coalesce(new.document, '')), '');
  new.phone := nullif(trim(coalesce(new.phone, '')), '');
  new.whatsapp := nullif(trim(coalesce(new.whatsapp, '')), '');
  new.email := nullif(lower(trim(coalesce(new.email, ''))), '');
  new.postal_code := nullif(trim(coalesce(new.postal_code, '')), '');
  new.street := nullif(trim(coalesce(new.street, '')), '');
  new.address_number := nullif(trim(coalesce(new.address_number, '')), '');
  new.complement := nullif(trim(coalesce(new.complement, '')), '');
  new.district := nullif(trim(coalesce(new.district, '')), '');
  new.city := nullif(trim(coalesce(new.city, '')), '');
  new.state := nullif(upper(left(trim(coalesce(new.state, '')), 2)), '');
  new.notes := nullif(trim(coalesce(new.notes, '')), '');

  new.normalized_document := nullif(regexp_replace(coalesce(new.document, ''), '\D', '', 'g'), '');
  new.normalized_phone := nullif(regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'), '');
  new.normalized_whatsapp := nullif(regexp_replace(coalesce(new.whatsapp, ''), '\D', '', 'g'), '');

  if tg_op = 'INSERT' and new.created_by is null then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists clients_normalize_fields on orcamento_app.clients;
create trigger clients_normalize_fields
before insert or update on orcamento_app.clients
for each row execute function orcamento_app.normalize_client_fields();

drop trigger if exists clients_set_updated_at on orcamento_app.clients;
create trigger clients_set_updated_at
before update on orcamento_app.clients
for each row execute function orcamento_app.set_updated_at();

alter table orcamento_app.clients enable row level security;

drop policy if exists clients_member_select on orcamento_app.clients;
create policy clients_member_select
on orcamento_app.clients
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists clients_member_insert on orcamento_app.clients;
create policy clients_member_insert
on orcamento_app.clients
for insert to authenticated
with check (
  orcamento_app.is_workspace_member(workspace_id)
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists clients_member_update on orcamento_app.clients;
create policy clients_member_update
on orcamento_app.clients
for update to authenticated
using (orcamento_app.is_workspace_member(workspace_id))
with check (
  orcamento_app.is_workspace_member(workspace_id)
  and created_by is not distinct from created_by
);

grant select, insert, update on orcamento_app.clients to authenticated;

notify pgrst, 'reload schema';

commit;
