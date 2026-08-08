# Fase 8 — Veículos e Peças

## Entregue

### Tipos de veículo
- criar;
- editar;
- desativar/reativar;
- padrões automáticos:
  - Carro;
  - Caminhonete;
  - Van;
  - Moto.

### Modelos
- tipo;
- marca;
- modelo;
- ano inicial/final;
- observações;
- imagem privada;
- ativo/inativo.

### Peças
Cada modelo possui peças com:
- nome;
- área em m²;
- multiplicador de dificuldade;
- desperdício padrão;
- tempo estimado de instalação;
- ordem;
- ativo/inativo.

A soma de área e tempo já aparece na listagem.

### Atomicidade
`save_vehicle_model_with_parts()` salva modelo e peças em uma RPC única.

Editar o modelo substitui o conjunto de peças dentro da mesma transação.

### Duplicação
`duplicate_vehicle_model()`:
- cria novo modelo;
- copia todas as peças;
- mantém parâmetros;
- não copia imagem para evitar vínculo visual acidental.

### Copiar peças
`copy_vehicle_parts()`:
- escolhe origem;
- escolhe destino;
- substitui peças do destino;
- exige mesmo workspace.

### Imagem
Usa o bucket privado existente:
`orcamento-app-assets`

Path:
`<workspace_id>/vehicles/<model_id>/...`

A policy de Storage criada na Fase 3 já restringe pelo primeiro diretório (`workspace_id`).

### Segurança
RLS em:
- vehicle_types;
- vehicle_models;
- vehicle_parts.

RPCs validam `auth.uid()` e membership.

## Próxima fase
Fase 9 — Wizard de Envelopamento.

Ele consumirá diretamente:
- vehicle_models;
- vehicle_parts;
- materials com `use_in_wrapping = true`;
- pricingService.
