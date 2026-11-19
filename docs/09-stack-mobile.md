# 09 — Stack e padrões do app mobile

App da jornada do cidadão. Regras em [07](07-regras-de-negocio-produto.md); arquitetura em [08](08-arquitetura.md).

## 1. Tecnologias

| Item | Escolha |
|---|---|
| Base | React Native + **Expo SDK mais recente** (55+) + **TypeScript** |
| Execução | **Development build** (`eas build --profile development`); Expo Go não é suficiente por causa de push e login Google. Durante o desenvolvimento com mock, o Expo Go serve como ambiente DEV (ver [14](14-build-apk.md)) |
| Plataforma alvo | Android (vídeo e push). iOS deve compilar, sem push |
| Navegação | **Expo Router** (abas + stack) |
| Estado global | **Context API** (`AuthContext`, `ThemeContext`) |
| Requisições | **Axios** com service layer e **interceptor** |
| Cache, servidor e offline | **TanStack Query** (`useQuery`, `useMutation`, `queryKey`, `QueryClientProvider`) com persistência no AsyncStorage |
| Armazenamento local | **AsyncStorage** (tema, filtros, rascunho, cache do TanStack Query, fila offline) |
| Autenticação | **Firebase Authentication** — e-mail/senha e Google (`@react-native-google-signin/google-signin`) |
| Banco do app | **Cloud Firestore** (dados do próprio usuário, ver doc 08 §8) |
| Fotos | `expo-image-picker` + `expo-image-manipulator` (WebP, maior lado ≤ 1920 px, qualidade 0,7), enviadas ao BFF (`POST /fotos`, Vercel Blob) com `expo-file-system` + `expo/fetch` |
| Localização | `expo-location` |
| Mapa | `react-native-maps` (marcadores, mapa de calor, trajeto da linha) |
| Push | `expo-notifications` + Expo Push Service (entrega via FCM, só Android) |
| Conectividade | `@react-native-community/netinfo` (offline/online) |
| Data e hora | `@react-native-community/datetimepicker` (campo `datetime` do formulário dinâmico, só em Segurança) |

## 2. Regras de código

