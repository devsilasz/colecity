# 07 — Regras de negócio do produto (v1)

Regras de negócio da v1 do Colecity. Cada regra tem um código para ser referenciada no código, nas Features, nos critérios de aceite e nos Test Cases. Escopo: ecossistema da plataforma (app mobile, BFF e API de domínio).

## Módulos da v1

| # | Módulo | O que permite |
|---|---|---|
| 1 | Conta | Cadastro, login, logout, perfil, recuperação de senha, solicitação de exclusão |
| 2 | Consulta | Lista e mapa de ocorrências, filtros e detalhe (sem conta) |
| 3 | Registro | Criar ocorrência com categoria, tipo, descrição, localização e foto |
| 4 | Semelhantes | Sugerir ocorrências parecidas durante o registro |
| 5 | Participação | "Também estou sendo afetado" e "Apoiar manifestação" |
| 6 | Acompanhamento | Linha do tempo de atualizações e estados |
| 7 | Minhas ocorrências | O que registrei e onde participo |
| 7b | Notificações | Push no Android |
| 8 | Transporte ao vivo | Trajeto, posição dos ônibus e detecção de desvio |

**Fora da v1:** compartilhamento, gamificação/pontuação, notificações no iOS e localização em segundo plano.

Módulos adicionais da v1: 7b. Notificações push (Android) e 8. Transporte ao vivo.

## 1. Conta

| Código | Regra |
|---|---|
| RN-CON-01 | Cadastro exige nome, e-mail e senha, além do aceite dos termos de uso e da política de privacidade. |
| RN-CON-02 | O e-mail deve ter formato válido e não pode estar cadastrado em outra conta. |
| RN-CON-03 | A senha deve ter no mínimo 8 caracteres, contendo letras e números. Implementada pela política de senha do Firebase Authentication (comprimento mínimo 8, exigir caractere numérico e alfabético). |
| RN-CON-04 | O login é feito com e-mail e senha. Em caso de erro, a mensagem é genérica ("e-mail ou senha inválidos"), sem indicar qual campo está errado. |
| RN-CON-05 | O login é feito diretamente no Firebase Authentication, que aplica sua própria proteção contra abuso; não há bloqueio de conta por tentativas. O limite de 30 requisições por minuto (RN-GER-12) vale para o BFF e o domínio. |
| RN-CON-06 | Apenas o nome do usuário é exibido publicamente; o e-mail nunca é exibido. |
| RN-CON-07 | O usuário pode editar nome e e-mail. A troca de e-mail exige a senha atual e o novo e-mail não pode estar cadastrado. |
| RN-CON-08 | O usuário pode excluir a conta, com confirmação forte (senha ou novo login Google + digitar "EXCLUIR"). A exclusão é imediata e definitiva para o usuário. Internamente é feita por anonimização: nome, e-mail, senha, vínculo Google, tokens de push e posições de Transporte ao vivo são apagados; participações saem das contagens; ocorrências e comentários permanecem como "Usuário removido". |
| RN-CON-09 | Recuperação de senha pelo fluxo do Firebase Authentication: o usuário informa o e-mail e recebe um link de redefinição (validade e uso único conforme o padrão do Firebase). A nova senha segue RN-CON-03. A tela responde sempre "se o e-mail existir, enviaremos instruções" (proteção contra enumeração de e-mails ativada no Firebase). |
| RN-CON-10 | O usuário pode entrar com e-mail e senha ou com Google. |
| RN-CON-11 | No primeiro login com Google, o app pede o aceite dos termos e da política de privacidade antes de criar a conta. O nome vem do Google e pode ser editado. |
| RN-CON-12 | Se o e-mail do Google já tiver conta com senha, os dois métodos ficam vinculados à mesma conta (configuração "uma conta por endereço de e-mail" do Firebase). |
| RN-CON-13 | Conta criada só com Google não tem senha. Em "Esqueci a senha" a tela mostra a mensagem genérica; o e-mail enviado orienta a entrar com Google. Dentro do app, "alterar senha" é substituído por "definir senha". |
| RN-CON-14 | Em conta só com Google, o campo de e-mail fica desabilitado (o e-mail é o do Google). |

