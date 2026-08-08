# Fase 13 — Aprovação → A Fazer

## Objetivo

Transformar a aprovação do orçamento em uma operação confiável e automática.

## Fluxo

`Aguardando resposta` → `Aprovado` + `work_order`

A ação fica na gestão de Orçamentos:
**Mais ações → Marcar como aprovado**

## Atomicidade

RPC:
`approve_quote_and_create_work_order()`

Na mesma transação:
1. trava o orçamento;
2. valida status;
3. monta snapshot dos itens;
4. cria `work_orders`;
5. altera quote para `approved`.

Não existe janela onde o orçamento pode ficar aprovado sem serviço operacional.

## Idempotência

Índice único:
`work_orders(workspace_id, quote_id)`

Se a aprovação for chamada novamente:
- não cria segundo serviço;
- devolve o work_order já existente.

## Snapshot operacional

`work_orders` guarda:
- quote_number;
- client_id;
- client_snapshot_json;
- quote_snapshot_json;
- items_snapshot_json;
- total;
- due_date;
- approved_at;
- approved_by.

Os itens incluem o `calculation_snapshot_json` original.

Assim a produção não depende de cadastros que podem ser alterados depois.

## Prazo

`due_date` recebe `expected_delivery_date` do orçamento.

Se o orçamento não tiver previsão, o serviço fica sem prazo até a Fase 14 permitir ajuste operacional.

## A Fazer

A rota `/a-fazer` agora lista os serviços aprovados.

Nesta fase a listagem serve para validar o fluxo automático.

A operação completa fica na Fase 14:
- ordenação;
- atrasados;
- alertas;
- alterar prazo;
- WhatsApp;
- iniciar;
- pronto;
- entregar.

## Segurança

RLS:
- membro só vê work_orders do próprio workspace.

RPC:
- exige auth;
- exige membership;
- aceita somente `awaiting_response`.

## Próxima fase
Fase 14 — A Fazer.
