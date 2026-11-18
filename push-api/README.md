# Colecity — API (push e fotos)

API pequena em Node + TypeScript que envia as notificações push do app Colecity. Roda na **Vercel** (plano Hobby, gratuito) como funções serverless.

Ela existe porque o projeto Firebase está no plano Spark, sem Cloud Functions: o app não pode enviar push por conta própria (teria que carregar uma credencial administrativa), então avisa esta API que um evento aconteceu e ela decide o resto.

## O projeto Colecity

**Colecity** é uma CitizenTech colaborativa para a cidade de São Paulo: moradores relatam problemas urbanos, veem no mapa onde eles se concentram e se juntam a quem enfrenta o mesmo problema, como afetados ou apoiadores. Projeto da Global Solution 2026/2 · FIAP.

| Parte | O que é |
|---|---|
| [`mobile/`](../mobile/README.md) | App do cidadão (React Native/Expo + Firebase Authentication e Cloud Firestore) |
| **`push-api/`** (esta API) | Envio seguro das notificações push do app |
| [`backend/`](../backend/README.md) | API REST em C#/.NET com as regras de negócio e a integração com a SPTrans |
| [`docs/`](../docs/README.md) | Regras de negócio, arquitetura, features e casos de teste |

Visão geral e entregas por disciplina no [README da raiz](../README.md).

## Integrantes

| Nome | RM |
|---|---|
| Guilherme Oliveira | RM 558797 |
| Matheus Dantas | RM 558804 |
| Rafael Panhoca | RM 555014 |
| Silas Alves | RM 555020 |
| Victor Rodriguez | RM 559094 |

## O que ela faz

1. Recebe do app o aviso de um evento (`comentario`, `concluida` ou `reaberta`).
2. Valida o **ID token do Firebase** com o Admin SDK (`verifyIdToken`).
3. Confere no Firestore que a ocorrência existe e que o evento é real e foi feito por quem chamou:
   - `comentario`: o comentário existe, é desta ocorrência e é da conta autenticada;
   - `concluida`: a ocorrência está concluída, quem chamou é o autor e a data confere;
   - `reaberta`: a ocorrência não está mais concluída, há o evento "Reaberta" na linha do tempo (nos últimos 15 minutos) e quem chamou é um afetado.
4. Evita duplicidade: grava `eventosProcessados/{evento}_{eventoId}`; se já existe, não envia de novo.
5. **Calcula os destinatários no servidor**: autor, afetados e apoiadores da ocorrência. Remove quem fez a ação, quem desligou as notificações no perfil e quem silenciou a ocorrência. Nunca aceita lista de destinatários nem texto vindos do app.
6. Comentários: no máximo 1 push por ocorrência a cada 30 minutos por destinatário (`pushControle/{uid}_{ocorrenciaId}`).
7. Envia pelo **Expo Push Service** para os tokens em `users/{uid}/devices` com `enabled: true`.
8. Tokens recusados pelo Expo (`DeviceNotRegistered`) são desativados no Firestore (`enabled: false`).

O texto não tem dados sensíveis: só o tipo e o local aproximado, que já são públicos. Exemplo: título "Novo comentário", corpo "Falta de abastecimento – Rua Aurora, República". O payload leva `occurrenceId`, usado pelo app para abrir a ocorrência.

## Fotos (Vercel Blob)

O Firebase Storage exige o plano pago; as fotos ficam no **Vercel Blob**, ligado a este mesmo projeto.

1. O app comprime a foto em WebP (maior lado ≤ 1920 px, qualidade 0,7) e envia para `POST /fotos` com o ID token do Firebase.
2. A API confere o login, o tipo (assinatura WebP) e o tamanho (≤ 2 MB), e **decide o caminho**: `{destino}/{uid}/{id}.webp`. O app nunca escolhe onde gravar nem tem a chave do armazenamento.
3. A foto é guardada como pública (leitura aberta, como as ocorrências) e a API devolve `{ id, path, url }`.
4. O Firestore guarda só o caminho e a URL, nunca a imagem.

Configuração (uma vez): painel da Vercel → projeto **push-api** → **Storage** → **Create** → **Blob** → conectar ao projeto. A Vercel cria a variável `BLOB_READ_WRITE_TOKEN` sozinha. Depois, publique de novo (`npx vercel --prod`) e confira `"fotosConfiguradas": true` no `/health`.

## Endpoints

### `GET /health`

Health check. Responde `200` quando a API está no ar e configurada:

```json
{ "status": "ok", "servico": "colecity-push-api", "variaveisFaltando": [], "hora": "2026-11-17T12:00:00.000Z" }
```

Responde `503` com `status: "configuracao-incompleta"` e os **nomes** das variáveis que faltam (nunca valores).

### `POST /fotos?destino=ocorrencias|comentarios`

Cabeçalhos: `Authorization: Bearer <ID token do Firebase>` e `Content-Type: image/webp`. Corpo: os bytes da foto.

