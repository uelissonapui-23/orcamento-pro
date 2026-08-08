# Fase 14 — A Fazer operacional

## Entregue

### Ordem automática
A listagem usa `due_date ASC`, então o que vence primeiro aparece primeiro.

### Alertas visuais
- atrasado: vermelho;
- vence hoje: amarelo;
- vence em até 2 dias: amarelo;
- normal: neutro.

### Fluxo operacional
`pending` → `in_progress` → `ready` → `delivered`

Ações:
- Iniciar;
- Marcar pronto;
- Entregar.

Cada transição é protegida por RPC própria e só aceita o estado anterior correto.

### Prazo
Pode ser alterado enquanto o serviço estiver:
- pending;
- in_progress;
- ready.

Depois de entregue, o prazo não pode mais ser alterado.

### WhatsApp
Usa o WhatsApp do snapshot do cliente e, se estiver vazio, usa o telefone.
Abre uma mensagem com referência ao número do orçamento.

### PDF e orçamento
Atalhos rápidos para o PDF e para o orçamento original.

### Entrega
Ao entregar:
- status = delivered;
- delivered_at;
- delivery_notes.

O item sai do filtro padrão de A Fazer e será exibido em Entregues na Fase 15.

## Segurança
Todas as operações exigem autenticação, membership, workspace correto e status permitido.

## Próxima fase
Fase 15 — Entregues.
