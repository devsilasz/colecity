# Colecity — App Mobile

App da CitizenTech **Colecity** (Global Solution 2026/2 · FIAP), desenvolvido em React Native com Expo e TypeScript.

O Colecity é um app colaborativo para relatar, acompanhar e se mobilizar em torno de problemas urbanos da cidade de São Paulo: falta de água, buracos, ônibus fora de rota, árvores caídas, pontos inseguros.

> O Colecity não é um canal oficial da Prefeitura e não encaminha manifestações a órgãos públicos.

## O projeto Colecity

O app é uma das partes da solução Colecity, organizada em um único repositório:

| Parte | O que é |
|---|---|
| **`mobile/`** (este app) | Porta de entrada do cidadão: consulta, registro, participação, acompanhamento e transporte ao vivo |
| [`bff/`](../bff/README.md) | BFF mobile (Vercel): valida o login, repassa ao domínio, guarda as fotos e envia as notificações push |
| [`backend/`](../backend/README.md) | API de domínio em C#/.NET (Render): regras de negócio, banco de dados e cruzamento dos relatos de transporte com a SPTrans |
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
- **Tecnologias:** app React Native/Expo com Firebase (Authentication e Cloud Firestore para os dados do usuário), BFF em Node/TypeScript na Vercel, API de domínio em C#/.NET no Render com dados da SPTrans (Olho Vivo), push pelo FCM e Expo Push.
- **Indicadores:** ocorrências registradas, afetados e apoios por ocorrência, ocorrências concluídas, desvios de rota detectados.
- **ODS:** 11 (Cidades e comunidades sustentáveis), 10 (Redução das desigualdades), 9 (Indústria, inovação e infraestrutura).

## O que o app faz

- **Explorar:** lista e mapa das ocorrências, com filtros de categoria, estado e distância, mapa de calor e Zonas de atenção. Aberto a visitantes.
- **Registrar:** categoria, tipo e localização; sugestão de ocorrências semelhantes; formulário gerado por JSON, com fotos.
- **Participar:** "Também estou sendo afetado" e "Apoiar manifestação", com contagens separadas; comentários; denúncia de conteúdo.
- **Minhas:** o que registrei, o que me afeta e o que apoio, com indicador de novidade; concluir e reabrir.
- **Transporte ao vivo:** trajeto e ônibus da linha (SPTrans), "Estou neste ônibus" e detecção de desvio de rota.
- **Perfil:** conta, tema claro/escuro, notificações, termos e exclusão de conta.
- **Offline:** as últimas leituras ficam em cache; registros, participações e comentários feitos sem conexão ficam "Aguardando envio" e são sincronizados depois.

## Arquitetura

```
App (Expo) --Bearer <ID token Firebase>--> BFF (Vercel) --X-Service-Key + X-User-Id--> API C# (Render)
    |                                         |                                            |
    +--> Firebase Auth (login)                +--> Vercel Blob (fotos)                     |
    +--> Firestore users/{uid}                ^                                            |
         (preferências, aparelhos)            +--------- eventos de domínio (push) --------+
```

- O app faz login no **Firebase Authentication** e chama **só o BFF**, levando o ID token no header `Authorization` (interceptor do Axios). Nunca fala direto com a API de domínio.
- O **BFF** valida o token, repassa ao domínio identificando o usuário pelo `uid` e devolve os mesmos modelos e erros do contrato ([doc 10](../docs/10-contrato-api-dominio.md)).
- A **API de domínio** guarda ocorrências, participações, comentários, linha do tempo e denúncias, e aplica as regras de negócio.
- O **Cloud Firestore** guarda só os dados do próprio usuário. O push nasce no domínio: quando alguém comenta, conclui, reabre ou confirma um desvio, o domínio avisa o BFF, que envia a notificação.

Contrato app ↔ BFF: [doc 08, seção 11](../docs/08-arquitetura.md). Rotas usadas pelo app: [`src/services/http/rotas.ts`](src/services/http/rotas.ts).