- **Proibido `any`.** Tipar props, estados, funções, eventos, respostas da API, contextos, dados do Firestore e parâmetros de rota.
- Hooks com uso real: `useState`, `useEffect`, `useMemo` (filtros, agrupamentos do mapa), `useCallback` (handlers passados a listas e componentes).
- Hooks customizados para separar lógica das telas.
- Estado imutável: nunca mutar arrays/objetos de estado.
- Listeners (Firestore, NetInfo, notificações, localização) removidos no cleanup do `useEffect`.
- Toda tela trata: loading, erro com ação de tentar novamente, estado vazio e offline.
- Mensagens de erro compreensíveis, sem detalhes internos (RN-GER-11).
- Confirmação antes de ações relevantes (concluir ocorrência, retirar participação, excluir conta, excluir comentário).
- Feedback visual ao salvar/enviar.
- **Acesso sem login:** o app abre direto em Explorar. Explorar, a consulta do Transporte, Sobre e os termos ficam abertos a visitantes. Registrar, Minhas e os dados da conta exibem o convite "Entre para continuar" (componente `AuthGate`), com atalhos para Entrar e Criar conta. Depois do login, o usuário volta para a tela de onde veio.
- **Explorar:** alterna entre lista e mapa pelo botão do cabeçalho. Os filtros de categoria e estado ficam salvos no AsyncStorage; o de distância não (depende da posição atual) e some se a localização for negada.
- **Mapa:** duas camadas, "Ocorrências" (marcador maior = mais participação) e "Mapa de calor" (sempre com o número de afetados por área). As Zonas de atenção aparecem nas duas, com o total de relatos. O mapa carrega até 50 ocorrências (limite de página do doc 10), as de maior participação. Ocorrências com a mesma localização aproximada (a menos de ~11 m, comum em Segurança, que não agrupa semelhantes — RN-SEM-04) têm os marcadores distribuídos em um círculo de 30 m ou mais em volta do ponto, para não ficarem sobrepostos; o mapa de calor e as Zonas de atenção continuam usando o ponto original. Sem Google Maps (iOS no Expo Go), o calor vira círculos com número. Os marcadores com texto ou ícone usam o hook `useRedesenhoMarcadores`: `tracksViewChanges` fica ligado por cerca de 1 s sempre que o desenho muda e depois desliga; ligado só no início, o Android fotografava o marcador antes de o texto e a fonte de ícones aparecerem e ele ficava vazio.
- **Detalhe:** menu "Mais ações" (só com login) com editar (autor), silenciar notificações da ocorrência e denunciar. Fotos abrem em tela cheia, com "Denunciar foto".
- **Participação:** apoiar pede confirmação avisando que o nome fica público (exceto em Segurança, que não tem lista); retirar afetado ou apoio também pede confirmação. Visitante que toca nos botões vai para o login.
- **Comentários:** tela própria, leitura aberta; links são tocáveis, com aviso de que não são verificados. Comentários na fila offline aparecem no fim da lista como "Aguardando envio".
- **Editar ocorrência:** só online (não entra na fila offline).
- **Minhas:** três abas em um seletor; as três são carregadas para o ponto de "novidade" aparecer em cada aba. O ponto da aba some quando ela é aberta (a aba aberta nunca mostra o ponto e, ao sair, as novidades que estavam na lista ficam como vistas até o app ser fechado); o selo de "novidade" de cada ocorrência continua até ela ser aberta (RN-MIN-04).
- **Troca de aba por gesto (carrossel):** na raiz de cada aba, arrastar a tela para os lados leva à aba vizinha, na ordem da tab bar, com as duas telas acompanhando o dedo (`CarrosselAbas`: as páginas são desenhadas a partir de `Navigator.useContext()` e posicionadas pelo nome, na ordem da tab bar, porque o estado das abas do expo-router só lista as já visitadas, na ordem da visita; `usePanGesture` do `react-native-gesture-handler` e Reanimated, fora da thread do JavaScript). Para isso as cinco abas ficam montadas desde a abertura do app e o layout raiz tem `GestureHandlerRootView`. O gesto fica suspenso nas telas empilhadas, onde há mapa aberto (`useBloquearGestoAbas`: Explorar em modo mapa e o mapa do Registrar) e enquanto o dedo está na barra de filtros (`gestoAbas`). A tab bar continua sendo o caminho para leitor de tela.
- **Novidade (RN-MIN-04):** a ocorrência é marcada quando `ultimaAtividadeEm` é posterior à última visita do usuário (`lastSeenAt`), ou quando ele acompanha e nunca abriu. A visita é registrada ao abrir o detalhe e ao marcar participação.
- **Concluir e reabrir:** aparecem no detalhe, no bloco "Acompanhamento", só para quem pode (`podeConcluir`, `podeReabrir`). Concluir abre `[id]/concluir.tsx` (feedback e fotos opcionais) e pede confirmação; reabrir pede confirmação no próprio detalhe. As duas ações são só online.
- **Transporte ao vivo:** a busca e a tela da linha são abertas a visitantes; "Estou neste ônibus" exige login e confirmação. A tela da linha traz o mapa (trajeto oficial, ônibus SPTrans e relatados por passageiros) e a mesma informação em lista, atualizada a cada 15 s.
- **Linhas cobertas (decisão de 18/11/2026):** em produção, a API de domínio usa o GTFS real da SPTrans (todas as linhas de ônibus, trajetos oficiais simplificados a 10 m) e os ônibus da Olho Vivo. A aba Transporte sugere 4 linhas como atalho; no mock, lista as linhas fictícias e avisa que só elas existem.
- **Viagem ativa:** fica no `ViagemContext`, no layout raiz, e continua valendo em qualquer tela enquanto o app está aberto (sem segundo plano, RN-TAV-08). Um cartão na aba Transporte lembra que a localização está sendo compartilhada e permite encerrar. Termina quando o usuário encerra, sai da conta, passam 2 horas ou o servidor responde `ativa: false`.
- **Desvio de rota:** a pergunta "O ônibus mudou de rota?" aparece em qualquer tela; ao confirmar, o app abre a ocorrência criada ou reforçada.
- **Intervalo de envio da posição:** 1 minuto (RN-TAV-04). Com a fonte `mock`, em que o transporte é simulado no app, cai para 10 segundos, só para o fluxo de desvio caber em uma demonstração; a simulação também troca a posição quando o aparelho está a mais de 2 km da linha.
- **Sair da conta:** pede confirmação e descarta as ações "Aguardando envio" daquele usuário no aparelho.
- **Com a fonte `mock`**, a tela de login mostra a conta de demonstração e "Entrar com Google" usa uma conta simulada. Com `bff` no Expo Go, o botão do Google avisa que o recurso depende do APK.
- **Fonte de dados (`EXPO_PUBLIC_DATA_SOURCE`):** `bff` (padrão) usa o Firebase Authentication para o login e o BFF (`EXPO_PUBLIC_BFF_URL`, adaptadores Axios em `src/services/http/`) para todo o domínio; o Firestore guarda só `users/{uid}` (`src/services/firestore/userData.firestore.ts`). `mock` usa dados no aparelho. Até 18/11/2026 havia também a fonte `firestore`, com o domínio inteiro no Firestore; ela foi removida na integração com o BFF (doc 06, decisões 30 a 32).
- **Troca de e-mail com Firebase:** a troca só vale depois que a pessoa confirma pelo link enviado ao novo endereço; o app avisa "enviamos um link de confirmação".
- **Tempo real:** o detalhe da ocorrência e os comentários são consultados de novo a cada 20 s enquanto a tela está aberta e o app em primeiro plano (`tempoReal.http.ts`). Essas atualizações acontecem em segundo plano; o indicador de "puxar para atualizar" só aparece quando a pessoa puxa a tela (`usePuxarParaAtualizar`).
- **Foto que não carrega** mostra a imagem padrão "Foto indisponível".
- Tema **light e dark** em todas as telas, preferência salva no AsyncStorage.
- Acessibilidade conforme RN-GER-01 a RN-GER-05 (`accessibilityLabel`, `accessibilityRole`, áreas de toque ≥ 44 pt, fonte do sistema, contraste AA).

