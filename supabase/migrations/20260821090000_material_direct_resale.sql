begin;

alter table orcamento_app.products drop constraint if exists products_calculation_mode_check;
alter table orcamento_app.products add constraint products_calculation_mode_check check (
  calculation_mode in ('square_meter','linear_meter','unit','quantity_tier','fluid_curve','fixed','manual','wrapping','material_resale')
);

alter table orcamento_app.quote_items drop constraint if exists quote_items_mode_check;
alter table orcamento_app.quote_items add constraint quote_items_mode_check check (
  calculation_mode in ('square_meter','linear_meter','unit','quantity_tier','fluid_curve','fixed','manual','wrapping','material_resale')
);

-- Mantém a RPC existente e amplia sua lista de modalidades sem alterar as
-- regras de isolamento, associação de material e faixas já implantadas.
do $$
declare
  v_definition text;
begin
  select pg_get_functiondef('orcamento_app.save_product_with_tiers(uuid,uuid,jsonb,jsonb)'::regprocedure)
    into v_definition;

  v_definition := replace(
    v_definition,
    $find$IF v_mode <> ALL (ARRAY['square_meter'::text, 'linear_meter'::text, 'unit'::text, 'quantity_tier'::text, 'fixed'::text, 'manual'::text, 'wrapping'::text]) THEN$find$,
    $replace$IF v_mode <> ALL (ARRAY['square_meter'::text, 'linear_meter'::text, 'unit'::text, 'quantity_tier'::text, 'fluid_curve'::text, 'fixed'::text, 'manual'::text, 'wrapping'::text, 'material_resale'::text]) THEN$replace$
  );

  v_definition := replace(
    v_definition,
    $find$if v_mode not in ('square_meter','linear_meter','unit','quantity_tier','fixed','manual','wrapping') then$find$,
    $replace$if v_mode not in ('square_meter','linear_meter','unit','quantity_tier','fluid_curve','fixed','manual','wrapping','material_resale') then$replace$
  );

  if position('material_resale' in v_definition) = 0 then
    raise exception 'save_product_with_tiers could not be upgraded for material_resale';
  end if;

  execute v_definition;
end;
$$;

notify pgrst, 'reload schema';
commit;
