# Automações — princípio estrutural

## Objetivo

Eliminar tarefas repetitivas e diminuir erros de digitação sem retirar do usuário decisões importantes.

Regra:

> Automatizar cálculo, preenchimento, organização e transições previsíveis. Pedir confirmação em decisões comerciais ou destrutivas.

## Automações obrigatórias da V1

### Cadastro e padrões
- ao criar workspace, criar `business_settings`;
- aplicar validade padrão do orçamento;
- aplicar prazo padrão quando configurado;
- preencher mensagem/termos/pagamento padrão;
- lembrar último contexto útil quando seguro.

### Orçamento
- gerar número único automaticamente;
- preencher data de emissão;
- calcular validade;
- recalcular item ao alterar medida/quantidade;
- escolher regra do produto automaticamente;
- calcular subtotal;
- aplicar desconto/adicional;
- calcular total;
- salvar snapshot do cliente;
- salvar snapshot do produto/preço;
- ordenar itens;
- detectar formulário incompleto;
- gerar nome do PDF automaticamente.

### Cliente
- busca instantânea;
- cliente rápido;
- normalização de telefone/documento;
- evitar duplicidade óbvia;
- preencher dados do cliente no orçamento sem redigitar.

### Produtos
- ao escolher produto, abrir apenas campos necessários;
- aplicar material padrão quando configurado;
- aplicar unidade e preço padrão;
- selecionar faixa de quantidade automaticamente.

### Envelopamento
- filtrar modelos pelo tipo;
- filtrar peças pelo modelo;
- filtrar materiais compatíveis;
- somar áreas;
- calcular desperdício;
- somar tempo;
- calcular preço;
- gerar descrição do item;
- gerar snapshot técnico.

### PDF
- usar logo/dados da empresa automaticamente;
- usar snapshot do cliente;
- ordenar itens;
- incluir validade/pagamento/termos;
- gerar PDF com um clique;
- usar compartilhamento nativo em PWA quando suportado.

### Aprovação
Ao usuário clicar “Confirmar orçamento”:
- validar que ainda não existe job;
- marcar quote como approved;
- registrar approved_at;
- criar job;
- copiar cliente/total/dados necessários;
- calcular due_date pelo prazo quando aplicável;
- registrar quote_event/job_event;
- atualizar interface.

Tudo em transação/RPC para não existir quote aprovado sem job.

### A Fazer
- ordenar atrasados primeiro;
- depois entrega hoje;
- depois mais próximos;
- sem data por último;
- alertas visuais automáticos;
- calcular “atrasado há X dias”;
- calcular “vence em X dias”.

### Entrega
Ao clicar “Marcar entregue”:
- pedir confirmação;
- definir status delivered;
- preencher delivered_at;
- registrar evento;
- remover do A Fazer;
- aparecer em Entregues.

### Duplicação
Duplicar orçamento deve:
- criar novo número;
- status draft;
- data atual;
- nova validade;
- copiar itens/snapshots;
- nunca copiar aprovação/job antigo.

## Automações futuras já previstas

- lembrete de orçamento sem resposta;
- lembrete de entrega próxima;
- modelos/favoritos de orçamento;
- produtos recentes;
- preenchimento por histórico do cliente;
- sugestão de último material usado;
- templates de mensagem de WhatsApp.

Essas automações não serão necessárias para a primeira publicação, mas o banco/eventos será preparado para recebê-las sem refazer páginas.

## O que NÃO automatizar sem confirmação

- aprovar orçamento;
- recusar orçamento;
- cancelar;
- excluir;
- marcar entregue;
- alterar preço final de item;
- substituir desconto;
- enviar mensagem ao cliente.

## Automação técnica

GitHub Actions:
- lint;
- typecheck;
- testes;
- build;
- migration validation;
- deploy de migrations de produção;
- logs visíveis.

Banco:
- triggers somente para timestamps/integridade simples;
- operações multi-entidade em RPC;
- RLS como camada real de autorização.

PWA:
- checar nova versão e oferecer atualização;
- evitar cache agressivo de dados financeiros/comerciais privados.
