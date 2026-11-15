# Colecity

CitizenTech colaborativa para relatar, acompanhar e se mobilizar em torno de problemas urbanos da cidade de São Paulo. Projeto da Global Solution 2026/2 (FIAP).

> O Colecity não é um canal oficial da Prefeitura e não encaminha manifestações a órgãos públicos.

## Integrantes

<!-- OBRIGATÓRIO: preencher com o nome completo e o RM de todos antes da entrega. -->

| Nome completo | RM |
|---|---|
| _preencher_ | _preencher_ |
| _preencher_ | _preencher_ |

## Vídeo

<!-- OBRIGATÓRIO: link do vídeo de até 3 minutos. -->

_Link do vídeo: preencher._

## Ficha da CitizenTech

- **Nome:** Colecity.
- **Cidade:** São Paulo, SP.
- **Público:** moradores e usuários de serviços urbanos da cidade.
- **Problema:** dificuldade de conhecer e reunir informações e manifestações sobre problemas urbanos compartilhados.
- **Como funciona:** app em que o cidadão consulta, registra e acompanha ocorrências por categoria e localização, com participação coletiva.
- **Tecnologias:** app React Native/Expo, BFF em Firebase Cloud Functions, API de domínio em C#/.NET, Firebase (Auth, Firestore, Storage, FCM), dados da SPTrans (GTFS e Olho Vivo).
- **Indicadores:** ocorrências registradas, afetados e apoios por ocorrência, ocorrências concluídas, desvios de rota detectados.
- **ODS:** 11 (Cidades e comunidades sustentáveis), 10 (Redução das desigualdades), 9 (Indústria, inovação e infraestrutura).

## O que o app faz

- **Explorar:** lista e mapa das ocorrências, com filtros de categoria, estado e distância, mapa de calor e Zonas de atenção. Aberto a visitantes.
- **Registrar:** categoria, tipo e localização; sugestão de ocorrências semelhantes; formulário gerado por JSON, com fotos.
- **Participar:** "Também estou sendo afetado" e "Apoiar manifestação", com contagens separadas; comentários com fotos; denúncia de conteúdo.
- **Minhas:** o que registrei, o que me afeta e o que apoio, com indicador de novidade; concluir e reabrir.
- **Transporte ao vivo:** trajeto e ônibus da linha, "Estou neste ônibus" e detecção de desvio de rota.
- **Perfil:** conta, tema claro/escuro, notificações, termos e exclusão de conta.
- **Offline:** as últimas leituras ficam em cache; registros, participações e comentários feitos sem conexão ficam "Aguardando envio" e são sincronizados depois.

## Estado atual

O app roda completo com **dados de demonstração (mock)**, que seguem o contrato da API de domínio (`docs/10-contrato-api-dominio.md`). A troca para a API real é feita por variável de ambiente, sem mudar as telas.

| Parte | Situação |
|---|---|
| Telas, navegação, regras de negócio e offline | Prontas, sobre o mock |
| Adaptadores HTTP para o BFF (Axios + interceptor) | Prontos; ligados com `EXPO_PUBLIC_USE_MOCK=false` |
| Firebase (Auth, Firestore, Storage, FCM) e BFF | Ainda não integrados: login, dados do usuário e upload usam o mock/AsyncStorage |
| API de domínio (C#) | Em desenvolvimento, fora deste app |

## Tecnologias

- Expo SDK 58, React Native 0.88, React 19, TypeScript estrito (sem `any`).
- Expo Router (abas + pilhas), Context API, hooks customizados.
- Axios com interceptors, TanStack Query com cache persistido no AsyncStorage.
- react-native-maps, expo-location, expo-image-picker, expo-image-manipulator (fotos em WebP).

## Como rodar

Pré-requisitos: Node.js 20 ou mais novo e o app **Expo Go** no celular (ou um emulador).

```bash
cd mobile
npm install
npm start
```

Leia o QR code com o Expo Go. Nenhuma configuração é necessária: o arquivo `mobile/.env` já vem com o mock ligado.

**Conta de demonstração:** `ana@colecity.app` / `colecity123` (há um botão "Preencher" na tela de login). "Entrar com Google" usa uma conta simulada.

### Variáveis de ambiente

Os nomes estão em `mobile/.env.example`. Valores locais vão em `mobile/.env.local`, que não é versionado.

| Variável | Para quê |
|---|---|
| `EXPO_PUBLIC_USE_MOCK` | `true` usa o mock; `false` usa o BFF |
| `EXPO_PUBLIC_BFF_URL` | URL base do BFF |
| `EXPO_PUBLIC_MOCK_ERROR_RATE` | Chance (0 a 1) de o mock falhar, para ver as telas de erro |
| `GOOGLE_MAPS_ANDROID_API_KEY`, `GOOGLE_MAPS_IOS_API_KEY`, `GOOGLE_SERVICES_JSON` | Só para o build próprio (APK) |

### Gerar o APK

O passo a passo do development build (Google Maps com chave própria e push) está em [`docs/14-build-apk.md`](docs/14-build-apk.md).

### Verificações

```bash
cd mobile
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run doctor      # expo-doctor
```

## Estrutura de pastas

```
docs/                     requisitos, regras de negócio, arquitetura e contrato da API
mobile/
  app/                    rotas (Expo Router)
    (auth)/               login, cadastro, recuperar senha, termos
    (tabs)/               explorar, registrar, transporte, minhas, perfil
  src/
    components/           ui, feedback, ocorrencia, mapa, registro, transporte, perfil, auth
    config/               ambiente, categorias, formulários (JSON), termos
    context/              Auth, Theme, Toast, Registro, Viagem
    hooks/                useAuth, useOcorrencias, useParticipacao, useComentarios, useViagem...
    services/             api.ts (Axios), contratos, mock/, http/, fila offline, cache
    mocks/                dados de demonstração
    theme/                cores, tipografia, espaçamentos
    types/                modelos do contrato
    utils/                datas, distâncias, validações
```

## O que aplicamos do semestre

| Conteúdo | Onde está |
|---|---|
| TypeScript sem `any` | Todo o projeto |
| Componentização e ESModules | `src/components`, `src/services`, `src/hooks` |
| Navegação por abas e stack | Expo Router: cinco abas, cada uma com sua pilha |
| Context API | Autenticação, tema, rascunho do registro e viagem ativa |
| Hooks customizados, `useMemo`, `useCallback` | `useOcorrencias`, `useParticipacao`, `useComentarios`, `useViagem`, filtros e mapa |
| AsyncStorage | Tema, filtros, cache das consultas, fila offline e dados do usuário |
| Axios, service layer e interceptors | `src/services/api.ts` (token, 401, 429, offline) e `src/services/http/` |
| TanStack Query | Leituras com cache persistido, retry e modo offline |
| Loading, erro, retry e estado vazio | Todas as telas |
| Formulário dinâmico por JSON | `src/config/formularios.ts` + `DynamicField` |
| Tema claro/escuro | Perfil → Aparência |
| Acessibilidade | Rótulos para leitor de tela, áreas de toque de 44 pt, fonte do sistema, nada só por cor |

## Prints

<!-- OBRIGATÓRIO: adicionar as imagens em docs/prints/ e referenciar aqui. -->

_Adicionar prints de: Explorar (lista e mapa), detalhe da ocorrência, Registrar, Minhas, Transporte ao vivo e Perfil (tema claro e escuro)._

## Documentação

O índice está em [`docs/README.md`](docs/README.md). Os documentos de referência são as regras de negócio (07), a arquitetura (08), a stack do app (09) e o contrato da API (10).
