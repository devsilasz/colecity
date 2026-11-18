# Evidências: chamadas reais à API de domínio do Colecity

Gerado em 16/11/2026 23:40 contra `http://localhost:5080/api/v1`. Todas as chamadas levam `X-Service-Key`, como o BFF faria.

## 1. Primeiro acesso: o BFF cria o usuário no domínio

### PUT /api/v1/usuarios/me

Headers: `X-User-Id: demo-cidada-1794883220`

Corpo:
```json
{"nome":"Cidadã Demonstração","email":"demo-cidada-1794883220@exemplo.com","aceiteTermosVersao":"2026-11"}
```

Status: **200**
```json
{
    "id": "eb11ac45-7c87-4e56-a1ed-0e312ed3c686",
    "nome": "Cidadã Demonstração",
    "email": "demo-cidada-1794883220@exemplo.com",
    "aceiteTermosVersao": "2026-11",
    "criadoEm": "2026-11-17T02:40:20.118595Z"
}
```

## 2. Consulta aberta: categorias e ocorrências ativas (sem login)

### GET /api/v1/categorias

Status: **200**
```json
[
    {
        "categoria": "TRANSPORTE",
        "nome": "Transporte",
        "tipos": [
            {
                "tipo": "ATRASO_INTERVALO_EXCESSIVO",
                "nome": "Atraso ou intervalo excessivo"
            },
            {
                "tipo": "ALTERACAO_ROTA_SEM_AVISO",
                "nome": "Alteração de rota sem aviso"
            },
            {
                "tipo": "LINHA_ESTACAO_FORA_OPERACAO",
                "nome": "Linha/estação fora de operação"
            },
            {
                "tipo": "SUPERLOTACAO",
                "nome": "Superlotação"
            },
            {
                "tipo": "PONTO_ESTACAO_DANIFICADO",
                "nome": "Ponto/estação danificado"
            }
        ]
    },
    {
        "categoria": "AGUA",
        "nome": "Água",
        "tipos": [
            {
                "tipo": "FALTA_ABASTECIMENTO",
                "nome": "Falta de abastecimento"
            },
            {
                "tipo": "BAIXA_PRESSAO",
                "nome": "Baixa pressão"
            },
            {
                "tipo": "VAZAMENTO_VIA",
                "nome": "Vazamento na via"
            },
            {
                "tipo": "AGUA_APARENCIA_ALTERADA",
                "nome": "Água com aparência alterada"
            }
        ]
    },
    {
        "categoria": "ENERGIA",
        "nome": "Energia",
        "tipos": [
            {
                "tipo": "FALTA_ENERGIA",
                "nome": "Falta de energia"
            },
            {
                "tipo": "OSCILACAO",
                "nome": "Oscilação"
            },
            {
                "tipo": "FIACAO_EXPOSTA_CAIDA",
                "nome": "Fiação exposta ou caída"
            },
            {
                "tipo": "ILUMINACAO_PUBLICA_APAGADA",
                "nome": "Iluminação pública apagada"
            }
        ]
    },
    {
        "categoria": "VIAS",
        "nome": "Vias",
        "tipos": [
            {
                "tipo": "BURACO",
                "nome": "Buraco"
            },
            {
                "tipo": "ALAGAMENTO",
                "nome": "Alagamento"
            },
            {
                "tipo": "CALCADA_DANIFICADA",
                "nome": "Calçada danificada"
            },
            {
                "tipo": "SEMAFORO_SINALIZACAO_DEFEITO",
                "nome": "Semáforo/sinalização com defeito"
            }
        ]
    },
    {
        "categoria": "ARVORES",
        "nome": "Árvores",
        "tipos": [
            {
                "tipo": "ARVORE_CAIDA",
                "nome": "Árvore caída"
            },
            {
                "tipo": "GALHO_RISCO_QUEDA",
                "nome": "Galho com risco de queda"
            },
            {
                "tipo": "ARVORE_SOBRE_FIACAO",
                "nome": "Árvore sobre fiação"
            }
        ]
    },
    {
        "categoria": "SEGURANCA",
        "nome": "Segurança",
        "tipos": [
            {
                "tipo": "ASSALTO_ROUBO",
                "nome": "Assalto/roubo"
            },
            {
                "tipo": "FURTO",
                "nome": "Furto"
            },
            {
                "tipo": "LOCAL_MAL_ILUMINADO_ERMO",
                "nome": "Local mal iluminado ou ermo"
            }
        ]
    },
    {
        "categoria": "RISCOS_INFRAESTRUTURA",
        "nome": "Riscos e infraestrutura",
        "tipos": [
            {
                "tipo": "RISCO_DESLIZAMENTO",
                "nome": "Risco de deslizamento"
            },
            {
                "tipo": "TRECHO_PERIGOSO_PEDESTRES",
                "nome": "Trecho perigoso para pedestres"
            },
            {
                "tipo": "ESTRUTURA_RISCO_QUEDA",
                "nome": "Imóvel/estrutura com risco de queda"
            },
            {
                "tipo": "CORREGO_TRANSBORDANDO",
                "nome": "Córrego transbordando"
            }
        ]
    }
]
```