## 3. Estrutura de pastas

```
app/                          # Expo Router
  _layout.tsx                 # providers (Query, Auth, Theme)
  (auth)/
    login.tsx
    cadastro.tsx
    recuperar-senha.tsx
    termos.tsx
  (tabs)/
    _layout.tsx               # abas
    explorar/
      index.tsx               # lista + mapa + filtros
      [id].tsx                # detalhe da ocorrência
      [id]/comentarios.tsx
      [id]/concluir.tsx
      [id]/editar.tsx         # autor edita descrição e fotos (RN-REG-09)
    registrar/
      index.tsx               # categoria, tipo, localização
      semelhantes.tsx
      detalhes.tsx            # formulário dinâmico
    transporte/
      index.tsx               # busca de linha
      [linha].tsx             # trajeto, ônibus, "Estou neste ônibus"
    minhas/
      index.tsx               # abas: registradas, sou afetado, apoio
    perfil/
      index.tsx               # resumo da conta, tema, notificações, sair, excluir conta
      conta.tsx               # editar nome, e-mail e alterar/definir senha (RN-CON-07, 13, 14)
      sobre.tsx               # aviso de não ser canal oficial, termos, privacidade
src/
  components/                 # OcorrenciaCard, CategoriaBadge, EstadoBadge, ContagemParticipacao,
                              # FilterBar, EmptyState, Loading, ErrorMessage, OfflineBanner,
                              # CustomButton, CustomInput, FotoPicker, DynamicField, ...
  config/
    formularios.ts            # JSON dos formulários por categoria
    categorias.ts
    termos.ts                 # textos dos termos de uso e da política de privacidade
  context/
    AuthContext.tsx
    ThemeContext.tsx
    ToastContext.tsx
    RegistroContext.tsx       # rascunho dos três passos do registro
    ViagemContext.tsx         # viagem "Estou neste ônibus" e envio periódico da posição
  hooks/
    useAuth.ts  useOcorrencias.ts  useOcorrencia.ts  useParticipacao.ts  useComentarios.ts
    useLocalizacao.ts  useViagem.ts  useMapa.ts  useFiltrosExplorar.ts  useMinhasOcorrencias.ts
    useConectividade.ts  useFilaOffline.ts  useSincronizarFila.ts  useTempoReal.ts
    useNotificacoesPush.ts  useNotificacoesAtivas.ts  useEstadoOcorrenciaUsuario.ts
    usePuxarParaAtualizar.ts  useRedesenhoMarcadores.ts  useCabecalhoRolavel.ts  useSairDoLogin.ts
  services/
    index.ts                  # único ponto que escolhe a fonte de dados (bff ou mock)
    contratos.ts              # interfaces dos services, iguais para todas as fontes
    firebase.ts               # inicialização (lê firebaseConfig.json)
    api.ts                    # instância Axios + interceptors
    http/                     # adaptadores do BFF: rotas, ocorrências, recursos, fotos, tempo real
    firestore/                # auth.firebase.ts (Firebase Auth) e userData.firestore.ts (users/{uid})
    mock/                     # adaptadores com dados de demonstração
    erros.ts                  # códigos do contrato → mensagens amigáveis
    imagem.ts                 # compressão WebP
    geocodificacao.ts         # endereço aproximado para a prévia do título
    googleNativo.ts           # login com Google nativo (só no APK)
    notificacoes.ts           # permissão, token, toque na notificação
    userDataService.ts        # dados do usuário no modo mock (AsyncStorage)
    offlineQueue.ts           # fila "Aguardando envio"
    queryClient.ts            # TanStack Query com cache persistido
    storage.ts                # chaves do AsyncStorage
  mocks/                      # dados semente do mock
  types/
    api.ts  categoria.ts  comentario.ts  estado.ts  formulario.ts  ocorrencia.ts  transporte.ts  usuario.ts
  theme/
    colors.ts  tokens.ts  categorias.ts  index.ts
  utils/
    formatarData.ts  distancia.ts  validacoes.ts  registro.ts  regrasOcorrencia.ts  haptics.ts
firestore.rules
firebaseConfig.json           # configuração pública do SDK cliente (versionada)
.env.example
```

