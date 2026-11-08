# OP-01 — gravação genérica restrita a estados editáveis

A migration `20261107210000_quote_save_editable_statuses.sql` substitui somente
`orcamento_app.save_quote_with_items(uuid, uuid, jsonb, jsonb)`. Mantém assinatura,
SECURITY DEFINER, search_path, privilégios e todo o corpo, exceto a lista de status
solicitados: somente draft/awaiting_response. approved/cancelled e outros valores
são rejeitados com SQLSTATE 22023 antes de gravar; não há coerção silenciosa.
Status ausente/vazio continua usando draft. Registros finais continuam bloqueados.
Aprovação, cancelamento e reabertura usam suas RPCs dedicadas, sem alterações.

O frontend já envia draft/awaiting_response e trata erros de RPC; não foi alterado.
Não há correção histórica nem mudança de RLS/grants ou objetos compartilhados.

QA: workflow test-quote-approval.yml, PostgreSQL 17.6 descartável, loopback,
credenciais sintéticas e sem secrets Supabase. Carrega SQL versionado necessário
(tabelas, funções, constraints, políticas e triggers), mais a migration nova.
O adaptador sintético auth.uid lê uma configuração de sessão; não é um servidor
Supabase Auth e não comprova emissão/validação de JWT. Testa autorização SQL com
SET ROLE authenticated e vínculo real de workspace, não mocks das RPCs.
Não é replay completo das migrations nem teste do Supabase remoto.

Produção: workflow de migrations continua somente workflow_dispatch. Push/PR
não aplicam SQL remoto. Futuro merge pode publicar a aplicação pela Vercel, mas
não aplica a correção de banco. Migration remota exige validação do secret,
revisão das pendências e autorização expressa separada. Até lá OP-01 continua
presente no banco de produção.