Resposta `201`: `{ "id": "…", "path": "ocorrencias/<uid>/<id>.webp", "url": "https://…blob.vercel-storage.com/…" }`

| Status | `erro` | Quando |
|---|---|---|
| 400 | `REQUISICAO_INVALIDA` | `destino` ausente ou inválido |
| 401 | `NAO_AUTENTICADO` | Sem token, ou token inválido/expirado |
| 413 | `FOTO_GRANDE_DEMAIS` | Mais de 2 MB |
| 415 | `FORMATO_INVALIDO` | Não é WebP |
| 500 | `ERRO_INTERNO` | Falha ao guardar (ex.: Blob não conectado) |

### `POST /notificar`

Cabeçalho: `Authorization: Bearer <ID token do Firebase>`.

```json
{ "ocorrenciaId": "abc123", "evento": "comentario", "eventoId": "id-do-comentario" }
```

| `evento` | `eventoId` |
|---|---|
| `comentario` | Id do comentário |
| `concluida` | `<ocorrenciaId>_concluida_<concluidaEm>` |
| `reaberta` | `<ocorrenciaId>_reaberta_<data da reabertura>` |

Resposta `200`:

```json
{ "enviado": true, "destinatarios": 3, "aparelhos": 4, "tokensDesativados": 0 }
```

Quando nada é enviado, `enviado` é `false` e `motivo` é `DUPLICADO` ou `SEM_DESTINATARIOS`.

| Status | `erro` | Quando |
|---|---|---|
| 400 | `REQUISICAO_INVALIDA` | Corpo ausente ou campos inválidos |
| 401 | `NAO_AUTENTICADO` | Sem token, ou token inválido/expirado |
| 403 | `SEM_PERMISSAO` | O evento não foi feito por quem chamou |
| 404 | `NAO_ENCONTRADO` | Ocorrência não existe |
| 405 | `METODO_NAO_PERMITIDO` | Método diferente de POST |
| 409 | `EVENTO_NAO_CONFERE` | O evento informado não aconteceu |
| 500 | `ERRO_INTERNO` | Falha inesperada (detalhes só no log da Vercel) |

## Variáveis de ambiente

Os valores vêm do JSON da conta de serviço do Firebase (console do Firebase → Configurações do projeto → Contas de serviço → Gerar nova chave privada). **Esse arquivo nunca vai para o repositório.**

| Variável | Campo do JSON |
|---|---|
| `FIREBASE_PROJECT_ID` | `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_PRIVATE_KEY` | `private_key` (o texto inteiro, com `-----BEGIN PRIVATE KEY-----` e os `\n`); aspas em volta são aceitas |
| `BLOB_READ_WRITE_TOKEN` | Criada pela Vercel ao conectar o Blob (ver "Fotos") |

## Rodar local

Requer Node.js 20 ou mais novo.

```bash
cd push-api
npm install
cp .env.example .env.local   # preencha os três valores
npx vercel dev               # sobe em http://localhost:3000
```

Teste: abra `http://localhost:3000/health`.

Verificações:

```bash
npm run typecheck
npm run lint
```

## Publicar na Vercel

1. Crie uma conta em https://vercel.com (plano Hobby).
2. No terminal:
   ```bash
   cd push-api
   npx vercel login
   npx vercel            # primeira vez: cria o projeto (aceite os padrões)
   ```
3. Cadastre as três variáveis no ambiente de produção (cada comando pede o valor):
   ```bash
   npx vercel env add FIREBASE_PROJECT_ID production
   npx vercel env add FIREBASE_CLIENT_EMAIL production
   npx vercel env add FIREBASE_PRIVATE_KEY production
   ```
   Também dá para cadastrar em vercel.com → projeto → Settings → Environment Variables.
4. Publique:
   ```bash
   npx vercel --prod
   ```
5. Abra `https://<seu-projeto>.vercel.app/health` e confira `"status": "ok"`.
6. Coloque essa URL (sem barra no final) em `EXPO_PUBLIC_PUSH_API_URL` no app: em `mobile/eas.json` (perfis `development` e `preview`) e em `mobile/.env.local`.

Se o projeto for importado pelo site da Vercel a partir do GitHub, defina **Root Directory** como `push-api`.

## Estrutura

```
api/
  notificar.ts   POST /notificar
  health.ts      GET /health
src/
  firebase.ts    Admin SDK (credencial por variáveis de ambiente)
  notificar.ts   confere o evento, calcula destinatários, envia
  expoPush.ts    envio pelo Expo Push Service
  textos.ts      título e corpo da notificação
  tipos.ts       tipos e erro HTTP
vercel.json      /notificar e /health → /api/*
```

## Limitações

- O terceiro gatilho da RN-NOT-02 (desvio de rota confirmado) não é notificado: o transporte ao vivo é simulado no app.
- O limite de 30 minutos descarta os comentários seguintes em vez de agrupá-los em uma notificação posterior, porque não há tarefa agendada no plano gratuito.
- Se o envio ao Expo falhar depois de o evento ser marcado como processado, a notificação daquele evento não é reenviada.