## Tecnologias

- **Expo SDK 58**, React Native 0.88, React 19, TypeScript estrito (sem `any`).
- Expo Router (abas + pilhas), Context API, hooks customizados.
- Axios com interceptors, TanStack Query com cache persistido no AsyncStorage.
- **Firebase JS SDK 13** (modular): Authentication e Cloud Firestore.
- react-native-maps, expo-location, expo-image-picker, expo-image-manipulator (fotos em WebP).

## Serviços Firebase

| Serviço | Responsabilidade |
|---|---|
| **Authentication** | Cadastro e login por e-mail e senha, login com Google (só no APK), sessão persistente no aparelho, recuperação de senha, troca de e-mail e senha com reautenticação, exclusão de conta. |
| **Cloud Firestore** | Dados do próprio usuário: aceite dos termos, preferência de notificações, ocorrências silenciadas, última visita e aparelhos para push. O domínio (ocorrências, comentários etc.) fica na API C#. |
| Storage | **Não usado** (exige o plano pago). As fotos ficam no **Vercel Blob**, enviadas pelo BFF; ver "Fotos". |
| Cloud Messaging (FCM) | Entrega das notificações push no Android, pelo Expo Push Service; ver "Notificações push". |

### Estrutura do banco (Firestore)

```
users/{uid}                           aceite dos termos e preferência de notificações
users/{uid}/occurrenceState/{id}      ocorrência silenciada e última visita
users/{uid}/devices/{deviceId}        token de push do aparelho
```

### Regras de segurança

As regras estão em [`firestore.rules`](firestore.rules):

- `users/{uid}` e subcoleções: leitura e escrita **só pelo próprio dono**, com os campos permitidos listados.
- Qualquer outro caminho: negado. As coleções internas do BFF (controle de push) só são acessadas pelo Admin SDK, no servidor.

## Como configurar o Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Método de login:** ative "E-mail/senha" (e "Google", ver abaixo). Em **Configurações → Política de senha**, exija no mínimo 8 caracteres, com letra e número.
3. **Firestore Database:** crie o banco em modo de produção (região `southamerica-east1`).
4. **Regras:** em Firestore → Regras, cole o conteúdo de `firestore.rules` e publique.
5. **Configuração do app:** em Configurações do projeto → Seus apps, adicione um app Web e copie o objeto `firebaseConfig` para `mobile/firebaseConfig.json`. Esse arquivo contém apenas a configuração pública do SDK cliente e é versionado. Nenhuma credencial administrativa (conta de serviço) entra no app ou no repositório.

## Como instalar e executar

Pré-requisitos: Node.js 20 ou mais novo e o app **Expo Go** no celular (ou um emulador).

```bash
cd mobile
npm install
cp .env.example .env.local   # preencha EXPO_PUBLIC_BFF_URL
npm start
```

