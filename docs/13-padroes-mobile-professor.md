# 13 — Padrões cobrados pelo professor de Mobile

Requisitos cobrados pelo professor de Mobile ao longo do semestre, filtrados para o que o Colecity usa. Complementa o [doc 09](09-stack-mobile.md).

## Erros que zeram ou derrubam nota
- Uso de `any` (inclusive para contornar tipos do Firebase ou da navegação).
- App que não executa.
- README sem **nome completo e RM de todos os integrantes** (nota zero).
- Entrega fora do GitHub (não aceita .zip nem Drive).
- Dependência instalada sem uso funcional.
- Regras do Firestore/Storage abertas (`allow read, write: if true`).
- Credencial administrativa, `serviceAccountKey.json` ou chave privada no app ou no repositório (mesmo privado).
- Push enviado direto pelo app com credencial administrativa, ou simulado com alerta local.
- Faltar loading, tratamento de erro, service layer ou interceptor.

## TypeScript
- Tipar: props, estados, funções, eventos, respostas da API, contextos, dados lidos/gravados no Firebase, parâmetros de navegação.
- Tipos de rota declarados (ex.: `{ id: string }` para `/ocorrencia/[id]`).

## Organização (ESModules)
`app/` (rotas do Expo Router), `src/components/`, `src/services/`, `src/hooks/`, `src/context/`, `src/types/`, `src/utils/`, `src/config/` (estrutura completa no doc 09). Separar: UI nas telas, chamadas HTTP e Firebase nos services, lógica reutilizável em hooks, estado global em context.

## Hooks
- `useState`, `useEffect`, `useMemo`, `useCallback` com finalidade real.
- Hooks customizados para separar a lógica das telas (lista no doc 09).
- Estado imutável; estados derivados com `useMemo`.
- Remover listeners (Firestore, NetInfo, notificações, localização) no cleanup do `useEffect`, sem duplicar listeners.

## Context API
- Estado global não pode ficar só em `useState` nas telas.
- Contextos esperados: autenticação e tema.

## Navegação
- Expo Router: abas inferiores `(tabs)` no fluxo principal e telas de detalhe/formulário empilhadas (stack).

## Consumo de API
- Axios com service layer (`api.ts` + services por recurso) e hooks que usam os services.
- **Interceptor obrigatório** (request: header de autenticação; response: tratamento de erro e logs).
- **TanStack Query** (`QueryClientProvider`, `useQuery`, `queryKey`, `useMutation`).
- Sempre: loading, erro com mensagem amigável, botão de tentar novamente, estado vazio.

## Armazenamento local
- AsyncStorage para preferências (tema, filtros) e persistência local.
- Tema **light e dark** em todas as telas principais, persistido.

## Formulário dinâmico
- Formulário de registro de ocorrência gerado a partir de configuração JSON por categoria: percorrer `fields`, renderizar o componente pelo `type`, controlar valores e validar obrigatórios (doc 09, seção 4.2).

## Firebase
- **Auth:** criar conta, login (e-mail/senha e Google), recuperar sessão, identificar por `uid`, logout. Após logout: limpar estado, remover listeners e voltar ao login.
- **Firestore:** dados do próprio usuário e tokens de dispositivo em `users/{uid}/devices/{deviceId}` (doc 08, seção 8); regras versionadas no repositório.
- **Storage:** fotos enviadas a serviço de armazenamento; salvar só a URL/caminho; **proibido Base64 no banco**; imagem padrão quando a foto falhar; pedir e tratar permissões.
- **Push (somente Android):** `expo-notifications` + FCM; development build (não depender do Expo Go); token salvo e atualizado; tratar permissão negada e aparelho sem token; payload com o id do recurso; toque na notificação abre a tela correspondente.
- **Envio de push pelo BFF (Cloud Functions):** valida o ID token com Admin SDK, calcula destinatários no servidor (nunca confia em lista enviada pelo app), protege contra chamadas duplicadas, remove tokens inválidos, texto sem dados sensíveis, health check.
- `firebaseConfig.json` versionado com a configuração pública do SDK cliente; `.env.example` para app e BFF, só com nomes de variáveis.

## Estados que a interface deve tratar
Loading, erro, não autenticado, lista vazia, falha no envio, permissão negada (localização, câmera/galeria, notificação), aparelho sem token de push, offline.

## UI
- Layout limpo, espaçamento consistente, Flexbox + StyleSheet, cores por estado/status, inputs estilizados, empty state amigável, loading ao buscar dados, confirmação antes de excluir/ações destrutivas, feedback visual ao salvar, mensagens de erro claras.

## README
- Nome e descrição do projeto; tecnologias e versão do Expo; como instalar, configurar e executar; estrutura de pastas; prints das telas; **nome completo e RM de todos os integrantes**.
- Itens do Firebase: serviços usados e responsabilidade de cada um; serviço de armazenamento de fotos; configuração de notificações no Android; regras do Firestore; evidência de notificação recebida; URL e endpoints da API (BFF) e health check.
- Itens da GS: Ficha da CitizenTech e link do vídeo (até 3 min).
