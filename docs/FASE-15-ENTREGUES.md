# Fase 15 — Entregues

## Objetivo
Separar completamente a operação diária do histórico concluído.

## Entregue

### Histórico
A rota `/entregues` mostra somente:
`work_orders.status = delivered`

Ordem:
`delivered_at DESC`

### Busca
Busca por:
- número;
- cliente;
- nome fantasia;
- CPF/CNPJ;
- observação da entrega.

### Filtros por período
- data inicial;
- data final.

### Detalhes
Mostra:
- aprovado em;
- iniciado em;
- pronto em;
- entregue em;
- prazo;
- total;
- cliente;
- itens entregues;
- observação da entrega.

### PDF
Acesso ao orçamento/PDF original.

### Duplicar
Permite duplicar o orçamento original para criar um novo trabalho.

A duplicação:
- cria novo número;
- nasce em draft;
- não altera o entregue original.

### Segurança
A listagem usa a RLS já existente em `work_orders`.
Não existe hard-delete.

## Próxima fase
Fase 16 — Home final.
