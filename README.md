# Colecity

**Colecity** (cidade coletiva) é uma CitizenTech colaborativa para a cidade de São Paulo. Moradores relatam problemas urbanos (transporte, água, energia, vias, árvores, segurança e riscos), veem no mapa onde eles se concentram e, em vez de reclamar sozinhos, se juntam a quem enfrenta o mesmo problema, como afetados ou apoiadores, acompanhando cada ocorrência ao longo do tempo.

Projeto da **Global Solution 2026/2 · FIAP · Engenharia de Software**.

> O Colecity não é um canal oficial da Prefeitura e não encaminha manifestações a órgãos públicos.

## Integrantes

| Nome | RM |
|---|---|
| Guilherme Oliveira | RM 558797 |
| Matheus Dantas | RM 558804 |
| Rafael Panhoca | RM 555014 |
| Silas Alves | RM 555020 |
| Victor Rodriguez | RM 559094 |

## Ficha da CitizenTech

| Campo | Resposta |
|---|---|
| **Nome** | Colecity |
| **Cidade** | São Paulo, SP |
| **Cidadão beneficiado** | Moradores e usuários de serviços urbanos da cidade |
| **Problema** | Reclamações sobre problemas urbanos ficam isoladas: as pessoas não sabem o que está acontecendo agora, qual a extensão do problema nem quem mais é afetado |
| **Como funciona** | O cidadão consulta, registra e acompanha ocorrências por categoria e localização; ocorrências semelhantes são sugeridas antes de criar uma nova; participação separada entre "afetado" e "apoio"; comentários, linha do tempo e notificações; no transporte, os relatos são cruzados com os ônibus em tempo real da SPTrans |
| **Indicadores** | Ocorrências registradas, afetados e apoios por ocorrência, ocorrências concluídas, relatos cruzados com a SPTrans |
| **ODS** | 11 (cidades e comunidades sustentáveis), 10 (redução das desigualdades), 9 (indústria, inovação e infraestrutura) |

## Como o projeto está organizado

```
backend/     API REST em C#/.NET 10: regras de negócio, banco (EF Core), integração SPTrans Olho Vivo
mobile/      App React Native/Expo do cidadão: Firebase Authentication + Cloud Firestore
push-api/    API de notificações push (Node + TypeScript, Vercel)
docs/        Documentação do produto: visão, regras de negócio, arquitetura, features e casos de teste
```

| Parte | O que é | Detalhes |
|---|---|---|
| **App mobile** | Porta de entrada do cidadão: explorar no mapa e em lista, registrar, participar, comentar, acompanhar, transporte ao vivo e perfil | [`mobile/README.md`](mobile/README.md) |
| **API de push** | Valida o usuário, calcula no servidor quem deve ser avisado e envia as notificações (Android) | [`push-api/README.md`](push-api/README.md) |
| **Backend C#** | Camada de serviços: domínio de ocorrências, persistência, documentação OpenAPI, testes e cruzamento dos relatos de transporte com a SPTrans; segue o contrato do [doc 10](docs/10-contrato-api-dominio.md) | [`backend/README.md`](backend/README.md) |
| **Documentação** | Regras de negócio, arquitetura e especificação usadas no desenvolvimento e nos testes | [`docs/README.md`](docs/README.md) |

## Entregas por disciplina

| Disciplina | Onde está |
|---|---|
| **Mobile Development & IoT** | [`mobile/`](mobile/README.md) — app Expo, README com Ficha, como rodar, prints e vídeo |
| **C# Software Development** | [`backend/`](backend/README.md) — Web API, EF Core, LINQ, async, testes |
| **Arquitetura Orientada a Serviços (SOA) e Web Services** | [`backend/`](backend/README.md) — domínio, banco, migrations, documentação automática e testes |
| **Testing, Compliance & Quality Assurance** | Projeto no Azure DevOps (Épicos, Features e Casos de Teste de Homologação): https://dev.azure.com/RM559094/Colecity · especificação em [`docs/11-features.md`](docs/11-features.md) e [`docs/12-test-cases.md`](docs/12-test-cases.md) |

## Vídeos

- **App rodando (Mobile, até 3 min):** _a preencher_
- **Pitch (até 4 min):** _a preencher_

## Como rodar

Cada parte roda de forma independente; o passo a passo completo está no README de cada pasta.

```bash
# App mobile (Node 20+ e Expo Go no celular)
cd mobile && npm install && npm start

# Backend C# (.NET 10)
cd backend && dotnet run --project src/Colecity.Api   # documentação em http://localhost:5080/scalar

# API de push (Node 20+)
cd push-api && npm install && npx vercel dev
```
