# 08 — Arquitetura

Visão técnica do Colecity v1. As regras de negócio estão em [07 — Regras de negócio do produto](07-regras-de-negocio-produto.md); este documento diz **onde** cada regra é implementada e **como** as partes conversam.

## 1. Visão geral

```
┌──────────────────────┐        ┌─────────────────────────────────────────┐        ┌──────────────────────────┐
│   App Mobile (Expo)  │ HTTPS  │  BFF mobile — Firebase Cloud Functions  │ HTTPS  │ API de domínio (C#/.NET) │
│  React Native + TS   │───────►│  (TypeScript)                           │───────►│ Web API + EF Core        │
│  AsyncStorage        │        │  - valida token do Firebase Auth        │        │ Regras de negócio        │
│  Firebase Auth SDK   │        │  - monta respostas por tela             │◄───────│ Banco relacional         │
│  expo-notifications  │        │  - push via FCM                         │ eventos│ Integração SPTrans       │
└─────────┬────────────┘        │  - Firestore (dados do app)             │        └────────────┬─────────────┘
          │ upload direto       └─────────────────────────────────────────┘                     │
          ▼ (URL assinada)                                                                       ▼
┌──────────────────────┐        ┌──────────────────────┐                             ┌──────────────────────┐
│ Firebase Storage     │        │ Firebase Auth / FCM  │                             │ SPTrans: GTFS +      │
│ (fotos WebP)         │        │                      │                             │ API Olho Vivo v2.1   │
└──────────────────────┘        └──────────────────────┘                             └──────────────────────┘
```

Princípio: **o domínio não conhece plataformas.** Ele não sabe o que é Firebase, push, tela ou aparelho. Tudo o que é específico do app mobile fica no BFF ou no próprio app.

## 2. Plataforma: Firebase

Todos os serviços de infraestrutura do app ficam no Firebase, no plano **Blaze** (pago por uso, dentro da cota gratuita):

| Serviço | Uso |
|---|---|
| Firebase Authentication | Login com e-mail/senha e Google; sessão do app |
| Cloud Functions (2ª geração) | BFF mobile: funções HTTP nativas (`onRequest`) e agendadas, em TypeScript |
| Cloud Firestore | Dados do app (dispositivos, preferências, silenciamentos, última visita) |
| Cloud Storage | Fotos de ocorrências e comentários (WebP) |
| Firebase Cloud Messaging | Push no Android |

Configuração obrigatória do projeto Firebase: alerta de orçamento e limite de gasto nas Cloud Functions.

