begin;

create index if not exists work_orders_workspace_delivered_at_idx
  on orcamento_app.work_orders (workspace_id, delivered_at desc)
  where status = 'delivered';

create index if not exists work_orders_workspace_delivered_client_idx
  on orcamento_app.work_orders (workspace_id, client_id, delivered_at desc)
  where status = 'delivered';

notify pgrst, 'reload schema';

commit;
