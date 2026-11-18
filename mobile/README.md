# Colecity — App Mobile

App da CitizenTech **Colecity** (Global Solution 2026/2 · FIAP), desenvolvido em React Native com Expo e TypeScript.

O Colecity é um app colaborativo para relatar, acompanhar e se mobilizar em torno de problemas urbanos da cidade de São Paulo: falta de água, buracos, ônibus fora de rota, árvores caídas, pontos inseguros.

> O Colecity não é um canal oficial da Prefeitura e não encaminha manifestações a órgãos públicos.

## O projeto Colecity

O app é uma das partes da solução Colecity, organizada em um único repositório:

| Parte | O que é |
|---|---|
| **`mobile/`** (este app) | Porta de entrada do cidadão: consulta, registro, participação, acompanhamento e transporte ao vivo |
| [`push-api/`](../push-api/README.md) | API que valida o usuário, calcula os destinatários e envia as notificações push |
| [`backend/`](../backend/README.md) | API REST em C#/.NET com as regras de negócio, banco de dados e cruzamento dos relatos de transporte com a SPTrans |
| [`docs/`](../docs/README.md) | Regras de negócio, arquitetura, features e casos de teste |

Visão geral e entregas por disciplina no [README da raiz](../README.md).

## Integrantes

| Nome | RM |
|------|----|
| Guilherme Oliveira | RM 558797 |
| Matheus Dantas | RM 558804 |
| Rafael Panhoca | RM 555014 |
| Silas Alves | RM 555020 |
| Victor Rodriguez | RM 559094 |

## Vídeo

<!-- Preencher com o link do vídeo de até 3 minutos. -->

_Link do vídeo: a preencher._

## Ficha da CitizenTech

- **Nome:** Colecity.
- **Cidade:** São Paulo, SP.
- **Público:** moradores e usuários de serviços urbanos da cidade.
- **Problema:** dificuldade de conhecer e reunir informações e manifestações sobre problemas urbanos compartilhados.
- **Como funciona:** app em que o cidadão consulta, registra e acompanha ocorrências por categoria e localização, com participação coletiva.
- **Tecnologias:** app React Native/Expo com Firebase (Authentication e Cloud Firestore), push pelo FCM e Expo Push com API própria na Vercel, backend em C#/.NET com dados da SPTrans (Olho Vivo).
- **Indicadores:** ocorrências registradas, afetados e apoios por ocorrência, ocorrências concluídas, desvios de rota detectados.
- **ODS:** 11 (Cidades e comunidades sustentáveis), 10 (Redução das desigualdades), 9 (Indústria, inovação e infraestrutura).

## O que o app faz

- **Explorar:** lista e mapa das ocorrências, com filtros de categoria, estado e distância, mapa de calor e Zonas de atenção. Aberto a visitantes.
- **Registrar:** categoria, tipo e localização; sugestão de ocorrências semelhantes; formulário gerado por JSON, com fotos.
- **Participar:** "Também estou sendo afetado" e "Apoiar manifestação", com contagens separadas; comentários; denúncia de conteúdo.
- **Minhas:** o que registrei, o que me afeta e o que apoio, com indicador de novidade; concluir e reabrir.
- **Transporte ao vivo:** trajeto e ônibus da linha, "Estou neste ônibus" e detecção de desvio de rota.
- **Perfil:** conta, tema claro/escuro, notificações, termos e exclusão de conta.
- **Offline:** as últimas leituras ficam em cache; registros, participações e comentários feitos sem conexão ficam "Aguardando envio" e são sincronizados depois.

## Tecnologias

- **Expo SDK 58**, React Native 0.88, React 19, TypeScript estrito (sem `any`).
- Expo Router (abas + pilhas), Context API, hooks customizados.
- **Firebase JS SDK 13** (modular): Authentication e Cloud Firestore.
- Axios com interceptors, TanStack Query com cache persistido no AsyncStorage.
- react-native-maps, expo-location, expo-image-picker, expo-image-manipulator (fotos em WebP).

## Serviços Firebase

