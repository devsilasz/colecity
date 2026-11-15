#!/usr/bin/env bash
# Percorre a jornada principal da API e imprime cada requisição/resposta em Markdown.
# Uso: ./scripts/demo-api.sh [url-base]   (padrão: http://localhost:5080)
set -euo pipefail

BASE="${1:-http://localhost:5080}"
JSON='Content-Type: application/json'

chamar() {
  local metodo="$1" caminho="$2" corpo="${3:-}"
  echo "### $metodo $caminho"
  [[ -n "$corpo" ]] && printf '\nCorpo:\n```json\n%s\n```\n' "$corpo"
  local saida status
  if [[ -n "$corpo" ]]; then
    saida=$(curl -s -w '\n%{http_code}' -X "$metodo" "$BASE$caminho" -H "$JSON" -d "$corpo")
  else
    saida=$(curl -s -w '\n%{http_code}' -X "$metodo" "$BASE$caminho")
  fi
  status=$(tail -n1 <<<"$saida")
  RESPOSTA=$(sed '$d' <<<"$saida")
  printf '\nStatus: **%s**\n```json\n%s\n```\n\n' "$status" "$(python3 -m json.tool --no-ensure-ascii <<<"${RESPOSTA:-null}" 2>/dev/null || echo "$RESPOSTA")"
}

campo() { python3 -c "import json,sys;print(json.load(sys.stdin)$1)" <<<"$RESPOSTA"; }

echo "# Evidências — chamadas reais à Colecity API"
echo
echo "Gerado em $(date '+%d/%m/%Y %H:%M') contra $BASE"
echo

echo "## 1. Cidadã se cadastra"
chamar POST /api/usuarios '{"nome":"Cidadã Demonstração","email":"demo@exemplo.com","bairro":"Jardim Ângela"}'
USUARIO=$(campo "['id']")

echo "## 2. Consulta a linha que usa e vê o cruzamento SPTrans x relatos"
chamar GET "/api/linhas?termo=6072"
chamar GET /api/linhas/6072-10/situacao

echo "## 3. Lista os relatos existentes da linha"
chamar GET "/api/ocorrencias?codigoLinha=6072-10"
OCORRENCIA=$(campo "['itens'][0]['id']")

echo "## 4. Junta-se ao abaixo-assinado e comenta"
chamar POST "/api/ocorrencias/$OCORRENCIA/apoios" "{\"usuarioId\":\"$USUARIO\"}"
chamar POST "/api/ocorrencias/$OCORRENCIA/comentarios" "{\"usuarioId\":\"$USUARIO\",\"texto\":\"Hoje também, esperei 40 minutos.\"}"

echo "## 5. Registra um novo problema (módulo Vias)"
chamar POST /api/ocorrencias "{\"modulo\":\"Vias\",\"autorId\":\"$USUARIO\",\"titulo\":\"Buraco na esquina\",\"descricao\":\"Buraco fundo que enche de água quando chove.\",\"bairro\":\"Jardim Ângela\",\"pontoReferencia\":\"Esquina com a Estrada do M'Boi Mirim\"}"

echo "## 6. Regras de negócio e validação"
chamar POST "/api/ocorrencias/$OCORRENCIA/apoios" "{\"usuarioId\":\"$USUARIO\"}"
chamar POST /api/ocorrencias "{\"modulo\":\"Transporte\",\"autorId\":\"$USUARIO\",\"titulo\":\"Sem linha\",\"descricao\":\"Faltou o código da linha\",\"bairro\":\"Grajaú\"}"
chamar POST /api/usuarios '{"nome":"","email":"invalido","bairro":""}'
chamar GET /api/ocorrencias/00000000-0000-0000-0000-000000000000

echo "## 7. Painel do poder público: onde agir primeiro"
chamar GET "/api/painel/ranking?top=3"
chamar GET /api/painel/indicadores
