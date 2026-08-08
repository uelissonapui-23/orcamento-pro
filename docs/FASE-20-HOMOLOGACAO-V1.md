# Fase 20 — Homologação + V1.0

## Versão
`1.0.0`

## Ajustes finais aplicados
- menu mobile "Mais" para Cadastros, Automações, Configurações e Perfil;
- bottom nav agora com 5 posições em telas móveis;
- PWA usa `autoUpdate`;
- `skipWaiting` + `clientsClaim`;
- manifest com idioma, id e ícone maskable;
- metadados móveis/iOS;
- headers Vercel reforçados;
- service worker e manifest sem cache incorreto;
- roadmap consolidado em 21/21 fases;
- versão exibida no app.

## Homologação funcional obrigatória

### 1. Conta e sessão
- criar conta;
- sair;
- entrar;
- recuperar senha;
- atualizar perfil;
- fechar e abrir PWA mantendo sessão esperada.

### 2. Configurações
- empresa;
- logo;
- endereço;
- cor;
- validade;
- prazo;
- pagamento;
- mensagem;
- termos.

### 3. Cadastros
- cliente completo;
- cliente rápido;
- produto;
- material;
- veículo;
- peças;
- duplicações;
- ativo/inativo.

### 4. Orçamento
- criar;
- todos os modos de cálculo usados no negócio;
- envelopamento;
- desconto;
- adicional;
- salvar rascunho;
- finalizar;
- reabrir.

### 5. PDF
- prévia;
- logo;
- cliente;
- itens;
- valores;
- 2+ páginas;
- baixar;
- imprimir;
- compartilhar no celular.

### 6. Operação
- marcar aguardando;
- aprovar;
- confirmar criação única em A Fazer;
- alterar prazo;
- alerta amarelo;
- alerta vermelho;
- iniciar;
- pronto;
- entregar;
- confirmar em Entregues.

### 7. Histórico
- detalhes;
- notas;
- PDF antigo;
- duplicar entregue;
- confirmar original intacto.

### 8. Home e busca
- métricas;
- atrasados;
- próximos;
- entregues hoje;
- Ctrl/Cmd+K;
- busca mobile;
- resultados de todos os tipos.

### 9. Automações
- configurações persistem;
- sugestões corretas;
- WhatsApp só abre após ação do usuário;
- favoritos/modelos.

### 10. Responsividade
Testar:
- 360/390 px;
- tablet retrato/paisagem;
- desktop 1366+;
- sem scroll horizontal indevido;
- dialogs utilizáveis;
- teclado não encobre ações críticas;
- menu Mais acessível.

### 11. PWA
- instalar;
- ícone correto;
- abre standalone;
- navegação funciona após reload em rota interna;
- atualização de deploy chega sem reinstalar;
- offline exibe shell quando já cacheado;
- operações de banco mostram erro de rede quando offline.

### 12. Produção
GitHub Actions:
- lint verde;
- typecheck verde;
- test verde;
- build verde.

Supabase:
- migrations 00100 a 01500 aplicadas;
- Auth funcionando;
- RLS ativa;
- bucket privado;
- nenhuma chave service_role no frontend.

Vercel:
- variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY;
- deploy Production verde;
- rotas internas recarregam;
- domínio HTTPS.

## Critério de aceite V1
A V1.0 pode ser considerada homologada após os testes acima passarem no ambiente real.