| Serviço | Responsabilidade |
|---|---|
| **Authentication** | Cadastro e login por e-mail e senha, login com Google (só no APK), sessão persistente no aparelho, recuperação de senha, troca de e-mail e senha com reautenticação, exclusão de conta. |
| **Cloud Firestore** | Banco de dados do app: perfis, ocorrências, linha do tempo, participações, comentários, denúncias e dados privados do usuário (preferências, ocorrências silenciadas, última visita). |
| Storage | **Não usado** (exige o plano pago). As fotos ficam no **Vercel Blob**, enviadas pela API do Colecity; ver "Fotos". |
| Cloud Messaging (FCM) | Entrega das notificações push no Android. O envio é feito pela API de push (`push-api/`), pelo Expo Push Service; ver "Notificações push". |

### Estrutura do banco

```
perfis/{uid}                          nome público (lido por todos, escrito só pelo dono)
users/{uid}                           privado: aceite dos termos e preferências
users/{uid}/occurrenceState/{id}      privado: ocorrência silenciada e última visita
ocorrencias/{id}                      ocorrência + contagens (totalAfetados, totalApoios, totalDenuncias)
ocorrencias/{id}/linhaDoTempo/{eid}   eventos automáticos (criada, mudou de estado, marcos, concluída)
participacoes/{ocorrenciaId_uid}      afetado / apoio de cada conta
comentarios/{id}                      comentários (campo ocorrenciaId)
denuncias/{tipo_conteudoId_uid}       uma denúncia por conta por conteúdo
```

As contagens são atualizadas em **transações** (`runTransaction`): duas pessoas participando ao mesmo tempo não perdem contagem. O detalhe da ocorrência e os comentários usam **listeners** (`onSnapshot`), removidos quando a tela fecha.

### Regras de segurança

As regras estão versionadas em [`firestore.rules`](firestore.rules). Não há nenhuma regra aberta para escrita. Resumo:

- Toda escrita exige usuário autenticado.
- `users/{uid}` e subcoleções: leitura e escrita só pelo próprio dono.
- `perfis/{uid}`: qualquer pessoa lê o nome público; só o dono escreve.
- **Ocorrência:** criada pelo próprio autor, já Aberta e com ele como único afetado. Só o autor edita descrição e fotos e só ele conclui. Nunca é excluída.
- **Contagens:** `totalAfetados` e `totalApoios` só mudam junto com a participação de quem está escrevendo, de 1 em 1. `totalDenuncias` só soma 1 quando a denúncia daquela conta é criada na mesma escrita.
- **Participação e comentário:** cada conta escreve apenas os próprios (`request.auth.uid`). Não há edição de comentário; só o autor exclui.
- **Linha do tempo:** só aceita novos eventos; nunca altera nem apaga.
- **Denúncia:** uma por conta por conteúdo; só quem denunciou lê a própria.

As leituras de ocorrências, comentários e nomes são públicas porque a consulta não exige conta.

## Como configurar o Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Método de login:** ative "E-mail/senha". Em **Configurações → Política de senha**, exija no mínimo 8 caracteres, com letra e número.
3. **Firestore Database:** crie o banco em modo de produção (região `southamerica-east1`).
4. **Regras:** em Firestore → Regras, cole o conteúdo de `firestore.rules` e publique.
5. **Configuração do app:** em Configurações do projeto → Seus apps, adicione um app Web e copie o objeto `firebaseConfig` para `mobile/firebaseConfig.json`. Esse arquivo contém apenas a configuração pública do SDK cliente e é versionado; a proteção dos dados vem das regras. Nenhuma credencial administrativa (conta de serviço) entra no app ou no repositório.
6. **Dados iniciais:** rode `npm run seed` (seção abaixo).

## Como instalar e executar

Pré-requisitos: Node.js 20 ou mais novo e o app **Expo Go** no celular (ou um emulador).

```bash
cd mobile
npm install
npm run seed     # só na primeira vez: cria as contas e as ocorrências de demonstração
npm start
```

Leia o QR code com o Expo Go.

### Dados iniciais (seed)

