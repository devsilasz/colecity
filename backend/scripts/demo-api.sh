#!/usr/bin/env bash
# Percorre a jornada principal da API de domínio como o BFF faria e imprime cada
# requisição/resposta em Markdown.
# Uso: ./scripts/demo-api.sh [url-base] [service-key]
#   padrões: http://localhost:5080 e a chave de desenvolvimento (appsettings.Development.json)
set -euo pipefail

BASE="${1:-http://localhost:5080}/api/v1"
CHAVE="${2:-dev-service-key-colecity}"
UID_DEMO="demo-cidada-$(date +%s)"

chamar() {
  local metodo="$1" caminho="$2" usuario="${3:-}" corpo="${4:-}" idem="${5:-}"
  local args=(-s -w '\n%{http_code}' -X "$metodo" "$BASE$caminho" -H "X-Service-Key: $CHAVE")
  [[ -n "$usuario" ]] && args+=(-H "X-User-Id: $usuario")
  [[ -n "$idem" ]] && args+=(-H "Idempotency-Key: $idem")
  [[ -n "$corpo" ]] && args+=(-H "Content-Type: application/json" -d "$corpo")

  echo "### $metodo /api/v1$caminho"
  echo
  if [[ -n "$usuario" ]]; then
    echo "Headers: \`X-User-Id: $usuario\`${idem:+ · \`Idempotency-Key: $idem\`}"
    echo
  fi
  if [[ -n "$corpo" ]]; then
    printf 'Corpo:\n```json\n%s\n```\n\n' "$corpo"
  fi
  local saida status
  saida=$(curl "${args[@]}")
  status=$(tail -n1 <<<"$saida")
  RESPOSTA=$(sed '$d' <<<"$saida")
  printf 'Status: **%s**\n```json\n%s\n```\n\n' "$status" \
    "$(python3 -m json.tool --no-ensure-ascii <<<"${RESPOSTA:-null}" 2>/dev/null || echo "$RESPOSTA")"
}

campo() { python3 -c "import json,sys;print(json.load(sys.stdin)$1)" <<<"$RESPOSTA"; }

minutos_atras() {
  python3 -c "import datetime;print((datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(minutes=$1)).strftime('%Y-%m-%dT%H:%M:%SZ'))"
}

echo "# Evidências: chamadas reais à API de domínio do Colecity"
echo
echo "Gerado em $(date '+%d/%m/%Y %H:%M') contra \`$BASE\`. Todas as chamadas levam \`X-Service-Key\`, como o BFF faria."
echo

echo "## 1. Primeiro acesso: o BFF cria o usuário no domínio"
echo
chamar PUT /usuarios/me "$UID_DEMO" '{"nome":"Cidadã Demonstração","email":"'"$UID_DEMO"'@exemplo.com","aceiteTermosVersao":"2026-11"}'

echo "## 2. Consulta aberta: categorias e ocorrências ativas (sem login)"
echo
chamar GET /categorias
chamar GET "/ocorrencias?pageSize=3"

echo "## 3. Registro: semelhantes antes de criar, depois o registro idempotente"
echo
chamar POST /ocorrencias/semelhantes "$UID_DEMO" '{"categoria":"AGUA","tipo":"FALTA_ABASTECIMENTO","localizacao":{"lat":-23.5520,"lng":-46.6005}}'
SEMELHANTE=$(campo "[0]['id']")
chamar POST /ocorrencias "$UID_DEMO" '{"categoria":"VIAS","tipo":"BURACO","descricao":"Buraco fundo na faixa da direita, perigoso para motos.","localizacao":{"lat":-23.5614,"lng":-46.6559},"fotos":[{"path":"ocorrencias/'"$UID_DEMO"'/buraco-1.webp"}]}' "registro-demo-1"
NOVA=$(campo "['id']")
echo "Repetindo a mesma \`Idempotency-Key\` (fila offline do app): devolve a mesma ocorrência, sem duplicar."
echo
chamar POST /ocorrencias "$UID_DEMO" '{"categoria":"VIAS","tipo":"BURACO","descricao":"Buraco fundo na faixa da direita, perigoso para motos.","localizacao":{"lat":-23.5614,"lng":-46.6559}}' "registro-demo-1"

echo "## 4. Participação: \"Também estou sendo afetado\" e \"Apoiar manifestação\""
echo
chamar PUT "/ocorrencias/$SEMELHANTE/participacoes/afetado" "$UID_DEMO"
chamar PUT "/ocorrencias/$NOVA/participacoes/apoio" demo-ana
chamar PUT "/ocorrencias/$NOVA/participacoes/apoio" "$UID_DEMO"

echo "## 5. Comentário, conclusão pelo autor e linha do tempo"
echo
chamar POST "/ocorrencias/$NOVA/comentarios" demo-ana '{"texto":"Passo aqui todo dia, está cada vez maior."}' "comentario-demo-1"
chamar POST "/ocorrencias/$NOVA/conclusao" demo-ana '{"feedback":"Tentando concluir sem ser autora."}'
chamar POST "/ocorrencias/$NOVA/conclusao" "$UID_DEMO" '{"feedback":"A subprefeitura tapou o buraco hoje."}'
chamar GET "/ocorrencias/$NOVA/linha-do-tempo"

echo "## 6. Regras de negócio e erros padronizados (Problem Details com \`code\`)"
echo
chamar POST /ocorrencias "$UID_DEMO" '{"categoria":"VIAS","tipo":"BURACO","descricao":"Buraco perto do aeroporto.","localizacao":{"lat":-23.4356,"lng":-46.4731}}' "erro-1"
chamar POST /ocorrencias "$UID_DEMO" '{"categoria":"VIAS"}' "erro-2"
chamar PUT "/ocorrencias/$NOVA/participacoes/afetado" demo-bruno
chamar GET /usuarios/me "uid-sem-cadastro"

echo "## 7. Mapa: calor por afetados distintos e Zona de atenção"
echo
chamar GET "/mapa/calor?minLat=-23.8&minLng=-46.9&maxLat=-23.4&maxLng=-46.4"
chamar GET "/mapa/zonas-atencao?minLat=-23.8&minLng=-46.9&maxLat=-23.4&maxLng=-46.4"

echo "## 8. Transporte ao vivo: linha, ônibus e desvio de rota relatado por passageiro"
echo
chamar GET "/transporte/linhas?busca=8700"
chamar GET "/transporte/linhas/8700-10/veiculos?sentido=1"
chamar POST /transporte/viagens "$UID_DEMO" '{"linha":"8700-10","sentido":1}'
VIAGEM=$(campo "['viagemId']")
for minutos in 3 2 1; do
  chamar POST "/transporte/viagens/$VIAGEM/posicoes" "$UID_DEMO" \
    '{"posicao":{"lat":-23.5100,"lng":-46.7050},"registradaEm":"'"$(minutos_atras "$minutos")"'"}'
done
chamar POST "/transporte/viagens/$VIAGEM/desvio" "$UID_DEMO" '{"confirmado":true}'
DESVIO=$(campo "['ocorrenciaId']")
chamar GET "/ocorrencias/$DESVIO/linha-do-tempo"

echo "## 9. Minhas ocorrências e exclusão de conta (anonimização)"
echo
chamar GET "/usuarios/me/ocorrencias?aba=AFETADO" "$UID_DEMO"
chamar DELETE /usuarios/me "$UID_DEMO"
chamar GET /usuarios/me "$UID_DEMO"
