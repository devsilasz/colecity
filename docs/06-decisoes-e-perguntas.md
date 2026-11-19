# 06 — Registro de decisões

| # | Decisão |
|---|---|
| 1 | O projeto se chama Colecity; território: cidade de São Paulo. |
| 2 | Problema e solução conforme [01](01-visao-e-contexto.md). |
| 3 | Categorias da v1: Transporte, Água, Energia, Vias, Árvores, Segurança, Riscos e infraestrutura. |
| 4 | Consulta aberta; registrar, participar e comentar exigem conta. |
| 5 | Participação em duas formas separadas: "Também estou sendo afetado" e "Apoiar manifestação". |
| 6 | Ocorrências semelhantes são sugeridas durante o registro, sem bloquear a criação. |
| 7 | Gamificação/pontuação fora do produto. |
| 8 | Zona de atenção apenas para Segurança e Riscos e infraestrutura. |
| 9 | Mapa de calor por afetados distintos; destaque por afetados + apoios. Fusão de ocorrências apenas visual. |
| 10 | Ocorrências não são excluídas; só o autor conclui. |
| 11 | Comentários com fotos e moderação por denúncias (5 contas distintas). |
| 12 | Links em comentários não são classificados como oficiais. |
| 13 | Transporte ao vivo na v1 (GTFS + Olho Vivo + posição de passageiros + detecção de desvio). |
| 14 | Push na v1, somente Android. |
| 15 | Login com e-mail/senha e Google via Firebase Authentication. |
| 16 | Exclusão de conta imediata para o usuário, implementada por anonimização. |
| 17 | Fotos enviadas apenas em WebP, comprimidas no aparelho. |
| 18 | Testing cobre só o ecossistema da plataforma. |
| 19 | C# e SOA entregam a mesma API de domínio. |
| 20 | BFF mobile em Firebase Cloud Functions (2ª geração, HTTP nativo, TypeScript, sem framework web); plataforma Firebase completa (plano Blaze). *Substituída pelas decisões 30 a 32: sem cartão para o Blaze, o BFF foi para a Vercel.* |
| 21 | App grava direto no Firestore apenas dados do próprio usuário, com regras de segurança. |
| 22 | App: Expo SDK mais recente, Expo Router, Context API, Axios com interceptors, TanStack Query, AsyncStorage, formulário dinâmico por JSON, tema light/dark. |
| 23 | Fora da v1: compartilhamento, push no iOS, localização em segundo plano, Realtime Database, MQTT, comentários em tempo real, versão web. |
| 24 | API de domínio: .NET 10, EF Core com SQLite (o doc 08 deixa o banco com o backend). Consultas geográficas por caixa delimitadora no banco + distância exata em memória. |
| 25 | SPTrans: sem token, a API usa dados simulados com o mesmo contrato da Olho Vivo; com `SpTrans:Token`, usa a API real. GTFS: amostra de 4 linhas no formato oficial, trocável pelo GTFS completo (`Gtfs:Diretorio`). |
| 26 | Geocodificação reversa do título (RN-REG-07) pelo Nominatim (OpenStreetMap); se falhar, "Tipo – Localização aproximada" e uma tarefa completa depois. |
| 27 | Limite do município (RN-REG-06) por polígono simplificado do contorno de São Paulo; em produção, polígono oficial do GeoSampa/IBGE. |
| 28 | Eventos domínio → BFF pelo padrão Outbox (gravados na mesma transação, enviados em segundo plano com 3 tentativas). |
| 29 | Moderação: decisão `MANTER` reexibe o conteúdo e zera a contagem; `REMOVER` mantém oculto. Reabrir ocorrência não concluída → `409 OCORRENCIA_NAO_CONCLUIDA`; confirmar desvio sem suspeita → `422 DESVIO_NAO_DETECTADO`; cabeçalho de idempotência ausente → `400 IDEMPOTENCY_KEY_OBRIGATORIA`. |
| 30 | (18/11/2026) Hospedagem gratuita sem cartão: API de domínio no **Render** (Web Service via Docker, SQLite no disco do container, recriado com migrations e seed a cada reinício); BFF na **Vercel** (Hobby, a antiga `push-api/` renomeada para `bff/`), substituindo as Cloud Functions da decisão 20. |
| 31 | (18/11/2026) Fotos: os bytes ficam no **Vercel Blob**, enviados pelo BFF (`POST /fotos`); o domínio é dono só da referência (`path`) e das regras (doc 10, seção 3.1). Guardar o binário no domínio exigiria disco persistente, que o plano gratuito do Render não tem, e mudaria o contrato. |
| 32 | (18/11/2026) Firestore fica só com `users/{uid}` (preferências, tokens de push, estado por ocorrência); todo o domínio vem da API C# pelo BFF. Push nasce no domínio (outbox → `POST /eventos-dominio` do BFF), não mais no app. |
| 33 | (18/11/2026) Ocorrência concluída é só consulta: o autor também não exclui mais o próprio comentário (RN-COM-04, `409 OCORRENCIA_CONCLUIDA`). |
| 34 | (18/11/2026) Reabertura transfere a autoria para quem reabriu; o autor anterior segue como afetado (RN-ACO-07). Ocorrências nunca são apagadas: ficam para auditoria (RN-ACO-08). Na hospedagem gratuita o banco é recriado a cada reinício do Render; em produção, banco persistente (PostgreSQL gerenciado), sem mudança de regra. A semente de demonstração não traz mais foto (a imagem nunca existiu no Blob). |
| 35 | (18/11/2026) Produção usa o GTFS real da SPTrans (`backend/gtfs-sptrans/`, via `Gtfs__Diretorio` na imagem Docker): todas as linhas de ônibus, primeira viagem por sentido, trajetos simplificados por Douglas-Peucker a 10 m (177 mil pontos). A importação roda no build da imagem (`--preparar-banco`), não na inicialização: no limite do Render a API sobe em ~36 s com 73 MB (antes, ~2,5 min e 378 MB); reimportação diária desligada na imagem. A amostra de 4 linhas continua para os testes e o `dotnet run` local. |
| 36 | (19/11/2026) Push sem o limite de 30 minutos: todo comentário notifica (RN-NOT-02). Canal Android `ocorrencias-alerta` de importância máxima, com som e vibração, inclusive com o app aberto. O domínio envia o outbox a cada 2 s (antes 10 s). |