`npm run seed` executa [`scripts/seed-firestore.ts`](scripts/seed-firestore.ts). Ele cria 10 contas de demonstração e grava 36 ocorrências em bairros reais de São Paulo, com participações e comentários. O script usa só o SDK cliente: cada dado é gravado logado como a conta dona dele, obedecendo às regras de segurança. Pode ser executado de novo sem duplicar.

**Conta de demonstração:** `ana@colecity.app` / `colecity123`. As outras contas seguem o mesmo padrão (`bruno@`, `carla@`, `diego@`…), com a mesma senha.

### Variáveis de ambiente

Os nomes estão em `.env.example`. Valores locais vão em `.env.local`, que não é versionado.

| Variável | Para quê |
|---|---|
| `EXPO_PUBLIC_DATA_SOURCE` | `firestore` (padrão): Firebase Auth + Firestore. `mock`: dados de demonstração guardados no aparelho, sem internet. `bff`: API própria em `EXPO_PUBLIC_BFF_URL`. |
| `EXPO_PUBLIC_BFF_URL` | URL base do BFF (só com `bff`). |
| `EXPO_PUBLIC_MOCK_ERROR_RATE` | Com `mock`: chance (0 a 1) de cada chamada falhar, para ver as telas de erro. |
| `EXPO_PUBLIC_PUSH_API_URL` | URL pública da API de push (sem barra no final). Vazia: o app não avisa eventos. |
| `API_KEY_MAPS` | Chave da Maps SDK for Android. Só para o build (APK). |
| `GOOGLE_MAPS_IOS_API_KEY`, `GOOGLE_SERVICES_JSON` | Só para o build próprio. |

O passo a passo do APK está em [`../docs/14-build-apk.md`](../docs/14-build-apk.md).

