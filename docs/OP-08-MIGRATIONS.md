# OP-08 — executor de migrations

Somente Orçamento Pro. Python 3 e `psql`, sem bibliotecas adicionais.

## Contrato

`python3 scripts/apply_migrations.py --plan` valida o inventário sem conectar.
Em execução, `SUPABASE_PROJECT_ID` deve ser `aiblckekbiudkyrkywnz` e
`SUPABASE_DB_URL` deve identificar esse projeto por host/usuário/database.
São aceitos conexão direta e pooler Supabase nos formatos verificados, sem
query parameters na URI. SSL é obrigatório fora do teste local. Secrets não
são argumentos de processo nem são impressos. Nenhuma configuração remota é alterada.

Uma conexão executa um único lote transacional. O advisory lock de dois inteiros
`(1869639538, 808)` é exclusivo deste executor e adquirido antes da leitura do
histórico. Não é o lock de numeração comercial. O histórico é reconsultado sob
lock; nome divergente, versão desconhecida ou duplicada interrompem a execução.
Aplicação e registro só se confirmam no COMMIT final. Um erro reverte o lote
pendente inteiro. Versões já registradas não são reaplicadas.

O lexer reconhece comentários, strings, identificadores e corpos dollar-quoted;
remove somente o par externo exato `BEGIN;`/`COMMIT;` e mantém os demais bytes.
Os 21 arquivos históricos permanecem intactos (19 com par externo). Transações
intermediárias, comandos psql, SQL incompleto e comandos fora do contrato são
recusados. Isso não é um sandbox para SQL não confiável: migrations continuam
exigindo revisão humana, incluindo efeitos externos de funções chamadas.
NOTIFY é transacional e continua presente nos arquivos históricos.

Lock cooperativo: outros escritores devem usar o mesmo protocolo para coordenar.
Lock timeout: 10 segundos; statement timeout: 120 segundos; conexão: 10 segundos.
Não há retry. Falha/ausência de confirmação produz OP08_UNCONFIRMED. Mesmo que
a saída mostre APPLY, isso não comprova commit. Antes de qualquer nova tentativa,
consultar o histórico por leitura; perda da confirmação pode ocorrer após commit.
Erros detalhados de SQL não são emitidos, pois podem conter conteúdo sensível.

Não existe checksum retroativo no histórico. Não editar migrations já aplicadas.
Inconsistência legada requer diagnóstico e autorização própria; não apagar linhas
nem marcar versões automaticamente. Não executar replay histórico em produção.

## Testes

`python3 -m unittest discover -s tests -p 'test_migration_runner.py' -v`

Para integração real, preparar PostgreSQL descartável com database `op08_test`
e configurar `OP08_TEST_DB_URL` para loopback. O modo `--local-test` recusa host
remoto e databases sem esse prefixo. Os testes descartam apenas `orcamento_app`
nessa instância sintética. Sem PostgreSQL/psql, as integrações ficam SKIP.
O workflow test-migrations.yml usa PostgreSQL 17.6 e credencial fictícia local;
não lê secrets Supabase. Sua execução depende de publicação autorizada da branch.

## Gatilhos e liberação

Os gatilhos de produção foram preservados: push na main nos caminhos de SQL,
workflow e agora executor; também workflow_dispatch. Concurrency não cancela
execução em andamento. Push nesta branch não aciona esse workflow de SQL.
Um futuro merge com estes arquivos poderá acioná-lo e exige autorização expressa.

O projeto também possui integração Git da Vercel. Não presumir que branch de QA
evita preview automático. Sem comprovação de ausência de deployment, não fazer
push nem abrir PR nesta ordem. Não mudar silenciosamente a política de publicação.

Este trabalho não implementa OP-01, não altera migrations históricas nem aplica
SQL remoto. Não está pronto para liberação enquanto os testes PostgreSQL reais
não forem executados e revisados. Nenhum teste simulado comprova atomicidade real.
