# Fase 9 — Wizard de Envelopamento

## Objetivo
Transformar os cadastros das Fases 5, 7 e 8 em um fluxo simples, sem cálculo externo.

## Fluxo final
1. Tipo de veículo.
2. Modelo.
3. Peças.
4. Produto/serviço de envelopamento + material.
5. Ajustes opcionais.
6. Resumo e valor final.

## Cálculo
Para cada peça:
- área real;
- desperdício padrão da peça;
- área cobrada;
- preço do material por m²;
- multiplicador de dificuldade;
- subtotal da peça.

Depois o motor soma as peças e aplica, quando informados:
- adicional percentual;
- adicional fixo;
- desconto fixo.

O total nunca fica negativo.

## Snapshot
O resultado contém um snapshot completo de:
- produto;
- veículo;
- material;
- peças;
- parâmetros;
- ajustes;
- métricas;
- total.

Assim, mudar um cadastro depois não altera o cálculo histórico do orçamento.

## Saída para a Fase 10
`calculateWrappingPrice()` devolve `quoteItemDraft` no mesmo formato esperado pelo editor de orçamento:
- product_id;
- description;
- quantity;
- area;
- unit_price;
- total_price;
- calculation_mode;
- calculation_input_json;
- calculation_snapshot_json;
- notes.

## Teste visual
Em Cadastros > Envelopamento existe o botão **Testar wizard**. Ele permite validar o fluxo completo antes do Editor de Orçamento da Fase 10.
