# Colecity — BFF mobile

Backend for Frontend do app Colecity, em Node + TypeScript, publicado como funções serverless na **Vercel** (plano Hobby, gratuito). É a única porta de entrada do app:

```
App (Expo) --Bearer <ID token Firebase>--> BFF (Vercel) --X-Service-Key + X-User-Id--> API de domínio C# (Render) /api/v1
                                            ^                                                      |
                                            +------------ POST /eventos-dominio (outbox) ----------+
```

- Valida o **ID token do Firebase** (Admin SDK) e repassa ao domínio identificando o usuário pelo `uid`, com a credencial de serviço. O app nunca vê essa credencial.
- Guarda as **fotos** no Vercel Blob e devolve o `path` que o domínio aceita.
- Recebe os **eventos do domínio** e envia as **notificações push** pelo Expo Push Service.

Arquitetura completa no [doc 08](../docs/08-arquitetura.md); contrato do domínio no [doc 10](../docs/10-contrato-api-dominio.md).

## O projeto Colecity

**Colecity** é uma CitizenTech colaborativa para a cidade de São Paulo: moradores relatam problemas urbanos, veem no mapa onde eles se concentram e se juntam a quem enfrenta o mesmo problema, como afetados ou apoiadores. Projeto da Global Solution 2026/2 · FIAP.

| Parte | O que é |
|---|---|
| [`mobile/`](../mobile/README.md) | App do cidadão (React Native/Expo + Firebase Authentication) |
| **`bff/`** (este) | BFF mobile: autenticação, repasse ao domínio, fotos e push |
| [`backend/`](../backend/README.md) | API de domínio em C#/.NET: regras de negócio, banco e integração com a SPTrans |
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

## Rotas

### Repasse ao domínio

Os caminhos seguem o contrato app ↔ BFF (doc 08, seção 11): espelham o doc 10, agrupados por recurso. Modelos, paginação, `Idempotency-Key` e erros (Problem Details com `code`) são os do domínio, repassados sem alteração.

| App → BFF | BFF → domínio (`/api/v1`) |
|---|---|
| `/usuarios/me`, `/usuarios/me/ocorrencias` | igual |
| `/ocorrencias/categorias` | `/categorias` |
| `/ocorrencias/mapa/calor`, `/ocorrencias/mapa/zonas-atencao` | `/mapa/…` |
| `/ocorrencias…` | igual |
| `/participacoes/{id}/{afetado\|apoio}` | `/ocorrencias/{id}/participacoes/{tipo}` |
| `/comentarios/ocorrencia/{id}` | `/ocorrencias/{id}/comentarios` |
| `/comentarios/{id}` | `/comentarios/{id}` |
| `/comentarios/denuncias` | `/denuncias` |
| `/transporte/…` | igual |

- **Autenticação:** com `Authorization: Bearer <ID token>`, o BFF valida o token e envia `X-User-Id = uid`. Sem o header, a chamada segue sem usuário: as consultas públicas funcionam e as rotas 🔒 voltam `401` do domínio. Token inválido ou expirado → `401 NAO_AUTENTICADO`.
- **Cadastro no domínio:** o app chama `PUT /usuarios/me` no cadastro, com o aceite dos termos; o BFF usa o e-mail do token e guarda a versão aceita em `bffUsuarios/{uid}` no Firestore. Se o domínio responder `403 USUARIO_NAO_CADASTRADO` (primeiro acesso, ou banco do domínio recriado), o BFF cadastra o usuário com esses dados e repete a requisição uma vez. Depois de `DELETE /usuarios/me`, o registro é apagado e a conta não é recadastrada.
- **Fotos nas respostas:** o domínio guarda só o `path`; o BFF acrescenta `url` (endereço público do Blob) a cada foto.
- **Fora do BFF:** as rotas de moderação (`/admin`) não são expostas ao app.
- **Rate limit (RN-GER-12):** feito pelo domínio, por usuário (`X-User-Id`). Funções serverless não guardam estado entre execuções, então um limite em memória no BFF não seria confiável.

### `POST /fotos?destino=ocorrencias|comentarios`

Cabeçalhos: `Authorization: Bearer <ID token do Firebase>` e `Content-Type: image/webp`. Corpo: os bytes da foto.

O BFF confere o login, a assinatura WebP e o tamanho (≤ 2 MB) e **decide o caminho**: `{destino}/{uid}/{id}.webp`, o formato que o domínio aceita (doc 10, seção 3.1). Resposta `201`: `{ "id", "path", "url" }`. O app envia só o `path` ao criar a ocorrência, o comentário ou a conclusão.

Os bytes ficam no Vercel Blob, e não no domínio, por decisão registrada no doc 06 (item 31): o Render gratuito não tem disco persistente, e o domínio já é dono da referência e das regras.

| Status | `code` | Quando |
|---|---|---|
| 400 | `REQUISICAO_INVALIDA` | `destino` ausente ou inválido |
| 401 | `NAO_AUTENTICADO` | Sem token, ou token inválido/expirado |
| 413 | `FOTO_GRANDE_DEMAIS` | Mais de 2 MB |
| 415 | `FOTO_INVALIDA` | Não é WebP |

### `POST /eventos-dominio`

Chamado **pelo domínio** (padrão Outbox), nunca pelo app, com `X-Service-Key`. Corpo no formato do doc 10, seção 5:

