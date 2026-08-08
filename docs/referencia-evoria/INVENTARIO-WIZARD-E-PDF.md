# Inventário da referência Evoria Pro

Arquivo analisado: `evoria-pro.zip`.

## Arquivos relevantes encontrados

- `src/pages/Quotes.jsx`
- `src/pages/Wrapping.jsx`
- `src/components/common/VehicleSelector.jsx`
- `src/components/common/PDFViewer.jsx`
- `src/pages/Clients.jsx`
- `src/pages/Materials.jsx`
- `src/pages/Products.jsx`

## Orçamento

`Quotes.jsx` contém:
- uso de `jsPDF`;
- `QuoteItem`;
- carga de `VehicleModel` e `VehiclePart`;
- materiais de envelopamento;
- cálculo avançado (`calcAdvancedQuoteItem`);
- criação do item de envelopamento;
- `wrapping_data`;
- `calculation_snapshot`;
- geração de PDF.

## Cálculo avançado observado

A referência considera, entre outros:
- material;
- mão de obra;
- instalação;
- acabamento;
- terceirização;
- frete;
- custo fixo;
- depreciação;
- perfil de preço;
- urgência;
- dificuldade;
- acabamentos antes/depois do markup.

O novo projeto NÃO começará com toda essa complexidade.

A arquitetura será extensível, mas a V1 usará modos de cobrança simples definidos em `MOTOR-DE-PRECOS.md`.

## Envelopamento observado

`Wrapping.jsx` mantém modelos e peças.

Campos de modelo observados:
- vehicle_type;
- brand;
- model;
- year_start/year_end;
- total_area;
- image_url;
- notes;
- is_active.

Campos de peça observados:
- name;
- part_category;
- area_m2;
- estimated_time_minutes;
- difficulty_label;
- difficulty_factor;
- exclusivity_label;
- exclusivity_factor;
- rarity_factor;
- waste_percent;
- image_url;
- notes;
- is_active.

## Snapshot observado

Ao adicionar envelopamento ao orçamento, a referência salva snapshot com:
- produto;
- material;
- perfil;
- veículo;
- peças selecionadas;
- área;
- dificuldade;
- raridade;
- desperdício;
- tempo;
- totais intermediários/finais.

Esse princípio será mantido porque protege o histórico do orçamento.

## Decisão

Reaproveitar:
- conceitos;
- campos úteis;
- sequência do wizard;
- snapshots;
- lógica de PDF como referência.

Não reaproveitar:
- Base44;
- tenant hardcoded;
- página gigante de Quotes;
- mistura de pricing/PDF/persistência/UI na mesma página;
- módulos de ERP não necessários.
