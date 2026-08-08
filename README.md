# Orçamento App — Fase 1

Fundação técnica do novo aplicativo de orçamentos.

## O que já existe

- React + Vite;
- navegação responsiva definitiva;
- shell mobile/desktop;
- PWA;
- Supabase client;
- schema isolado `orcamento_app`;
- fundação de `profiles`, `workspaces` e `workspace_members`;
- RLS inicial;
- GitHub Actions para lint/typecheck/test/build;
- workflow de migrations Supabase;
- Vercel SPA + headers básicos;
- estrutura preparada para os módulos do Plano Mestre.

As páginas de negócio ainda aparecem como “Módulo preparado” de propósito. Não há implementação descartável.

## Rodar no VS Code

1. Extraia este ZIP em uma pasta nova.
2. Abra a pasta no VS Code.
3. Rode:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

O projeto abre normalmente mesmo antes de configurar Supabase; autenticação entra na Fase 2.

## Validar

```powershell
npm run check
```

## Supabase

Preencha `.env`:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

No GitHub, o workflow de produção espera:

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_ID
SUPABASE_DB_PASSWORD
```

## Publicação

Depois de criar o repositório:

```powershell
git init
git add .
git commit -m "Fase 1 - fundacao tecnica"
git branch -M main
git remote add origin SEU_REPOSITORIO
git push -u origin main
```

Conecte o repositório ao Vercel e cadastre as duas variáveis `VITE_...`.

## Próxima fase

Fase 2 — autenticação + bootstrap de workspace + segurança completa.


## Fase 2 concluída

A fundação agora inclui autenticação e workspace reais:
- cadastro/login/logout;
- reset de senha;
- rotas protegidas;
- perfil;
- bootstrap automático de workspace;
- RLS e isolamento.

Antes de testar, adicione `orcamento_app` aos schemas expostos na Data API do Supabase.

Próxima fase: Empresa + configurações do PDF.


## Fase 3 concluída

Configurações da empresa e fonte definitiva dos dados do PDF:
- dados comerciais;
- endereço;
- logo privada;
- identidade;
- validade/prazo;
- condições/mensagens/termos;
- automação de defaults para novos orçamentos.

Próxima fase: Clientes.


## Fase 4 concluída

Clientes:
- cadastro completo;
- cliente rápido;
- busca;
- edição;
- desativação;
- duplicidade controlada;
- snapshot histórico preparado;
- RLS.

Próxima fase: Produtos e Serviços.


## Fase 5 concluída

Produtos e Serviços:
- categorias;
- 7 modos de cobrança;
- preços mínimos;
- desperdício;
- faixas de quantidade;
- duplicação;
- formulário dinâmico;
- RLS e RPC transacional.

Próxima fase: Motor de preços.


## Fase 6 concluída

Motor de preços central:
- m²;
- metro linear;
- unidade;
- faixas;
- valor fixo;
- manual;
- mínimos;
- desperdício;
- desconto/adicional;
- snapshot versionado;
- adapter pronto para quote_item.

Próxima fase: Materiais.


## Fase 7 concluída

Materiais:
- categorias;
- unidades;
- largura de rolo;
- custo/preço;
- envelopamento;
- ativo/inativo;
- duplicação;
- material padrão integrado aos produtos.

Próxima fase: Veículos e Peças.


## Fase 8 concluída

Veículos e Peças:
- tipos;
- modelos;
- anos;
- peças;
- área/dificuldade/desperdício/tempo;
- duplicação;
- cópia de peças;
- imagens privadas;
- RLS/RPCs.

Próxima fase: Wizard de Envelopamento.


## Fase 10 concluída

Editor de orçamento funcional com cliente, produtos, cálculos, wizard, snapshots, totais e persistência atômica.

Próxima fase: PDF definitivo.


## Fase 11 concluída

PDF A4 definitivo com prévia, download, impressão, compartilhamento e snapshot histórico da empresa.

Próxima fase: Gestão de Orçamentos.


## Fase 12 concluída

Gestão de orçamentos com busca, filtros, duplicação, cancelamento, reabertura e acesso ao PDF.

Próxima fase: Aprovação → A Fazer.


## Fase 13 concluída

Aprovação atômica de orçamento com criação única de work_order em A Fazer e snapshots operacionais.

Próxima fase: A Fazer operacional.


## Fase 14 concluída

A Fazer operacional com prioridade por prazo, alertas, produção, pronto, entrega, WhatsApp e PDF.

Próxima fase: Entregues.


## Fase 15 concluída

Histórico de Entregues com busca, período, detalhes, PDF e duplicação.

Próxima fase: Home final.


## Fase 16 concluída

Home final operacional com prioridades, atrasados, próximos, aguardando resposta e ações rápidas.

Próxima fase: Busca global.


## Fase 17 concluída

Busca global com Ctrl/Cmd+K, navegação rápida, filtros por query e duplicação centralizada.

Próxima fase: Automações avançadas da V1.