### GET /api/v1/ocorrencias?pageSize=3

Status: **200**
```json
{
    "items": [
        {
            "id": "0d0f5535-fd22-4bfd-9f87-e2ce6ef7c764",
            "titulo": "Atraso ou intervalo excessivo – Av. Francisco Matarazzo, Água Branca",
            "categoria": "TRANSPORTE",
            "tipo": "ATRASO_INTERVALO_EXCESSIVO",
            "estado": "EM_ACOMPANHAMENTO",
            "bairro": "Água Branca",
            "localizacaoAproximada": {
                "lat": -23.525,
                "lng": -46.695
            },
            "totalAfetados": 11,
            "totalApoios": 1,
            "ultimaAtividadeEm": "2026-11-16T07:28:16.18205Z",
            "zonaAtencao": false,
            "minhaParticipacao": null
        },
        {
            "id": "74ade34d-dfd8-4ab3-89bd-2041bc95f059",
            "titulo": "Falta de abastecimento – Rua Taquari, Mooca",
            "categoria": "AGUA",
            "tipo": "FALTA_ABASTECIMENTO",
            "estado": "EM_ACOMPANHAMENTO",
            "bairro": "Mooca",
            "localizacaoAproximada": {
                "lat": -23.551,
                "lng": -46.6
            },
            "totalAfetados": 5,
            "totalApoios": 2,
            "ultimaAtividadeEm": "2026-11-16T14:40:16.18205Z",
            "zonaAtencao": false,
            "minhaParticipacao": null
        },
        {
            "id": "c0f419ba-abbe-4a2d-9490-5e7716bb8bf0",
            "titulo": "Buraco – Av. Dona Belmira Marin, Grajaú",
            "categoria": "VIAS",
            "tipo": "BURACO",
            "estado": "ABERTA",
            "bairro": "Grajaú",
            "localizacaoAproximada": {
                "lat": -23.77,
                "lng": -46.68
            },
            "totalAfetados": 2,
            "totalApoios": 3,
            "ultimaAtividadeEm": "2026-11-13T02:40:16.18205Z",
            "zonaAtencao": false,
            "minhaParticipacao": null
        }
    ],
    "page": 1,
    "pageSize": 3,
    "total": 10
}
```

## 3. Registro: semelhantes antes de criar, depois o registro idempotente

### POST /api/v1/ocorrencias/semelhantes

Headers: `X-User-Id: demo-cidada-1794883220`

Corpo:
```json
{"categoria":"AGUA","tipo":"FALTA_ABASTECIMENTO","localizacao":{"lat":-23.5520,"lng":-46.6005}}
```

Status: **200**
```json
[
    {
        "id": "74ade34d-dfd8-4ab3-89bd-2041bc95f059",
        "titulo": "Falta de abastecimento – Rua Taquari, Mooca",
        "categoria": "AGUA",
        "tipo": "FALTA_ABASTECIMENTO",
        "estado": "EM_ACOMPANHAMENTO",
        "bairro": "Mooca",
        "localizacaoAproximada": {
            "lat": -23.551,
            "lng": -46.6
        },
        "totalAfetados": 5,
        "totalApoios": 2,
        "ultimaAtividadeEm": "2026-11-16T14:40:16.18205Z",
        "zonaAtencao": false,
        "minhaParticipacao": {
            "afetado": false,
            "apoio": false,
            "autor": false
        },
        "distanciaMetros": 114
    }
]
```

