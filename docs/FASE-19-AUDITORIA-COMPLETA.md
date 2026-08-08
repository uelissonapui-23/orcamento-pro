# Fase 19 — Auditoria completa

## Escopo auditado
Projeto completo recebido após a Fase 18:
- autenticação;
- workspace/RLS;
- configurações;
- clientes;
- produtos/serviços;
- materiais;
- veículos e wizard;
- orçamento/editor;
- PDF/snapshot;
- gestão de orçamentos;
- aprovação;
- A Fazer;
- Entregues;
- Home;
- busca global;
- automações;
- responsividade estrutural;
- migrations e RPCs.

## Correções aplicadas

### 1. Home podia subcontar
A Home carregava no máximo 8 orçamentos aguardando resposta e 20 serviços em aberto antes de calcular os totais.
Isso fazia os cards exibirem números incorretos quando o volume crescesse.

Corrigido: os totais agora usam o conjunto completo permitido pela consulta.

### 2. Busca global de A Fazer podia perder resultados
A busca carregava somente os primeiros 80 serviços e depois filtrava no navegador.
Um serviço mais antigo poderia não ser encontrado.

Corrigido: `listWorkOrders` ganhou busca no banco por número, cliente, nome fantasia e documento.

### 3. Separação A Fazer x Entregues
O filtro "Todos" de A Fazer poderia incluir `delivered`.

Corrigido: "Todos" agora significa todos os estados operacionais daquela área, sem misturar Entregues.

### 4. Hardening de SECURITY DEFINER
Funções internas usadas exclusivamente por triggers tiveram EXECUTE externo revogado.
Helpers de membership continuam explicitamente disponíveis somente para `authenticated`.

### 5. Orçamentos aceitam `?q=`
Padronização de navegação por busca/filtro.

## Validação executada
- `npm run typecheck`: passou.
- `npm run lint`: passou após restaurar permissão dos executáveis trazidos do Windows.
- `npm run test` e `npm run build`: o código não chegou a executar porque o `node_modules` recebido é Windows e o ambiente de auditoria é Linux; falta o binário opcional Linux do Rollup.

Esse bloqueio é ambiental, não um erro TypeScript/lint do projeto.

## Observações para homologação
A Fase 20 deve executar o fluxo real ponta a ponta no ambiente local/produção:
cadastro → orçamento → PDF → aguardando resposta → aprovação → A Fazer → produção → pronto → entrega → histórico.

## Próxima fase
Fase 20 — Homologação e V1.0.
