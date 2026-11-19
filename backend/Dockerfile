# API de domínio Colecity — imagem para o Render (Web Service via Docker).
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/Colecity.Api/Colecity.Api.csproj -c Release -o /app/publish
# Banco já com as migrations e o GTFS real (backend/gtfs-sptrans), criado aqui no build:
# assim a API não reimporta 177 mil pontos de trajeto a cada inicialização no Render.
# As chaves abaixo são só para este passo (a API exige configuração para montar a aplicação).
RUN mkdir -p /app/data && \
    Seguranca__ServiceKey=build Seguranca__AdminKey=build \
    ConnectionStrings__Colecity="Data Source=/app/data/colecity.db" \
    Gtfs__Diretorio=/src/gtfs-sptrans \
    dotnet /app/publish/Colecity.Api.dll --preparar-banco

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
# SQLite no disco do container: o Render gratuito não tem disco persistente, então a cada
# reinício/deploy o banco volta ao da imagem (GTFS já importado) e recebe o seed de demonstração.
COPY --from=build --chown=app:app /app/data /app/data
COPY gtfs-sptrans/*.txt /app/gtfs/
USER app
ENV Gtfs__Diretorio=/app/gtfs \
    Gtfs__ReimportarDiariamente=false \
    ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__Colecity="Data Source=/app/data/colecity.db" \
    PORT=8080
EXPOSE 8080
# O Render informa a porta em $PORT.
CMD ["sh", "-c", "ASPNETCORE_HTTP_PORTS=$PORT exec dotnet Colecity.Api.dll"]
