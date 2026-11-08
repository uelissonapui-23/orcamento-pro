# Diagnóstico sintático da conexão (Ordem 04.4)

O script validate_connection_secret.py chama exclusivamente connection_env do
executor existente, com PROJECT e local=False. Não chama main do executor,
psql, subprocessos, sockets, SQL ou serviços remotos. Usa somente stdlib.
Não recebe URI por argumento. Lê SUPABASE_DB_URL da memória do processo e não
persiste seu valor. Retorna apenas mensagem fixa: COMPATÍVEL (exit 0),
INCOMPATÍVEL: URI fora do contrato OP-08 (exit 1), ou NÃO VERIFICÁVEL por ausência
ou falha interna (exit 2). Não imprime motivos provenientes de exceções.
Diagnósticos Python incidentais de importação/validação são capturados em memória,
nunca enviados a logs. O workflow desabilita escrita de bytecode.

Workflow manual separado: validate-connection-secret.yml. Somente workflow_dispatch,
job limitado a repositório esperado e refs/heads/main. Sem inputs ou ref escolhível
para checkout: usa github.sha da execução, nunca o HEAD de PR. Checkout fixado em
SHA, token contents:read, persist-credentials:false; secret somente na etapa final.
Sem instalação de pacotes, artefatos, caches ou comandos de conexão. O checkout
comunica-se com GitHub; o diagnóstico em si não estabelece conexão de rede.

A referência main e o código nela contido devem ter sido revisados antes do
acionamento. A checagem de ref não substitui revisão/proteção da branch nem impede
que alguém autorizado a modificar workflows altere suas proteções no futuro.
Este trabalho não muda permissões do repositório ou cria environment protegido.

Nesta ordem, somente testes sintéticos locais/CI. test-connection-secret.yml usa
pull_request, sem secrets, exercitando URIs fabricadas e funções de conexão
instrumentadas para falhar caso sejam chamadas. Não acionar workflow manual de
branch de PR para testar credencial. Nenhum secret real foi acessado.

Integração exige autorização própria. Depois do merge, execução com credencial
real exige autorização expressa separada e conferência do SHA revisado na main.
Uma execução manual em outra ref é ignorada pelo job; não é diagnóstico válido.
Resultado sintático compatível não comprova autenticação, rede, permissões ou
segurança de aplicar migrations. Não aciona nem libera o workflow de migrations.

Push/PR pode iniciar CI e Preview Vercel. Futuro merge pode publicar aplicação;
não dispara este diagnóstico nem migrations, ambos exclusivamente manuais.

Fontes: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch
https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
