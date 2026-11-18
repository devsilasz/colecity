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
| 20 | BFF mobile em Firebase Cloud Functions (2ª geração, HTTP nativo, TypeScript, sem framework web); plataforma Firebase completa (plano Blaze). |
| 21 | App grava direto no Firestore apenas dados do próprio usuário, com regras de segurança. |
| 22 | App: Expo SDK mais recente, Expo Router, Context API, Axios com interceptors, TanStack Query, AsyncStorage, formulário dinâmico por JSON, tema light/dark. |
| 23 | Fora da v1: compartilhamento, push no iOS, localização em segundo plano, Realtime Database, MQTT, comentários em tempo real, versão web. |
| 24 | API de domínio: .NET 10, EF Core com SQLite (o doc 08 deixa o banco com o backend). Consultas geográficas por caixa delimitadora no banco + distância exata em memória. |
| 25 | SPTrans: sem token, a API usa dados simulados com o mesmo contrato da Olho Vivo; com `SpTrans:Token`, usa a API real. GTFS: amostra de 4 linhas no formato oficial, trocável pelo GTFS completo (`Gtfs:Diretorio`). |
| 26 | Geocodificação reversa do título (RN-REG-07) pelo Nominatim (OpenStreetMap); se falhar, "Tipo – Localização aproximada" e uma tarefa completa depois. |
| 27 | Limite do município (RN-REG-06) por polígono simplificado do contorno de São Paulo; em produção, polígono oficial do GeoSampa/IBGE. |
| 28 | Eventos domínio → BFF pelo padrão Outbox (gravados na mesma transação, enviados em segundo plano com 3 tentativas). |
| 29 | Moderação: decisão `MANTER` reexibe o conteúdo e zera a contagem; `REMOVER` mantém oculto. Reabrir ocorrência não concluída → `409 OCORRENCIA_NAO_CONCLUIDA`; confirmar desvio sem suspeita → `422 DESVIO_NAO_DETECTADO`; cabeçalho de idempotência ausente → `400 IDEMPOTENCY_KEY_OBRIGATORIA`. |
