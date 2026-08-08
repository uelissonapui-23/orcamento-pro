begin;

-- Reparo idempotente da estrutura da Fase 18.
create table if not exists orcamento_app.automation_settings (
  workspace_id uuid primary key references orcamento_app.workspaces(id) on delete cascade,
  quote_followup_days integer not null default 3 check (quote_followup_days between 1 and 30),
  quote_expiry_warning_days integer not null default 2 check (quote_expiry_warning_days between 0 and 15),
  delivery_warning_days integer not null default 2 check (delivery_warning_days between 0 and 15),
  show_safe_suggestions boolean not null default true,
  default_whatsapp_message text not null default 'Olá, {cliente}! Estou entrando em contato sobre o orçamento #{numero}.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orcamento_app.quote_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references orcamento_app.workspaces(id) on delete cascade,
  name text not null,
  description text,
  payload_json jsonb not null default '{}'::jsonb,
  is_favorite boolean not null default false,
  use_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_templates_workspace_favorite_idx
  on orcamento_app.quote_templates (
    workspace_id,
    is_favorite desc,
    use_count desc,
    updated_at desc
  );

alter table orcamento_app.automation_settings enable row level security;
alter table orcamento_app.quote_templates enable row level security;

drop policy if exists automation_settings_member_all
  on orcamento_app.automation_settings;

create policy automation_settings_member_all
on orcamento_app.automation_settings
for all to authenticated
using (orcamento_app.is_workspace_member(workspace_id))
with check (orcamento_app.is_workspace_member(workspace_id));

drop policy if exists quote_templates_member_all
  on orcamento_app.quote_templates;

create policy quote_templates_member_all
on orcamento_app.quote_templates
for all to authenticated
using (orcamento_app.is_workspace_member(workspace_id))
with check (orcamento_app.is_workspace_member(workspace_id));

-- A migration original criou RLS, mas não concedeu privilégios de tabela.
-- Sem estes GRANTs, usuários autenticados recebem "permission denied".
grant select, insert, update, delete
  on orcamento_app.automation_settings
  to authenticated;

grant select, insert, update, delete
  on orcamento_app.quote_templates
  to authenticated;

notify pgrst, 'reload schema';

commit;