### POST /api/v1/ocorrencias

Headers: `X-User-Id: demo-cidada-1794883220` · `Idempotency-Key: registro-demo-1`

Corpo:
```json
{"categoria":"VIAS","tipo":"BURACO","descricao":"Buraco fundo na faixa da direita, perigoso para motos.","localizacao":{"lat":-23.5614,"lng":-46.6559},"fotos":[{"path":"ocorrencias/demo-cidada-1794883220/buraco-1.webp"}]}
```

Status: **201**
```json
{
    "id": "989a67e0-1b7d-4fcb-8af7-d25aacf1f53d",
    "titulo": "Buraco – Avenida Paulista, Morro dos Ingleses",
    "categoria": "VIAS",
    "tipo": "BURACO",
    "estado": "ABERTA",
    "bairro": "Morro dos Ingleses",
    "localizacaoAproximada": {
        "lat": -23.561,
        "lng": -46.656
    },
    "totalAfetados": 1,
    "totalApoios": 0,
    "ultimaAtividadeEm": "2026-11-17T02:40:20.889739Z",
    "zonaAtencao": false,
    "minhaParticipacao": {
        "afetado": true,
        "apoio": false,
        "autor": true
    },
    "descricao": "Buraco fundo na faixa da direita, perigoso para motos.",
    "rua": "Avenida Paulista",
    "linha": null,
    "dataHoraOcorrido": null,
    "fotos": [
        {
            "id": "3443e97e-70f9-47f4-b09b-04bdebedb0dc",
            "path": "ocorrencias/demo-cidada-1794883220/buraco-1.webp"
        }
    ],
    "autor": {
        "nome": "Cidadã Demonstração",
        "removido": false
    },
    "criadaEm": "2026-11-17T02:40:20.889739Z",
    "concluidaEm": null,
    "conclusao": null,
    "podeEditar": true,
    "podeConcluir": true,
    "podeReabrir": false,
    "avisoContagem": "Participações registradas no Colecity; não representam o total de afetados."
}
```

Repetindo a mesma `Idempotency-Key` (fila offline do app): devolve a mesma ocorrência, sem duplicar.

### POST /api/v1/ocorrencias

Headers: `X-User-Id: demo-cidada-1794883220` · `Idempotency-Key: registro-demo-1`

Corpo:
```json
{"categoria":"VIAS","tipo":"BURACO","descricao":"Buraco fundo na faixa da direita, perigoso para motos.","localizacao":{"lat":-23.5614,"lng":-46.6559}}
```

Status: **201**
```json
{
    "id": "989a67e0-1b7d-4fcb-8af7-d25aacf1f53d",
    "titulo": "Buraco – Avenida Paulista, Morro dos Ingleses",
    "categoria": "VIAS",
    "tipo": "BURACO",
    "estado": "ABERTA",
    "bairro": "Morro dos Ingleses",
    "localizacaoAproximada": {
        "lat": -23.561,
        "lng": -46.656
    },
    "totalAfetados": 1,
    "totalApoios": 0,
    "ultimaAtividadeEm": "2026-11-17T02:40:20.889739Z",
    "zonaAtencao": false,
    "minhaParticipacao": {
        "afetado": true,
        "apoio": false,
        "autor": true
    },
    "descricao": "Buraco fundo na faixa da direita, perigoso para motos.",
    "rua": "Avenida Paulista",
    "linha": null,
    "dataHoraOcorrido": null,
    "fotos": [
        {
            "id": "3443e97e-70f9-47f4-b09b-04bdebedb0dc",
            "path": "ocorrencias/demo-cidada-1794883220/buraco-1.webp"
        }
    ],
    "autor": {
        "nome": "Cidadã Demonstração",
        "removido": false
    },
    "criadaEm": "2026-11-17T02:40:20.889739Z",
    "concluidaEm": null,
    "conclusao": null,
    "podeEditar": true,
    "podeConcluir": true,
    "podeReabrir": false,
    "avisoContagem": "Participações registradas no Colecity; não representam o total de afetados."
}
```

