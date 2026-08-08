# PWA e responsividade

## PWA desde a Fase 1

- manifest válido;
- ícones 192/512;
- favicon;
- `display: standalone`;
- theme/background color;
- service worker;
- estratégia de atualização;
- tela offline amigável;
- sem cache perigoso de dados privados.

## Mobile first

Larguras de validação:
- 320;
- 360;
- 390;
- 430;
- 768;
- 1024;
- 1366;
- 1920.

## Navegação

Mobile:
- barra inferior com 4 destinos principais;
- menu secundário para cadastros/configurações.

Desktop:
- sidebar;
- conteúdo com max-width adaptativo;
- não deixar grandes áreas vazias sem necessidade.

## Regras

- `min-width: 0` em grids/flex críticos;
- textos longos com wrap/truncate consciente;
- nenhum botão essencial fora da viewport;
- diálogo com `max-height` + scroll;
- safe area;
- teclado virtual não cobre ação principal;
- inputs de medida com teclado numérico;
- targets de toque adequados;
- tabela só quando realmente melhora desktop; usar cards no mobile.

## Editor de orçamento

No celular:
- cliente e resumo compactos;
- itens em cards;
- total fixável próximo ao rodapé quando fizer sentido;
- botão Adicionar item destacado;
- formulários em drawer/dialog responsivo.

No desktop:
- aproveitar largura para resumo lateral sem duplicar lógica.

## A Fazer

Priorizar leitura de relance:
- atraso em vermelho;
- hoje vermelho/laranja;
- até 3 dias laranja;
- até 7 dias amarelo;
- demais neutros.
