# Fase 4 — Clientes

## Entregue

### Cadastro completo
- nome;
- empresa/nome fantasia;
- CPF/CNPJ;
- telefone;
- WhatsApp;
- e-mail;
- endereço;
- observações;
- ativo/inativo.

### Cliente rápido
Componente reutilizável:
`QuickClientDialog`

Campos mínimos:
- nome;
- WhatsApp ou telefone;
- e-mail opcional.

Foi criado agora para ser usado posteriormente dentro do editor de orçamento sem refazer a lógica.

### Busca
Busca por:
- nome;
- empresa;
- e-mail;
- documento normalizado;
- telefone normalizado;
- WhatsApp normalizado.

### Duplicidades
Banco:
- CPF/CNPJ normalizado é único por workspace.

Frontend:
- documento, telefone ou WhatsApp iguais disparam aviso antes de cadastrar;
- telefone/WhatsApp não bloqueiam automaticamente porque empresas podem compartilhar contato.

### Exclusão
Não existe hard-delete na UI.
Cliente é desativado/reativado.

Isso preserva histórico de orçamentos.

### Snapshot
`buildClientSnapshot()` já define o formato histórico que os futuros quotes deverão salvar.

Alterar um cliente no cadastro no futuro não altera um orçamento antigo.

## Segurança

Tabela:
`orcamento_app.clients`

RLS:
- membro lê somente workspace próprio;
- membro cadastra somente no workspace próprio;
- membro altera somente no workspace próprio.

Não há delete grant nesta fase.

## Navegação

A área Cadastros já possui estrutura final:
- Clientes;
- Produtos e Serviços;
- Materiais;
- Envelopamento.

Os próximos módulos entrarão nessa estrutura sem refazer a navegação.