## 4. Participação: "Também estou sendo afetado" e "Apoiar manifestação"

### PUT /api/v1/ocorrencias/74ade34d-dfd8-4ab3-89bd-2041bc95f059/participacoes/afetado

Headers: `X-User-Id: demo-cidada-1794883220`

Status: **200**
```json
{
    "totalAfetados": 6,
    "totalApoios": 2,
    "minhaParticipacao": {
        "afetado": true,
        "apoio": false,
        "autor": false
    }
}
```

### PUT /api/v1/ocorrencias/989a67e0-1b7d-4fcb-8af7-d25aacf1f53d/participacoes/apoio

Headers: `X-User-Id: demo-ana`

Status: **200**
```json
{
    "totalAfetados": 1,
    "totalApoios": 1,
    "minhaParticipacao": {
        "afetado": false,
        "apoio": true,
        "autor": false
    }
}
```

### PUT /api/v1/ocorrencias/989a67e0-1b7d-4fcb-8af7-d25aacf1f53d/participacoes/apoio

Headers: `X-User-Id: demo-cidada-1794883220`

Status: **422**
```json
{
    "type": "about:blank",
    "title": "O autor não pode apoiar a própria ocorrência.",
    "status": 422,
    "code": "AUTOR_NAO_PODE_APOIAR",
    "traceId": "00-1b5f056faf3d3b732a978ed3ae6cf104-8c9f6e1ddb543d2e-00"
}
```

## 5. Comentário, conclusão pelo autor e linha do tempo

### POST /api/v1/ocorrencias/989a67e0-1b7d-4fcb-8af7-d25aacf1f53d/comentarios

Headers: `X-User-Id: demo-ana` · `Idempotency-Key: comentario-demo-1`

Corpo:
```json
{"texto":"Passo aqui todo dia, está cada vez maior."}
```

Status: **201**
```json
{
    "id": "9c345ef4-d05c-4f2e-9e74-19eef76b50cf",
    "texto": "Passo aqui todo dia, está cada vez maior.",
    "fotos": [],
    "autor": {
        "nome": "Ana Souza",
        "afetado": false,
        "removido": false
    },
    "criadoEm": "2026-11-17T02:40:21.490069Z",
    "podeExcluir": true
}
```

### POST /api/v1/ocorrencias/989a67e0-1b7d-4fcb-8af7-d25aacf1f53d/conclusao

Headers: `X-User-Id: demo-ana`

Corpo:
```json
{"feedback":"Tentando concluir sem ser autora."}
```

Status: **403**
```json
{
    "type": "about:blank",
    "title": "Apenas o autor pode fazer isso.",
    "status": 403,
    "code": "SOMENTE_AUTOR",
    "traceId": "00-bbdb8f7da99ff3a8da3fa8f71f00d909-e910030dc94a556c-00"
}
```

### POST /api/v1/ocorrencias/989a67e0-1b7d-4fcb-8af7-d25aacf1f53d/conclusao

Headers: `X-User-Id: demo-cidada-1794883220`

Corpo:
```json
{"feedback":"A subprefeitura tapou o buraco hoje."}
```

Status: **200**
```json
{
    "id": "989a67e0-1b7d-4fcb-8af7-d25aacf1f53d",
    "titulo": "Buraco – Avenida Paulista, Morro dos Ingleses",
    "categoria": "VIAS",
    "tipo": "BURACO",
    "estado": "CONCLUIDA",
    "bairro": "Morro dos Ingleses",
    "localizacaoAproximada": {
        "lat": -23.561,
        "lng": -46.656
    },
    "totalAfetados": 1,
    "totalApoios": 1,
    "ultimaAtividadeEm": "2026-11-17T02:40:21.490069Z",
    "zonaAtencao": false,
    "minhaParticipacao": {
        "afetado": true,
        "apoio": false,
        "autor": true
    },
    "descricao": "Buraco fundo na faixa da direita, perigoso para motos.",
    "rua": "Avenida Paulista",
    "linha": null,
    "dataHoraOcorrido": null,
    "fotos": [
        {
            "id": "3443e97e-70f9-47f4-b09b-04bdebedb0dc",
            "path": "ocorrencias/demo-cidada-1794883220/buraco-1.webp"
        }
    ],
    "autor": {
        "nome": "Cidadã Demonstração",
        "removido": false
    },
    "criadaEm": "2026-11-17T02:40:20.889739Z",
    "concluidaEm": "2026-11-17T02:40:21.67183Z",
    "conclusao": {
        "motivo": "AUTOR",
        "feedback": "A subprefeitura tapou o buraco hoje.",
        "fotos": []
    },
    "podeEditar": false,
    "podeConcluir": false,
    "podeReabrir": true,
    "avisoContagem": "Participações registradas no Colecity; não representam o total de afetados."
}
```

