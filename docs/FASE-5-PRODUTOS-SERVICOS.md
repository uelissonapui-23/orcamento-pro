# Fase 5 — Produtos e Serviços

## Entregue

### Produtos e serviços unificados
Uma única entidade `products`.

### Categorias
- criar;
- renomear;
- desativar/reativar;
- categoria Geral criada automaticamente por workspace.

### Modos oficiais de cobrança
- `square_meter` — m²;
- `linear_meter` — metro linear;
- `unit` — unidade;
- `quantity_tier` — faixas;
- `fixed` — valor fixo;
- `manual` — preço digitado no orçamento;
- `wrapping` — wizard de envelopamento.

### Formulário dinâmico
Cada modo exibe apenas configurações relevantes.

Exemplos:
- m² → preço/m², mínimo, desperdício;
- linear → preço/metro, mínimo;
- unidade → preço/unidade, mínimo;
- fixo → valor e opção de multiplicar por quantidade;
- faixa → editor de faixas;
- manual → sem preço;
- wrapping → delegação futura ao wizard.

### Faixas
`product_price_tiers` suporta:
- quantidade mínima;
- quantidade máxima opcional;
- preço;
- preço total da faixa ou preço unitário.

A RPC transacional rejeita faixas sobrepostas.

### Persistência atômica
`save_product_with_tiers()`:
- valida workspace;
- valida categoria;
- salva produto;
- substitui faixas na mesma transação;
- evita produto salvo parcialmente.

### Duplicação
`duplicate_product()` copia:
- configuração;
- modo;
- valores;
- faixas;
- cria novo ID e nome “- cópia”.

### Histórico
Produtos são desativados, não excluídos pela UI.

Os futuros itens de orçamento salvarão snapshot do preço/regra usada.
Alterar o cadastro não mudará orçamento antigo.

## Próxima fase
Fase 6 — Motor de preços.

O motor consumirá esta configuração. Não deverá duplicar lógica de cadastro.