## 2. Consulta

| Código | Regra |
|---|---|
| RN-CSL-01 | Qualquer pessoa pode consultar ocorrências, sem conta. |
| RN-CSL-02 | A consulta pode ser feita em lista ou em mapa. |
| RN-CSL-03 | Filtros: categoria, estado e distância da posição atual (1, 5 ou 10 km). O filtro de distância só aparece se a localização for permitida. |
| RN-CSL-04 | Por padrão, são exibidas apenas ocorrências não encerradas, ordenadas pela atividade mais recente. |
| RN-CSL-05 | Cada item da lista mostra categoria, tipo, bairro/região aproximada, estado, nº de afetados, nº de apoios e tempo desde a última atualização. |
| RN-CSL-06 | O detalhe mostra descrição, fotos, localização aproximada, estado, contagens separadas e linha do tempo. |
| RN-CSL-07 | As contagens exibem o aviso: "Participações registradas no Colecity; não representam o total de afetados." |
| RN-CSL-08 | A localização pública é aproximada (~100 m), nunca o ponto exato. |

## 3. Registro de ocorrência

| Código | Regra |
|---|---|
| RN-REG-01 | Apenas usuários autenticados podem registrar ocorrências. |
| RN-REG-02 | Campos obrigatórios: categoria, tipo, descrição (10 a 500 caracteres) e localização. |
| RN-REG-03 | Opcionais: até 3 fotos; linha de ônibus/metrô/trem (só em Transporte); data e hora do ocorrido (só em Segurança — o relato pode ser feito depois, inclusive de outro aparelho, ex.: após ter o celular roubado). Sem data/hora informada, vale o momento do registro. A data/hora do ocorrido não pode ser futura nem anterior a 30 dias. |
| RN-REG-04 | Fotos são processadas no aparelho antes do envio: convertidas para WebP e redimensionadas mantendo a proporção, com o maior lado em no máximo 1920 px. O servidor aceita apenas WebP (até 2 MB por imagem) e recusa outros formatos. |
| RN-REG-05 | Tipos por categoria — ver tabela abaixo. Não há tipo livre. |
| RN-REG-06 | A localização vem do GPS ou é escolhida no mapa/por endereço, e deve estar no município de São Paulo. Fora dele, o app informa: "Por enquanto o Colecity funciona apenas na cidade de São Paulo." |
| RN-REG-07 | A ocorrência não tem título digitado; o título é gerado como "Tipo – Rua, Bairro". |
| RN-REG-08 | A ocorrência é criada no estado Aberta e o autor conta automaticamente como afetado. |
| RN-REG-09 | O autor pode editar descrição e fotos enquanto a ocorrência não estiver Concluída (Aberta ou Em acompanhamento). Categoria, tipo e localização não podem ser alterados. |
| RN-REG-10 | Ocorrências não podem ser excluídas. O autor pode apenas marcar como concluída, mesmo que seja o único participante. |
| RN-REG-11 | Não há limite de ocorrências por usuário; o limite geral da API é de 30 requisições por minuto. |
| RN-REG-12 | Relatos de Segurança não podem conter dados de terceiros (descrição física, placa, nome). O app exibe: "Em emergência, ligue 190. Registre o B.O. na Delegacia Eletrônica. O Colecity não substitui a polícia." |

### Categorias e tipos

| Categoria | Tipos |
|---|---|
| Transporte | Atraso ou intervalo excessivo · Alteração de rota sem aviso · Linha/estação fora de operação · Superlotação · Ponto/estação danificado |
| Água | Falta de abastecimento · Baixa pressão · Vazamento na via · Água com aparência alterada |
| Energia | Falta de energia · Oscilação · Fiação exposta ou caída · Iluminação pública apagada |
| Vias | Buraco · Alagamento · Calçada danificada · Semáforo/sinalização com defeito |
| Árvores | Árvore caída · Galho com risco de queda · Árvore sobre fiação |
| Segurança | Assalto/roubo · Furto · Local mal iluminado ou ermo |
| Riscos e infraestrutura | Risco de deslizamento · Trecho perigoso para pedestres · Imóvel/estrutura com risco de queda · Córrego transbordando |

