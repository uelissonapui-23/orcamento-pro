# Fase 7 — Materiais

## Entregue

### Cadastro
- nome;
- categoria;
- unidade;
- largura do rolo;
- custo;
- preço de referência;
- observações;
- ativo/inativo;
- usar no envelopamento.

### Categorias
Tabela própria `material_categories`.
Categoria `Geral` é criada automaticamente em novos workspaces e via backfill nos existentes.

### Envelopamento
`use_in_wrapping = true` exige `roll_width`.

Isso permite ao futuro wizard:
- listar somente materiais compatíveis;
- conhecer a largura do rolo;
- usar custo/preço de referência quando a regra exigir.

### Produto → Material padrão
A referência `products.default_material_id` agora possui FK real para `materials`.

A RPC `save_product_with_tiers()` foi atualizada para:
- aceitar material padrão;
- validar que ele está ativo;
- validar mesmo workspace;
- salvar atomicamente junto da configuração do produto.

A tela Produtos e Serviços agora permite escolher material padrão.

### Segurança
RLS em:
- material_categories;
- materials.

Sem hard-delete na UI.

### Duplicação
`duplicate_material()` cria uma cópia ativa mantendo configurações.

## Próxima fase
Fase 8 — Veículos e Peças.
