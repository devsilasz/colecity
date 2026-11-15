# Evidências — chamadas reais à Colecity API

Gerado em 14/11/2026 22:24 contra http://localhost:5080

## 1. Cidadã se cadastra
### POST /api/usuarios

Corpo:
```json
{"nome":"Cidadã Demonstração","email":"demo@exemplo.com","bairro":"Jardim Ângela"}
```

Status: **201**
```json
{
    "id": "fa2105e1-4d76-47b4-b06b-ab586266ba32",
    "nome": "Cidadã Demonstração",
    "email": "demo@exemplo.com",
    "bairro": "Jardim Ângela",
    "criadoEm": "2026-11-15T01:24:25.802225Z"
}
```

## 2. Consulta a linha que usa e vê o cruzamento SPTrans x relatos
### GET /api/linhas?termo=6072

Status: **200**
```json
[
    {
        "codigoSpTrans": 34001,
        "letreiro": "6072-10",
        "sentido": 1,
        "origem": "TERM. VARGINHA",
        "destino": "JD. HERCULANO"
    },
    {
        "codigoSpTrans": 34002,
        "letreiro": "6072-10",
        "sentido": 2,
        "origem": "JD. HERCULANO",
        "destino": "TERM. VARGINHA"
    }
]
```

### GET /api/linhas/6072-10/situacao

Status: **200**
```json
{
    "letreiro": "6072-10",
    "horarioReferenciaSpTrans": "22:24",
    "sentidos": [
        {
            "sentido": 1,
            "destino": "JD. HERCULANO",
            "veiculosEmOperacao": 0,
            "veiculosAcessiveis": 0
        },
        {
            "sentido": 2,
            "destino": "TERM. VARGINHA",
            "veiculosEmOperacao": 0,
            "veiculosAcessiveis": 0
        }
    ],
    "totalVeiculosEmOperacao": 0,
    "ocorrenciasAtivas": 1,
    "pessoasAfetadas": 10,
    "problemaMaisRelatado": "NaoPassou",
    "alerta": "SPTrans não mostra ônibus em operação e 10 pessoa(s) relatam que a linha não está passando."
}
```

## 3. Lista os relatos existentes da linha
### GET /api/ocorrencias?codigoLinha=6072-10

Status: **200**
```json
{
    "itens": [
        {
            "id": "0a6ffae2-f8a7-4ba0-a58d-3a5eb11c8ea7",
            "modulo": "Transporte",
            "titulo": "Linha 6072-10 não passa depois das 22h",
            "descricao": "O aplicativo mostra o horário, mas o ônibus não aparece. Já esperei mais de uma hora no ponto.",
            "bairro": "Jardim Ângela",
            "resumo": "Linha 6072-10: NaoPassou",
            "status": "AbaixoAssinado",
            "totalApoios": 10,
            "apoiosParaAbaixoAssinado": 10,
            "prioridade": 20,
            "autorId": "7ed33a92-4dd4-4a45-bc00-40bf33369711",
            "criadaEm": "2026-11-15T01:24:00.552411",
            "resolvidaEm": null,
            "codigoLinha": "6072-10",
            "tipoProblema": "NaoPassou",
            "duracaoEstimadaHoras": null,
            "pontoReferencia": null
        }
    ],
    "pagina": 1,
    "tamanhoPagina": 20,
    "total": 1,
    "totalPaginas": 1
}
```

## 4. Junta-se ao abaixo-assinado e comenta
### POST /api/ocorrencias/0a6ffae2-f8a7-4ba0-a58d-3a5eb11c8ea7/apoios

Corpo:
```json
{"usuarioId":"fa2105e1-4d76-47b4-b06b-ab586266ba32"}
```

Status: **200**
```json
{
    "id": "0a6ffae2-f8a7-4ba0-a58d-3a5eb11c8ea7",
    "modulo": "Transporte",
    "titulo": "Linha 6072-10 não passa depois das 22h",
    "descricao": "O aplicativo mostra o horário, mas o ônibus não aparece. Já esperei mais de uma hora no ponto.",
    "bairro": "Jardim Ângela",
    "resumo": "Linha 6072-10: NaoPassou",
    "status": "AbaixoAssinado",
    "totalApoios": 11,
    "apoiosParaAbaixoAssinado": 10,
    "prioridade": 22,
    "autorId": "7ed33a92-4dd4-4a45-bc00-40bf33369711",
    "criadaEm": "2026-11-15T01:24:00.552411",
    "resolvidaEm": null,
    "codigoLinha": "6072-10",
    "tipoProblema": "NaoPassou",
    "duracaoEstimadaHoras": null,
    "pontoReferencia": null
}
```

