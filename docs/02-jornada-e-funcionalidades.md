# 02 — Jornada e funcionalidades

## Jornada principal

1. A pessoa abre o app e vê ocorrências próximas em lista ou mapa, sem precisar de conta.
2. Filtra por categoria, estado e distância e abre uma ocorrência para ver descrição, fotos, contagens, linha do tempo e comentários.
3. Para registrar um problema, entra na conta, escolhe categoria, tipo e localização.
4. O app mostra ocorrências semelhantes; a pessoa participa de uma delas ou cria uma nova.
5. Quem participa acompanha a ocorrência pela linha do tempo, comentários, notificações e pela área "Minhas ocorrências".
6. O autor conclui a ocorrência quando o problema é resolvido, com feedback e fotos.

Jornada do transporte: a pessoa busca a linha, vê o trajeto e os ônibus no mapa, toca em "Estou neste ônibus" para compartilhar a posição durante a viagem e confirma desvios de rota detectados.

## Módulos da v1

| Módulo | Regras |
|---|---|
| Conta | RN-CON |
| Consulta | RN-CSL |
| Registro e Zona de atenção | RN-REG, RN-ZON |
| Ocorrências semelhantes | RN-SEM |
| Destaque e mapa de calor | RN-DES |
| Participação | RN-PAR |
| Comentários e moderação | RN-COM, RN-MOD |
| Acompanhamento e estados | RN-ACO |
| Minhas ocorrências | RN-MIN |
| Notificações push (Android) | RN-NOT |
| Transporte ao vivo | RN-TAV |
| Regras gerais | RN-GER |

Detalhes em [07 — Regras de negócio do produto](07-regras-de-negocio-produto.md).

## Fora da v1

Compartilhamento externo, gamificação/pontuação, push no iOS, localização em segundo plano.