## 4. Padrões obrigatórios

### 4.1 Interceptor Axios (`services/api.ts`)
- **Request:** injeta `Authorization: Bearer <ID token do Firebase>` (obtido do usuário atual; o SDK renova o token sozinho).
- **Response:**
  - `401` → força renovação do token e repete a requisição uma vez; se falhar, encerra a sessão.
  - `429` → mensagem "Muitas ações seguidas, aguarde um instante" (RN-GER-12).
  - Sem conexão → erro tipado de offline, tratado pela fila (RN-GER-10).
- Base URL do BFF vem de variável de ambiente (`EXPO_PUBLIC_BFF_URL`).
- Os caminhos do BFF ficam em um único arquivo (`src/services/http/rotas.ts`) e seguem o contrato app ↔ BFF do doc 08, seção 11.

### 4.2 Formulário dinâmico (registro de ocorrência)
Os campos do registro são gerados a partir de `config/formularios.ts`. A tela percorre `fields`, identifica o `type`, renderiza o componente correspondente (`DynamicField`), controla valores, valida obrigatórios e regras de tamanho.

```ts
type FieldType = 'text' | 'multiline' | 'select' | 'datetime' | 'linha' | 'fotos';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  options?: { label: string; value: string }[];
  maxItems?: number;
  help?: string;                    // texto de apoio abaixo do campo
  step?: 'inicio' | 'detalhes';     // passo do registro em que o campo aparece (padrão: detalhes)
}

interface CategoriaFormConfig {
  categoria: Categoria;
  fields: FormField[];
}
```

Exemplos:
- Todas as categorias: `tipo` (select, obrigatório), `descricao` (multiline, 10–500, obrigatório), `fotos` (fotos, até 3, opcional).
- Transporte: + `linha` (linha, opcional) — RN-REG-03.
- Segurança: + `dataHoraOcorrido` (datetime, opcional) e aviso fixo de RN-REG-12.

O mesmo JSON alimenta dois passos do registro, pelo campo `step`:
- `inicio` (`registrar/index.tsx`): `tipo` e, em Transporte, `linha`, junto da categoria e da localização. Ficam antes das sugestões porque tipo e linha são critérios de semelhança (RN-SEM-01, RN-SEM-03).
- `detalhes` (`registrar/detalhes.tsx`): `dataHoraOcorrido`, `descricao` e `fotos`.

Fluxo: passo 1 → busca de semelhantes → `semelhantes.tsx` só se houver sugestão → `detalhes.tsx`. Segurança, falta de conexão ou falha na busca pulam direto para os detalhes (RN-SEM-04, RN-SEM-08). O rascunho dos três passos fica no `RegistroContext` e é limpo após o envio.

Localização (RN-REG-06): GPS, alfinete fixo no centro de um mapa em tela cheia, ou busca por endereço com o geocodificador do aparelho (`expo-location`). O "rua, bairro" mostrado no formulário é só para exibição; o título oficial é gerado pelo servidor (RN-REG-07).

Após registrar: online, abre o detalhe da ocorrência criada; offline, o registro vai para a fila "Aguardando envio" e o app volta para Explorar.

