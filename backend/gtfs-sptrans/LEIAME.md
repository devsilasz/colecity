# GTFS da SPTrans (dados reais, trajetos simplificados)

Usado pela imagem Docker (Render), via `Gtfs__Diretorio=/app/gtfs`. Os testes e o `dotnet run`
local continuam com a amostra de `src/Colecity.Infrastructure/Transporte/Gtfs`.

- Origem: GTFS oficial da SPTrans (área logada de https://www.sptrans.com.br/desenvolvedores/), baixado em 18/11/2026.
- `routes.txt`: todas as linhas de ônibus (colunas do GTFS que a API lê).
- `trips.txt`: só a primeira viagem de cada linha e sentido, que é a que a API usa.
- `shapes.txt`: só os trajetos dessas viagens, simplificados por Douglas-Peucker com tolerância de 10 m
  (de 1,15 milhão para 177 mil pontos). A importação roda no build da imagem Docker (`--preparar-banco`),
  então a API sobe sem reimportar.

Para atualizar: baixe o GTFS novo e gere os três arquivos de novo com o mesmo filtro.
