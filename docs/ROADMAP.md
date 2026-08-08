# Roadmap oficial — Orçamento Pro

## Situação atual

### ✅ Fase 0 — Plano Mestre
Concluída.
- visão;
- escopo;
- arquitetura;
- modelo de dados;
- automações;
- segurança;
- wizard mapeado;
- critérios de pronto.

### ✅ Fase 1 — Fundação técnica
Concluída.
- React/Vite;
- estrutura responsiva;
- PWA;
- Supabase;
- GitHub Actions;
- Vercel preparado;
- migrations;
- lint/typecheck/test/build.

### ✅ Fase 2 — Autenticação + Workspace + Segurança
Concluída.
- cadastro/login/logout;
- recuperação de senha;
- sessão;
- profile;
- workspace automático;
- RLS;
- isolamento.

### ✅ Fase 3 — Empresa + Configurações do PDF
Concluída.
- empresa;
- endereço;
- logo;
- identidade;
- validade/prazo;
- pagamento;
- mensagens/termos;
- defaults automáticos.

### ✅ Fase 4 — Clientes
Concluída.
- cadastro completo;
- cliente rápido;
- busca;
- edição;
- ativo/inativo;
- duplicidade;
- snapshot histórico.

### ✅ Fase 5 — Produtos e Serviços
Concluída.
- categorias;
- 7 modos de cobrança;
- formulário dinâmico;
- faixas;
- duplicação;
- RLS/RPC.

### ✅ Fase 6 — Motor de Preços
Concluída.
- m²;
- metro linear;
- unidade;
- faixa de quantidade;
- fixo;
- manual;
- mínimo;
- desperdício;
- subtotal/desconto/adicional;
- snapshots;
- adapter para quote_item;
- testes;
- preview de cálculo.

---

## Próximas fases

### ✅ Fase 7 — Materiais
Concluída.
- cadastro;
- categorias;
- unidade;
- largura de rolo;
- custo/preço;
- material padrão;
- flag envelopamento;
- ativo/inativo;
- integração com produtos e preparação do wizard.

### ✅ Fase 8 — Veículos e Peças
Concluída.
- tipos de veículo;
- modelos;
- marca/ano;
- peças;
- área;
- dificuldade;
- desperdício;
- tempo;
- duplicar modelo;
- copiar peças;
- imagens privadas.

### ✅ Fase 9 — Wizard de Envelopamento
Concluída.
- tipo e modelo;
- seleção de peças;
- material exclusivo de envelopamento;
- ajustes pontuais;
- cálculo automático por área, desperdício e dificuldade;
- tempo estimado;
- snapshot imutável;
- saída padronizada `quoteItemDraft` para a Fase 10.

### ✅ Fase 10 — Editor de Orçamento
Concluída.
- cliente;
- cliente rápido;
- itens;
- formulários por modo;
- pricingService;
- wizard;
- ordenar/remover itens;
- desconto/adicional;
- salvar/editar;
- snapshots;
- numeração;
- RPC atômica.

### ✅ Fase 11 — PDF Definitivo
Concluída.
- A4;
- logo;
- empresa;
- cliente;
- itens;
- medidas;
- valores;
- totais;
- termos;
- múltiplas páginas;
- prévia;
- download direto;
- imprimir;
- compartilhar;
- snapshot histórico da empresa.

### ✅ Fase 12 — Gestão de Orçamentos
Concluída.
- lista;
- busca;
- filtros;
- status;
- editar;
- duplicar;
- cancelar sem apagar;
- reabrir;
- PDF;
- aguardando resposta.

### ⏳ Fase 13 — Aprovação → A Fazer
- RPC atômica;
- aprovado;
- criação única de job;
- snapshot;
- eventos;
- prazo automático.

### ⏳ Fase 14 — A Fazer
- lista operacional;
- ordenação por entrega;
- atrasados;
- alertas visuais;
- WhatsApp;
- PDF;
- alterar prazo;
- marcar entregue.

### ⏳ Fase 15 — Entregues
- histórico;
- filtros;
- detalhes;
- PDF;
- duplicar orçamento.

### ⏳ Fase 16 — Home final
- aguardando resposta;
- a fazer;
- entregas próximas;
- atrasados;
- ações rápidas;
- sem gráficos desnecessários.

### ⏳ Fase 17 — Busca, Filtros e Duplicação
- busca global;
- cliente;
- telefone;
- número do orçamento;
- produto;
- veículo;
- índices.

### ⏳ Fase 18 — Automações avançadas da V1
- lembretes;
- recentes;
- favoritos/modelos quando aplicável;
- sugestões seguras;
- mensagens;
- redução de repetição.

### ⏳ Fase 19 — Auditoria completa
- bugs;
- sintaxe;
- console;
- segurança;
- RLS;
- isolamento A/B;
- RPC;
- Storage;
- dependências;
- performance.

### ⏳ Fase 20 — Homologação + V1.0
- celular;
- tablet;
- computador;
- PWA;
- fluxo ponta a ponta;
- Actions;
- Supabase;
- Vercel;
- checklist final.

## Progresso

Fases concluídas: **13 de 21 (0 a 20)**.

Blocos de fundação/cadastros concluídos:
- Fundação: 100%
- Segurança: 100%
- Empresa/PDF settings: 100%
- Clientes: 100%
- Produtos: 100%
- Motor de preços: 100%
- Materiais: 100%
- Veículos e peças: 100%
- Wizard de envelopamento: 100%
- Editor de orçamento: 100%
- PDF definitivo: 100%
- Gestão de orçamentos: 100%

Próximo foco: **Editor de Orçamento → PDF → Gestão de Orçamentos**.
