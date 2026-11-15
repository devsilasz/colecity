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
| Fotos | `expo-image-picker` + `expo-image-manipulator` (WebP, maior lado ≤ 1920 px, qualidade 0,7) + **Firebase Storage** |
| Localização | `expo-location` |
| Mapa | `react-native-maps` (marcadores, mapa de calor, trajeto da linha) |
| Push | `expo-notifications` + **FCM** (Android) |
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
- **Mapa:** duas camadas, "Ocorrências" (marcador maior = mais participação) e "Mapa de calor" (sempre com o número de afetados por área). As Zonas de atenção aparecem nas duas, com o total de relatos. O mapa carrega até 50 ocorrências (limite de página do doc 10), as de maior participação. Sem Google Maps (iOS no Expo Go), o calor vira círculos com número.
- **Detalhe:** menu "Mais ações" (só com login) com editar (autor), silenciar notificações da ocorrência e denunciar. Fotos abrem em tela cheia, com "Denunciar foto".
- **Participação:** apoiar pede confirmação avisando que o nome fica público (exceto em Segurança, que não tem lista); retirar afetado ou apoio também pede confirmação. Visitante que toca nos botões vai para o login.
- **Comentários:** tela própria, leitura aberta; links são tocáveis, com aviso de que não são verificados. Comentários na fila offline aparecem no fim da lista como "Aguardando envio".
- **Editar ocorrência:** só online (não entra na fila offline).
- **Minhas:** três abas em um seletor; as três são carregadas para o ponto de "novidade" aparecer em cada aba. Registros feitos offline aparecem no topo de "Registradas por mim" como "Aguardando envio"; se o servidor recusar, mostram o motivo com "Tentar novamente" e "Descartar".
- **Novidade (RN-MIN-04):** a ocorrência é marcada quando `ultimaAtividadeEm` é posterior à última visita do usuário (`lastSeenAt`), ou quando ele acompanha e nunca abriu. A visita é registrada ao abrir o detalhe e ao marcar participação.
- **Concluir e reabrir:** aparecem no detalhe, no bloco "Acompanhamento", só para quem pode (`podeConcluir`, `podeReabrir`). Concluir abre `[id]/concluir.tsx` (feedback e fotos opcionais) e pede confirmação; reabrir pede confirmação no próprio detalhe. As duas ações são só online.
- **Transporte ao vivo:** a busca e a tela da linha são abertas a visitantes; "Estou neste ônibus" exige login e confirmação. A tela da linha traz o mapa (trajeto oficial, ônibus SPTrans e relatados por passageiros) e a mesma informação em lista, atualizada a cada 15 s.
- **Viagem ativa:** fica no `ViagemContext`, no layout raiz, e continua valendo em qualquer tela enquanto o app está aberto (sem segundo plano, RN-TAV-08). Um cartão na aba Transporte lembra que a localização está sendo compartilhada e permite encerrar. Termina quando o usuário encerra, sai da conta, passam 2 horas ou o servidor responde `ativa: false`.
- **Desvio de rota:** a pergunta "O ônibus mudou de rota?" aparece em qualquer tela; ao confirmar, o app abre a ocorrência criada ou reforçada.
- **Intervalo de envio da posição:** 1 minuto (RN-TAV-04). Com `EXPO_PUBLIC_USE_MOCK=true` cai para 10 segundos, só para o fluxo de desvio caber em uma demonstração; o mock também simula a posição quando o aparelho está a mais de 2 km da linha.
- **Sair da conta:** pede confirmação e descarta as ações "Aguardando envio" daquele usuário no aparelho.
- **Com mock ativo**, a tela de login mostra a conta de demonstração e "Entrar com Google" usa uma conta simulada.
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
    RegistroContext.tsx       # rascunho dos três passos do registro
    ViagemContext.tsx         # viagem "Estou neste ônibus" e envio periódico da posição
  hooks/
    useAuth.ts  useOcorrencias.ts  useOcorrencia.ts  useParticipacao.ts
    useComentarios.ts  useLocalizacao.ts  useViagem.ts  useNotificacoes.ts
    useConectividade.ts  useFilaOffline.ts  useSincronizarFila.ts  useNotificacoesAtivas.ts
    useFiltrosExplorar.ts  useMapa.ts  useEstadoOcorrenciaUsuario.ts  useMinhasOcorrencias.ts
  services/
    firebase.ts               # inicialização (lê firebaseConfig.json)
    api.ts                    # instância Axios + interceptors
    authService.ts
    ocorrenciaService.ts
    participacaoService.ts
    comentarioService.ts
    transporteService.ts
    uploadService.ts          # compressão WebP + upload Storage
    notificationService.ts    # permissão, token, toque na notificação
    userDataService.ts        # Firestore do usuário
    offlineQueue.ts
    storage.ts                # AsyncStorage
  types/
    ocorrencia.ts  categoria.ts  usuario.ts  comentario.ts  transporte.ts
    formulario.ts  navigation.ts  api.ts
  theme/
    colors.ts
  utils/
    formatarData.ts  distancia.ts  validacoes.ts
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
- Fotos de registros offline são comprimidas na hora e enviadas ao Storage junto com a fila.

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
| Context API | Autenticação e tema |
| Hooks customizados, `useMemo`, `useCallback` | `useOcorrencias`, `useParticipacao`, `useViagem`, filtros e mapa |
| AsyncStorage | Tema, filtros, rascunho, cache e fila offline |
| Consumo de API com Axios, service layer e interceptors | Comunicação com o BFF, token automático, tratamento de 401/429 |
| TanStack Query | Leituras com cache, retry e offline |
| Loading, erro, retry e empty state | Todas as telas |
| Formulário dinâmico a partir de JSON | Registro de ocorrência por categoria |
| Firebase Authentication | Login e-mail/senha e Google, sessão persistente |
| Cloud Firestore com regras de segurança | Dispositivos, preferências e estado por ocorrência |
| Upload de imagens com permissões | Fotos de ocorrências e comentários (Storage) |
| Push com FCM via API própria | BFF calcula destinatários e envia; deep link para a ocorrência |
| Tema light/dark | Perfil |