### POST /api/ocorrencias/0a6ffae2-f8a7-4ba0-a58d-3a5eb11c8ea7/comentarios

Corpo:
```json
{"usuarioId":"fa2105e1-4d76-47b4-b06b-ab586266ba32","texto":"Hoje também, esperei 40 minutos."}
```

Status: **201**
```json
{
    "id": "df1d1880-84d4-44f7-b60d-708c77e568c2",
    "usuarioId": "fa2105e1-4d76-47b4-b06b-ab586266ba32",
    "texto": "Hoje também, esperei 40 minutos.",
    "criadoEm": "2026-11-15T01:24:26.24671Z"
}
```

## 5. Registra um novo problema (módulo Vias)
### POST /api/ocorrencias

Corpo:
```json
{"modulo":"Vias","autorId":"fa2105e1-4d76-47b4-b06b-ab586266ba32","titulo":"Buraco na esquina","descricao":"Buraco fundo que enche de água quando chove.","bairro":"Jardim Ângela","pontoReferencia":"Esquina com a Estrada do M'Boi Mirim"}
```

Status: **201**
```json
{
    "id": "7539de1b-77a7-4f68-9d11-0b32e7e2de93",
    "modulo": "Vias",
    "titulo": "Buraco na esquina",
    "descricao": "Buraco fundo que enche de água quando chove.",
    "bairro": "Jardim Ângela",
    "resumo": "Via danificada: Esquina com a Estrada do M'Boi Mirim",
    "status": "Aberta",
    "totalApoios": 1,
    "apoiosParaAbaixoAssinado": 3,
    "prioridade": 1,
    "autorId": "fa2105e1-4d76-47b4-b06b-ab586266ba32",
    "criadaEm": "2026-11-15T01:24:26.29186Z",
    "resolvidaEm": null,
    "codigoLinha": null,
    "tipoProblema": null,
    "duracaoEstimadaHoras": null,
    "pontoReferencia": "Esquina com a Estrada do M'Boi Mirim"
}
```

## 6. Regras de negócio e validação
### POST /api/ocorrencias/0a6ffae2-f8a7-4ba0-a58d-3a5eb11c8ea7/apoios

Corpo:
```json
{"usuarioId":"fa2105e1-4d76-47b4-b06b-ab586266ba32"}
```

Status: **422**
```json
{
    "type": "https://tools.ietf.org/html/rfc4918#section-11.2",
    "title": "Regra de negócio violada",
    "status": 422,
    "detail": "Usuário já apoia esta ocorrência.",
    "traceId": "00-df27788a8a5befc4e64c430bf2112fdc-04d3e9e397b484e8-00"
}
```

### POST /api/ocorrencias

Corpo:
```json
{"modulo":"Transporte","autorId":"fa2105e1-4d76-47b4-b06b-ab586266ba32","titulo":"Sem linha","descricao":"Faltou o código da linha","bairro":"Grajaú"}
```

Status: **422**
```json
{
    "type": "https://tools.ietf.org/html/rfc4918#section-11.2",
    "title": "Regra de negócio violada",
    "status": 422,
    "detail": "Código da linha é obrigatório para o módulo Transporte.",
    "traceId": "00-71ff5c6f7361c21da3b62fa0c762ac39-ef8ea836fa7ebbad-00"
}
```

### POST /api/usuarios

Corpo:
```json
{"nome":"","email":"invalido","bairro":""}
```

Status: **400**
```json
{
    "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "errors": {
        "Nome": [
            "The Nome field is required."
        ],
        "Email": [
            "The Email field is not a valid e-mail address."
        ],
        "Bairro": [
            "The Bairro field is required."
        ]
    },
    "traceId": "00-052026f22d65f03f58cd8b90a0544b1c-4eee6b5baeec5ab6-00"
}
```

### GET /api/ocorrencias/00000000-0000-0000-0000-000000000000

Status: **404**
```json
{
    "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
    "title": "Recurso não encontrado",
    "status": 404,
    "detail": "Ocorrência '00000000-0000-0000-0000-000000000000' não encontrado(a).",
    "traceId": "00-ab25e4e58e2fedf1178756091c2a5238-d7686a6bf330a62e-00"
}
```