### Zona de atenção

| Código | Regra |
|---|---|
| RN-ZON-01 | Vale apenas para as categorias Segurança e Riscos e infraestrutura. Uma área recebe o selo "Zona de atenção" quando há 5 ou mais relatos de contas distintas, da mesma categoria, num raio de 300 m, nos últimos 30 dias. |
| RN-ZON-02 | O selo sempre mostra a origem: "X relatos da comunidade nos últimos 30 dias". |
| RN-ZON-03 | O selo some automaticamente quando os relatos saem da janela de 30 dias e o total fica abaixo de 5. |
| RN-ZON-04 | No mapa, áreas com muitos relatos aparecem com cor mais densa (mapa de calor). As ocorrências continuam separadas nos dados; a fusão é apenas visual. |

> Nota técnica: o app usa o SDK mais recente do Expo (WebP no iOS e Android). A agregação do mapa de calor e das zonas de atenção pode ser feita no banco, por exemplo com uma materialized view atualizada periodicamente.

## 4. Ocorrências semelhantes

| Código | Regra |
|---|---|
| RN-SEM-01 | As sugestões aparecem logo após a escolha de categoria, tipo e localização, antes da descrição e das fotos. |
| RN-SEM-02 | É semelhante a ocorrência não concluída, da mesma categoria e tipo, a até 500 m, com atividade (registro, comentário ou participação) nos últimos 7 dias. |
| RN-SEM-03 | Transporte: quando a linha é informada, também são semelhantes as ocorrências da mesma linha, independentemente da distância. |
| RN-SEM-04 | Segurança não sugere semelhantes: cada relato é um fato distinto e alimenta a Zona de atenção. |
| RN-SEM-05 | São exibidas até 5 sugestões, ordenadas pela participação (afetados + apoios), mostrando título, distância, contagens e última atualização. |
| RN-SEM-06 | Na sugestão, a pessoa pode marcar "Também estou sendo afetado", "Apoiar", abrir o detalhe ou escolher "Não é o meu caso, criar nova". |
| RN-SEM-07 | Ocorrências em que a pessoa já participa aparecem com "Você já participa". |
| RN-SEM-08 | Sem semelhantes, o registro segue direto. A sugestão nunca bloqueia a criação. |

## Destaque e mapa de calor

| Código | Regra |
|---|---|
| RN-DES-01 | A intensidade do mapa de calor é calculada pelo número de afetados distintos na área, não pelo número de ocorrências. |
| RN-DES-02 | Ocorrências com mais participação (afetados + apoios) aparecem maiores no mapa e primeiro nas listas. |

## Comentários (fórum da ocorrência)

| Código | Regra |
|---|---|
| RN-COM-01 | Usuários autenticados podem comentar em ocorrências não concluídas. |
| RN-COM-02 | Comentário: 1 a 500 caracteres e até 3 fotos (mesma regra WebP de RN-REG-04). |
| RN-COM-03 | Autores que marcaram "Também estou sendo afetado" aparecem com o selo "Afetado". |
| RN-COM-04 | O autor pode excluir o próprio comentário enquanto a ocorrência não estiver concluída; depois da conclusão, nada muda (decisão de 18/11/2026). Não há edição. |
| RN-COM-05 | Comentários são exibidos em ordem cronológica (mais antigo primeiro). |
| RN-COM-06 | Comentários podem conter links. O Colecity não valida nem classifica links como oficiais; cabe a quem lê avaliar a fonte. |

## Denúncia e moderação

| Código | Regra |
|---|---|
| RN-MOD-01 | Usuários autenticados podem denunciar ocorrências, comentários e fotos, com motivo: ofensivo, dados pessoais, spam ou falso. Uma denúncia por conta por conteúdo. |
| RN-MOD-02 | Com 5 denúncias de contas distintas, o conteúdo fica oculto até revisão da equipe Colecity. |

## 8. Transporte ao vivo

Módulo independente: nenhum outro módulo depende dele.