### 4.3 Offline (RN-GER-09, RN-GER-10)
- Leituras: TanStack Query com persister no AsyncStorage; sem conexão, exibe o cache com `OfflineBanner` "Você está offline".
- Escritas (registrar, participar, comentar): sem conexão, a ação vai para `offlineQueue` no AsyncStorage com status "Aguardando envio" e um id local único.
- Ao voltar a conexão (NetInfo), a fila é enviada em ordem. Cada ação leva um `Idempotency-Key` (o id local) para evitar duplicidade se o envio for repetido.
- Fotos de registros offline são comprimidas na hora e enviadas ao BFF (`POST /fotos`) quando a fila é processada.

### 4.4 Push (Android)
- Permissão pedida após o primeiro registro ou participação (RN-NOT-01).
- Token salvo em `users/{uid}/devices/{deviceId}` no Firestore e atualizado quando mudar.
- Toque na notificação abre `/(tabs)/explorar/[id]` pelo `occurrenceId` do payload (RN-NOT-05).
- Tratar permissão negada e aparelho sem token, sem quebrar o app.

### 4.5 Segredos
- `firebaseConfig.json` (configuração pública do SDK cliente) é versionado.
- Nenhuma credencial administrativa, conta de serviço ou token da SPTrans no app ou no repositório.
- `.env.example` lista apenas nomes de variáveis.

## 5. README do app (obrigatório)
- Nome, descrição e Ficha da CitizenTech.
- **Nome completo e RM de todos os integrantes.**
- Tecnologias e versão do Expo.
- Serviços Firebase usados e a responsabilidade de cada um.
- Como instalar, configurar (Firebase, Google, FCM) e executar (development build).
- Estrutura de pastas.
- Regras do Firestore.
- Prints das telas e evidência de notificação recebida.
- Link do vídeo (até 3 minutos).
- Seção "O que aplicamos do semestre" (tabela abaixo).

## 6. O que aplicamos do semestre

| Conteúdo | Onde está no Colecity |
|---|---|
| TypeScript sem `any` | Todo o projeto |
| Componentização e ESModules | `src/components`, `src/services`, `src/hooks` |
| Navegação por abas e stack | Expo Router: abas Explorar, Registrar, Transporte, Minhas, Perfil, com stack de detalhe |
| Context API | Autenticação, tema, avisos (toast), rascunho do registro e viagem ativa |
| Hooks customizados, `useMemo`, `useCallback` | `useOcorrencias`, `useParticipacao`, `useViagem`, filtros e mapa |
| AsyncStorage | Tema, filtros, rascunho, cache e fila offline |
| Consumo de API com Axios, service layer e interceptors | Comunicação com o BFF, token automático, tratamento de 401/429 |
| TanStack Query | Leituras com cache, retry e offline |
| Loading, erro, retry e empty state | Todas as telas |
| Formulário dinâmico a partir de JSON | Registro de ocorrência por categoria |
| Firebase Authentication | Login e-mail/senha e Google, sessão persistente |
| Cloud Firestore com regras de segurança | `users/{uid}`: aceite, preferências, estado por ocorrência e aparelhos (`firestore.rules`) |
| Upload de imagens com permissões | Fotos de ocorrências e comentários, enviadas ao BFF com o ID token (Vercel Blob) |
| Push com FCM via API própria | O domínio calcula os destinatários, o BFF filtra preferências e envia pelo Expo Push; o toque abre a ocorrência |
| Tema light/dark | Perfil |

## Nota — build, Maps e push (17/11/2026)

- **Variáveis:** `mobile/.env` deixou de ser versionado (o `.gitignore` ignora `.env` e `.env.*`, menos `.env.example`). A chave do Maps é `API_KEY_MAPS` (antes `GOOGLE_MAPS_ANDROID_API_KEY`), lida no `app.config.ts` para `android.config.googleMaps.apiKey`; no EAS ela é cadastrada com `eas env:create`.
- **Push no app:** `src/services/notificacoes.ts` e `src/hooks/useNotificacoesPush.ts`. O `expo-notifications` é carregado sob demanda, só no Android fora do Expo Go e com a fonte `bff`; nos demais casos tudo vira "não faz nada". Permissão pedida após o primeiro registro ou participação (RN-NOT-01); Expo push token gravado em `users/{uid}/devices/{deviceId}`; aparelho desativado no logout e apagado na exclusão da conta; toque abre `/explorar/[id]`; o Perfil explica permissão negada e aparelho sem token.
- **Aviso de eventos (até 18/11/2026):** o app chamava `POST /notificar` da API de push depois de comentar, concluir ou reabrir. Desde a integração com o BFF, o push nasce no domínio (outbox → `POST /eventos-dominio` do BFF) e o app só registra o aparelho.
- **Regras do Firestore:** `devices` só o dono; as coleções do BFF (`eventosProcessados`, `bffUsuarios`) fechadas para qualquer cliente.

