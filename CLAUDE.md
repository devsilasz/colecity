# Colecity — Global Solution 2026/2 (FIAP)

CitizenTech colaborativa para relatar, acompanhar e se mobilizar em torno de problemas urbanos da cidade de São Paulo.

## Leia primeiro
- `docs/README.md` — índice. Fonte da verdade: docs 07, 08, 09 e 10.
- `docs/07-regras-de-negocio-produto.md` — todas as regras (códigos RN-XXX-NN).
- `docs/08-arquitetura.md` — app Expo → BFF (Firebase Cloud Functions) → API de domínio C# (do Silas).
- `docs/09-stack-mobile.md` — stack, padrões e estrutura de pastas do app.
- `docs/10-contrato-api-dominio.md` — contrato BFF ↔ domínio.
- `docs/11-features.md` e `docs/12-test-cases.md` — features e testes (entrega de Testing, já feita no Azure DevOps; não alterar).
- `docs/13-padroes-mobile-professor.md` — padrões e erros que o professor de Mobile cobra.
- `docs/enunciado-gs.pdf` — enunciado oficial.

Use apenas a pasta `docs/` como referência de requisitos.

## Situação
- Testing: entregue/fechado no Azure DevOps (projeto RM559094/Colecity). Não criar nem editar itens lá.
- Mobile: próximo trabalho. Entrega até 19/11 23h55: repositório GitHub com app Expo funcional, README (Ficha da CitizenTech, como rodar, prints, nome e RM dos integrantes) e link de vídeo de até 3 min. Rubrica: telas e navegação, consumo de dados, banco de dados, acessibilidade, aderência ao problema, documentação.
- API de domínio (C#, Silas) ainda não existe: o app deve funcionar com mock seguindo o contrato do doc 10, trocável pela API real.

## Regras do app (resumo do doc 09)
- Expo SDK mais recente, TypeScript sem `any`, Expo Router, Context API, hooks customizados, Axios com interceptor, TanStack Query (persistido no AsyncStorage), formulário de registro gerado por JSON, tema claro/escuro, acessibilidade.
- Firebase completo (plano Blaze): Auth (e-mail/senha e Google), Cloud Functions (BFF, sem framework web), Firestore (dados do próprio usuário, com regras), Storage (fotos WebP), FCM (push só Android). Development build (push não funciona no Expo Go).
- Segredos nunca no repositório; `firebaseConfig.json` (config pública do cliente) é versionado; `.env.example` só com nomes.

## Ambiente
- Usuário em Windows. Quando surgir decisão de produto não coberta pelos docs, perguntar antes e registrar nos docs.