### Verificações

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run doctor      # expo-doctor
```

## Fotos

O Firebase Storage exige o plano pago. As fotos ficam no **Vercel Blob**, pela mesma API do push ([`../push-api/`](../push-api/README.md)):

1. A foto é comprimida no aparelho para WebP (maior lado ≤ 1920 px, qualidade 0,7; RN-REG-04).
2. O app envia para `POST /fotos` com o ID token do Firebase. A API confere o login, o formato e o tamanho, e decide o caminho (`ocorrencias/{uid}/{id}.webp` ou `comentarios/{uid}/{id}.webp`).
3. O Firestore guarda só o caminho e a URL pública, **nunca a imagem em Base64**.
4. Sem internet, a ação que tem foto fica "Aguardando envio" e a foto sobe junto quando a conexão volta.

Sem `EXPO_PUBLIC_PUSH_API_URL` configurada, as fotos ficam só no aparelho.

## Google Maps no APK

No Expo Go o mapa usa a chave do próprio Expo Go. No APK ele precisa da nossa chave da **Maps SDK for Android**.

- A chave fica em `API_KEY_MAPS`. Localmente, em `mobile/.env.local` (ignorado pelo git). O `app.config.ts` a coloca em `android.config.googleMaps.apiKey`.
- O build roda na nuvem do EAS, que **não lê o `.env` local**. Cadastre a variável no ambiente do perfil `preview`:
  ```bash
  npx eas-cli@latest env:create --name API_KEY_MAPS --value "SUA_CHAVE" --environment preview --visibility sensitive
  ```
  Para o development build, repita com `--environment development`.
- No Google Cloud Console, restrinja a chave ao pacote `com.colecity.app` + SHA-1 do app e à API "Maps SDK for Android".

Sem a chave o APK abre, mas o mapa fica em branco.

## Login com Google (Android)

Funciona só no **APK / development build** (biblioteca nativa `@react-native-google-signin/google-signin`); no Expo Go o botão mostra um aviso.

- O Google devolve um `idToken`, trocado por uma sessão do Firebase Auth (`signInWithCredential`).
- **Primeiro acesso** pede o aceite dos termos antes de criar a conta no banco (RN-CON-11). Se a pessoa desistir, não fica logada.
- **Conta só com Google** pode definir uma senha em Perfil → Dados da conta (RN-CON-13); o e-mail é o do Google (RN-CON-14).
- **Excluir conta** sem senha pede um novo login com a mesma conta do Google (RN-CON-08).

Configuração (uma vez por keystore):

1. Pegue a SHA-1 do app: `npx eas-cli@latest credentials` → Android → preview → **SHA1 Fingerprint**.
2. Console do Firebase → Configurações do projeto → app Android `com.colecity.app` → **Adicionar impressão digital** → cole a SHA-1.
3. Authentication → Método de login → **Google** ativado.
4. Baixe o `google-services.json` de novo e substitua `mobile/google-services.json`. Ele passa a ter o cliente OAuth Android.
5. Gere um build novo.

Sem a SHA-1 cadastrada o Google recusa o login (`DEVELOPER_ERROR`) e o app mostra uma mensagem de erro genérica.

## Notificações push (Android)

Funcionam só no **APK / development build** e só no Android.

| Parte | Como funciona |
|---|---|
| Permissão | Pedida após o primeiro registro ou a primeira participação, nunca na abertura do app (RN-NOT-01). |
| Token | O app obtém o **Expo push token** e grava em `users/{uid}/devices/{deviceId}` (`token`, `plataforma`, `enabled`, `updatedAt`). É regravado na abertura, no login e quando o token muda; no logout o aparelho é desativado. |
| Sem permissão ou sem token | O Perfil explica o motivo (permissão negada, ou aparelho sem Google Play Services/sem rede). Nada trava. |
| Envio | Depois de **comentar, concluir ou reabrir** (já gravado no Firestore), o app chama `POST /notificar` da API de push com o ID token do Firebase. Falha na chamada não desfaz a ação nem mostra erro. |
| Quem recebe | Decidido no servidor: autor, afetados e apoiadores, menos quem fez a ação, quem silenciou a ocorrência e quem desligou as notificações (RN-NOT-02, RN-NOT-04). |
| Toque | Abre a ocorrência (`occurrenceId` no payload, RN-NOT-05). |

### Configuração no Android (FCM)

1. Console do Firebase → Configurações do projeto → Seus apps → **Adicionar app Android** com o pacote `com.colecity.app`.
2. Baixe o `google-services.json` e salve em `mobile/google-services.json`. É configuração pública do cliente e é versionado; os perfis do `eas.json` já apontam para ele.
3. Console do Firebase → Configurações do projeto → **Contas de serviço** → Gerar nova chave privada. Envie esse JSON ao EAS (`npx eas-cli@latest credentials` → Android → Google Service Account → FCM V1). **Esse arquivo não vai para o repositório.**

### API de push

Código e documentação em [`../push-api/`](../push-api/README.md). Hospedada na Vercel.

- **URL pública:** https://push-api-rho.vercel.app (health check: https://push-api-rho.vercel.app/health)
- **Endpoints:** `POST /notificar` e `GET /health`.
- **Health check:** `GET <URL>/health` deve responder `{"status":"ok"}`.

### Evidência de notificação recebida

<!-- OBRIGATÓRIO: print da notificação chegando no Android. Salvar em docs/prints/notificacao.png. -->

_Adicionar o print em `docs/prints/notificacao.png`._

## Gerar o APK

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init          # só na primeira vez: grava o projectId no app.json
npm run build:apk                # perfil preview: APK instalável, distribuição interna
```

Ao terminar, o EAS mostra um link e um QR code. Qualquer pessoa com o link baixa e instala o APK (é preciso permitir "instalar apps desconhecidos"). O passo a passo completo, com as variáveis e as credenciais, está em [`../docs/14-build-apk.md`](../docs/14-build-apk.md).

## Estrutura de pastas

