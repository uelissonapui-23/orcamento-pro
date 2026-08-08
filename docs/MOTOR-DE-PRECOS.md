# Motor de preços

## Objetivo

O orçamento deve calcular automaticamente a maior parte dos itens a partir de configurações simples feitas uma vez.

A implementação ficará em `pricingService`, com funções puras testáveis.

## 1. Metro quadrado

Entrada:
- largura em metros;
- altura em metros;
- quantidade;
- preço por m²;
- desperdício opcional;
- mínimo opcional.

Fórmula base:
área_unitária = largura × altura
área_total = área_unitária × quantidade

Se desperdício for usado:
área_cobrada = área_total × (1 + desperdício/100)

valor = área_cobrada × preço_m²

valor_final = max(valor, mínimo), quando mínimo existir.

## 2. Metro linear

comprimento_total = comprimento × quantidade
valor = comprimento_total × preço_metro
aplicar mínimo se configurado.

## 3. Unidade

valor = quantidade × preço_unitário.

## 4. Faixa de quantidade

Encontrar a faixa onde:
min_quantity <= quantidade <= max_quantity

`max_quantity = null` significa sem teto.

A faixa poderá representar:
- valor total do lote; ou
- preço unitário da faixa.

Isso deve ser explícito em `price_mode`.

## 5. Valor fixo

valor = preço configurado.

Quantidade poderá multiplicar o fixo somente se o produto estiver configurado para isso.

## 6. Manual

Usuário informa o preço no orçamento.
Ainda assim o valor deve ser salvo em snapshot.

## 7. Envelopamento

Delegar para `wrappingService`.

## Snapshot obrigatório

Todo item deve salvar:
- modo de cálculo;
- inputs;
- preços usados;
- material usado;
- desperdício;
- resultado;
- versão/regra do cálculo.

Assim uma alteração futura no cadastro não muda documentos antigos.

## Validações

- valores negativos: proibidos;
- quantidade <= 0: proibida;
- dimensões obrigatórias conforme modo;
- evitar NaN/Infinity;
- arredondamento monetário centralizado;
- unidade exibida separadamente da unidade interna.

## Regra UX

O formulário de item mostra somente os campos exigidos pelo `calculation_mode`.
