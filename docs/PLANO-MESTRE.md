# Plano Mestre

## 1. Visão

O aplicativo deve responder rapidamente a quatro perguntas:

1. O que preciso orçar?
2. Quais orçamentos ainda aguardam resposta?
3. Quais serviços foram aprovados e ainda preciso entregar?
4. O que já foi entregue?

Ele não será um ERP. Financeiro, estoque, compras, CRM complexo, produção industrial, assinaturas e outros módulos ficam fora da V1.

## 2. Navegação final

### Navegação principal
- Início
- Orçamentos
- A Fazer
- Entregues

### Navegação secundária
- Cadastros
  - Clientes
  - Produtos e Serviços
  - Materiais
  - Envelopamento
- Configurações
  - Empresa
  - PDF
  - Padrões do orçamento

No celular, a navegação principal deve permanecer com no máximo quatro destinos visíveis.

## 3. Fluxo diário principal

Novo orçamento
→ escolher/cadastrar cliente
→ adicionar produto/serviço
→ informar somente os campos exigidos pelo modo de cálculo
→ cálculo automático
→ salvar
→ gerar/compartilhar PDF
→ aguardar resposta
→ confirmar aprovação
→ criar serviço A Fazer automaticamente
→ marcar entregue
→ mover para histórico de Entregues.

## 4. Cadastros de baixa frequência

A complexidade deve ficar aqui:
- cliente;
- produto/serviço;
- regra de preço;
- material;
- veículo/modelo;
- peças;
- dados da empresa;
- padrão do PDF.

Depois de configurados, o orçamento diário deve exigir o mínimo de digitação.

## 5. Princípio de não retrabalho

Cada módulo só será declarado concluído quando incluir:
- banco final previsto;
- RLS;
- CRUD necessário;
- validação;
- estados loading/vazio/erro;
- responsividade;
- integração com módulos seguintes já prevista;
- auditoria mínima;
- testes de regressão principais.

Não serão criadas páginas “temporárias” que precisem ser substituídas depois.

## 6. Módulos finais

0. Planejamento e arquitetura
1. Fundação técnica
2. Autenticação, workspace e segurança
3. Empresa e PDF
4. Clientes
5. Produtos e Serviços
6. Motor de preços
7. Materiais
8. Veículos e peças
9. Wizard de envelopamento
10. Editor de orçamento
11. PDF definitivo
12. Gestão de orçamentos
13. Aprovação → A Fazer
14. A Fazer
15. Entregues
16. Home
17. Busca/filtros/duplicação
18. Automações avançadas
19. Auditoria de segurança e isolamento
20. Revisão PWA/responsividade e V1.0

## 7. Escopo deliberadamente fora da V1

- contas a pagar/receber;
- fluxo de caixa;
- estoque;
- fornecedores;
- compras;
- ordens de produção complexas;
- máquinas;
- comissões;
- CRM de oportunidades;
- assinaturas;
- planos pagos;
- anúncios;
- emissão fiscal.

Esses recursos só entram se houver necessidade real depois.