```
mobile/
  app/                    rotas (Expo Router)
    (auth)/               login, cadastro, recuperar senha, termos
    (tabs)/               explorar, registrar, transporte, minhas, perfil
  src/
    components/           ui, feedback, ocorrencia, mapa, registro, transporte, perfil, auth
    config/               ambiente, categorias, formulários (JSON), termos
    context/              Auth, Theme, Toast, Registro, Viagem
    hooks/                useAuth, useOcorrencias, useParticipacao, useComentarios, useViagem...
    services/
      firebase.ts         inicialização única do Firebase
      contratos.ts        interfaces dos services (iguais para todas as fontes de dados)
      index.ts            único ponto que escolhe a fonte de dados
      firestore/          adaptadores Firebase (Auth e Firestore)
      mock/               adaptadores com dados de demonstração
      http/               adaptadores Axios para o BFF
      api.ts              instância Axios + interceptors
      offlineQueue.ts     fila "Aguardando envio"
      queryClient.ts      TanStack Query com cache persistido
    mocks/                dados semente (usados pelo mock e pelo seed)
    theme/                cores, tipografia, espaçamentos
    types/                modelos do contrato
    utils/                datas, distâncias, validações, regras de ocorrência
  scripts/seed-firestore.ts   dados iniciais
  firestore.rules             regras de segurança
  firebaseConfig.json         configuração pública do SDK cliente
```

## Limitações conhecidas

- **Fotos antigas:** as tiradas antes da integração com o Vercel Blob ficaram só no aparelho de quem tirou; em outros aparelhos aparece "Foto indisponível". Excluir a conta não apaga as fotos já publicadas, que fazem parte das ocorrências.
- **Regras de negócio no app:** sem um servidor próprio, as regras do Firestore garantem autoria e coerência das contagens, mas validações mais ricas (limite de requisições, geocodificação oficial, moderação) ficam para a API de domínio.
- **Localização exata:** o documento da ocorrência guarda o ponto exato e o aproximado. O app só exibe o aproximado (~100 m), mas o ponto exato é legível por quem consultar o banco diretamente. A API de domínio resolve isso ao não expor o campo.
- **Encerramento automático por inatividade** (7 ou 30 dias) não é executado: exigiria uma função agendada, disponível só no plano pago.
- **Entrar com Google** só funciona no APK / development build. No Expo Go o botão avisa que o recurso depende do APK.
- **Notificações push:** só no Android e só no APK (no Expo Go o recurso fica desligado, sem erro). Desvio de rota confirmado não gera push, e comentários além do limite de 30 minutos são descartados em vez de agrupados.
- **Transporte ao vivo:** linhas, trajetos e posições dos ônibus são simulados no app; a ocorrência de desvio de rota é gravada no Firestore.
- **Filtros e ordenação** são aplicados no aparelho sobre as ocorrências carregadas, o que serve para o volume de uma demonstração.

## O que aplicamos do semestre

| Conteúdo | Onde está no Colecity |
|---|---|
| TypeScript sem `any` | Todo o projeto |
| Componentização e ESModules | `src/components`, `src/services`, `src/hooks` |
| Navegação por abas e stack | Expo Router: abas Explorar, Registrar, Transporte, Minhas e Perfil, cada uma com sua pilha |
| Context API | Autenticação, tema, rascunho do registro e viagem ativa |
| Hooks customizados, `useMemo`, `useCallback` | `useOcorrencias`, `useParticipacao`, `useComentarios`, `useViagem`, filtros e mapa |
| AsyncStorage | Tema, filtros, sessão do Firebase, cache das consultas e fila offline |
| Consumo de API com Axios, service layer e interceptors | `src/services/api.ts` (token, 401, 429, offline) e `src/services/http/` |
| TanStack Query | Leituras com cache persistido, retry e modo offline; `useMutation` nas escritas |
| Loading, erro, retry e empty state | Todas as telas |
| Formulário dinâmico a partir de JSON | `src/config/formularios.ts` + `DynamicField` |
| Firebase Authentication | Login por e-mail e senha, sessão persistente, recuperação de senha, exclusão de conta |
| Cloud Firestore com regras de segurança | Ocorrências, participações, comentários, denúncias e dados do usuário; `firestore.rules` |
| Imagens com permissões | Câmera e galeria, compressão WebP; imagem padrão quando a foto falha |
| Tema light/dark | Perfil → Aparência |

## Prints

<!-- Adicionar as imagens em mobile/docs/prints/ e referenciar aqui. -->

_Adicionar em `docs/prints/`: Explorar (lista e mapa), detalhe da ocorrência, Registrar, Minhas, Transporte ao vivo e Perfil (tema claro e escuro)._