### GET /api/v1/ocorrencias/989a67e0-1b7d-4fcb-8af7-d25aacf1f53d/linha-do-tempo

Status: **200**
```json
[
    {
        "tipo": "CRIADA",
        "descricao": "Ocorrência registrada",
        "em": "2026-11-17T02:40:20.889739Z"
    },
    {
        "tipo": "CONCLUIDA",
        "descricao": "Concluída pelo autor",
        "em": "2026-11-17T02:40:21.67183Z"
    }
]
```

## 6. Regras de negócio e erros padronizados (Problem Details com `code`)

### POST /api/v1/ocorrencias

Headers: `X-User-Id: demo-cidada-1794883220` · `Idempotency-Key: erro-1`

Corpo:
```json
{"categoria":"VIAS","tipo":"BURACO","descricao":"Buraco perto do aeroporto.","localizacao":{"lat":-23.4356,"lng":-46.4731}}
```

Status: **422**
```json
{
    "type": "about:blank",
    "title": "Por enquanto o Colecity funciona apenas na cidade de São Paulo.",
    "status": 422,
    "code": "LOCALIZACAO_FORA_DO_MUNICIPIO",
    "errors": {
        "localizacao": [
            "Por enquanto o Colecity funciona apenas na cidade de São Paulo."
        ]
    },
    "traceId": "00-e70d183d21dafc06eb86f127e090543a-4a396daa609839c3-00"
}
```

### POST /api/v1/ocorrencias

Headers: `X-User-Id: demo-cidada-1794883220` · `Idempotency-Key: erro-2`

Corpo:
```json
{"categoria":"VIAS"}
```

Status: **422**
```json
{
    "type": "about:blank",
    "title": "Preencha os campos obrigatórios.",
    "status": 422,
    "code": "CAMPO_OBRIGATORIO",
    "errors": {
        "tipo": [
            "Campo obrigatório."
        ],
        "descricao": [
            "Campo obrigatório."
        ],
        "localizacao": [
            "Campo obrigatório."
        ]
    },
    "traceId": "00-69f36a0aa14157dfdbd2f03787f15e0e-5b135eb538fbeea3-00"
}
```

### PUT /api/v1/ocorrencias/989a67e0-1b7d-4fcb-8af7-d25aacf1f53d/participacoes/afetado

Headers: `X-User-Id: demo-bruno`

Status: **409**
```json
{
    "type": "about:blank",
    "title": "A ocorrência já foi concluída.",
    "status": 409,
    "code": "OCORRENCIA_CONCLUIDA",
    "traceId": "00-4197aaf90037be7ea01f06599b859ed7-0e64e674e941fcea-00"
}
```

### GET /api/v1/usuarios/me

Headers: `X-User-Id: uid-sem-cadastro`

Status: **403**
```json
{
    "type": "about:blank",
    "title": "Conclua seu cadastro para continuar.",
    "status": 403,
    "code": "USUARIO_NAO_CADASTRADO",
    "traceId": "00-cd51e005caa0288ff1b09834f53be26d-567fcc0d29b98178-00"
}
```

## 7. Mapa: calor por afetados distintos e Zona de atenção

### GET /api/v1/mapa/calor?minLat=-23.8&minLng=-46.9&maxLat=-23.4&maxLng=-46.4

