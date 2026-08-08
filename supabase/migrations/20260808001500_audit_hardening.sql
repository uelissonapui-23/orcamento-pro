begin;

-- Auditoria V1: funções internas SECURITY DEFINER não devem ser invocáveis diretamente.
revoke all on function orcamento_app.handle_new_auth_user() from public, anon, authenticated;
revoke all on function orcamento_app.protect_workspace_owner() from public, anon, authenticated;
revoke all on function orcamento_app.create_default_business_settings() from public, anon, authenticated;
revoke all on function orcamento_app.create_default_product_category() from public, anon, authenticated;
revoke all on function orcamento_app.create_default_material_category() from public, anon, authenticated;
revoke all on function orcamento_app.create_default_vehicle_types() from public, anon, authenticated;

-- Helpers de trigger também não precisam de EXECUTE externo.
revoke all on function orcamento_app.set_updated_at() from public, anon, authenticated;
revoke all on function orcamento_app.normalize_product_fields() from public, anon, authenticated;
revoke all on function orcamento_app.normalize_material_fields() from public, anon, authenticated;
revoke all on function orcamento_app.normalize_vehicle_model_fields() from public, anon, authenticated;

-- As funções abaixo são helpers deliberadamente consultáveis pelo app/RLS.
revoke all on function orcamento_app.is_workspace_member(uuid) from public, anon;
grant execute on function orcamento_app.is_workspace_member(uuid) to authenticated;

revoke all on function orcamento_app.is_workspace_admin(uuid) from public, anon;
grant execute on function orcamento_app.is_workspace_admin(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
