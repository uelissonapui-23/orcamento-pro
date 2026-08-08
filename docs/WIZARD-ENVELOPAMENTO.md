# Wizard de envelopamento — especificação final

## Origem

Será reconstruído com base na lógica existente no `evoria-pro.zip`, principalmente:
- `src/pages/Quotes.jsx`;
- `src/pages/Wrapping.jsx`;
- `src/components/common/VehicleSelector.jsx`.

Não será copiada a dependência do Base44.

## Objetivo

Transformar seleção de veículo + peças + material em um item calculado pronto para o orçamento.

## Passos finais

### Passo 1 — Tipo
- Carro
- Moto
- Caminhonete
- Van
- Caminhão
- Outro

A lista será configurável.

### Passo 2 — Modelo
Busca por:
- marca;
- modelo;
- faixa de ano.

Permitir “Outro/personalizado” no futuro sem quebrar estrutura.

### Passo 3 — Peças
Mostrar peças ativas do modelo.

Cada peça:
- nome;
- área m²;
- tempo estimado;
- dificuldade;
- fator de dificuldade;
- raridade/exclusividade;
- desperdício;
- imagem opcional.

Seleção múltipla.

### Passo 4 — Material
Mostrar materiais com `use_in_wrapping = true`.

Exibir:
- nome;
- unidade;
- preço/custo relevante;
- largura do rolo quando aplicável.

### Passo 5 — Ajustes
Somente quando necessário:
- desperdício adicional;
- dificuldade;
- urgência;
- adicional manual;
- instalação/acabamento se habilitados.

A versão inicial deve esconder opções avançadas por padrão.

### Passo 6 — Resultado

Exibir:
- veículo;
- peças;
- área total;
- área com desperdício;
- material;
- tempo estimado;
- preço calculado;
- resumo do cálculo.

Botão único:
`Adicionar ao orçamento`.

## Saída do wizard

O wizard não grava orçamento diretamente.

Ele retorna um objeto padronizado:

- description
- quantity = 1
- area
- unit_price
- total_price
- material_id
- calculation_mode = wrapping
- wrapping_snapshot_json
- calculation_snapshot_json
- notes

O editor de orçamento decide quando salvar.

## Dados observados na referência Evoria

A base atual possui nas peças:
- `area_m2`;
- `estimated_time_minutes`;
- `difficulty_label`;
- `difficulty_factor`;
- `exclusivity_factor`/`rarity_factor`;
- `waste_percent`;
- imagem;
- notas.

O orçamento atual também salva snapshot das peças selecionadas e do cálculo. Esse comportamento será preservado por ser correto para histórico.

## Simplificação

O Evoria possui perfis de preço e diversos componentes de custo.
No novo app, o wizard começa com uma regra menor e legível.

A arquitetura deixa extensão preparada, mas opções avançadas só serão adicionadas se forem realmente necessárias.