Status: **200**
```json
[
    {
        "lat": -23.525,
        "lng": -46.695,
        "peso": 11
    },
    {
        "lat": -23.55,
        "lng": -46.6,
        "peso": 6
    },
    {
        "lat": -23.55,
        "lng": -46.635,
        "peso": 5
    },
    {
        "lat": -23.705,
        "lng": -46.77,
        "peso": 3
    },
    {
        "lat": -23.67,
        "lng": -46.78,
        "peso": 3
    },
    {
        "lat": -23.77,
        "lng": -46.68,
        "peso": 2
    }
]
```

### GET /api/v1/mapa/zonas-atencao?minLat=-23.8&minLng=-46.9&maxLat=-23.4&maxLng=-46.4

Status: **200**
```json
[
    {
        "categoria": "SEGURANCA",
        "centro": {
            "lat": -23.55044,
            "lng": -46.633860000000006
        },
        "raioMetros": 300,
        "totalRelatos": 5,
        "texto": "5 relatos da comunidade nos últimos 30 dias"
    }
]
```

## 8. Transporte ao vivo: linha, ônibus e desvio de rota relatado por passageiro

### GET /api/v1/transporte/linhas?busca=8700

Status: **200**
```json
[
    {
        "codigo": "8700-10",
        "nome": "Pq. Continental – Pça. Ramos",
        "sentidos": [
            {
                "sentido": 1,
                "destino": "Pça. Ramos"
            },
            {
                "sentido": 2,
                "destino": "Pq. Continental"
            }
        ]
    }
]
```

### GET /api/v1/transporte/linhas/8700-10/veiculos?sentido=1

Status: **200**
```json
[
    {
        "fonte": "SPTRANS",
        "prefixo": "58279",
        "posicao": {
            "lat": -23.5245,
            "lng": -46.7655
        },
        "atualizadoEm": "2026-11-17T02:40:22.486624Z",
        "acessivel": true
    },
    {
        "fonte": "SPTRANS",
        "prefixo": "31825",
        "posicao": {
            "lat": -23.5275,
            "lng": -46.68
        },
        "atualizadoEm": "2026-11-17T02:40:22.486624Z",
        "acessivel": false
    }
]
```

### POST /api/v1/transporte/viagens

Headers: `X-User-Id: demo-cidada-1794883220`

Corpo:
```json
{"linha":"8700-10","sentido":1}
```

Status: **201**
```json
{
    "viagemId": "74de2fa8-bc7d-4691-9439-7199551c5c8b",
    "expiraEm": "2026-11-17T04:40:22.605337Z"
}
```

### POST /api/v1/transporte/viagens/74de2fa8-bc7d-4691-9439-7199551c5c8b/posicoes

Headers: `X-User-Id: demo-cidada-1794883220`

Corpo:
```json
{"posicao":{"lat":-23.5100,"lng":-46.7050},"registradaEm":"2026-11-17T02:37:22Z"}
```

Status: **200**
```json
{
    "ativa": true,
    "desvioSuspeito": false,
    "trechoDesvio": null
}
```

### POST /api/v1/transporte/viagens/74de2fa8-bc7d-4691-9439-7199551c5c8b/posicoes

Headers: `X-User-Id: demo-cidada-1794883220`

Corpo:
```json
{"posicao":{"lat":-23.5100,"lng":-46.7050},"registradaEm":"2026-11-17T02:38:22Z"}
```

Status: **200**
```json
{
    "ativa": true,
    "desvioSuspeito": false,
    "trechoDesvio": null
}
```

### POST /api/v1/transporte/viagens/74de2fa8-bc7d-4691-9439-7199551c5c8b/posicoes

Headers: `X-User-Id: demo-cidada-1794883220`

Corpo:
```json
{"posicao":{"lat":-23.5100,"lng":-46.7050},"registradaEm":"2026-11-17T02:39:23Z"}
```

Status: **200**
```json
{
    "ativa": true,
    "desvioSuspeito": true,
    "trechoDesvio": [
        {
            "lat": -23.51,
            "lng": -46.705
        },
        {
            "lat": -23.51,
            "lng": -46.705
        },
        {
            "lat": -23.51,
            "lng": -46.705
        }
    ]
}
```

### POST /api/v1/transporte/viagens/74de2fa8-bc7d-4691-9439-7199551c5c8b/desvio

