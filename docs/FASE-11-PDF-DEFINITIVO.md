# Fase 11 — PDF Definitivo

## Entregue

### Prévia A4
Rota:
`/orcamentos/:quoteId/pdf`

Mostra:
- logo;
- identidade da empresa;
- número;
- cliente;
- emissão;
- validade;
- previsão;
- itens;
- medidas/notas;
- subtotal;
- desconto;
- adicional;
- total;
- pagamento;
- mensagem;
- observações;
- termos.

### Download direto
O navegador gera o PDF localmente.

Não há servidor externo nem envio de dados para terceiros.

O gerador:
1. renderiza páginas A4 em Canvas;
2. suporta múltiplas páginas;
3. converte cada página em JPEG;
4. monta um arquivo PDF válido;
5. faz download com nome amigável.

### Compartilhar
Em navegadores/dispositivos que suportam Web Share com arquivos:
- gera PDF;
- abre o compartilhamento do sistema.

Em dispositivos incompatíveis, orienta usar Baixar PDF.

### Imprimir
A prévia possui estilo `@media print` em A4.

### Snapshot da empresa
Nova coluna:
`quotes.business_snapshot_json`

No primeiro save do orçamento são preservados:
- nome;
- razão social;
- CPF/CNPJ;
- contato;
- endereço;
- logo_path;
- cor principal.

Mudanças futuras em Configurações não alteram o documento antigo.

### Histórico de logos
A troca/remoção de logo deixa de apagar o arquivo anterior no Storage.
Isso é intencional: orçamentos antigos podem referenciá-lo.

## Próxima fase
Fase 12 — Gestão de Orçamentos.
