# Fase 3 — Empresa + Configurações do PDF

## Entregue

Tabela final `orcamento_app.business_settings` com:
- nome/razão social;
- documento;
- contatos;
- endereço;
- logo privada;
- cor principal;
- validade padrão;
- prazo padrão;
- pagamento;
- mensagem;
- observações;
- termos.

## Automação

`buildQuoteDefaults()` é a fonte única para preencher novos orçamentos:
- issue_date;
- valid_until;
- expected_delivery_date;
- payment_terms_snapshot;
- message_snapshot;
- notes_snapshot;
- terms_snapshot.

A futura tela de orçamento não deve duplicar essa lógica.

## Histórico

Os futuros quotes guardarão snapshots. Alterar configurações da empresa depois NÃO altera orçamentos antigos.

## Logo

Bucket:
`orcamento-app-assets`

Privado.

Estrutura:
`<workspace_id>/logos/<arquivo>`

RLS do Storage usa membership/admin do workspace.

Permitido:
- PNG
- JPG/JPEG
- WebP
- até 2 MB

SVG foi deliberadamente excluído do upload nesta fase para reduzir superfície de conteúdo ativo.

## PDF

A prévia desta fase serve apenas para identidade visual.

O PDF A4 definitivo será construído na fase de PDF e deverá consumir:
- business_settings atual no momento da criação;
- snapshots do quote/cliente/itens;
- logo por URL assinada/download autenticado.

A página de Configurações NÃO deverá ser refeita para isso.
