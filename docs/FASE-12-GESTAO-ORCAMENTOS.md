# Fase 12 — Gestão de Orçamentos

## Entregue

### Busca
Busca por:
- número;
- nome do cliente;
- nome fantasia;
- CPF/CNPJ.

### Filtros
- Todos;
- Rascunhos;
- Aguardando resposta;
- Aprovados;
- Cancelados.

### Ações
Cada orçamento possui:
- abrir PDF;
- editar quando permitido;
- duplicar;
- cancelar;
- reabrir cancelado como rascunho.

### Cancelamento
Não existe hard-delete.

Ao cancelar:
- status = cancelled;
- cancelled_at;
- cancelled_by;
- cancellation_reason opcional.

Itens e snapshots permanecem intactos.

### Duplicação
`duplicate_quote()`:
- valida workspace;
- gera número novo;
- copia cliente;
- copia snapshots;
- copia itens;
- preserva cálculos;
- nasce como draft;
- usa data atual;
- mantém duração original da validade.

### Reabertura
Orçamento cancelado pode voltar a `draft`.
Metadados de cancelamento são limpos.

### Segurança
As ações são RPCs `security definer` com:
- auth.uid();
- membership;
- workspace explícito;
- validação de status.

Orçamento aprovado não é alterado por essas RPCs.

## Próxima fase
Fase 13 — Aprovação → A Fazer.
