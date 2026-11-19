# Mudanças da integração ponta a ponta (17–18/11/2026)

Este documento resume o que mudou no repositório para ligar as três partes do Colecity: **app (Expo) → BFF (Vercel) → API de domínio C# (Render)**. Também registra as correções feitas durante os testes manuais. As regras e decisões completas estão em `docs/` (principalmente os docs 06, 07, 08 e 10). Aqui fica o "o que mudou, onde e por quê".

Commits cobertos: de `e8194f3` a `7d6d0c5`, na branch `main`.

---

## 1. Visão geral

**Antes:**
- O app falava direto com o Firestore. Ocorrências, comentários e participações ficavam lá, com um script de seed.
- Havia uma `push-api/` na Vercel só para enviar notificações.
- A API de domínio em C# (`backend/`) existia, mas ninguém a chamava.

**Depois:**

```
App (Expo) --Bearer <ID token Firebase>--> BFF (Vercel) --X-Service-Key + X-User-Id--> API de domínio C# (Render) /api/v1
                                            ^                                                      |
                                            +------------ POST /eventos-dominio (outbox) ----------+
```

- **Domínio (C#):** é a única fonte das regras e dos dados (ocorrências, participações, comentários, denúncias e transporte).
- **BFF:** valida o login do Firebase, repassa ao domínio, guarda as fotos e envia os push.
- **Firestore:** ficou só com `users/{uid}`, os dados do próprio usuário (preferências, aparelhos para push, estado por ocorrência).

| Parte | Onde está | Endereço |
|---|---|---|
| API de domínio | Render (Docker, plano gratuito) | https://colecity.onrender.com/swagger |
| BFF | Vercel (funções serverless, plano Hobby) | https://push-api-rho.vercel.app/health |
| App | APK pelo EAS (perfil `preview`) | `npm run build:apk` em `mobile/` |

---

## 2. Backend (API de domínio C#)

A regra foi mexer o mínimo possível. Contrato e regras só mudaram onde o grupo decidiu, e isso está registrado nos docs (seção 2.3).

### 2.1 Publicação no Render
- **`backend/Dockerfile`** (novo):
  - Build multi-stage (`sdk:10.0` → `aspnet:10.0`).
  - Escuta na porta `$PORT` que o Render informa e roda com o usuário `app`, sem root.
  - SQLite em `/app/data/colecity.db`.
- **`backend/.dockerignore`** (novo): fora da imagem ficam `bin/`, `obj/`, `*.db`, `tests/` e `docs/`.
- **`backend/README.md`**: alterado só nas seções de execução e publicação.
  - Como rodar com Docker.
  - Variáveis do Render: `Seguranca__ServiceKey`, `Bff__EventosUrl`, `Bff__ServiceKey`, `SpTrans__Token`, `Seguranca__AdminKey` e `RateLimit__RequisicoesPorMinuto=120`.
  - Limitações do plano gratuito: banco recriado a cada deploy e serviço que dorme.
- **Outbox → BFF:** `Bff__EventosUrl` aponta para `https://push-api-rho.vercel.app/eventos-dominio`.

### 2.2 GTFS real da SPTrans
**Antes:** a API usava uma amostra **inventada** de 4 linhas, com uns 15 pontos por trajeto. No mapa, a linha passava por cima de quarteirões, enquanto os ônibus (reais, da Olho Vivo) apareciam em outras ruas. A detecção de desvio também usava esse trajeto falso.

**Agora:**
- **`backend/gtfs-sptrans/`** (novo) tem o GTFS oficial, baixado em 18/11/2026:
  - **1.326 linhas** de ônibus.
  - Só a primeira viagem de cada linha e sentido, que é a que a API usa.
  - Trajetos **simplificados por Douglas-Peucker a 10 m**: de 1,15 milhão para **177 mil pontos**, 5,6 MB no total.
  - O `LEIAME.md` da pasta explica como os arquivos foram gerados.
- **A importação acontece no build da imagem, e não na inicialização:**
  - `Program.cs` ganhou o modo `--preparar-banco`, que aplica as migrations, importa o GTFS e sai.
  - O Dockerfile roda esse modo no build e copia o banco pronto para a imagem.
  - Ao subir, a API vê que as linhas já existem e pula a importação. A semente roda na inicialização, porque as datas dela dependem do dia em que o servidor sobe.
- **`Gtfs:ReimportarDiariamente`** (nova opção, padrão `true`): fica `false` na imagem, porque lá os arquivos só mudam com um deploy novo.
- **Medição no limite do Render (512 MB, 0,1 CPU):**

  | Cenário | Tempo para subir | Memória |
  |---|---|---|
  | Importando na inicialização | ~2,5 min | 378 MB |
  | **Banco pronto na imagem** | **~36 s** | **73 MB** |

- **Sem mudança para o desenvolvimento local:** os testes e o `dotnet run` continuam com a amostra de 4 linhas (`src/Colecity.Infrastructure/Transporte/Gtfs`).
- **Semente:** o nome da linha 8700-10 passou a ser o oficial ("Term. Campo Limpo – Pça. Ramos de Azevedo").

### 2.3 Regras alteradas (decididas nos testes e registradas nos docs 06, 07 e 10)

| Mudança | Onde no código | Regra |
|---|---|---|
| Em ocorrência concluída, **ninguém exclui comentário**, nem o autor. A API responde `409 OCORRENCIA_CONCLUIDA` e a listagem traz `podeExcluir: false` | `ComentarioService.ExcluirAsync`, `OcorrenciaConsultas.ComentariosAsync` | RN-COM-04 |
| **Reabrir transfere a autoria**: quem reabre (precisa ser afetado) vira o autor, pode editar e concluir, e a ocorrência vai para as "Registradas" dessa pessoa. O autor anterior continua como afetado | `Ocorrencia.Reabrir` | RN-ACO-07 |
| Ao editar, as fotos que **já eram da ocorrência** continuam válidas mesmo na pasta do autor anterior; só as novas precisam estar na pasta de quem edita. Sem isso, o novo autor não conseguiria editar | `Ocorrencia.Editar` | RN-REG-09 |
| Ocorrências **nunca são apagadas**: o histórico fica para auditoria. Só ficou documentado; no código já era assim | — | RN-ACO-08 |
| A semente não traz mais a foto da ocorrência de falta de água, porque a imagem nunca existiu no armazenamento e o app mostrava "Foto indisponível" | `DataSeeder` | — |

**Testes:** entraram 2 testes novos, um para o comentário travado na conclusão e outro para a reabertura com transferência de autoria. **São 109 testes, todos passando.** Eles foram rodados no container `mcr.microsoft.com/dotnet/sdk:10.0`, porque o .NET não está instalado na máquina.

---

## 3. BFF (`bff/`, antes `push-api/`)

A pasta foi renomeada com `git mv`, o que preserva o histórico. O projeto continua o mesmo na Vercel, então a URL não mudou.

### 3.1 Rotas
| Rota | O que faz |
|---|---|
| Todas as rotas do app (`api/proxy.ts`) | Valida o ID token do Firebase e repassa ao domínio com `X-Service-Key` e `X-User-Id = uid`. Sem token, a chamada segue sem usuário: as consultas públicas funcionam e as rotas protegidas recebem `401`. Token inválido resulta em `401 NAO_AUTENTICADO` |
| `POST /fotos?destino=ocorrencias\|comentarios` | Guarda a foto no **Vercel Blob** e devolve `{ id, path, url }`. O caminho é decidido pelo BFF (`{destino}/{uid}/{id}.webp`) |
| `POST /eventos-dominio` | Chamada **pelo domínio** (outbox), com `X-Service-Key`. Substitui a antiga `/notificar`. Envia o push respeitando as preferências, as ocorrências silenciadas e o limite de 30 minutos por comentário |
| `GET /health` | Mostra a configuração, se o domínio está no ar e se as fotos estão configuradas. Lista só os **nomes** das variáveis que faltam |
| `/admin` | **Não exposta** ao app |

### 3.2 Detalhes importantes
- **Mapeamento de caminhos** (`src/rotas.ts`): o app usa caminhos agrupados por recurso, e o BFF converte para os do doc 10.
  - `/participacoes/{id}/afetado` vira `/ocorrencias/{id}/participacoes/afetado`.
  - `/comentarios/denuncias` vira `/denuncias`.
- **Recadastro automático** (`src/usuarios.ts`): quando o domínio responde `403 USUARIO_NAO_CADASTRADO`, o BFF cadastra o usuário e repete a chamada uma vez. Isso acontece no primeiro acesso ou quando o banco do Render foi recriado.
  - Os dados vêm do token e do aceite dos termos, guardado em `bffUsuarios/{uid}`.
  - Depois de `DELETE /usuarios/me`, o usuário não é recadastrado.
- **URLs das fotos** (`src/fotos.ts`): o domínio guarda só o `path`, e o BFF acrescenta a `url` pública em todas as respostas.
- **Eventos sem repetição** (`src/eventos.ts`): cada evento grava `eventosProcessados/{eventId}`. Se o envio falha, a marca é apagada para o domínio poder tentar de novo. Tokens que o Expo recusa (`DeviceNotRegistered`) são desativados.
- **Rate limit:** fica no domínio, por usuário. Funções serverless não guardam estado entre execuções, então um limite em memória no BFF não seria confiável.
- **Correção de fotos no Android (18/11):** o `fetch` do Android troca o `Content-Type`. Agora o BFF aceita qualquer `image/*` ou `application/octet-stream` e decide pela **assinatura do arquivo** (`RIFF....WEBP`). Quando recusa, registra no log só o tipo, o tamanho e os 12 primeiros bytes, sem nenhum dado pessoal.

### 3.3 Variáveis (Vercel)
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `DOMINIO_URL`, `DOMINIO_SERVICE_KEY`, `BLOB_READ_WRITE_TOKEN` e, opcionalmente, `BLOB_BASE_URL`. O `.env.example` traz só os nomes.

### 3.4 Publicação
O projeto da Vercel **não está ligado ao GitHub**, porque o repositório é de outra conta. Para publicar:

```bash
cd bff
npx vercel --prod
```

Na Vercel, o *Root Directory* fica vazio.

---

## 4. App (`mobile/`)

### 4.1 Integração
- **Fonte de dados** (`EXPO_PUBLIC_DATA_SOURCE`): `bff`, que é o padrão, ou `mock`. A opção `firestore` deixou de existir.
- **Adaptadores HTTP novos:**
  - `upload.http.ts`: envia as fotos ao BFF.
  - `tempoReal.http.ts`: consulta a cada 20 s enquanto o app está aberto.
- **Firestore só com `users/{uid}`:** `userData.firestore.ts` guarda o aceite dos termos, a preferência de notificações, as ocorrências silenciadas, a última visita e os aparelhos. O `firestore.rules` foi enxugado; todo o resto é negado.
- **Removidos:** a camada de domínio no Firestore (`firestore/base.ts`, `ocorrencia`, `comentario`, `participacao` e outros), o `scripts/seed-firestore.ts`, o script `seed` e as chamadas a `/notificar`.
- **Exclusão de conta**, nesta ordem: reautentica, `DELETE /usuarios/me` no BFF, limpa o Firestore e só então exclui a conta no Firebase Auth.
- **Push:** o app só registra o aparelho. A notificação nasce no domínio (outbox), passa pelo BFF e vai ao Expo Push Service.
- O **mock continua funcionando** e segue as mesmas regras novas.

### 4.2 Correções dos testes manuais (18/11)
| Problema relatado | Causa | Correção |
|---|---|---|
| Erro no Expo Go: `setNotificationChannelAsync` rejeitado | O app não reconhecia que estava no Expo Go | Detecção com `isRunningInExpoGo()`. O push fica protegido por `try/catch` e nunca derruba o app |
| Fotos da galeria: "Não foi possível usar esta foto" ao editar, concluir e comentar (Android) | O `fetch(...).blob()` do React Native passa os bytes por base64, e a foto chegava ao BFF sem a assinatura WebP (`415`) | Envio direto dos bytes do arquivo (`File` do `expo-file-system` com o `fetch` do Expo), além da correção no BFF (seção 3.2) |
| O mapa filtrado por "Água" ainda mostrava Zonas de atenção | As zonas ignoravam o filtro | As zonas seguem o filtro de categoria (`ExplorarMapa.tsx`) |
| No iPhone, a tela de comentários descia sozinha, com o círculo de carregamento | O indicador de "puxar para atualizar" ligava a cada atualização automática de 20 s | Hook `usePuxarParaAtualizar`: o indicador só aparece quando a pessoa puxa a tela. Vale para ocorrência, comentários, Explorar e Minhas |
| Linhas de ônibus | Antes havia só a amostra de 4 linhas | A aba Transporte diz que **todas as linhas de ônibus** da SPTrans estão na busca e sugere 4 como atalho. No mock, avisa que só existem as linhas fictícias |
| Excluir comentário em ocorrência concluída | Mudança de regra | O botão some (vem `podeExcluir: false` da API e do mock) |

**Atualizações:** `expo ~58.0.26`, `expo-dev-client ~58.0.21` e `expo-router ~58.0.32`, que são patches do SDK 58. Entrou também o `expo-file-system`.

**Verificações:** `tsc --noEmit` e ESLint limpos, sem `any`.

---

## 5. Documentação atualizada
- **`README.md` (raiz):** arquitetura, endereços, como rodar e ordem de publicação.
- **`docs/06-decisoes-e-perguntas.md`:** decisões 30 a 35.
  - 30: hospedagem no Render e na Vercel.
  - 31: fotos no Blob.
  - 32: Firestore só com `users`.
  - 33: comentário travado na conclusão.
  - 34: reabertura e auditoria.
  - 35: GTFS real.
- **`docs/07`:** RN-COM-04, RN-ACO-07 e RN-ACO-08 atualizadas.
- **`docs/08`:** nota sobre a integração ponta a ponta. As notas antigas foram marcadas como substituídas.
- **`docs/09`:** fonte de dados, push, fotos e linhas cobertas.
- **`docs/10`:** `409` ao excluir comentário em ocorrência concluída e efeito da reabertura.
- **`docs/14`:** variáveis do build do APK.
- **`bff/README.md` e `mobile/README.md`:** reescritos.
- **`backend/README.md`:** só as seções de execução e publicação.
- Os docs 11 e 12 (entrega de Testing) **não foram alterados**.

---

## 6. Operação

- **O Render não publica sozinho**, mesmo com *Auto-Deploy* ligado: o repositório é de outra conta e o webhook não chega. Depois de cada push que mexer em `backend/`, faça **Manual Deploy → Deploy latest commit**.
- **Cada deploy no Render recria o banco** e volta para a semente. Ocorrências de teste somem; as contas continuam, porque ficam no Firebase.
- **O Render gratuito dorme** depois de 15 minutos sem uso. Um job no cron-job.org chama `/health` a cada 5 minutos para mantê-lo acordado.
- **A Vercel não dorme.**
- **Push:** cada pessoa recebe no máximo 1 notificação de comentário por ocorrência a cada 30 minutos (RN-NOT-02). Mudanças de estado, como concluir e reabrir, sempre chegam.
- **Segredos:** nunca entram no repositório. O token da Olho Vivo e a credencial de serviço ficam só no Render e na Vercel. O `firebaseConfig.json` é a configuração pública do cliente e está versionado de propósito.

---

## 7. Pendências conhecidas
- **Layout com "Tamanho de exibição" grande no Android:** em alguns aparelhos o texto vaza. Faltam prints para localizar as telas.
- **Texto da aba Transporte:** a mudança só aparece num **APK novo**. O trajeto real e a busca completa vêm da API, então já funcionam no APK atual.
- **Em produção de verdade:** um banco persistente, como um PostgreSQL gerenciado, para que o histórico de auditoria sobreviva aos deploys. As regras não precisam mudar.
