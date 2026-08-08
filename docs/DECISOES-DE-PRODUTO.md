# Decisões oficiais de produto

## Interface
- O aplicativo deve parecer simples mesmo quando a estrutura interna for completa.
- Mostrar somente campos relevantes para o item selecionado.
- Preferir linguagem humana a termos técnicos.
- Evitar tabelas largas no celular.
- Não usar dezenas de status.

## Orçamento
Status oficiais:
- `draft` — Rascunho
- `waiting` — Aguardando resposta
- `approved` — Aprovado
- `rejected` — Recusado
- `cancelled` — Cancelado

## Serviço
Status oficiais:
- `todo` — A Fazer
- `delivered` — Entregue
- `cancelled` — Cancelado

## Aprovação
Aprovação nunca será automática sem ação explícita do usuário.

A ação “Confirmar orçamento” deve ser transacional:
1. validar orçamento;
2. marcar como aprovado;
3. criar serviço A Fazer;
4. copiar snapshot dos itens;
5. registrar evento;
6. impedir duplicação do serviço.

## Clientes
- cadastro completo;
- cadastro rápido no orçamento;
- orçamento mantém snapshot dos dados do cliente;
- edição futura do cliente não altera orçamento antigo.

## Produtos e Serviços
Uma única área serve para produtos e serviços.

Modos de cálculo iniciais:
- m²;
- metro linear;
- unidade;
- faixa de quantidade;
- valor fixo;
- manual;
- envelopamento por peças.

## Preço
O preço usado no orçamento deve ficar congelado em snapshot.

Alterar o cadastro do produto no futuro não pode alterar orçamento antigo.

## Envelopamento
O wizard será componente independente e retornará um item pronto ao editor de orçamento.

## Nome e identidade
O nome definitivo do app não bloqueia o desenvolvimento.
A identidade será centralizada em configuração/Brand component para poder trocar nome, logo e cores sem reescrever páginas.
