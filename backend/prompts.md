# Registro de uso de IA

A IA foi usada como copiloto no desenvolvimento do backend, como permitem as regras da Global Solution. Todo o código gerado foi revisado, executado e testado pela equipe, e cada integrante sabe explicar cada parte.

**Ferramenta:** Claude Code (Anthropic)

## Prompt principal

> Você é um engenheiro de software sênior cursando o terceiro ano de faculdade e está fazendo a GS CitizenTech (3ES Fev, FIAP 2026). Sua responsabilidade é a demanda de C# e SOA. Nossa solução é o Colecity, descrito em "colecity (cidade coletiva).txt" e em "Colecity_Posicionamento_Estrategico.pdf". Toque esta tarefa para tirar 10, fazendo somente o necessário para cumprir os critérios das duas matérias.

## Como a IA foi usada

| Etapa | O que foi pedido à IA | O que a equipe validou |
|-------|-----------------------|------------------------|
| Leitura dos requisitos | Extrair dos PDFs os critérios de avaliação de C# (POO, Web API, EF Core + LINQ, Async, Qualidade) e de SOA (Domínio, Banco, Migrações, Documentação, Testes) | Conferência com o enunciado oficial |
| Arquitetura | Propor uma arquitetura em camadas que atendesse às duas disciplinas com um único backend | Escolha de SQLite para rodar em qualquer máquina sem instalação |
| Domínio | Modelar ocorrências por módulo com herança e polimorfismo, e as regras do abaixo-assinado | Limites de apoios e pesos de urgência por módulo |
| Integração SPTrans | Implementar o cliente da API Olho Vivo (autenticação por cookie) e um cliente simulado com o mesmo contrato | Formato dos campos (`cl`, `lt`, `tl`, `sl`, `tp`, `ts`, `hr`, `vs`) conforme a documentação da SPTrans |
| Depuração | Corrigir consultas LINQ que o EF Core não conseguia traduzir no painel de indicadores (`GroupBy` com navegação e `OrderBy` sobre record construído) | Teste manual do endpoint e teste automatizado |
| Testes | Criar testes de domínio, de serviço (SQLite em memória com as migrations reais), do cliente HTTP e de integração da API | Execução de `dotnet test` (40 aprovados) |
| Documentação | Escrever README com Ficha da CitizenTech, instruções e mapeamento dos critérios | Revisão do texto e preenchimento dos integrantes |

## Segunda iteração: adequação ao contrato do time

> Neste mesmo workspace, rodei um git pull origin main, e meu colega de grupo comentou que talvez não esteja 100% condizente com a doc. Ele mandou o mobile dele também, mas entendo que o melhor seria adaptarmos nosso backend aqui, correto? Induzindo nossa matéria de SOA e C# para um 10.
>
> Então vamos mexer no nosso backend C#: adapte conforme a doc e tudo, e mesmo assim tiremos 10.

| Etapa | O que foi pedido à IA | O que a equipe validou |
|-------|-----------------------|------------------------|
| Análise de aderência | Comparar o backend com os docs 07, 08 e 10 e com os tipos do app (`mobile/src/types`) | Lista de divergências: rotas, autenticação BFF → domínio, 7 categorias, afetado x apoio, estados, erros com `code` |
| Domínio | Reescrever o domínio seguindo as regras RN-XXX do doc 07, com a política de cada categoria por polimorfismo | Regras conferidas uma a uma contra o doc 07 |
| Contrato | Implementar os endpoints, modelos, enums `UPPER_SNAKE_CASE`, paginação e Problem Details do doc 10 | Respostas comparadas com os exemplos do doc 10 e com o mock do app |
| Integrações | Geocodificação (Nominatim), amostra de GTFS, Olho Vivo com cache, outbox de eventos para o BFF | Decisão de usar dados simulados por padrão, com o caminho real documentado |
| Depuração | Corrigir a instância de value object owned compartilhada entre entidades (EF gravava nulo) e as datas sem `Z` do SQLite | Testes de regressão e testes manuais com `curl` |
| Testes | Testes de domínio, de aplicação com banco real, de tarefas e de integração HTTP | `dotnet test`: 107 aprovados |
