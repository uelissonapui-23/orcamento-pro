# Modelo de dados planejado

Nome de schema provisório: `orcamento_app`.

O nome definitivo poderá ser escolhido na Fase 1 antes da primeira migration.

## Identidade e isolamento

### profiles
- id → auth.users.id
- full_name
- avatar_url
- created_at
- updated_at

### workspaces
- id
- name
- owner_user_id
- active
- created_at
- updated_at

### workspace_members
- workspace_id
- user_id
- role: owner | admin | member
- active
- created_at

Todas as entidades de negócio usarão `workspace_id`.

## Empresa

### business_settings
- workspace_id
- legal_name
- trade_name
- document
- phone
- whatsapp
- email
- address fields
- logo_path
- primary_color
- default_quote_validity_days
- default_delivery_days
- default_payment_terms
- default_quote_message
- default_quote_notes
- default_quote_terms

## Clientes

### clients
- id
- workspace_id
- name
- trade_name
- document
- phone
- whatsapp
- email
- address
- notes
- active
- created_by
- created_at
- updated_at

Índices para nome, telefone, documento.

## Catálogo

### product_categories
- id
- workspace_id
- name
- active
- sort_order

### products
- id
- workspace_id
- category_id
- name
- description
- calculation_mode
- unit_label
- base_price
- minimum_price
- waste_percent
- default_material_id
- active
- configuration_json
- created_at
- updated_at

`calculation_mode`:
- square_meter
- linear_meter
- unit
- quantity_tier
- fixed
- manual
- wrapping

### product_price_tiers
- id
- product_id
- min_quantity
- max_quantity nullable
- price
- price_mode

### materials
- id
- workspace_id
- name
- category
- unit
- roll_width
- cost_value optional
- sale_value optional
- use_in_wrapping
- active

## Envelopamento

### vehicle_types
- id
- workspace_id
- name
- active

### vehicle_models
- id
- workspace_id
- vehicle_type_id
- brand
- model
- year_start
- year_end
- image_path
- notes
- active

### vehicle_parts
- id
- workspace_id
- vehicle_model_id
- name
- part_category
- area_m2
- estimated_time_minutes
- difficulty_label
- difficulty_factor
- rarity_factor
- waste_percent
- image_path
- notes
- active
- sort_order

## Orçamentos

### quotes
- id
- workspace_id
- quote_number
- client_id nullable
- client_snapshot_json
- status
- issue_date
- valid_until
- expected_delivery_date nullable
- subtotal
- discount_type
- discount_value
- surcharge_value
- total
- payment_terms_snapshot
- message_snapshot
- notes_snapshot
- terms_snapshot
- approved_at
- rejected_at
- cancelled_at
- created_by
- created_at
- updated_at

Número do orçamento gerado no banco para evitar colisão.

### quote_items
- id
- workspace_id
- quote_id
- product_id nullable
- item_type
- description
- quantity
- width
- height
- area
- linear_meters
- unit_price
- total_price
- discount
- material_id nullable
- calculation_mode
- calculation_input_json
- calculation_snapshot_json
- wrapping_snapshot_json
- notes
- sort_order
- created_at
- updated_at

## Eventos

### quote_events
- id
- workspace_id
- quote_id
- event_type
- payload_json
- created_by
- created_at

## Serviços

### jobs
- id
- workspace_id
- quote_id unique
- client_id nullable
- client_snapshot_json
- status
- approved_at
- due_date
- delivered_at
- total
- notes
- created_by
- created_at
- updated_at

### job_events
- id
- workspace_id
- job_id
- event_type
- payload_json
- created_by
- created_at

## Regras de integridade

- quote_item sempre pertence ao mesmo workspace do quote.
- job é único por quote aprovado.
- vehicle_part pertence ao mesmo workspace/modelo.
- snapshots históricos não são recalculados automaticamente.
- exclusões com histórico devem preferir inativação quando necessário.
