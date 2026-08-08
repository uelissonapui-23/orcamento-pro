begin;

create table if not exists orcamento_app.business_settings (
  workspace_id uuid primary key references orcamento_app.workspaces(id) on delete cascade,
  legal_name text,
  trade_name text,
  document text,
  phone text,
  whatsapp text,
  email text,
  postal_code text,
  street text,
  address_number text,
  complement text,
  district text,
  city text,
  state text,
  logo_path text,
  primary_color text not null default '#111827'
    check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  default_quote_validity_days integer not null default 7
    check (default_quote_validity_days between 1 and 365),
  default_delivery_days integer not null default 7
    check (default_delivery_days between 0 and 365),
  default_payment_terms text,
  default_quote_message text,
  default_quote_notes text,
  default_quote_terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table orcamento_app.business_settings enable row level security;

drop trigger if exists business_settings_set_updated_at on orcamento_app.business_settings;
create trigger business_settings_set_updated_at
before update on orcamento_app.business_settings
for each row execute function orcamento_app.set_updated_at();

create or replace function orcamento_app.create_default_business_settings()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, orcamento_app
as $$
begin
  insert into orcamento_app.business_settings (
    workspace_id,
    trade_name
  )
  values (
    new.id,
    new.name
  )
  on conflict (workspace_id) do nothing;

  return new;
end;
$$;

drop trigger if exists workspace_create_default_business_settings on orcamento_app.workspaces;
create trigger workspace_create_default_business_settings
after insert on orcamento_app.workspaces
for each row execute function orcamento_app.create_default_business_settings();

insert into orcamento_app.business_settings (workspace_id, trade_name)
select w.id, w.name
from orcamento_app.workspaces w
on conflict (workspace_id) do nothing;

drop policy if exists business_settings_member_select on orcamento_app.business_settings;
create policy business_settings_member_select
on orcamento_app.business_settings
for select to authenticated
using (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists business_settings_admin_insert on orcamento_app.business_settings;
create policy business_settings_admin_insert
on orcamento_app.business_settings
for insert to authenticated
with check (orcamento_app.is_workspace_admin(workspace_id));

drop policy if exists business_settings_admin_update on orcamento_app.business_settings;
create policy business_settings_admin_update
on orcamento_app.business_settings
for update to authenticated
using (orcamento_app.is_workspace_admin(workspace_id))
with check (orcamento_app.is_workspace_admin(workspace_id));

grant select, insert, update on orcamento_app.business_settings to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'orcamento-app-assets',
  'orcamento-app-assets',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists orcamento_app_assets_member_select on storage.objects;
create policy orcamento_app_assets_member_select
on storage.objects
for select to authenticated
using (
  bucket_id = 'orcamento-app-assets'
  and orcamento_app.is_workspace_member(
    ((storage.foldername(name))[1])::uuid
  )
);

drop policy if exists orcamento_app_assets_admin_insert on storage.objects;
create policy orcamento_app_assets_admin_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'orcamento-app-assets'
  and orcamento_app.is_workspace_admin(
    ((storage.foldername(name))[1])::uuid
  )
);

drop policy if exists orcamento_app_assets_admin_update on storage.objects;
create policy orcamento_app_assets_admin_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'orcamento-app-assets'
  and orcamento_app.is_workspace_admin(
    ((storage.foldername(name))[1])::uuid
  )
)
with check (
  bucket_id = 'orcamento-app-assets'
  and orcamento_app.is_workspace_admin(
    ((storage.foldername(name))[1])::uuid
  )
);

drop policy if exists orcamento_app_assets_admin_delete on storage.objects;
create policy orcamento_app_assets_admin_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'orcamento-app-assets'
  and orcamento_app.is_workspace_admin(
    ((storage.foldername(name))[1])::uuid
  )
);

notify pgrst, 'reload schema';

commit;
