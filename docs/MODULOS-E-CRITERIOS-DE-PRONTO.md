# Módulos e critérios de pronto

Um módulo não é “concluído” só porque a página abre.

## 1. Fundação
Pronto quando:
- projeto roda local;
- lint/typecheck/build verdes;
- env exemplo;
- GitHub;
- Actions;
- Supabase;
- Vercel;
- PWA instalável;
- deploy automático.

## 2. Auth/Workspace
Pronto quando:
- cadastro/login/logout/reset;
- bootstrap de workspace;
- membership;
- RLS testado com dois usuários;
- rotas protegidas.

## 3. Empresa/PDF
Pronto quando:
- CRUD dos dados;
- upload logo;
- padrões;
- preview;
- persistência;
- responsivo.

## 4. Clientes
Pronto quando:
- criar/editar/desativar;
- busca;
- cliente rápido;
- histórico preparado;
- validações;
- snapshot integrado ao quoteService.

## 5. Produtos
Pronto quando:
- CRUD;
- categorias;
- todos os modos previstos no schema;
- formulário dinâmico;
- faixas de quantidade;
- inativação;
- duplicação opcional.

## 6. Pricing
Pronto quando:
- funções puras;
- testes para cada modo;
- arredondamento;
- mínimo;
- tiers;
- snapshots.

## 7. Materiais
Pronto quando:
- CRUD;
- filtro envelopamento;
- material padrão;
- inativação segura.

## 8. Veículos/Peças
Pronto quando:
- CRUD modelo;
- CRUD peça;
- duplicar modelo;
- copiar peças;
- ordenação;
- filtros;
- imagens opcionais.

## 9. Wizard
Pronto quando:
- fluxo completo;
- cálculo;
- snapshots;
- retorno padronizado;
- mobile/desktop;
- teste com múltiplas peças.

## 10. Editor de orçamento
Pronto quando:
- criar/editar;
- cliente rápido;
- item manual;
- todos os modos;
- wizard;
- reordenar;
- desconto/adicional;
- autosave controlado ou save explícito confiável;
- evitar duplo submit.

## 11. PDF
Pronto quando:
- layout A4;
- logo;
- cliente;
- itens;
- medidas;
- totais;
- termos;
- acentos;
- quebra de página;
- compartilhamento;
- snapshot.

## 12. Gestão de orçamentos
Pronto quando:
- filtros/status;
- busca;
- editar;
- duplicar;
- cancelar;
- confirmar;
- PDF;
- ordenação.

## 13. Aprovação
Pronto quando:
- RPC atômica;
- idempotente;
- quote aprovado;
- job criado uma vez;
- evento registrado.

## 14. A Fazer
Pronto quando:
- ordenação por prazo;
- alertas;
- alterar data;
- detalhes;
- WhatsApp;
- PDF;
- marcar entregue.

## 15. Entregues
Pronto quando:
- histórico;
- filtros;
- detalhes;
- PDF;
- duplicação.

## 16. Home
Pronto quando:
- indicadores úteis;
- atrasados;
- próximos;
- aguardando resposta;
- ações rápidas;
- sem gráficos supérfluos.

## 17. Busca
Pronto quando:
- cliente;
- telefone;
- quote number;
- produto;
- veículo;
- índices adequados.

## 18. Automações
Pronto quando:
- regras do documento AUTOMAÇÕES implementadas;
- ações idempotentes;
- mensagens claras;
- sem decisão comercial automática indevida.

## 19. Segurança
Pronto quando:
- RLS auditado;
- storage;
- RPCs;
- isolamento A/B;
- dependências;
- headers;
- console limpo.

## 20. V1
Pronto quando:
- desktop/tablet/mobile validados;
- PWA instalada;
- build production;
- Actions/Vercel verdes;
- checklist ponta a ponta.