| Código | Regra |
|---|---|
| RN-TAV-01 | As linhas vêm do GTFS da SPTrans; na escolha da linha há busca por número ou nome. |
| RN-TAV-02 | O detalhe da linha mostra o trajeto oficial (GTFS shapes) no mapa. |
| RN-TAV-03 | Posições da API Olho Vivo aparecem marcadas como "SPTrans". |
| RN-TAV-04 | Um usuário autenticado pode tocar em "Estou neste ônibus" e escolher a linha; enquanto a viagem estiver ativa e o app aberto, sua localização é enviada a cada 1 minuto. Há no máximo uma viagem ativa por usuário; iniciar outra encerra a anterior. A posição aparece marcada como "Relatado por passageiros". |
| RN-TAV-05 | O compartilhamento é por viagem e só começa por ação explícita. Termina quando o usuário encerra, após 2 horas ou após 10 minutos parado fora do trajeto. |
| RN-TAV-06 | O mapa mostra apenas o ônibus, nunca nome ou trajeto individual de passageiro. Posições individuais são apagadas em 24 horas; ficam só dados agregados. |
| RN-TAV-07 | Se a posição relatada ficar a mais de 300 m do trajeto oficial por mais de 2 minutos, o app pergunta "O ônibus mudou de rota?". Com confirmação, cria ou reforça uma ocorrência "Alteração de rota sem aviso" na linha, com o trecho desviado no mapa. |
| RN-TAV-08 | Na v1 não há envio de localização em segundo plano. |

## 5. Participação

| Código | Regra |
|---|---|
| RN-PAR-01 | "Também estou sendo afetado" e "Apoiar manifestação" exigem login e têm contagens separadas. |
| RN-PAR-02 | Cada conta marca no máximo 1 "afetado" e 1 "apoio" por ocorrência; pode marcar os dois. |
| RN-PAR-03 | O autor conta automaticamente como afetado e não pode apoiar a própria ocorrência. O autor não pode retirar sua marcação de afetado. |
| RN-PAR-04 | A participação pode ser retirada a qualquer momento enquanto a ocorrência não estiver concluída; as contagens são atualizadas. |
| RN-PAR-05 | Em ocorrência concluída não é possível participar nem retirar participação. |
| RN-PAR-06 | O detalhe exibe a lista de apoiadores (apenas o nome público). Ao apoiar, o app avisa que o nome aparecerá na lista. |
| RN-PAR-07 | A lista de afetados não é exibida (só a contagem), para não expor quem sofre o problema no local. Na categoria Segurança, nenhuma lista é exibida. |

## 6. Acompanhamento e estados

| Código | Regra |
|---|---|
| RN-ACO-01 | Estados: Aberta → Em acompanhamento → Concluída. |
| RN-ACO-02 | A ocorrência passa a Em acompanhamento automaticamente ao atingir 3 afetados. |
| RN-ACO-03 | A linha do tempo registra automaticamente: criação, mudanças de estado, marcos de participação (10, 50, 100 afetados) e desvios detectados (Transporte ao vivo). |
| RN-ACO-04 | Apenas o autor pode marcar a ocorrência como Concluída, a qualquer momento. |
| RN-ACO-05 | Ao concluir, o autor pode deixar um feedback de finalização com texto e até 3 fotos (ex.: foto do buraco tampado, "a Prefeitura arrumou"). O feedback aparece em destaque no topo da ocorrência. O texto do feedback tem até 500 caracteres. |
| RN-ACO-06 | Encerramento automático por inatividade (sem comentário, participação ou evento): 7 dias para Água e Energia; 30 dias para as demais categorias. |
| RN-ACO-07 | Qualquer afetado pode reabrir uma ocorrência concluída em até 7 dias; ela volta para Em acompanhamento. Relatos de Segurança não podem ser reabertos. |
| RN-ACO-08 | Ocorrências concluídas continuam consultáveis, saem da lista padrão e não aceitam comentários nem participação. |
| RN-ACO-09 | Relatos de Segurança não têm ciclo de acompanhamento: ficam Abertos por 30 dias (contando para a Zona de atenção) e depois são concluídos automaticamente. |
| RN-ACO-10 | Se a conta do autor for excluída (anonimizada), a ocorrência segue ativa com "Usuário removido" e só é concluída pelo encerramento automático. |

## 7. Minhas ocorrências

