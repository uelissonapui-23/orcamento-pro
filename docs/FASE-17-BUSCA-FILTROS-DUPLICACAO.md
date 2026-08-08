# Fase 17 — Busca, Filtros e Duplicação

## Busca global

Atalho:
`Ctrl/Cmd + K`

Também existe botão no topo do app.

Busca simultaneamente:
- clientes;
- orçamentos;
- A Fazer;
- entregues;
- produtos/serviços;
- materiais;
- veículos.

## Resultado direto

Orçamentos abrem diretamente no editor/histórico.

A Fazer e Entregues apontam para o orçamento relacionado.

Cadastros abrem a aba correta já com o termo de busca preenchido.

## Ranking

Resultados são ordenados por relevância:
1. título exatamente igual;
2. título começa com o termo;
3. título contém o termo;
4. subtítulo contém o termo.

## Duplicação centralizada

A busca global oferece duplicar diretamente:
- orçamento;
- orçamento relacionado a A Fazer;
- orçamento relacionado a Entregues;
- produto/serviço;
- material;
- veículo.

O registro original nunca é alterado.

Orçamentos duplicados:
- recebem número novo;
- nascem como draft;
- preservam snapshots/itens.

## Filtros

As páginas de cadastros passam a aceitar `?q=`.

Isso permite que a busca global leve o usuário para:
- Clientes já filtrado;
- Produtos já filtrado;
- Materiais já filtrado;
- Envelopamento já filtrado.

## Segurança

A busca reutiliza services que já aplicam:
- workspace_id;
- RLS;
- status/filtros apropriados.

Nenhuma consulta global ignora o isolamento por workspace.

## Próxima fase
Fase 18 — Automações avançadas da V1.
