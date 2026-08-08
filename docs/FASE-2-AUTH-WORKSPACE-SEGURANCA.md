# Fase 2 — Autenticação, Workspace e Segurança

## Fluxos concluídos

### Cadastro
O usuário informa nome, e-mail e senha.
Supabase Auth cria `auth.users`.
Trigger server-side cria:
- `orcamento_app.profiles`;
- `orcamento_app.workspaces`;
- `orcamento_app.workspace_members` como owner.

### Login
Após autenticação, o frontend chama `ensure_user_foundation()`.
A RPC é idempotente e garante que contas antigas ou incompletas tenham fundação válida.

### Recuperação
`resetPasswordForEmail()` redireciona para `/redefinir-senha`.

### Rotas
Sem sessão: redireciona para `/entrar`.
Com sessão mas sem workspace válido: bloqueia a aplicação com erro explícito.
Rotas públicas de login/cadastro redirecionam usuários já autenticados para Home.

## Segurança

O frontend nunca envia `user_id` como autoridade.
A RPC usa `auth.uid()`.
Helpers:
- `is_workspace_member(workspace_id)`;
- `is_workspace_admin(workspace_id)`.

RLS protege:
- profiles;
- workspaces;
- workspace_members.

O owner não pode ser rebaixado/removido pelas policies normais.

## Supabase Data API

Adicione `orcamento_app` em:
Project Settings → API / Data API → Exposed schemas.

Mantenha também `public` e `graphql_public` se já forem necessários pelo projeto.

## Auth URLs

No Supabase Auth → URL Configuration:
- Site URL: URL oficial do Vercel;
- Redirect URLs:
  - `http://localhost:5173/**`
  - URL do Vercel `/**`

## Teste mínimo

1. Criar usuário A.
2. Confirmar e-mail.
3. Entrar.
4. Verificar Home e Perfil.
5. Sair/entrar.
6. Recuperar senha.
7. Criar usuário B.
8. Confirmar que A e B têm workspaces diferentes.
9. Executar checklist `supabase/tests/phase2_isolation_checks.sql` em homologação.
