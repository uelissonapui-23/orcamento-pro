# Fase 10 — Editor de Orçamento

## Entregue
- lista funcional de orçamentos;
- novo orçamento;
- edição de rascunho/aguardando resposta;
- numeração automática por workspace;
- cliente + cliente rápido;
- defaults da Fase 3;
- produtos da Fase 5;
- motor da Fase 6;
- materiais/Fase 7 indiretamente pelos produtos/wizard;
- wizard da Fase 9;
- ordenação e remoção de itens;
- desconto fixo ou percentual;
- adicional;
- subtotal/total;
- snapshots históricos;
- salvamento atômico quote + items;
- RLS e validações de workspace.

## Estados usados agora
- draft;
- awaiting_response.

Os estados approved/cancelled já existem no banco, mas os fluxos serão concluídos nas fases de gestão/aprovação.

## Segurança
O backend recalcula subtotal, desconto, adicional e total.
Não confia nos totais enviados pelo navegador.

A RPC valida:
- usuário autenticado;
- membership do workspace;
- cliente do mesmo workspace;
- produto do mesmo workspace;
- pelo menos um item;
- valores não negativos;
- desconto percentual <= 100.

## Histórico
Salvamos:
- client_snapshot_json;
- payment/message/notes/terms snapshots;
- calculation_input_json;
- calculation_snapshot_json por item.

## Próxima fase
Fase 11 — PDF definitivo.
