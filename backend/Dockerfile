# API de domínio Colecity — imagem para o Render (Web Service via Docker).
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/Colecity.Api/Colecity.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
# SQLite no disco do container: o Render gratuito não tem disco persistente, então a cada
# reinício/deploy o banco é recriado (migrations + seed de demonstração na inicialização).
RUN mkdir -p /app/data && chown -R app:app /app/data
USER app
COPY gtfs-sptrans/*.txt /app/gtfs/
ENV Gtfs__Diretorio=/app/gtfs
ENV ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__Colecity="Data Source=/app/data/colecity.db" \
    PORT=8080
EXPOSE 8080
# O Render informa a porta em $PORT.
CMD ["sh", "-c", "ASPNETCORE_HTTP_PORTS=$PORT exec dotnet Colecity.Api.dll"]