```json
{
  "eventId": "uuid",
  "tipo": "ocorrencia.comentario_criado",
  "ocorridoEm": "2026-11-18T14:20:00Z",
  "dados": { "ocorrenciaId": "uuid", "titulo": "Buraco – Rua Aurora, República", "destinatariosUids": ["uid1"] }
}
```

1. Confere a credencial de serviço (comparação em tempo constante).
2. Descarta repetidos: grava `eventosProcessados/{eventId}`; se já existe, responde `DUPLICADO`. Se o envio falhar, a marca é apagada para a nova tentativa do domínio.
3. Os destinatários vêm calculados pelo domínio (autor, afetados e apoiadores, sem quem fez a ação). Para cada um, o BFF lê `users/{uid}` no Firestore e remove quem desligou as notificações ou silenciou a ocorrência (`occurrenceState/{id}.muted`).
4. Comentários: no máximo 1 push por ocorrência a cada 30 minutos por destinatário (`pushControle/{uid}_{ocorrenciaId}`).
5. Envia pelo Expo Push Service para os tokens em `users/{uid}/devices` com `enabled: true`; tokens recusados (`DeviceNotRegistered`) são desativados.

| `tipo` | Título | Corpo |
|---|---|---|
| `ocorrencia.comentario_criado` | Novo comentário | título da ocorrência |
| `ocorrencia.estado_alterado` | Ocorrência concluída / reaberta / em acompanhamento | título da ocorrência |
| `transporte.desvio_confirmado` | Desvio de rota confirmado | `Linha 8700-10 – <título>` |

O texto usa só o título público da ocorrência ("Tipo – Rua, Bairro"): nunca o conteúdo do comentário nem o nome de quem agiu. O payload leva `occurrenceId`, que o app usa para abrir a ocorrência. Tipo de evento desconhecido responde `200` com `TIPO_DESCONHECIDO`, para o domínio não repetir a entrega.

### `GET /health`

`200` quando o BFF está configurado; `503` com os **nomes** das variáveis ausentes (nunca valores). Informa também `dominioNoAr` (o Render gratuito dorme; `false` pode ser só o domínio acordando) e `fotosConfiguradas`.

## Variáveis de ambiente

| Variável | O que é |
|---|---|
| `FIREBASE_PROJECT_ID` | Campo `project_id` do JSON da conta de serviço do Firebase |
| `FIREBASE_CLIENT_EMAIL` | Campo `client_email` |
| `FIREBASE_PRIVATE_KEY` | Campo `private_key` (com `-----BEGIN PRIVATE KEY-----` e os `\n`; aspas em volta são aceitas) |
| `DOMINIO_URL` | URL da API de domínio, sem barra no final (ex.: `https://colecity.onrender.com`) |
| `DOMINIO_SERVICE_KEY` | Credencial de serviço: o **mesmo** valor de `Seguranca__ServiceKey` no Render. Vale nos dois sentidos (BFF → domínio e eventos domínio → BFF) |
| `BLOB_READ_WRITE_TOKEN` | Criada pela Vercel ao conectar o Blob ao projeto |
| `BLOB_BASE_URL` | Opcional. Endereço público do Blob; vazio = calculado a partir do token |

O JSON da conta de serviço sai do console do Firebase (Configurações do projeto → Contas de serviço → Gerar nova chave privada) e **nunca vai para o repositório**.

## Rodar local

Requer Node.js 20 ou mais novo.

```bash
cd bff
npm install
cp .env.example .env.local   # preencha os valores
npx vercel dev               # sobe em http://localhost:3000
```

Para usar o domínio local, rode o backend (ver [`backend/README.md`](../backend/README.md)) e aponte `DOMINIO_URL=http://localhost:5080` e `DOMINIO_SERVICE_KEY=dev-service-key-colecity`.

Verificações:

```bash
npm run typecheck
npm run lint
```

## Publicar na Vercel

O projeto da Vercel é o mesmo da antiga `push-api/` (URL https://push-api-rho.vercel.app). Ele **não está ligado ao GitHub** (o repositório pertence a outra conta), então cada mudança é publicada pelo terminal, de dentro desta pasta:

```bash
cd bff
npx vercel login      # uma vez
npx vercel link       # uma vez, se a pasta .vercel/ não existir: escolha o projeto push-api
npx vercel --prod
```

Como o terminal envia só esta pasta, o **Root Directory** do projeto fica **vazio**. Se o projeto for ligado ao GitHub no futuro, troque para `bff`.

Em **Settings → Environment Variables**, cadastre `DOMINIO_URL` e `DOMINIO_SERVICE_KEY` (as do Firebase e do Blob já existem). Publique de novo e confira `/health`: `"status": "ok"` e `"dominioNoAr": true`.

Depois, no Render, preencha `Bff__EventosUrl` com `https://<projeto>.vercel.app/eventos-dominio`.

## Estrutura

```
api/
  proxy.ts            todas as rotas que espelham o domínio
  fotos.ts            POST /fotos
  eventos-dominio.ts  POST /eventos-dominio
  health.ts           GET /health
src/
  auth.ts             validação do ID token
  dominio.ts          cliente da API de domínio (X-Service-Key, X-User-Id)
  rotas.ts            caminho do app → caminho do domínio
  usuarios.ts         cadastro e recadastro no domínio
  fotos.ts            URL pública das fotos
  eventos.ts          eventos do domínio → push
  expoPush.ts         envio pelo Expo Push Service
  textos.ts           título e corpo da notificação
  firebase.ts         Admin SDK (credencial por variáveis de ambiente)
  http.ts             erros (Problem Details) e utilitários
vercel.json           rewrites para /api/*
```
