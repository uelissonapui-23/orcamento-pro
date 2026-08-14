-- Orçamento Pro: libera o novo modo de cálculo "fluid_curve".
alter table orcamento_app.products drop constraint if exists products_calculation_mode_check;
alter table orcamento_app.products add constraint products_calculation_mode_check check (calculation_mode in ('square_meter','linear_meter','unit','quantity_tier','fluid_curve','fixed','manual','wrapping'));
alter table orcamento_app.quote_items drop constraint if exists quote_items_mode_check;
alter table orcamento_app.quote_items add constraint quote_items_mode_check check (calculation_mode in ('square_meter','linear_meter','unit','quantity_tier','fluid_curve','fixed','manual','wrapping'));
