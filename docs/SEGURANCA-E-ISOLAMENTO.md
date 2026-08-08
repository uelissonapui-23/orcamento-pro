# Segurança e isolamento

## Regras desde a primeira migration

- autenticação via Supabase Auth;
- nenhuma `service_role` no frontend;
- somente chave publicável no navegador;
- toda entidade comercial tem `workspace_id`;
- toda query é protegida por RLS;
- não confiar em filtros do frontend como segurança.

## Membership

Acesso permitido quando existe `workspace_members` ativo para:
- auth.uid();
- workspace solicitado.

Roles iniciais:
- owner;
- admin;
- member.

## Operações críticas

Usar RPC transacional para:
- confirmar orçamento;
- duplicar orçamento;
- cancelar quando houver dependências;
- marcar serviço entregue;
- operações futuras de exclusão em cascata lógica.

RPCs `security definer` devem:
- usar `SET search_path`;
- validar `auth.uid()`;
- validar workspace;
- não aceitar user_id livre como autoridade.

## Storage

Buckets privados para:
- logos;
- anexos futuros;
- imagens de veículos/produtos.

Path:
`workspace_id/...`

URLs assinadas quando conteúdo for privado.

## Integridade

- FK para relações;
- constraints de status;
- valores >= 0;
- índices por workspace;
- unique quote number por workspace;
- job único por quote;
- validação de snapshot;
- timestamps server-side.

## Exclusão

Preferir:
- `active = false` para cadastros usados em histórico;
- hard delete somente para registros sem dependências ou com cascata segura.

## Auditoria

Eventos relevantes:
- quote_created;
- quote_sent/waiting;
- quote_approved;
- quote_rejected;
- quote_cancelled;
- quote_duplicated;
- job_created;
- job_due_changed;
- job_delivered.

## Testes obrigatórios de isolamento

Criar usuários A e B:
- A não lê clientes de B;
- A não lê quotes de B;
- A não altera produtos de B;
- A não acessa job de B por UUID;
- anexos/Storage de B não ficam públicos;
- RPC rejeita IDs de workspace de B.