## Nota — login com Google (17/11/2026)

- Biblioteca `@react-native-google-signin/google-signin` (plugin no `app.config.ts`, modo Firebase: lê o `google-services.json`). Carregada sob demanda em `src/services/googleNativo.ts`, só fora do Expo Go; no Expo Go resolve como `RECURSO_INDISPONIVEL` e a tela de login mostra o aviso de sempre.
- `webClientId` = cliente OAuth do tipo web (`client_type: 3`) lido do `google-services.json`.
- Fluxo (`authFirebase.entrarComGoogle`): seletor de conta → `idToken` → `signInWithCredential`. Se `users/{uid}` ainda não tem aceite dos termos, a sessão é encerrada e a tela pede o aceite (RN-CON-11); o `idToken` fica em memória para a segunda chamada não pedir a conta de novo. Cancelar o seletor não mostra erro.
- Conta só Google: `definirSenha` usa `linkWithCredential` com o e-mail do Google (RN-CON-13); exclusão confirma com novo login Google na mesma conta (`reauthenticateWithCredential`; outra conta = credenciais inválidas) (RN-CON-08). O logout também encerra a sessão do Google no aparelho.
- Depende da SHA-1 do keystore do EAS cadastrada no Firebase (doc 14 §4.3.1).

## Nota — APK fechando ao abrir (17/11/2026)

O primeiro APK fechava antes da primeira tela: o R8, ligado por padrão no build de release do SDK 58, removia a classe gerada do banco interno do WorkManager (`WorkDatabase_Impl`, usado por `expo-notifications` e Google Play Services). Correção em `app.config.ts` com `expo-build-properties`: `enableMinifyInReleaseBuilds: false` e `enableShrinkResourcesInReleaseBuilds: false` (APK um pouco maior), e regras `-keep` para as classes do Room caso a minificação volte a ser ligada.

## Nota — laço no token de push (17/11/2026)

No primeiro APK, pedir o Expo push token fazia o Android emitir o evento de token novo, e o listener do app pedia o token de novo: cerca de 13 consultas por segundo, cada uma regravando `users/{uid}/devices`. Correção em `src/services/notificacoes.ts`: o listener só reage a um token diferente do último visto, e o aparelho só é regravado quando a conta ou o token mudam.

## Nota — conclusão com erro e outro aparelho desatualizado (17/11/2026, histórico)

Vale para a fonte `firestore`, removida em 18/11/2026. Hoje a conclusão passa pelo domínio, e as telas são atualizadas por consulta a cada 20 s.

- **Sintoma:** ao concluir, quem concluiu via um erro, mas a ocorrência ficava concluída; no outro aparelho continuava aberta.
- **Causa 1:** o `concluir` (e o `reabrir`) gravava e só depois fazia leituras extras para montar o detalhe; com a conexão instável essas leituras falhavam e o erro aparecia para uma ação já gravada. Agora o detalhe é montado antes de gravar.
- **Causa 2:** no React Native o canal de streaming padrão do Firestore (WebChannel) caía ("transport errored") e os listeners paravam. `src/services/firebase.ts` usa `initializeFirestore` com `experimentalForceLongPolling: true`.
- **Causa 3:** o listener do detalhe só atualizava a própria tela. Agora também invalida o cache em memória do Firestore, as listas, Minhas e o mapa.

## Nota — fotos no Vercel Blob (17/11/2026)

- Decisão: sem plano Blaze (sem Firebase Storage) e sem projeto livre no Supabase, as fotos vão para o **Vercel Blob**, no mesmo projeto da API de push (`push-api/`, hoje `bff/`).
- Fluxo: `uploadHttp` (`src/services/http/upload.http.ts`, antes `uploadNuvem`) envia a foto WebP para `POST /fotos?destino=…` com o ID token; a API valida login, assinatura WebP e tamanho (≤ 2 MB), grava em `{destino}/{uid}/{id}.webp` (público) e devolve `{ id, path, url }`. O domínio guarda só o `path`; o BFF acrescenta a URL nas respostas.
- Falha de rede no envio vira `OFFLINE`: a ação vai para a fila offline e a foto sobe depois.
- Fora do escopo: apagar fotos do Blob ao excluir a conta (fazem parte das ocorrências, que permanecem anonimizadas).
