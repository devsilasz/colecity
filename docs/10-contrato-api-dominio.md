# 10 — Contrato da API de domínio

Contrato entre o **BFF mobile** (Firebase Cloud Functions) e a **API de domínio** (C#/.NET). As regras citadas estão em [07](07-regras-de-negocio-produto.md); a arquitetura em [08](08-arquitetura.md).

A API de domínio é a única dona das regras de negócio: toda validação listada aqui é feita nela, mesmo que o app ou o BFF também validem antes.

---

## 1. Convenções

| Item | Padrão |
|---|---|
| Base | `https://<host>/api/v1` |
| Formato | JSON, `camelCase`, UTF-8 |
| Ids | UUID (string) |
| Datas | ISO 8601 em UTC (`2026-11-13T15:04:05Z`) |
| Coordenadas | `{ "lat": -23.55, "lng": -46.63 }` (WGS84) |
| Enums | strings em `UPPER_SNAKE_CASE` |
| Paginação | `?page=1&pageSize=20` (máx. 50). Resposta: `{ "items": [], "page": 1, "pageSize": 20, "total": 134 }` |
| Documentação | Swagger/OpenAPI em `/swagger` |
| Health check | `GET /health` → `200 { "status": "ok" }` (sem autenticação) |

### 1.1 Autenticação BFF → domínio

Toda requisição (exceto `/health`) envia:

| Header | Obrigatório | Descrição |
|---|---|---|
| `X-Service-Key` | sim | Segredo compartilhado entre BFF e domínio. Sem ele ou inválido → `401`. |
| `X-User-Id` | quando há usuário logado | `uid` do Firebase, já validado pelo BFF. Endpoints marcados 🔒 exigem este header; sem ele → `401`. |
| `Idempotency-Key` | em criações (marcadas ⟳) | Id único gerado pelo app. Repetir a mesma chave em até 24 h devolve a mesma resposta, sem criar de novo. |

O domínio nunca recebe nem valida tokens do Firebase; confia no `X-User-Id` apenas quando `X-Service-Key` é válido.

Usuário com conta **anonimizada** ou inexistente no domínio, em endpoint 🔒 (exceto `PUT /usuarios/me`) → `403 USUARIO_NAO_CADASTRADO`.

### 1.2 Erros

Formato Problem Details (RFC 7807), com `code` estável para o app mapear mensagens:

```json
{
  "type": "about:blank",
  "title": "Localização fora da área atendida",
  "status": 422,
  "code": "LOCALIZACAO_FORA_DO_MUNICIPIO",
  "errors": { "localizacao": ["A localização deve estar no município de São Paulo."] }
}
```

| Status | Uso |
|---|---|
| `400` | JSON malformado ou tipo inválido |
| `401` | Sem credencial de serviço ou sem usuário em endpoint 🔒 |
| `403` | Usuário sem permissão para a ação (ex.: não é o autor) |
| `404` | Recurso inexistente (ou oculto por moderação, para quem não é o autor) |
| `409` | Conflito de estado (ex.: participar de ocorrência concluída) |
| `422` | Violação de regra de negócio |
| `429` | Rate limit (RN-GER-12) |

Códigos (`code`) usados neste contrato estão listados em cada endpoint.

---

## 2. Enumerações

### 2.1 Categorias e tipos (RN-REG-05)

| Categoria (`categoria`) | Tipos (`tipo`) |
|---|---|
| `TRANSPORTE` | `ATRASO_INTERVALO_EXCESSIVO`, `ALTERACAO_ROTA_SEM_AVISO`, `LINHA_ESTACAO_FORA_OPERACAO`, `SUPERLOTACAO`, `PONTO_ESTACAO_DANIFICADO` |
| `AGUA` | `FALTA_ABASTECIMENTO`, `BAIXA_PRESSAO`, `VAZAMENTO_VIA`, `AGUA_APARENCIA_ALTERADA` |
| `ENERGIA` | `FALTA_ENERGIA`, `OSCILACAO`, `FIACAO_EXPOSTA_CAIDA`, `ILUMINACAO_PUBLICA_APAGADA` |
| `VIAS` | `BURACO`, `ALAGAMENTO`, `CALCADA_DANIFICADA`, `SEMAFORO_SINALIZACAO_DEFEITO` |
| `ARVORES` | `ARVORE_CAIDA`, `GALHO_RISCO_QUEDA`, `ARVORE_SOBRE_FIACAO` |
| `SEGURANCA` | `ASSALTO_ROUBO`, `FURTO`, `LOCAL_MAL_ILUMINADO_ERMO` |
| `RISCOS_INFRAESTRUTURA` | `RISCO_DESLIZAMENTO`, `TRECHO_PERIGOSO_PEDESTRES`, `ESTRUTURA_RISCO_QUEDA`, `CORREGO_TRANSBORDANDO` |

Cada tipo pertence a exatamente uma categoria. Tipo incompatível com a categoria → `422 TIPO_INVALIDO_PARA_CATEGORIA`.

### 2.2 Outras

| Enum | Valores |
|---|---|
| `EstadoOcorrencia` | `ABERTA`, `EM_ACOMPANHAMENTO`, `CONCLUIDA` |
| `MotivoConclusao` | `AUTOR`, `INATIVIDADE` |
| `MotivoDenuncia` | `OFENSIVO`, `DADOS_PESSOAIS`, `SPAM`, `FALSO` |
| `TipoConteudo` | `OCORRENCIA`, `COMENTARIO`, `FOTO` |
| `TipoEventoLinhaDoTempo` | `CRIADA`, `ESTADO_ALTERADO`, `MARCO_AFETADOS`, `DESVIO_DETECTADO`, `CONCLUIDA`, `REABERTA` |
| `FontePosicao` | `SPTRANS`, `PASSAGEIROS` |
| `AbaMinhas` | `REGISTRADAS`, `AFETADO`, `APOIO` |

---

## 3. Modelos

### 3.1 Foto

O app envia a foto ao Firebase Storage e o domínio recebe só a referência.

```json
{ "path": "ocorrencias/{uid}/{uuid}.webp" }
```
Regras: `path` deve terminar em `.webp` e começar com `ocorrencias/{uid}/` ou `comentarios/{uid}/` do próprio usuário (RN-REG-04). Senão → `422 FOTO_INVALIDA`. Máximo de 3 por recurso → `422 LIMITE_FOTOS_EXCEDIDO`.

Na resposta, fotos voltam como `{ "path": "...", "id": "uuid" }`. A URL pública é montada pelo BFF.

### 3.2 OcorrenciaResumo (listas)

```json
{
  "id": "uuid",
  "titulo": "Falta de abastecimento – Rua Taquari, Mooca",
  "categoria": "AGUA",
  "tipo": "FALTA_ABASTECIMENTO",
  "estado": "EM_ACOMPANHAMENTO",
  "bairro": "Mooca",
  "localizacaoAproximada": { "lat": -23.5512, "lng": -46.5998 },
  "totalAfetados": 37,
  "totalApoios": 12,
  "ultimaAtividadeEm": "2026-11-13T14:20:00Z",
  "zonaAtencao": false,
  "minhaParticipacao": { "afetado": true, "apoio": false, "autor": false }
}
```
- `localizacaoAproximada`: arredondada para ~100 m (RN-CSL-08). A localização exata nunca sai do domínio.
- `minhaParticipacao`: só vem quando há `X-User-Id`; senão `null`.
- `zonaAtencao`: `true` se a ocorrência está dentro de uma Zona de atenção (RN-ZON).

### 3.3 OcorrenciaDetalhe

`OcorrenciaResumo` +

```json
{
  "descricao": "Sem água desde ontem às 18h...",
  "rua": "Rua Taquari",
  "linha": null,
  "dataHoraOcorrido": null,
  "fotos": [{ "id": "uuid", "path": "ocorrencias/abc/123.webp" }],
  "autor": { "nome": "Ana", "removido": false },
  "criadaEm": "2026-11-12T21:00:00Z",
  "concluidaEm": null,
  "conclusao": null,
  "podeEditar": true,
  "podeConcluir": true,
  "podeReabrir": false,
  "avisoContagem": "Participações registradas no Colecity; não representam o total de afetados."
}
```
- `linha`: `{ "codigo": "8700-10", "nome": "Pq. Continental – Pça. Ramos" }` (só Transporte).
- `autor.removido = true` → `nome = "Usuário removido"` (RN-CON-08).
- `conclusao`: `{ "motivo": "AUTOR", "feedback": "A Prefeitura tampou o buraco.", "fotos": [...] }`.
- `podeEditar`: autor e estado ≠ `CONCLUIDA` (RN-REG-09). `podeConcluir`: autor e estado ≠ `CONCLUIDA` (RN-ACO-04). `podeReabrir`: usuário afetado, estado `CONCLUIDA` há ≤ 7 dias e não for Segurança (RN-ACO-07).

### 3.4 Comentario

```json
{
  "id": "uuid",
  "texto": "Ainda sem água na altura do nº 300.",
  "fotos": [],
  "autor": { "nome": "Bruno", "afetado": true, "removido": false },
  "criadoEm": "2026-11-13T14:20:00Z",
  "podeExcluir": false
}
```

---

## 4. Endpoints

Legenda: 🔒 exige `X-User-Id` · ⟳ exige `Idempotency-Key`.

### 4.1 Usuários (RN-CON)

#### `PUT /usuarios/me` 🔒
Cria ou atualiza o usuário do domínio no primeiro acesso (chamado pelo BFF após o login).
```json
{ "nome": "Ana Souza", "email": "ana@ex.com", "aceiteTermosVersao": "2026-11" }
```
- Usuário novo exige `aceiteTermosVersao` → senão `422 ACEITE_TERMOS_OBRIGATORIO` (RN-CON-01, RN-CON-11).
- `nome`: 2 a 80 caracteres → `422 NOME_INVALIDO`.
- Resposta `200` com `{ "id", "nome", "email", "aceiteTermosVersao", "criadoEm" }`.

#### `GET /usuarios/me` 🔒
Resposta: igual ao acima.

#### `PATCH /usuarios/me` 🔒
```json
{ "nome": "Ana S.", "email": "novo@ex.com" }
```
Campos opcionais. O BFF só envia `email` depois que a troca foi concluída no Firebase Auth (RN-CON-07). E-mail já usado por outro usuário → `409 EMAIL_JA_CADASTRADO`.

#### `DELETE /usuarios/me` 🔒
Anonimiza o usuário (RN-CON-08): apaga nome, e-mail, `uid` e posições de transporte; remove participações e recalcula contagens; ocorrências e comentários passam a exibir "Usuário removido". Resposta `204`. Depois disso, o `uid` não é mais reconhecido.

#### `GET /usuarios/me/ocorrencias?aba=REGISTRADAS|AFETADO|APOIO&page=` 🔒
Lista de `OcorrenciaResumo` (RN-MIN-01, 02): não concluídas primeiro, depois concluídas; dentro de cada grupo, `ultimaAtividadeEm` decrescente. A aba `AFETADO` inclui as ocorrências registradas pelo próprio usuário, pois o autor conta como afetado (RN-REG-08).

### 4.2 Categorias

#### `GET /categorias`
```json
[{ "categoria": "AGUA", "nome": "Água", "tipos": [{ "tipo": "FALTA_ABASTECIMENTO", "nome": "Falta de abastecimento" }] }]
```

### 4.3 Ocorrências — consulta (RN-CSL, RN-DES)

#### `GET /ocorrencias`
| Parâmetro | Tipo | Padrão | Regra |
|---|---|---|---|
| `categoria` | enum, repetível | todas | RN-CSL-03 |
| `estado` | enum, repetível | `ABERTA`,`EM_ACOMPANHAMENTO` | RN-CSL-04 |
| `lat`, `lng` | número | — | obrigatórios juntos com `raioKm` |
| `raioKm` | `1`, `5` ou `10` | — | outro valor → `400` |
| `linha` | string | — | ocorrências da linha |
| `page`, `pageSize` | int | 1, 20 | |

Ordenação: participação (`totalAfetados + totalApoios`) decrescente, depois `ultimaAtividadeEm` decrescente (RN-DES-02). Conteúdo oculto por moderação não aparece. Resposta: página de `OcorrenciaResumo`.

#### `GET /ocorrencias/{id}`
`OcorrenciaDetalhe`. Ocorrência oculta por moderação → `404` (exceto para o autor, que a vê com `"oculta": true`).

#### `GET /ocorrencias/{id}/linha-do-tempo`
```json
[{ "tipo": "MARCO_AFETADOS", "descricao": "10 pessoas afetadas", "em": "2026-11-13T10:00:00Z" }]
```
Eventos automáticos de RN-ACO-03, em ordem cronológica.

#### `GET /ocorrencias/{id}/apoiadores?page=`
`{ items: [{ "nome": "Carla" }], ... }` (RN-PAR-06). Categoria `SEGURANCA` → lista vazia (RN-PAR-07). Usuários removidos não aparecem.

#### `GET /mapa/calor?minLat=&minLng=&maxLat=&maxLng=&categoria=`
```json
[{ "lat": -23.55, "lng": -46.60, "peso": 37 }]
```
`peso` = afetados distintos na célula (RN-DES-01). Pode vir de agregação periódica (atualização em até 5 minutos).

#### `GET /mapa/zonas-atencao?minLat=&minLng=&maxLat=&maxLng=`
```json
[{ "categoria": "SEGURANCA", "centro": { "lat": -23.54, "lng": -46.63 }, "raioMetros": 300, "totalRelatos": 7, "texto": "7 relatos da comunidade nos últimos 30 dias" }]
```
RN-ZON-01 a 03.

### 4.4 Ocorrências — registro e ciclo de vida (RN-REG, RN-SEM, RN-ACO)

#### `POST /ocorrencias/semelhantes` 🔒
```json
{ "categoria": "AGUA", "tipo": "FALTA_ABASTECIMENTO", "localizacao": { "lat": -23.551, "lng": -46.599 }, "linha": null }
```
Resposta: até 5 `OcorrenciaResumo` + `distanciaMetros` (RN-SEM-02 a 05, 07). `SEGURANCA` → sempre `[]` (RN-SEM-04). Localização fora do município → `422 LOCALIZACAO_FORA_DO_MUNICIPIO`.

#### `POST /ocorrencias` 🔒 ⟳
```json
{
  "categoria": "TRANSPORTE",
  "tipo": "ALTERACAO_ROTA_SEM_AVISO",
  "descricao": "O 8700 não passou pela Av. X hoje.",
  "localizacao": { "lat": -23.53, "lng": -46.70 },
  "linha": "8700-10",
  "dataHoraOcorrido": null,
  "fotos": [{ "path": "ocorrencias/uid/1.webp" }]
}
```
Validações:
| Regra | Erro |
|---|---|
| Campos obrigatórios (RN-REG-02) | `422 CAMPO_OBRIGATORIO` |
| Descrição 10–500 caracteres | `422 DESCRICAO_TAMANHO_INVALIDO` |
| Tipo da categoria | `422 TIPO_INVALIDO_PARA_CATEGORIA` |
| Município de São Paulo (RN-REG-06) | `422 LOCALIZACAO_FORA_DO_MUNICIPIO` |
| `linha` só em `TRANSPORTE` e existente no GTFS | `422 LINHA_INVALIDA` |
| `dataHoraOcorrido` só em `SEGURANCA`, não futura, no máx. 30 dias atrás | `422 DATA_OCORRIDO_INVALIDA` |
| Fotos (seção 3.1) | `422 FOTO_INVALIDA` / `LIMITE_FOTOS_EXCEDIDO` |

Efeitos: estado `ABERTA`; título gerado "Tipo – Rua, Bairro" por geocodificação reversa (RN-REG-07); autor registrado como afetado (RN-REG-08); evento `CRIADA` na linha do tempo. Resposta `201` com `OcorrenciaDetalhe`.

#### `PATCH /ocorrencias/{id}` 🔒
```json
{ "descricao": "...", "fotos": [{ "path": "..." }] }
```
Só `descricao` e `fotos` (substitui a lista). Não autor → `403 SOMENTE_AUTOR`. Concluída → `409 OCORRENCIA_CONCLUIDA`. Outros campos enviados → `400`.

#### `POST /ocorrencias/{id}/conclusao` 🔒
```json
{ "feedback": "A Prefeitura tampou o buraco.", "fotos": [{ "path": "..." }] }
```
`feedback` opcional (até 500), fotos opcionais (até 3) (RN-ACO-04, 05). Não autor → `403 SOMENTE_AUTOR`. Já concluída → `409 OCORRENCIA_CONCLUIDA`. Evento `CONCLUIDA`; dispara `ocorrencia.estado_alterado`.

#### `POST /ocorrencias/{id}/reabertura` 🔒
Regras de RN-ACO-07. Não afetado → `403 SOMENTE_AFETADO`. Fora do prazo → `422 PRAZO_REABERTURA_EXPIRADO`. Segurança → `422 REABERTURA_NAO_PERMITIDA`. Estado volta a `EM_ACOMPANHAMENTO`; evento `REABERTA`. Quem reabre passa a ser o autor (`podeEditar`/`podeConcluir`, aba Registradas); o autor anterior segue como afetado. Na edição, as fotos que já eram da ocorrência continuam aceitas mesmo na pasta do autor anterior; só as novas precisam estar na pasta de quem edita.

> Não existe endpoint de exclusão de ocorrência (RN-REG-10).

#### Processos automáticos (tarefas agendadas no domínio)
| Processo | Frequência | Regra |
|---|---|---|
| Passar a `EM_ACOMPANHAMENTO` ao atingir 3 afetados | no momento da participação | RN-ACO-02 |
| Encerrar por inatividade (7 dias Água/Energia; 30 dias demais) | a cada hora | RN-ACO-06 |
| Concluir relatos de Segurança após 30 dias | a cada hora | RN-ACO-09 |
| Recalcular mapa de calor e Zonas de atenção | a cada 5 min | RN-DES-01, RN-ZON |

Conclusão automática usa `MotivoConclusao.INATIVIDADE` e dispara `ocorrencia.estado_alterado`.

### 4.5 Participação (RN-PAR)

| Método e rota | Efeito |
|---|---|
| `PUT /ocorrencias/{id}/participacoes/afetado` 🔒 | Marca "Também estou sendo afetado" |
| `DELETE /ocorrencias/{id}/participacoes/afetado` 🔒 | Retira |
| `PUT /ocorrencias/{id}/participacoes/apoio` 🔒 | Marca "Apoiar manifestação" |
| `DELETE /ocorrencias/{id}/participacoes/apoio` 🔒 | Retira |

- Idempotentes: marcar duas vezes não duplica; retirar o que não existe → `204` (RN-PAR-02).
- Resposta `200`: `{ "totalAfetados": 38, "totalApoios": 12, "minhaParticipacao": {...} }`.
- Autor apoiando a própria → `422 AUTOR_NAO_PODE_APOIAR` (RN-PAR-03). Autor retirando "afetado" → `422 AUTOR_SEMPRE_AFETADO`.
- Ocorrência concluída → `409 OCORRENCIA_CONCLUIDA` (RN-PAR-05).
- Marcos de 10, 50 e 100 afetados geram evento `MARCO_AFETADOS`.

### 4.6 Comentários (RN-COM)

#### `GET /ocorrencias/{id}/comentarios?page=`
Página de `Comentario`, mais antigo primeiro (RN-COM-05). Ocultos por moderação não aparecem (exceto para o próprio autor, com `"oculto": true`).

#### `POST /ocorrencias/{id}/comentarios` 🔒 ⟳
```json
{ "texto": "Ainda sem água.", "fotos": [] }
```
`texto` 1–500 → `422 COMENTARIO_TAMANHO_INVALIDO`. Ocorrência concluída → `409 OCORRENCIA_CONCLUIDA`. Resposta `201` com `Comentario`. Dispara `ocorrencia.comentario_criado`.

#### `DELETE /comentarios/{id}` 🔒
Só o autor → senão `403 SOMENTE_AUTOR` (RN-COM-04). Ocorrência concluída → `409 OCORRENCIA_CONCLUIDA` (e `podeExcluir: false` na listagem). Resposta `204`. Não há edição.

### 4.7 Denúncias (RN-MOD)

#### `POST /denuncias` 🔒
```json
{ "tipoConteudo": "COMENTARIO", "conteudoId": "uuid", "motivo": "OFENSIVO" }
```
- Uma denúncia por conta por conteúdo → repetida `409 DENUNCIA_JA_REGISTRADA`.
- Ao atingir 5 contas distintas, o conteúdo fica oculto (RN-MOD-02).
- Resposta `201`.

Revisão da equipe Colecity (não exposta ao BFF): `GET /admin/denuncias`, `POST /admin/denuncias/{conteudoId}/decisao` `{ "acao": "MANTER" | "REMOVER" }`, protegidos por credencial administrativa própria.

### 4.8 Transporte ao vivo (RN-TAV)

#### `GET /transporte/linhas?busca=8700`
`[{ "codigo": "8700-10", "nome": "Pq. Continental – Pça. Ramos", "sentidos": [{ "sentido": 1, "destino": "Pça. Ramos" }, { "sentido": 2, "destino": "Pq. Continental" }] }]` — dados do GTFS (RN-TAV-01). Mínimo 2 caracteres.

#### `GET /transporte/linhas/{codigo}/trajeto?sentido=1`
`{ "pontos": [{ "lat": ..., "lng": ... }] }` — `shapes.txt` do GTFS (RN-TAV-02).

#### `GET /transporte/linhas/{codigo}/veiculos?sentido=1`
```json
[
  { "fonte": "SPTRANS", "prefixo": "11234", "posicao": { "lat": ..., "lng": ... }, "atualizadoEm": "...", "acessivel": true },
  { "fonte": "PASSAGEIROS", "prefixo": null, "posicao": { "lat": ..., "lng": ... }, "atualizadoEm": "...", "acessivel": null }
]
```
- `SPTRANS`: Olho Vivo (`/Posicao/Linha`), com cache de 15 s no domínio (RN-TAV-03).
- `PASSAGEIROS`: posição agregada das viagens ativas da linha (média das posições recentes de passageiros próximos entre si); nunca expõe usuário (RN-TAV-06).

#### `POST /transporte/viagens` 🔒
`{ "linha": "8700-10", "sentido": 1 }` → `201 { "viagemId": "uuid", "expiraEm": "..." }`. Uma viagem ativa por usuário; iniciar outra encerra a anterior. Expira em 2 h (RN-TAV-05).

#### `POST /transporte/viagens/{id}/posicoes` 🔒
`{ "posicao": { "lat": ..., "lng": ... }, "registradaEm": "..." }` — enviada a cada 1 minuto pelo app.
Resposta:
```json
{ "ativa": true, "desvioSuspeito": false, "trechoDesvio": null }
```
- Viagem encerrada/expirada → `ativa: false` (app para de enviar).
- 10 min parado fora do trajeto → encerra (RN-TAV-05).
- Mais de 300 m do trajeto por mais de 2 min (na prática, 3 posições consecutivas fora do trajeto, com envio a cada 1 minuto) → `desvioSuspeito: true` + `trechoDesvio` (lista de pontos) (RN-TAV-07).
- Posições individuais apagadas após 24 h (RN-TAV-06).

#### `POST /transporte/viagens/{id}/desvio` 🔒
`{ "confirmado": true }`. Se `true`: cria ou reforça (usuário vira afetado) a ocorrência `TRANSPORTE / ALTERACAO_ROTA_SEM_AVISO` da linha, com evento `DESVIO_DETECTADO` e o trecho na linha do tempo; dispara `transporte.desvio_confirmado`. Resposta `200 { "ocorrenciaId": "uuid" }` ou `{ "ocorrenciaId": null }` se `false`.

#### `POST /transporte/viagens/{id}/encerrar` 🔒
`204`.

---

## 5. Eventos domínio → BFF

O domínio chama a função `eventosDominio` do BFF:

```
POST https://southamerica-east1-<projeto>.cloudfunctions.net/eventosDominio
X-Service-Key: <segredo>
```
```json
{
  "eventId": "uuid",
  "tipo": "ocorrencia.comentario_criado",
  "ocorridoEm": "2026-11-13T14:20:00Z",
  "dados": {
    "ocorrenciaId": "uuid",
    "titulo": "Falta de abastecimento – Rua Taquari, Mooca",
    "autorAcaoUid": "uid-de-quem-comentou",
    "destinatariosUids": ["uid1", "uid2"]
  }
}
```

| `tipo` | Quando | Campos extras em `dados` |
|---|---|---|
| `ocorrencia.estado_alterado` | Concluída, reaberta, em acompanhamento | `novoEstado`, `motivo` |
| `ocorrencia.comentario_criado` | Novo comentário | — |
| `transporte.desvio_confirmado` | Desvio confirmado | `linha` |

- `destinatariosUids`: autor, afetados e apoiadores da ocorrência, **sem** `autorAcaoUid`. Calculado pelo domínio.
- Entrega "pelo menos uma vez": se o BFF não responder `2xx`, o domínio tenta de novo (3 tentativas, intervalo crescente). O BFF descarta `eventId` repetido.
- Falha no envio de evento nunca desfaz a operação de negócio.

---

## 6. Requisitos de dados (domínio)

- Consultas geográficas: raio (300 m, 500 m, 1/5/10 km), ponto dentro do município de São Paulo (polígono oficial do município) e distância de ponto a linha (trajeto do ônibus).
- Geocodificação reversa (rua e bairro) para o título; em falha, usar "Tipo – Localização aproximada" e preencher depois.
- GTFS da SPTrans importado em tabelas (`routes`, `trips`, `shapes`), com rotina de atualização.
- Token da SPTrans apenas no domínio (variável de ambiente).
- Logs sem e-mail, `uid` ou tokens em texto (LGPD).