| Código | Regra |
|---|---|
| RN-MIN-01 | Área exclusiva para usuários autenticados, com três abas: Registradas por mim, Sou afetado e Apoio. Como o autor conta como afetado (RN-REG-08), as ocorrências que ele registrou aparecem também em Sou afetado. |
| RN-MIN-02 | Em cada aba, ocorrências não concluídas aparecem primeiro, depois as concluídas. |
| RN-MIN-03 | Ao retirar a participação, a ocorrência sai da aba correspondente. |
| RN-MIN-04 | Ocorrências com atividade nova desde a última visita (comentário, mudança de estado, desvio) exibem um indicador de "novidade". |

## 7b. Notificações push (somente Android na v1)

| Código | Regra |
|---|---|
| RN-NOT-01 | A permissão de notificação é pedida após o primeiro registro ou participação, não na abertura do app. |
| RN-NOT-02 | Autores, afetados e apoiadores de uma ocorrência são notificados quando: o estado muda (concluída, reaberta); há novos comentários (no máximo 1 notificação por ocorrência a cada 30 minutos, agrupada); um desvio de rota é confirmado em linha com ocorrência deles. |
| RN-NOT-03 | Não há notificação de Zona de atenção (exigiria localização em segundo plano). |
| RN-NOT-04 | O usuário pode silenciar uma ocorrência ou desligar todas as notificações no perfil. |
| RN-NOT-05 | Tocar na notificação abre a ocorrência (deep link). |
| RN-NOT-06 | O indicador de "novidade" (RN-MIN-04) continua valendo para quem não ativar notificações. |

> Nota técnica: o app usa expo-notifications em um development build (push não funciona no Expo Go no Android desde o SDK 53). O envio é feito pelo BFF via Firebase Cloud Messaging (FCM). iOS fica fora da v1. Ver [08 — Arquitetura](08-arquitetura.md).

> LGPD: a anonimização só é válida se nada identificável sobrar — incluindo logs e backups com e-mail, nome, `uid` ou tokens do usuário excluído. Logs não devem registrar e-mail nem tokens; backups seguem política de expurgo.

## 8. Regras gerais

### Acessibilidade

| Código | Regra |
|---|---|
| RN-GER-01 | Todos os botões, ícones e imagens têm rótulo para leitor de tela (TalkBack/VoiceOver). |
| RN-GER-02 | Áreas de toque têm no mínimo 44×44 pt e o app respeita o tamanho de fonte do sistema. |
| RN-GER-03 | Nenhuma informação é transmitida só por cor: mapa de calor e Zona de atenção sempre têm texto ou número. |
| RN-GER-04 | Contraste mínimo WCAG AA. |
| RN-GER-05 | Tudo que o mapa mostra também está disponível em lista. |

### Termos, privacidade e transparência

| Código | Regra |
|---|---|
| RN-GER-06 | Termos de uso e política de privacidade acessíveis no app, inclusive sem login. |
| RN-GER-07 | A localização só é pedida no momento de uso (registrar, filtrar por distância, Transporte ao vivo). Se negada, o local pode ser escolhido no mapa ou por endereço. |
| RN-GER-08 | Aviso fixo nos termos e na tela "Sobre": "O Colecity não é um canal oficial da Prefeitura e não encaminha manifestações a órgãos públicos." |

### Conexão, offline e erros

| Código | Regra |
|---|---|
| RN-GER-09 | Sem internet, o app mostra as últimas ocorrências carregadas (banco local) com o aviso "Você está offline". |
| RN-GER-10 | Registros, participações e comentários feitos offline ficam em fila local com status "Aguardando envio" e são sincronizados automaticamente quando a conexão volta. |
| RN-GER-11 | Mensagens de erro dizem o que fazer, sem códigos técnicos. |

### API e sessão

| Código | Regra |
|---|---|
| RN-GER-12 | Limite geral de 30 requisições por minuto por usuário/IP; acima disso, HTTP 429 e o app mostra "Muitas ações seguidas, aguarde um instante". |
| RN-GER-13 | A sessão não expira por tempo: o app mantém o login (refresh token do Firebase) até o usuário sair, excluir a conta ou a conta ser desativada. |