## 7. Painel do poder público: onde agir primeiro
### GET /api/painel/ranking?top=3

Status: **200**
```json
[
    {
        "id": "0a6ffae2-f8a7-4ba0-a58d-3a5eb11c8ea7",
        "modulo": "Transporte",
        "titulo": "Linha 6072-10 não passa depois das 22h",
        "descricao": "O aplicativo mostra o horário, mas o ônibus não aparece. Já esperei mais de uma hora no ponto.",
        "bairro": "Jardim Ângela",
        "resumo": "Linha 6072-10: NaoPassou",
        "status": "AbaixoAssinado",
        "totalApoios": 11,
        "apoiosParaAbaixoAssinado": 10,
        "prioridade": 22,
        "autorId": "7ed33a92-4dd4-4a45-bc00-40bf33369711",
        "criadaEm": "2026-11-15T01:24:00.552411",
        "resolvidaEm": null,
        "codigoLinha": "6072-10",
        "tipoProblema": "NaoPassou",
        "duracaoEstimadaHoras": null,
        "pontoReferencia": null
    },
    {
        "id": "90f7f21e-43f4-465d-bc56-c42e2739718d",
        "modulo": "Energia",
        "titulo": "Queda de energia recorrente na rua",
        "descricao": "A luz cai quase todo dia no fim da tarde e demora horas para voltar.",
        "bairro": "Capão Redondo",
        "resumo": "Falta de energia em Capão Redondo há 6h",
        "status": "AbaixoAssinado",
        "totalApoios": 5,
        "apoiosParaAbaixoAssinado": 5,
        "prioridade": 10,
        "autorId": "4cb36ede-bdeb-440f-af2d-a58492412e56",
        "criadaEm": "2026-11-15T01:24:00.553076",
        "resolvidaEm": null,
        "codigoLinha": null,
        "tipoProblema": null,
        "duracaoEstimadaHoras": 6,
        "pontoReferencia": null
    },
    {
        "id": "886bd8f3-f2df-433a-b795-606b9d10732a",
        "modulo": "Transporte",
        "titulo": "875A-10 lotado no horário de pico",
        "descricao": "Entre 7h e 8h não é possível embarcar nos pontos depois de Perdizes.",
        "bairro": "Perdizes",
        "resumo": "Linha 875A-10: Lotacao",
        "status": "Aberta",
        "totalApoios": 4,
        "apoiosParaAbaixoAssinado": 10,
        "prioridade": 8,
        "autorId": "7ed33a92-4dd4-4a45-bc00-40bf33369711",
        "criadaEm": "2026-11-15T01:24:00.553001",
        "resolvidaEm": null,
        "codigoLinha": "875A-10",
        "tipoProblema": "Lotacao",
        "duracaoEstimadaHoras": null,
        "pontoReferencia": null
    }
]
```

### GET /api/painel/indicadores

Status: **200**
```json
{
    "totalOcorrencias": 7,
    "totalApoios": 28,
    "mediaPessoasPorOcorrencia": 4,
    "taxaResolucaoConfirmada": 14.29,
    "abaixoAssinadosAtivos": 3,
    "relatosAtrasoTransporte": 1,
    "porModulo": [
        {
            "modulo": "Transporte",
            "ocorrencias": 2,
            "abaixoAssinados": 1,
            "resolvidas": 0
        },
        {
            "modulo": "Energia",
            "ocorrencias": 1,
            "abaixoAssinados": 1,
            "resolvidas": 0
        },
        {
            "modulo": "Agua",
            "ocorrencias": 1,
            "abaixoAssinados": 0,
            "resolvidas": 0
        },
        {
            "modulo": "Vias",
            "ocorrencias": 3,
            "abaixoAssinados": 1,
            "resolvidas": 1
        }
    ],
    "bairrosMaisAfetados": [
        {
            "bairro": "Jardim Ângela",
            "ocorrenciasAtivas": 3,
            "pessoasAfetadas": 14
        },
        {
            "bairro": "Capão Redondo",
            "ocorrenciasAtivas": 1,
            "pessoasAfetadas": 5
        },
        {
            "bairro": "Perdizes",
            "ocorrenciasAtivas": 1,
            "pessoasAfetadas": 4
        },
        {
            "bairro": "Grajaú",
            "ocorrenciasAtivas": 1,
            "pessoasAfetadas": 3
        }
    ]
}
```