Leia o QR code com o Expo Go. O app usa o BFF publicado (https://push-api-rho.vercel.app), que fala com a API de domínio no Render. O plano gratuito do Render dorme sem uso: a primeira tela pode levar até um minuto para carregar.

**Sem internet ou sem backend:** rode com `EXPO_PUBLIC_DATA_SOURCE=mock` no `.env.local`. Tudo passa a ser simulado no aparelho, inclusive o login (conta de demonstração `ana@colecity.app` / `colecity123`).

### Dados de demonstração

A API de domínio sobe com ocorrências fictícias em bairros reais de São Paulo, com participações e comentários (ver [`../backend/README.md`](../backend/README.md)). No plano gratuito do Render, esses dados voltam ao estado inicial sempre que o serviço reinicia. Para registrar, participar ou comentar, crie uma conta no próprio app.

### Variáveis de ambiente

Os nomes estão em `.env.example`. Valores locais vão em `.env.local`, que não é versionado. Para o APK, os valores ficam nos perfis do `eas.json`.

| Variável | Para quê |
|---|---|
| `EXPO_PUBLIC_DATA_SOURCE` | `bff` (padrão): BFF + API de domínio, login pelo Firebase. `mock`: tudo simulado no aparelho, sem internet. |
| `EXPO_PUBLIC_BFF_URL` | URL do BFF, sem barra no final (ex.: `https://push-api-rho.vercel.app`). |
| `EXPO_PUBLIC_MOCK_ERROR_RATE` | Com `mock`: chance (0 a 1) de cada chamada falhar, para ver as telas de erro. |
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

O Firebase Storage exige o plano pago. As fotos ficam no **Vercel Blob**, enviadas pelo BFF:

1. A foto é comprimida no aparelho para WebP (maior lado ≤ 1920 px, qualidade 0,7; RN-REG-04).
2. O app envia para `POST /fotos` do BFF com o ID token do Firebase. O BFF confere o login, o formato e o tamanho, e decide o caminho (`ocorrencias/{uid}/{id}.webp` ou `comentarios/{uid}/{id}.webp`).
3. Ao registrar, comentar ou concluir, o app envia ao domínio **só o caminho** (`path`), nunca a imagem. Nas respostas, o BFF acrescenta a URL pública de cada foto.
4. Sem internet, a ação que tem foto fica "Aguardando envio" e a foto sobe junto quando a conexão volta.

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
- **Primeiro acesso** pede o aceite dos termos antes de criar a conta (RN-CON-11). Se a pessoa desistir, não fica logada.
- **Conta só com Google** pode definir uma senha em Perfil → Dados da conta (RN-CON-13); o e-mail é o do Google (RN-CON-14).
- **Excluir conta** sem senha pede um novo login com a mesma conta do Google (RN-CON-08).

Configuração (uma vez por keystore):

1. Pegue a SHA-1 do app: `npx eas-cli@latest credentials` → Android → preview → **SHA1 Fingerprint**.
2. Console do Firebase → Configurações do projeto → app Android `com.colecity.app` → **Adicionar impressão digital** → cole a SHA-1.
3. Authentication → Método de login → **Google** ativado.
4. Baixe o `google-services.json` de novo e substitua `mobile/google-services.json`. Ele passa a ter o cliente OAuth Android.
5. Gere um build novo.

Sem a SHA-1 cadastrada o Google recusa o login (`DEVELOPER_ERROR`) e o app mostra uma mensagem de erro genérica.

## Exclusão de conta (RN-CON-08)

Depois da confirmação (senha ou novo login com Google), nesta ordem:

1. `DELETE /usuarios/me` no BFF: o domínio **anonimiza** a conta (o nome some das ocorrências e comentários, e as participações saem das contagens).
2. Os dados do usuário no Firestore (`users/{uid}`, estados e aparelhos) são apagados.
3. A conta é excluída do Firebase Authentication (`deleteUser`).

## Notificações push (Android)

Funcionam só no **APK / development build** e só no Android.

| Parte | Como funciona |
|---|---|
| Permissão | Pedida após o primeiro registro ou a primeira participação, nunca na abertura do app (RN-NOT-01). |
| Token | O app obtém o **Expo push token** e grava em `users/{uid}/devices/{deviceId}` (`token`, `plataforma`, `enabled`, `updatedAt`). É regravado na abertura, no login e quando o token muda; no logout o aparelho é desativado. |
| Sem permissão ou sem token | O Perfil explica o motivo (permissão negada, ou aparelho sem Google Play Services/sem rede). Nada trava. |
| Envio | Nasce no domínio: comentário, conclusão, reabertura ou desvio confirmado vira um evento, que o domínio envia ao BFF. O app não participa. |
| Quem recebe | Calculado no servidor: autor, afetados e apoiadores, menos quem fez a ação, quem silenciou a ocorrência e quem desligou as notificações (RN-NOT-02, RN-NOT-04). Comentários: no máximo 1 push por ocorrência a cada 30 minutos. |
| Toque | Abre a ocorrência (`occurrenceId` no payload, RN-NOT-05). |

### Configuração no Android (FCM)

1. Console do Firebase → Configurações do projeto → Seus apps → **Adicionar app Android** com o pacote `com.colecity.app`.
2. Baixe o `google-services.json` e salve em `mobile/google-services.json`. É configuração pública do cliente e é versionado; os perfis do `eas.json` já apontam para ele.
3. Console do Firebase → Configurações do projeto → **Contas de serviço** → Gerar nova chave privada. Envie esse JSON ao EAS (`npx eas-cli@latest credentials` → Android → Google Service Account → FCM V1). **Esse arquivo não vai para o repositório.**

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

Os perfis do `eas.json` já apontam para o BFF (`EXPO_PUBLIC_DATA_SOURCE=bff` e `EXPO_PUBLIC_BFF_URL`). Ao terminar, o EAS mostra um link e um QR code. Qualquer pessoa com o link baixa e instala o APK (é preciso permitir "instalar apps desconhecidos"). O passo a passo completo, com as variáveis e as credenciais, está em [`../docs/14-build-apk.md`](../docs/14-build-apk.md).

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
      index.ts            único ponto que escolhe a fonte de dados (bff ou mock)
      http/               adaptadores Axios para o BFF (rotas, recursos, fotos, atualização ao vivo)
      firestore/          Firebase Auth e dados do usuário (users/{uid})
      mock/               adaptadores com dados de demonstração
      api.ts              instância Axios + interceptors
      notificacoes.ts     registro do aparelho para push
      offlineQueue.ts     fila "Aguardando envio"
      queryClient.ts      TanStack Query com cache persistido
    mocks/                dados semente do mock
    theme/                cores, tipografia, espaçamentos
    types/                modelos do contrato (doc 10)
    utils/                datas, distâncias, validações, regras de ocorrência
  firestore.rules         regras de segurança
  firebaseConfig.json     configuração pública do SDK cliente
```

## O que aplicamos do semestre

| Conteúdo | Onde está no Colecity |
|---|---|
| TypeScript sem `any` | Todo o projeto |
| Componentização e ESModules | `src/components`, `src/services`, `src/hooks` |
| Navegação por abas e stack | Expo Router: abas Explorar, Registrar, Transporte, Minhas e Perfil, cada uma com sua pilha |
| Context API | Autenticação, tema, rascunho do registro e viagem ativa |
| Hooks customizados, `useMemo`, `useCallback` | `useOcorrencias`, `useParticipacao`, `useComentarios`, `useViagem`, filtros e mapa |
| AsyncStorage | Tema, filtros, sessão do Firebase, cache das consultas e fila offline |
| Consumo de API com Axios, service layer e interceptors | `src/services/api.ts` (token, 401, 429, offline) e `src/services/http/`, consumindo o BFF |
| TanStack Query | Leituras com cache persistido, retry e modo offline; `useMutation` nas escritas |
| Loading, erro, retry e empty state | Todas as telas |
| Formulário dinâmico a partir de JSON | `src/config/formularios.ts` + `DynamicField` |
| Firebase Authentication | Login por e-mail e senha e Google, sessão persistente, recuperação de senha, exclusão de conta |
| Cloud Firestore com regras de segurança | Dados do próprio usuário (preferências, silenciadas, aparelhos); `firestore.rules` |
| Imagens com permissões | Câmera e galeria, compressão WebP; imagem padrão quando a foto falha |
| Tema light/dark | Perfil → Aparência |

## Prints

<!-- Adicionar as imagens em mobile/docs/prints/ e referenciar aqui. -->

_Adicionar em `docs/prints/`: Explorar (lista e mapa), detalhe da ocorrência, Registrar, Minhas, Transporte ao vivo e Perfil (tema claro e escuro)._