Headers: `X-User-Id: demo-cidada-1794883220`

Corpo:
```json
{"confirmado":true}
```

Status: **200**
```json
{
    "ocorrenciaId": "eeaa5cca-8e75-4e58-b41f-8c755683a0f2"
}
```

### GET /api/v1/ocorrencias/eeaa5cca-8e75-4e58-b41f-8c755683a0f2/linha-do-tempo

Status: **200**
```json
[
    {
        "tipo": "CRIADA",
        "descricao": "Ocorrência registrada",
        "em": "2026-11-17T02:40:23.24655Z"
    },
    {
        "tipo": "DESVIO_DETECTADO",
        "descricao": "Desvio de rota confirmado por passageiros",
        "em": "2026-11-17T02:40:23.246955Z",
        "trecho": [
            {
                "lat": -23.51,
                "lng": -46.705
            },
            {
                "lat": -23.51,
                "lng": -46.705
            },
            {
                "lat": -23.51,
                "lng": -46.705
            }
        ]
    }
]
```

## 9. Minhas ocorrências e exclusão de conta (anonimização)

### GET /api/v1/usuarios/me/ocorrencias?aba=AFETADO

Headers: `X-User-Id: demo-cidada-1794883220`

Status: **200**
```json
{
    "items": [
        {
            "id": "eeaa5cca-8e75-4e58-b41f-8c755683a0f2",
            "titulo": "Alteração de rota sem aviso – Rua Antônio Sarkis, Água Branca",
            "categoria": "TRANSPORTE",
            "tipo": "ALTERACAO_ROTA_SEM_AVISO",
            "estado": "ABERTA",
            "bairro": "Água Branca",
            "localizacaoAproximada": {
                "lat": -23.51,
                "lng": -46.705
            },
            "totalAfetados": 1,
            "totalApoios": 0,
            "ultimaAtividadeEm": "2026-11-17T02:40:23.246955Z",
            "zonaAtencao": false,
            "minhaParticipacao": {
                "afetado": true,
                "apoio": false,
                "autor": true
            }
        },
        {
            "id": "74ade34d-dfd8-4ab3-89bd-2041bc95f059",
            "titulo": "Falta de abastecimento – Rua Taquari, Mooca",
            "categoria": "AGUA",
            "tipo": "FALTA_ABASTECIMENTO",
            "estado": "EM_ACOMPANHAMENTO",
            "bairro": "Mooca",
            "localizacaoAproximada": {
                "lat": -23.551,
                "lng": -46.6
            },
            "totalAfetados": 6,
            "totalApoios": 2,
            "ultimaAtividadeEm": "2026-11-17T02:40:21.225243Z",
            "zonaAtencao": false,
            "minhaParticipacao": {
                "afetado": true,
                "apoio": false,
                "autor": false
            }
        },
        {
            "id": "989a67e0-1b7d-4fcb-8af7-d25aacf1f53d",
            "titulo": "Buraco – Avenida Paulista, Morro dos Ingleses",
            "categoria": "VIAS",
            "tipo": "BURACO",
            "estado": "CONCLUIDA",
            "bairro": "Morro dos Ingleses",
            "localizacaoAproximada": {
                "lat": -23.561,
                "lng": -46.656
            },
            "totalAfetados": 1,
            "totalApoios": 1,
            "ultimaAtividadeEm": "2026-11-17T02:40:21.490069Z",
            "zonaAtencao": false,
            "minhaParticipacao": {
                "afetado": true,
                "apoio": false,
                "autor": true
            }
        }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 3
}
```

### DELETE /api/v1/usuarios/me

Headers: `X-User-Id: demo-cidada-1794883220`

Status: **204**
```json
null
```

### GET /api/v1/usuarios/me

Headers: `X-User-Id: demo-cidada-1794883220`

Status: **403**
```json
{
    "type": "about:blank",
    "title": "Conclua seu cadastro para continuar.",
    "status": 403,
    "code": "USUARIO_NAO_CADASTRADO",
    "traceId": "00-f581e935c3e38e55ac989dc04d8e22df-381aa3b236ce65f3-00"
}
```

