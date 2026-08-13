begin;

alter table orcamento_app.business_settings
  add column if not exists pdf_logo_path text;

-- Mantém compatibilidade com empresas já cadastradas. A próxima troca de logo
-- gera automaticamente uma cópia WebP leve; até lá o PDF usa a logo original.
update orcamento_app.business_settings
set pdf_logo_path = logo_path
where pdf_logo_path is null
  and logo_path is not null;

notify pgrst, 'reload schema';

commit;