A API de domínio (C#) é hospedada pela equipe em servidor Linux, fora do Firebase.

## 3. Responsabilidades por camada

### 3.1 App mobile (Expo, React Native, TypeScript)
- Telas, navegação (Expo Router) e acessibilidade (RN-GER-01 a 05).
- Login e cadastro via SDK do Firebase Auth (e-mail/senha e Google). A sessão é mantida pelo SDK (RN-GER-13).
- Compressão de imagens antes do envio: WebP, maior lado ≤ 1920 px, qualidade ~0,7 (RN-REG-04).
- Upload das fotos direto para o Firebase Storage usando o caminho/permissão fornecido pelo BFF.
- Cache e offline com TanStack Query persistido no AsyncStorage; fila de ações offline sincronizada ao voltar a conexão (RN-GER-09, RN-GER-10).
- Grava **direto no Firestore**, protegido por regras de segurança, apenas os dados do próprio usuário: tokens de dispositivo, preferências de notificação, ocorrências silenciadas e última visita por ocorrência (RN-MIN-04, RN-NOT-04).
- Permissões de localização só no momento de uso (RN-GER-07).
- Transporte ao vivo: envio da posição enquanto a viagem estiver ativa e o app aberto (RN-TAV-04, 05, 08).
- Receber push e abrir a ocorrência por deep link (RN-NOT-05).
- Indicador de "novidade" (RN-MIN-04).
- Envia em toda chamada ao BFF o header `Authorization: Bearer <ID token do Firebase>`.

### 3.2 BFF mobile (Firebase Cloud Functions, TypeScript)
- Implementado com **Cloud Functions de 2ª geração** (`firebase-functions/v2`), em TypeScript, usando apenas recursos nativos do Firebase — sem framework web.
- Funções HTTP (`onRequest`) agrupadas por recurso; cada função trata internamente seus métodos e caminhos:

| Função | Responsabilidade |
|---|---|
| `health` | Health check (`GET`) |
| `ocorrencias` | Consulta, detalhe, registro, edição, conclusão, reabertura, semelhantes, mapa |
| `participacoes` | Afetado e apoio (marcar/retirar) |
| `comentarios` | Listar, criar, excluir, denunciar |
| `usuarios` | Primeiro acesso, perfil, aceite de termos, exclusão de conta, "minhas ocorrências" |
| `transporte` | Linhas, trajeto, posições, viagem, confirmação de desvio |
| `uploads` | Caminhos de upload no Storage |
| `eventosDominio` | Recebe eventos da API de domínio (credencial de serviço) e envia push |

- Código compartilhado entre funções (validação do token, cliente HTTP do domínio, respostas de erro padronizadas, rate limit) fica em módulos internos do projeto de functions.
- Região: `southamerica-east1` (São Paulo).
- Segredos (credencial de serviço do domínio, URL do domínio) via **Secret Manager** do Firebase (`defineSecret`).
- O app chama as funções por HTTPS com Axios (ver doc 09).
- Documentação dos endpoints do BFF no repositório (`functions/README.md`).
- Valida o ID token do Firebase em toda rota autenticada (`firebase-admin`), obtém o `uid` e repassa a identidade ao domínio.
- No primeiro acesso de um `uid`, garante que o usuário exista no domínio (com aceite de termos, RN-CON-01 e RN-CON-11).
- Monta respostas no formato de cada tela (ex.: a home combina lista + mapa de calor numa chamada).
- Valida entradas antes de repassar (formato, tamanho), sem reimplementar regras de negócio — a decisão final é sempre do domínio.
- Gera permissão de upload para o Storage e repassa ao domínio apenas a referência da foto.
- Lê do Firestore os tokens de push e preferências gravados pelo app.
- Recebe eventos do domínio e calcula no servidor quem deve receber push (nunca confia em lista de destinatários vinda do app), aplicando o agrupamento de comentários (máx. 1 push por ocorrência a cada 30 min) e o silenciamento (RN-NOT-02, RN-NOT-04).
- Proteção contra duplicidade: o mesmo evento (id do evento) nunca gera push repetido.
- Remove ou desativa tokens de push inválidos retornados pelo FCM.
- O texto do push não expõe dados sensíveis; o payload contém `occurrenceId` para o deep link.
- Rate limit da borda: 30 requisições/minuto por usuário ou IP (RN-GER-12).
- Exclusão de conta: anonimiza no domínio, apaga o usuário no Firebase Auth e remove os dados do Firestore (RN-CON-08).

### 3.3 API de domínio (C#/.NET, Web API, EF Core)
Dona de **todas** as regras de negócio do doc 07:
- Usuários do domínio (nome público, aceite de termos, anonimização).
- Ocorrências: categorias, tipos, registro, edição, título gerado, validação de território (município de São Paulo).
- Ocorrências semelhantes (RN-SEM).
- Participação e contagens (RN-PAR).
- Comentários e moderação (RN-COM, RN-MOD).
- Estados, conclusão, reabertura e encerramento automático (RN-ACO) — encerramento via tarefa agendada.
- Mapa de calor e Zona de atenção (RN-DES, RN-ZON) — agregações no banco (ex.: view materializada atualizada periodicamente).
- Transporte ao vivo: importação do GTFS, consulta à Olho Vivo, recebimento das posições, detecção de desvio (RN-TAV).
- Validação das fotos: aceita apenas referências de imagens WebP (RN-REG-04).
- Publica **eventos de domínio** consumidos pelo BFF (ver seção 5).
- Documentação Swagger, migrações e testes (critérios de C# e SOA).

## 4. Identidade e autenticação

1. O app autentica no Firebase Auth (e-mail/senha ou Google) e recebe um ID token.
2. Toda chamada ao BFF leva o ID token no header `Authorization`.
3. O BFF valida o token com `firebase-admin` e obtém `uid`, e-mail e nome.
4. O BFF chama o domínio identificando o usuário pelo `uid`. A comunicação BFF → domínio é protegida por credencial de serviço (chave/segredo conhecido só pelo BFF, guardado em variável de ambiente/secret do Firebase). O domínio não aceita chamadas sem essa credencial.
5. O domínio não guarda senha nem trata login; guarda `uid` (Firebase), nome público e aceite de termos.

Configurações do Firebase Auth exigidas pelas regras:
- Provedores: e-mail/senha e Google.
- Política de senha: mínimo 8 caracteres, exigir letra e número (RN-CON-03).
- Proteção contra enumeração de e-mails ativada (RN-CON-09).
- "Uma conta por endereço de e-mail" (RN-CON-12).

## 5. Eventos do domínio → BFF (push)

O domínio avisa o BFF quando algo relevante acontece, chamando um endpoint do BFF protegido por credencial de serviço. O BFF decide quem notificar e como.

| Evento | Quando | Dados mínimos |
|---|---|---|
| `ocorrencia.estado_alterado` | Concluída, reaberta, em acompanhamento | id da ocorrência, novo estado, ids dos participantes |
| `ocorrencia.comentario_criado` | Novo comentário | id da ocorrência, id do autor do comentário, ids dos participantes |
| `transporte.desvio_confirmado` | Desvio confirmado numa linha | código da linha, id da ocorrência, ids dos participantes |

Cada evento tem um `eventId` único. O domínio envia apenas ids; o BFF busca tokens de push e preferências no Firestore.

## 6. Fluxos principais

### 6.1 Registro de ocorrência com fotos
1. App comprime as fotos (WebP ≤ 1920 px).
2. App pede ao BFF permissão de upload; BFF devolve caminhos no Storage.
3. App envia as fotos direto ao Storage.
4. App chama o BFF para consultar semelhantes (categoria, tipo, localização) — RN-SEM-01.
5. Se a pessoa decide criar, app envia ao BFF os dados + referências das fotos; BFF repassa ao domínio, que valida tudo e cria a ocorrência.
6. Offline: os passos ficam na fila local e são executados na ordem quando a conexão volta (RN-GER-10).

### 6.2 Transporte ao vivo
1. Usuário toca em "Estou neste ônibus" e escolhe a linha (lista vinda do GTFS, via domínio).
2. Com o app aberto, envia posição periodicamente ao BFF, que repassa ao domínio.
3. O domínio compara com o trajeto oficial (GTFS shapes); se o desvio passar de 300 m por mais de 2 min, devolve um sinal para o app perguntar "O ônibus mudou de rota?" (RN-TAV-07).
4. As posições da Olho Vivo são consultadas pelo domínio (o token da SPTrans fica só no domínio).

## 7. Segredos e configuração

| Segredo | Onde fica | Nunca |
|---|---|---|
| Token da SPTrans (Olho Vivo) | Domínio C# (variável de ambiente / user-secrets) | No app, no BFF ou no repositório |
| Credencial de serviço BFF ↔ domínio | Secrets do Firebase Functions e variável de ambiente do domínio | No app ou no repositório |
| Conta de serviço do Firebase | Gerenciada pelo próprio Cloud Functions | No repositório |
| Configuração pública do Firebase (app) | No app (é pública por natureza) | — |

## 8. Firestore — estrutura e regras

```
users/{uid}
  notificationsEnabled: boolean
  updatedAt: timestamp
users/{uid}/devices/{deviceId}
  token: string
  platform: "android"
  enabled: boolean
  updatedAt: timestamp
users/{uid}/occurrenceState/{occurrenceId}
  muted: boolean
  lastSeenAt: timestamp
processedEvents/{eventId}        (somente BFF)
  processedAt: timestamp
```

> **Entrega de Mobile sem BFF:** enquanto o BFF e a API de domínio não existem, o app grava também as ocorrências no Firestore (`perfis`, `ocorrencias`, `participacoes`, `comentarios`, `denuncias`), com `EXPO_PUBLIC_DATA_SOURCE=firestore`. A estrutura e as regras dessa versão estão em `mobile/README.md` e `mobile/firestore.rules`. A estrutura abaixo é a da arquitetura alvo, em que o Firestore guarda só dados do próprio usuário.

Regras de segurança (versionadas no repositório do app em `firestore.rules`):
- `users/{uid}` e subcoleções: leitura e escrita apenas pelo próprio usuário autenticado (`request.auth.uid == uid`).
- Tokens de dispositivo nunca são legíveis por outros usuários.
- `processedEvents`: sem acesso pelo app (só o Admin SDK do BFF).
- Nenhuma regra aberta (`allow read, write: if true`).

## 9. Storage — regras

Regras versionadas em `storage.rules`:
- Escrita apenas em `ocorrencias/{uid}/**` e `comentarios/{uid}/**` pelo próprio usuário autenticado.
- Apenas `contentType == 'image/webp'` e tamanho ≤ 2 MB (RN-REG-04).
- Leitura pública das imagens (são exibidas em ocorrências públicas).
- Sem sobrescrita nem exclusão pelo app.

## 10. Banco do domínio
Definido pelo time do backend C#. Requisitos vindos das regras: consultas geográficas (raio de 300 m e 500 m, distância ao trajeto da linha) e agregações periódicas para mapa de calor e Zona de atenção.

Implementação (ver `backend/README.md`): EF Core com SQLite e migrations. As consultas por raio filtram por caixa delimitadora no banco e calculam a distância exata (Haversine) em memória; a distância ao trajeto usa projeção local sobre os pontos do GTFS. Zonas de atenção são recalculadas a cada 5 minutos para uma tabela própria; o mapa de calor é agregado no banco (GROUP BY com COUNT DISTINCT de afetados). Em produção, o caminho natural é PostgreSQL + PostGIS.

## 11. Contrato app ↔ BFF

- Base: `EXPO_PUBLIC_BFF_URL` = `https://southamerica-east1-<projeto>.cloudfunctions.net`. Cada recurso é uma função (seção 3.2); o caminho começa pelo nome da função.
- Os caminhos, modelos, enums, paginação e erros (`code`) **espelham o doc 10**, prefixados pela função:

| Doc 10 (domínio) | App → BFF |
|---|---|
| `/usuarios/me…` | `/usuarios/me…` |
| `/categorias`, `/ocorrencias…`, `/mapa/…` | `/ocorrencias/categorias`, `/ocorrencias…`, `/ocorrencias/mapa/…` |
| `/ocorrencias/{id}/participacoes/{afetado\|apoio}` | `/participacoes/{id}/{afetado\|apoio}` |
| `/ocorrencias/{id}/comentarios`, `/comentarios/{id}`, `/denuncias` | `/comentarios/ocorrencia/{id}`, `/comentarios/{id}`, `/comentarios/denuncias` |
| `/transporte/…` | `/transporte/…` |
| — | `/uploads` (caminhos de upload no Storage) |
| `/health` | `/health` |

- Autenticação: `Authorization: Bearer <ID token do Firebase>`. O app **nunca** envia `X-Service-Key` nem `X-User-Id`; quem os envia ao domínio é o BFF.
- `Idempotency-Key` é enviado pelo app nas criações (fila offline).
- O BFF pode acrescentar endpoints agregados por tela, mas os de cima são a base.

## Nota — push sem Cloud Functions (decisão de 17/11/2026)

O projeto Firebase está no plano Spark, sem Cloud Functions. Enquanto o BFF não existe, o push é enviado por uma API própria em `push-api/` (Node + TypeScript, Vercel), que cumpre as mesmas obrigações descritas para o BFF na seção de push: valida o ID token com o Admin SDK, confere o evento no Firestore, calcula os destinatários no servidor, evita duplicidade (`eventosProcessados`), aplica o limite de 30 minutos para comentários (`pushControle`), desativa tokens inválidos e tem health check. Diferenças: o gatilho vem do app (`POST /notificar` após comentar, concluir ou reabrir), não de eventos do domínio; o envio usa o Expo Push Service (que entrega via FCM); desvio de rota confirmado não gera push. Detalhes em `push-api/README.md`.

## Nota — fotos sem Firebase Storage (decisão de 17/11/2026)

Sem o plano Blaze, as fotos são guardadas no **Vercel Blob** pela API em `push-api/` (`POST /fotos`), que valida o ID token do Firebase e decide o caminho no servidor. O app não tem a chave do armazenamento. Quando o BFF existir, ele assume este endpoint.

## Nota — integração ponta a ponta (decisão de 18/11/2026)

Substitui as duas notas anteriores. O fluxo volta ao desenho original, com outra hospedagem:

```
App (Expo) --Bearer <ID token Firebase>--> BFF (Vercel) --X-Service-Key + X-User-Id--> API C# (Render) /api/v1
                                            ^                                                   |
                                            +---------- POST /eventos-dominio (outbox) ---------+
```

- **BFF** em `bff/` (Node + TypeScript na Vercel, antiga `push-api/`): valida o ID token, repassa ao domínio com a credencial de serviço, cadastra o usuário no primeiro acesso (`PUT /usuarios/me`), recebe os eventos do domínio e envia o push pelo Expo Push Service. As rotas seguem a seção 11, servidas sob a URL da Vercel.
- **Fotos:** os bytes ficam no Vercel Blob (`POST /fotos` do BFF, caminho `{ocorrencias|comentarios}/{uid}/{id}.webp`); o domínio guarda só o `path` e valida as regras. O BFF acrescenta a `url` pública nas respostas.
- **Domínio** no Render (plano gratuito): banco SQLite não persistente, recriado com seed a cada reinício; o serviço dorme sem uso.
- **Firestore:** só `users/{uid}`. As coleções de domínio do app foram removidas.
