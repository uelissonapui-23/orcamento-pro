# Arquitetura técnica

## Stack

Frontend:
- React
- Vite
- Tailwind CSS
- React Router
- componentes acessíveis e responsivos

Backend:
- Supabase Auth
- PostgreSQL
- Supabase Storage
- RPCs PostgreSQL para operações transacionais
- RLS para isolamento

Infraestrutura:
- GitHub
- GitHub Actions
- Vercel
- PWA

## Separação de responsabilidades

### Pages
Orquestram tela e navegação. Não concentram fórmulas ou SQL.

### Components
Componentes visuais reutilizáveis.

### Services
Operações de negócio:
- quoteService
- clientService
- productService
- pricingService
- wrappingService
- jobService
- pdfService

### Repositories
Acesso Supabase quando necessário para manter queries fora das telas.

### Database/RPC
Operações que precisam ser atômicas e protegidas.

## Estrutura alvo

src/
  app/
  assets/
  components/
    brand/
    clients/
    products/
    quotes/
    wrapping/
    jobs/
    shared/
    ui/
  hooks/
  lib/
  pages/
  repositories/
  services/
  utils/

supabase/
  migrations/
  tests/

public/

.github/
  workflows/

docs/

## Regra de arquitetura

Uma página nunca deve:
- implementar cálculo complexo de preço;
- montar PDF inteiro;
- executar sequência crítica de múltiplos writes sem RPC/transação;
- conhecer detalhes de RLS;
- repetir normalização de moeda/medidas.

## CI/CD

Todo push em `main` deverá:
1. validar arquivos;
2. instalar dependências;
3. lint;
4. typecheck;
5. testes;
6. build;
7. aplicar migrations de produção;
8. permitir Vercel publicar.

Migrations devem ser idempotentes quando possível e possuir histórico controlado.
