# Fase 6 — Motor de Preços

## Objetivo

Centralizar toda a matemática de preço em funções puras, independentes de tela e banco.

Arquivo principal:
`src/services/pricingService.js`

## Modos implementados

### m²
Entradas:
- largura;
- altura;
- quantidade;
- desperdício.

Saídas:
- área unitária;
- área total;
- área cobrada;
- preço por m²;
- total bruto;
- mínimo aplicado;
- total final.

### Metro linear
- comprimento;
- quantidade;
- preço por metro;
- mínimo.

### Unidade
- quantidade;
- preço unitário;
- mínimo.

### Faixa de quantidade
Seleciona automaticamente a faixa correta.
Suporta:
- valor total da faixa;
- preço por unidade.

Se nenhuma faixa cobre a quantidade, retorna erro explícito.

### Valor fixo
Suporta:
- cobrar fixo uma vez;
- multiplicar fixo pela quantidade.

### Manual
Recebe preço digitado no orçamento.
Ainda gera snapshot.

### Envelopamento
Não calcula nesta fase.
Retorna:
`status = requires_wizard`

Contrato:
`delegated_to = wrappingService`

Assim não criamos fórmula provisória que teria que ser refeita no wizard.

## Snapshot

Todo cálculo retorna:
- engine_version;
- calculation_mode;
- product_id/name;
- inputs;
- preço utilizado;
- mínimo;
- desperdício;
- regra/faixa;
- métricas;
- total.

O futuro quote_item salvará esse snapshot.

## Adapter para orçamento

`quoteItemPricingService.js`

Transforma o resultado em um `quoteItemDraft` já compatível com a estrutura planejada:
- product_id;
- description;
- quantity;
- width/height;
- area;
- linear_meters;
- unit_price;
- total_price;
- calculation_mode;
- calculation_input_json;
- calculation_snapshot_json.

Isso evita reconstruir a integração na Fase 10.

## Totais do orçamento

`calculateQuoteTotals()` já centraliza:
- subtotal;
- desconto fixo;
- desconto percentual;
- adicional;
- total;
- proteção contra total negativo.

## Arredondamento

Valores monetários são arredondados a 2 casas em utilitário central `money.js`.

## Testes

Cobertura de:
- m²;
- desperdício;
- mínimo;
- metro linear;
- unidade;
- faixas total/unitário;
- quantidade fora de faixa;
- fixo;
- manual;
- delegação wrapping;
- subtotal/desconto/adicional;
- entradas inválidas.

## Preview

O cadastro de produto ganhou “Teste rápido do preço”.
Serve somente para validar a regra cadastrada.

A matemática continua em `pricingService`, não no componente.
