# 11 — Épicos, Features e critérios de aceite

Estrutura para o Azure Boards (processo Scrum), no padrão usado em aula:
- **Epic** → título "Prover …".
- **Feature** (filha do Epic) → título com verbo no infinitivo; descrição em **QUEM QUER / O QUE E QUANDO QUER / PORQUE QUER**; critérios de aceite em "Validar se, quando …, o sistema …".
- Cada critério gera um Test Case de Homologação (doc 12). Os códigos RN entre parênteses referenciam o [doc 07](07-regras-de-negocio-produto.md).

## Épicos

| Epic | Título | Features |
|---|---|---|
| E1 | Prover acesso seguro e gestão da conta do cidadão | F01–F05 |
| E2 | Prover consulta e visualização dos problemas urbanos da cidade | F06–F08 |
| E3 | Prover registro colaborativo de problemas e mobilização coletiva | F09–F13 |
| E4 | Prover acompanhamento das ocorrências ao longo do tempo | F14–F16 |
| E5 | Prover monitoramento colaborativo do transporte público | F17–F18 |
| E6 | Prover uso inclusivo, resiliente e transparente da plataforma | F19–F20 |

---

## E1 — Prover acesso seguro e gestão da conta do cidadão

### F01 — Cadastrar conta com e-mail e senha

**QUEM QUER:** o cidadão que mora ou usa serviços urbanos em São Paulo.

**O QUE E QUANDO QUER:** quando quiser registrar ou participar de ocorrências, deve criar uma conta informando nome, e-mail e senha e aceitando os termos de uso e a política de privacidade. O e-mail deve ser válido e não pode estar cadastrado; a senha deve ter no mínimo 8 caracteres, com letras e números. Publicamente, apenas o nome é exibido.

**PORQUE QUER:** sem conta não é possível registrar problemas nem participar das manifestações; a conta identifica quem contribui sem expor seus dados de contato.

**Critérios de aceite:**
1. Validar se, quando informados nome, e-mail válido, senha válida e o aceite dos termos, o sistema cria a conta e dá acesso ao app. (RN-CON-01)
2. Validar se, quando nome, e-mail ou senha não forem informados, o sistema indica o campo obrigatório e não cria a conta. (RN-CON-01)
3. Validar se, quando informado um e-mail com formato inválido, o sistema exibe mensagem de e-mail inválido e não cria a conta. (RN-CON-02)
4. Validar se, quando informado um e-mail já cadastrado, o sistema informa que o e-mail já está em uso e não cria a conta. (RN-CON-02)
5. Validar se, quando informada senha com menos de 8 caracteres, sem letra ou sem número, o sistema exibe a regra da senha e não cria a conta. (RN-CON-03)
6. Validar se, quando o aceite dos termos e da política de privacidade não for marcado, o sistema não conclui o cadastro. (RN-CON-01)
7. Validar se, quando outras pessoas visualizam conteúdo do usuário, o sistema exibe apenas o nome, nunca o e-mail. (RN-CON-06)

### F02 — Acessar o app com login, sessão e logout

**QUEM QUER:** o cidadão cadastrado.

**O QUE E QUANDO QUER:** quando abrir o app, deve entrar com e-mail e senha e permanecer conectado até sair. Em caso de erro, o sistema não deve indicar qual campo está errado, e não deve bloquear a conta por tentativas, apenas limitar ações excessivas.

**PORQUE QUER:** entrar toda vez no app desestimula o acompanhamento dos problemas; mensagens genéricas protegem a conta contra tentativas de descobrir dados.

**Critérios de aceite:**
1. Validar se, quando informados e-mail e senha corretos, o sistema dá acesso ao app. (RN-CON-04)
2. Validar se, quando informados e-mail ou senha incorretos, o sistema exibe "E-mail ou senha inválidos" sem indicar qual campo está errado. (RN-CON-04)
3. Validar se, quando o usuário erra a senha várias vezes e depois informa a senha correta, o sistema dá acesso normalmente, sem bloquear a conta. (RN-CON-05)
4. Validar se, quando o usuário logado fecha e reabre o app, o sistema mantém a sessão ativa. (RN-GER-13)
5. Validar se, quando o usuário toca em "Sair", o sistema encerra a sessão e bloqueia o acesso às áreas que exigem conta. (RN-GER-13)
6. Validar se, quando o limite de requisições é excedido, o sistema exibe "Muitas ações seguidas, aguarde um instante". (RN-GER-12)

### F03 — Entrar com conta Google

**QUEM QUER:** o cidadão que prefere não criar outra senha.

**O QUE E QUANDO QUER:** quando entrar no app, deve poder usar a conta Google. No primeiro acesso, o sistema pede o aceite dos termos antes de criar a conta; se o e-mail já tiver conta com senha, os dois acessos levam à mesma conta.

**PORQUE QUER:** reduz o esforço de cadastro e aumenta a participação, sem duplicar contas.

**Critérios de aceite:**
1. Validar se, quando o usuário entra com Google pela primeira vez e aceita os termos, o sistema cria a conta com o nome vindo do Google. (RN-CON-10, RN-CON-11)
2. Validar se, quando o usuário recusa o aceite dos termos no primeiro login com Google, o sistema não cria a conta. (RN-CON-11)
3. Validar se, quando o usuário com conta de e-mail e senha entra com Google usando o mesmo e-mail, o sistema acessa a mesma conta, com suas ocorrências e participações. (RN-CON-12)
4. Validar se, quando a conta foi criada só com Google, o sistema exibe o e-mail desabilitado no perfil e a opção "Definir senha". (RN-CON-13, RN-CON-14)
5. Validar se, quando o usuário cancela a escolha de conta do Google, o sistema permanece na tela de login sem erro. (RN-CON-10)

### F04 — Recuperar senha

**QUEM QUER:** o cidadão que esqueceu a senha.

**O QUE E QUANDO QUER:** quando não lembrar a senha, deve informar o e-mail e receber um link para definir uma nova senha. A resposta do app é sempre a mesma, exista ou não o e-mail.

**PORQUE QUER:** recuperar o acesso sem perder o histórico de participação, sem revelar quais e-mails estão cadastrados.

**Critérios de aceite:**
1. Validar se, quando informado o e-mail de uma conta com senha, o sistema exibe "Se o e-mail existir, enviaremos instruções" e envia o link de redefinição. (RN-CON-09)
2. Validar se, quando informado um e-mail não cadastrado, o sistema exibe a mesma mensagem e não envia e-mail. (RN-CON-09)
3. Validar se, quando o usuário define uma nova senha válida pelo link, o sistema aceita a nova senha e recusa a anterior. (RN-CON-09)
4. Validar se, quando a nova senha não atende à regra de senha, o sistema recusa a redefinição. (RN-CON-03)
5. Validar se, quando o link de redefinição já foi usado, o sistema recusa nova utilização. (RN-CON-09)
6. Validar se, quando a conta é só Google, o sistema exibe a mensagem genérica e o e-mail enviado orienta a entrar com Google. (RN-CON-13)

### F05 — Gerenciar perfil e excluir conta

**QUEM QUER:** o cidadão cadastrado.

**O QUE E QUANDO QUER:** quando quiser, deve poder alterar nome e e-mail (confirmando a senha para trocar o e-mail) e excluir a conta, com confirmação forte. Após a exclusão, seus dados pessoais deixam de existir e seu conteúdo aparece como "Usuário removido".

**PORQUE QUER:** manter controle sobre os próprios dados, conforme a LGPD.

**Critérios de aceite:**
1. Validar se, quando o usuário altera o nome e salva, o sistema exibe o novo nome no perfil, nas ocorrências e nos comentários. (RN-CON-07)
2. Validar se, quando o usuário altera o e-mail informando a senha atual correta, o sistema atualiza o e-mail. (RN-CON-07)
3. Validar se, quando informada a senha atual incorreta, o sistema recusa a troca de e-mail. (RN-CON-07)
4. Validar se, quando informado um novo e-mail já cadastrado, o sistema recusa a troca. (RN-CON-07)
5. Validar se, quando o usuário confirma a exclusão com a senha e digita "EXCLUIR", o sistema exclui a conta, encerra a sessão e impede novo login com ela. (RN-CON-08)
6. Validar se, quando a senha estiver errada ou "EXCLUIR" não for digitado corretamente, o sistema não exclui a conta. (RN-CON-08)
7. Validar se, quando uma conta é excluída, o sistema exibe "Usuário removido" como autor de suas ocorrências e retira suas participações das contagens. (RN-CON-08)

---

## E2 — Prover consulta e visualização dos problemas urbanos da cidade

### F06 — Consultar ocorrências em lista

**QUEM QUER:** qualquer pessoa, com ou sem conta.

**O QUE E QUANDO QUER:** quando quiser saber o que está acontecendo na cidade, deve ver as ocorrências em lista, filtrar por categoria, estado e distância, e ver as contagens de participação com o aviso de origem.

**PORQUE QUER:** hoje não há um lugar que reúna os problemas relatados; a lista mostra quais problemas existem e quantas pessoas estão mobilizadas.

**Critérios de aceite:**
1. Validar se, quando a pessoa abre o app sem estar logada, o sistema exibe a lista de ocorrências. (RN-CSL-01)
2. Validar se, quando a lista é aberta sem filtros, o sistema exibe apenas ocorrências não concluídas, com as de maior participação primeiro. (RN-CSL-04, RN-DES-02)
3. Validar se, quando a lista é exibida, o sistema mostra em cada item categoria, tipo, bairro, estado, nº de afetados, nº de apoios e tempo desde a última atualização. (RN-CSL-05)
4. Validar se, quando filtrada uma categoria, o sistema exibe somente ocorrências dessa categoria. (RN-CSL-03)
5. Validar se, quando filtrado o estado "Concluída", o sistema exibe as ocorrências concluídas. (RN-CSL-03)
6. Validar se, quando a localização é permitida e filtrado o raio de 1, 5 ou 10 km, o sistema exibe somente ocorrências dentro do raio. (RN-CSL-03)
7. Validar se, quando a localização não é permitida, o sistema não exibe o filtro de distância. (RN-CSL-03)
8. Validar se, quando nenhuma ocorrência atende aos filtros, o sistema exibe estado vazio com orientação. (RN-GER-11)
9. Validar se, quando as contagens são exibidas, o sistema mostra o aviso "Participações registradas no Colecity; não representam o total de afetados." (RN-CSL-07)

### F07 — Visualizar ocorrências no mapa, mapa de calor e Zona de atenção

**QUEM QUER:** qualquer pessoa, com ou sem conta.

**O QUE E QUANDO QUER:** quando quiser entender a extensão de um problema, deve ver as ocorrências no mapa, com marcadores proporcionais à participação, mapa de calor por pessoas afetadas e selo de Zona de atenção em áreas com muitos relatos de Segurança ou Riscos.

**PORQUE QUER:** reclamações isoladas escondem a dimensão real do problema; o mapa mostra quais ruas e bairros estão afetados.

**Critérios de aceite:**
1. Validar se, quando o modo mapa é aberto, o sistema exibe as ocorrências como marcadores maiores conforme a participação. (RN-DES-02)
2. Validar se, quando um marcador é exibido, o sistema mostra posição aproximada, e não o ponto exato registrado. (RN-CSL-08)
3. Validar se, quando há muitas pessoas afetadas numa área, o sistema exibe a área com cor mais intensa, independentemente de estarem em uma ou várias ocorrências. (RN-DES-01)
4. Validar se, quando há 5 ou mais relatos de Segurança ou Riscos de contas distintas num raio de 300 m em 30 dias, o sistema exibe "Zona de atenção" com o texto "X relatos da comunidade nos últimos 30 dias". (RN-ZON-01, RN-ZON-02)
5. Validar se, quando há apenas 4 relatos nessas condições, o sistema não exibe Zona de atenção. (RN-ZON-01)
6. Validar se, quando os relatos de uma zona passam de 30 dias e o total fica abaixo de 5, o sistema deixa de exibir a Zona de atenção. (RN-ZON-03)
7. Validar se, quando há muitos relatos de outras categorias (ex.: Água) numa área, o sistema não exibe Zona de atenção, apenas o mapa de calor. (RN-ZON-01)
8. Validar se, quando mapa de calor ou Zona de atenção são exibidos, o sistema apresenta texto ou número além da cor. (RN-GER-03)

### F08 — Visualizar detalhes da ocorrência

**QUEM QUER:** qualquer pessoa, com ou sem conta.

**O QUE E QUANDO QUER:** quando abrir uma ocorrência, deve ver título, descrição, fotos, localização aproximada, estado, contagens separadas, linha do tempo, comentários, lista de apoiadores e, se concluída, o feedback de conclusão.

**PORQUE QUER:** entender o problema e a mobilização antes de decidir participar.

**Critérios de aceite:**
1. Validar se, quando uma ocorrência é aberta, o sistema exibe título no formato "Tipo – Rua, Bairro", descrição, fotos, localização aproximada, estado, afetados e apoios separados, linha do tempo e comentários. (RN-CSL-06, RN-REG-07)
2. Validar se, quando a ocorrência tem apoiadores, o sistema exibe a lista com o nome de cada apoiador. (RN-PAR-06)
3. Validar se, quando a ocorrência tem afetados, o sistema exibe só a contagem, sem lista de nomes. (RN-PAR-07)
4. Validar se, quando a ocorrência é de Segurança, o sistema não exibe nenhuma lista de pessoas. (RN-PAR-07)
5. Validar se, quando a ocorrência atinge 10 afetados, o sistema registra o marco na linha do tempo. (RN-ACO-03)
6. Validar se, quando a ocorrência foi concluída com feedback, o sistema exibe o feedback e suas fotos em destaque no topo. (RN-ACO-05)

---

## E3 — Prover registro colaborativo de problemas e mobilização coletiva

### F09 — Registrar ocorrência urbana

**QUEM QUER:** o cidadão logado que enfrenta um problema urbano.

**O QUE E QUANDO QUER:** quando identificar um problema, deve informar categoria, tipo, localização no município de São Paulo e descrição de 10 a 500 caracteres, podendo anexar até 3 fotos. Em Transporte pode informar a linha; em Segurança, data e hora do ocorrido. O sistema cria a ocorrência como "Aberta", gera o título e registra o autor como afetado. O autor pode editar descrição e fotos enquanto estiver aberta; a ocorrência não pode ser excluída.

**PORQUE QUER:** dar visibilidade ao problema para que outras pessoas afetadas se juntem a ele.

**Critérios de aceite:**
1. Validar se, quando a pessoa não está logada e toca em "Registrar", o sistema pede login antes de continuar. (RN-REG-01)
2. Validar se, quando informados categoria, tipo, localização e descrição válidos, o sistema cria a ocorrência como "Aberta" e registra o autor como afetado. (RN-REG-02, RN-REG-08)
3. Validar se, quando a descrição tem menos de 10 ou mais de 500 caracteres, o sistema recusa o registro e exibe a regra. (RN-REG-02)
4. Validar se, quando escolhida localização fora do município de São Paulo, o sistema exibe "Por enquanto o Colecity funciona apenas na cidade de São Paulo." e não registra. (RN-REG-06)
5. Validar se, quando a permissão de localização é negada, o sistema permite escolher o local no mapa ou por endereço. (RN-REG-06, RN-GER-07)
6. Validar se, quando anexadas fotos, o sistema aceita até 3, envia em WebP com o maior lado de até 1920 px e impede a 4ª foto. (RN-REG-03, RN-REG-04)
7. Validar se, quando a categoria é Transporte, o sistema exibe o campo de linha, e quando é outra categoria, não exibe. (RN-REG-03)
8. Validar se, quando a categoria é Segurança, o sistema permite informar data e hora do ocorrido e exibe o aviso "Em emergência, ligue 190…". (RN-REG-03, RN-REG-12)
9. Validar se, quando informada data do ocorrido futura ou anterior a 30 dias, o sistema recusa o registro. (RN-REG-03)
10. Validar se, quando o autor edita descrição ou fotos de ocorrência aberta, o sistema salva as alterações e não permite alterar categoria, tipo ou localização. (RN-REG-09)
11. Validar se, quando o usuário não é o autor, o sistema não exibe a opção de editar. (RN-REG-09)
12. Validar se, quando o autor visualiza sua ocorrência, o sistema não oferece opção de excluí-la. (RN-REG-10)

### F10 — Sugerir ocorrências semelhantes no registro

**QUEM QUER:** o cidadão logado que está registrando um problema.

**O QUE E QUANDO QUER:** quando escolher categoria, tipo e localização, deve ver até 5 ocorrências semelhantes (mesma categoria e tipo, até 500 m, não concluídas, com atividade em 7 dias; em Transporte também a mesma linha), podendo participar de uma delas ou criar nova. Segurança não sugere semelhantes.

**PORQUE QUER:** evitar relatos isolados e somar forças na ocorrência que já reúne mais pessoas.

**Critérios de aceite:**
1. Validar se, quando existe ocorrência não concluída de mesma categoria e tipo a até 500 m com atividade nos últimos 7 dias, o sistema a sugere antes da descrição. (RN-SEM-01, RN-SEM-02)
2. Validar se, quando a ocorrência está a mais de 500 m, é de outro tipo, está concluída ou sem atividade há mais de 7 dias, o sistema não a sugere. (RN-SEM-02)
3. Validar se, quando a categoria é Transporte e a linha foi informada, o sistema sugere ocorrências da mesma linha mesmo a mais de 500 m. (RN-SEM-03)
4. Validar se, quando a categoria é Segurança, o sistema não sugere semelhantes. (RN-SEM-04)
5. Validar se, quando há mais de 5 semelhantes, o sistema exibe no máximo 5, as de maior participação primeiro, com distância, contagens e última atualização. (RN-SEM-05)
6. Validar se, quando o usuário toca em "Também estou sendo afetado" ou "Apoiar" numa sugestão, o sistema registra a participação sem criar nova ocorrência. (RN-SEM-06)
7. Validar se, quando o usuário toca em "Não é o meu caso, criar nova", o sistema segue para o registro. (RN-SEM-06, RN-SEM-08)
8. Validar se, quando o usuário já participa de uma ocorrência sugerida, o sistema a exibe com "Você já participa". (RN-SEM-07)
9. Validar se, quando não há semelhantes, o sistema segue direto para a descrição. (RN-SEM-08)

### F11 — Participar como afetado ou apoiador

**QUEM QUER:** o cidadão logado.

**O QUE E QUANDO QUER:** quando encontrar uma ocorrência que o afeta ou com a qual concorda, deve marcar "Também estou sendo afetado" e/ou "Apoiar manifestação", com contagens separadas, uma vez cada, podendo retirar enquanto a ocorrência não estiver concluída.

**PORQUE QUER:** dar força coletiva ao problema e mostrar quantas pessoas são afetadas e quantas apoiam a causa.

**Critérios de aceite:**
1. Validar se, quando a pessoa não está logada e toca em participar, o sistema pede login. (RN-PAR-01)
2. Validar se, quando o usuário marca "Também estou sendo afetado", o sistema aumenta em 1 a contagem de afetados e não altera a de apoios. (RN-PAR-01)
3. Validar se, quando o usuário marca "Apoiar", o sistema aumenta em 1 a contagem de apoios, avisa que o nome aparecerá na lista e o inclui nela. (RN-PAR-01, RN-PAR-06)
4. Validar se, quando o usuário tenta marcar afetado novamente, o sistema não aumenta a contagem. (RN-PAR-02)
5. Validar se, quando o usuário marca afetado e apoio na mesma ocorrência, o sistema aumenta as duas contagens. (RN-PAR-02)
6. Validar se, quando o autor tenta apoiar a própria ocorrência ou retirar seu "afetado", o sistema impede a ação. (RN-PAR-03)
7. Validar se, quando o usuário retira sua participação, o sistema diminui em 1 a contagem correspondente. (RN-PAR-04)
8. Validar se, quando a ocorrência está concluída, o sistema não permite participar nem retirar participação. (RN-PAR-05)
9. Validar se, quando a ocorrência atinge 3 afetados, o sistema altera o estado para "Em acompanhamento". (RN-ACO-02)

### F12 — Comentar ocorrência

**QUEM QUER:** o cidadão logado.

**O QUE E QUANDO QUER:** quando tiver informação nova sobre o problema, deve publicar comentário de 1 a 500 caracteres com até 3 fotos, em ocorrência não concluída. Afetados aparecem com o selo "Afetado". O autor pode excluir o próprio comentário, sem edição.

**PORQUE QUER:** manter a informação atualizada e mostrar a situação real no local.

**Critérios de aceite:**
1. Validar se, quando a pessoa não está logada, o sistema permite ler comentários e não permite comentar. (RN-COM-01)
2. Validar se, quando o usuário envia comentário de 1 a 500 caracteres com até 3 fotos, o sistema o exibe no fim da lista com nome e horário. (RN-COM-02, RN-COM-05)
3. Validar se, quando o comentário está vazio ou tem mais de 500 caracteres, o sistema o recusa. (RN-COM-02)
4. Validar se, quando o autor do comentário marcou "Também estou sendo afetado", o sistema exibe o selo "Afetado". (RN-COM-03)
5. Validar se, quando o autor exclui o próprio comentário e confirma, o sistema o remove e não oferece opção de edição. (RN-COM-04)
6. Validar se, quando o usuário não é autor do comentário, o sistema não exibe a opção de excluir. (RN-COM-04)
7. Validar se, quando a ocorrência está concluída, o sistema não permite comentar. (RN-COM-01)
8. Validar se, quando o comentário contém um link, o sistema o publica sem selo de verificação. (RN-COM-06)

### F13 — Denunciar conteúdo impróprio

**QUEM QUER:** o cidadão logado.

**O QUE E QUANDO QUER:** quando encontrar ocorrência, comentário ou foto ofensiva, com dados pessoais, spam ou falsa, deve denunciar com o motivo. Cada conta denuncia uma vez por conteúdo; com 5 denúncias de contas distintas o conteúdo é ocultado até revisão.

**PORQUE QUER:** manter a plataforma confiável e proteger pessoas de exposição indevida.

**Critérios de aceite:**
1. Validar se, quando o usuário denuncia ocorrência, comentário ou foto escolhendo um motivo, o sistema registra a denúncia. (RN-MOD-01)
2. Validar se, quando o usuário tenta denunciar o mesmo conteúdo novamente, o sistema informa que a denúncia já foi registrada. (RN-MOD-01)
3. Validar se, quando o conteúdo recebe a 5ª denúncia de contas distintas, o sistema o oculta para os demais usuários. (RN-MOD-02)
4. Validar se, quando o conteúdo tem 4 denúncias, o sistema o mantém visível. (RN-MOD-02)
5. Validar se, quando a pessoa não está logada e toca em denunciar, o sistema pede login. (RN-MOD-01)

---

## E4 — Prover acompanhamento das ocorrências ao longo do tempo

### F14 — Concluir, reabrir e encerrar ocorrências

**QUEM QUER:** o autor e os afetados de uma ocorrência.

**O QUE E QUANDO QUER:** quando o problema for resolvido, o autor deve concluir a ocorrência, com feedback opcional de até 500 caracteres e até 3 fotos. Um afetado pode reabrir em até 7 dias (exceto Segurança). Ocorrências sem atividade são concluídas automaticamente (7 dias para Água e Energia, 30 dias para as demais); relatos de Segurança após 30 dias.

**PORQUE QUER:** saber se o problema foi resolvido e manter o mapa atualizado, sem ocorrências abandonadas.

**Critérios de aceite:**
1. Validar se, quando o autor conclui a ocorrência com feedback de até 500 caracteres e até 3 fotos, o sistema altera o estado para "Concluída" e exibe o feedback em destaque. (RN-ACO-04, RN-ACO-05)
2. Validar se, quando o autor conclui sem feedback, o sistema conclui a ocorrência normalmente. (RN-ACO-04)
3. Validar se, quando o usuário não é o autor, o sistema não exibe a opção de concluir. (RN-ACO-04)
4. Validar se, quando um afetado reabre ocorrência concluída há até 7 dias, o sistema altera o estado para "Em acompanhamento". (RN-ACO-07)
5. Validar se, quando a conclusão ocorreu há mais de 7 dias, o sistema não permite reabrir. (RN-ACO-07)
6. Validar se, quando o usuário não é afetado, o sistema não exibe a opção de reabrir. (RN-ACO-07)
7. Validar se, quando o relato de Segurança está concluído, o sistema não permite reabrir. (RN-ACO-07)
8. Validar se, quando ocorrência de Água ou Energia fica 7 dias sem atividade, o sistema a conclui automaticamente. (RN-ACO-06)
9. Validar se, quando ocorrência de outra categoria fica 30 dias sem atividade, o sistema a conclui automaticamente, e com 29 dias não a conclui. (RN-ACO-06)
10. Validar se, quando relato de Segurança completa 30 dias, o sistema o conclui automaticamente. (RN-ACO-09)
11. Validar se, quando a ocorrência está concluída, o sistema a retira da lista padrão e a mantém acessível pelo filtro e pelo link. (RN-ACO-08)

### F15 — Acompanhar minhas ocorrências

**QUEM QUER:** o cidadão logado.

**O QUE E QUANDO QUER:** quando quiser acompanhar seus problemas, deve ver num só lugar as ocorrências que registrou, em que é afetado e que apoia, com as não concluídas primeiro e indicador de novidade.

**PORQUE QUER:** não perder o andamento dos problemas que o afetam.

**Critérios de aceite:**
1. Validar se, quando a pessoa não está logada e abre "Minhas", o sistema pede login. (RN-MIN-01)
2. Validar se, quando o usuário abre "Minhas", o sistema exibe as abas "Registradas por mim", "Sou afetado" e "Apoio" com as ocorrências correspondentes. (RN-MIN-01)
3. Validar se, quando uma aba tem ocorrências abertas e concluídas, o sistema exibe as não concluídas primeiro. (RN-MIN-02)
4. Validar se, quando o usuário retira o apoio de uma ocorrência, o sistema a remove da aba "Apoio". (RN-MIN-03)
5. Validar se, quando a ocorrência teve comentário, mudança de estado ou desvio desde a última visita, o sistema exibe indicador de novidade e o remove após a abertura. (RN-MIN-04)
6. Validar se, quando uma aba não tem ocorrências, o sistema exibe estado vazio com orientação. (RN-GER-11)

### F16 — Receber notificações push

**QUEM QUER:** o autor, afetado ou apoiador de uma ocorrência, no Android.

**O QUE E QUANDO QUER:** quando a ocorrência mudar de estado, receber comentários ou tiver desvio confirmado na linha, deve ser notificado, com no máximo uma notificação de comentários a cada 30 minutos por ocorrência, podendo silenciar uma ocorrência ou desligar todas.

**PORQUE QUER:** acompanhar sem precisar abrir o app.

**Critérios de aceite:**
1. Validar se, quando o usuário faz o primeiro registro ou participação, o sistema pede permissão de notificação, e não a pede ao abrir o app. (RN-NOT-01)
2. Validar se, quando a ocorrência é concluída ou reaberta, o sistema notifica autor, afetados e apoiadores. (RN-NOT-02)
3. Validar se, quando há vários comentários novos em 30 minutos, o sistema envia no máximo uma notificação agrupada dessa ocorrência. (RN-NOT-02)
4. Validar se, quando o próprio usuário comenta, o sistema não o notifica do próprio comentário. (RN-NOT-02)
5. Validar se, quando o usuário silencia uma ocorrência, o sistema não envia notificações dela. (RN-NOT-04)
6. Validar se, quando o usuário desliga todas as notificações no perfil, o sistema não envia nenhuma. (RN-NOT-04)
7. Validar se, quando o usuário toca na notificação, o sistema abre direto a ocorrência. (RN-NOT-05)
8. Validar se, quando a permissão de notificação é negada, o sistema funciona normalmente e exibe o indicador de novidade. (RN-NOT-06)

---

## E5 — Prover monitoramento colaborativo do transporte público

### F17 — Consultar linhas, trajeto e ônibus em tempo real

**QUEM QUER:** o passageiro de ônibus de São Paulo.

**O QUE E QUANDO QUER:** quando for usar uma linha, deve buscá-la por número ou nome, ver o trajeto oficial no mapa e os ônibus em circulação, identificados como "SPTrans" ou "Relatado por passageiros".

**PORQUE QUER:** alterações de rota e horários sem aviso dificultam o dia a dia; ver onde o ônibus realmente está ajuda a planejar a viagem.

**Critérios de aceite:**
1. Validar se, quando buscada uma linha por número ou nome com pelo menos 2 caracteres, o sistema exibe as linhas correspondentes. (RN-TAV-01)
2. Validar se, quando o termo buscado não corresponde a nenhuma linha, o sistema exibe estado vazio. (RN-TAV-01)
3. Validar se, quando uma linha é aberta, o sistema exibe o trajeto oficial no mapa para o sentido escolhido. (RN-TAV-02)
4. Validar se, quando a SPTrans informa posições da linha, o sistema exibe os ônibus marcados como "SPTrans". (RN-TAV-03)
5. Validar se, quando há passageiros compartilhando viagem na linha, o sistema exibe a posição como "Relatado por passageiros", sem nome ou trajeto de pessoas. (RN-TAV-04, RN-TAV-06)
6. Validar se, quando a SPTrans está indisponível, o sistema exibe aviso e continua mostrando o trajeto e as posições de passageiros. (RN-TAV-03)

### F18 — Compartilhar viagem e confirmar desvio de rota

**QUEM QUER:** o passageiro logado que está no ônibus.

**O QUE E QUANDO QUER:** quando estiver em viagem, deve tocar em "Estou neste ônibus" para enviar sua posição a cada 1 minuto com o app aberto. A viagem termina ao encerrar, após 2 horas ou 10 minutos parado fora do trajeto. Se o ônibus ficar a mais de 300 m do trajeto por mais de 2 minutos, o app pergunta se a rota mudou; confirmado, registra a ocorrência "Alteração de rota sem aviso".

**PORQUE QUER:** transformar a mudança de rota sem aviso em informação concreta e visível para todos.

**Critérios de aceite:**
1. Validar se, quando a pessoa não está logada e toca em "Estou neste ônibus", o sistema pede login. (RN-TAV-04)
2. Validar se, quando o usuário logado permite a localização e inicia a viagem, o sistema envia a posição a cada 1 minuto com o app aberto. (RN-TAV-04)
3. Validar se, quando a localização é negada, o sistema não inicia a viagem e explica o motivo. (RN-GER-07)
4. Validar se, quando o usuário inicia nova viagem com outra ativa, o sistema encerra a anterior. (RN-TAV-04)
5. Validar se, quando o usuário toca em "Encerrar viagem", o sistema para o envio. (RN-TAV-05)
6. Validar se, quando a viagem completa 2 horas ou o usuário fica 10 minutos parado fora do trajeto, o sistema encerra a viagem automaticamente. (RN-TAV-05)
7. Validar se, quando o ônibus fica a mais de 300 m do trajeto por mais de 2 minutos, o sistema pergunta "O ônibus mudou de rota?". (RN-TAV-07)
8. Validar se, quando o desvio é confirmado, o sistema cria ou reforça a ocorrência "Alteração de rota sem aviso" da linha, com o trecho no mapa e o usuário como afetado. (RN-TAV-07)
9. Validar se, quando o usuário responde que não houve desvio, o sistema não cria ocorrência. (RN-TAV-07)
10. Validar se, quando o app vai para segundo plano, o sistema não envia a posição. (RN-TAV-08)

---

## E6 — Prover uso inclusivo, resiliente e transparente da plataforma

### F19 — Usar o app sem conexão

**QUEM QUER:** o cidadão com internet instável.

**O QUE E QUANDO QUER:** quando estiver sem conexão, deve ver as últimas ocorrências carregadas e poder registrar, participar e comentar; as ações ficam aguardando envio e são sincronizadas quando a conexão volta, sem duplicar.

**PORQUE QUER:** problemas como falta de energia costumam derrubar a internet justamente quando a pessoa precisa relatar.

**Critérios de aceite:**
1. Validar se, quando o usuário fica sem internet após carregar ocorrências, o sistema exibe as últimas ocorrências e o aviso "Você está offline". (RN-GER-09)
2. Validar se, quando o usuário registra, participa ou comenta offline, o sistema exibe a ação com status "Aguardando envio". (RN-GER-10)
3. Validar se, quando a conexão volta, o sistema envia automaticamente as ações pendentes na ordem em que foram feitas. (RN-GER-10)
4. Validar se, quando uma ação é reenviada após falha, o sistema não a duplica. (RN-GER-10)
5. Validar se, quando ocorre erro de envio, o sistema exibe mensagem compreensível, sem código técnico, e oferece tentar novamente. (RN-GER-11)

### F20 — Garantir privacidade, transparência e acessibilidade

**QUEM QUER:** todo cidadão, inclusive pessoas com deficiência.

**O QUE E QUANDO QUER:** ao usar o app, deve acessar termos e política de privacidade sem conta, saber que o Colecity não é canal oficial, ter a localização pedida só quando necessária e usar o app com leitor de tela, fonte ampliada e tema claro ou escuro.

**PORQUE QUER:** uma tecnologia cidadã precisa ser acessível, proteger dados e ser honesta sobre seus limites.

**Critérios de aceite:**
1. Validar se, quando a pessoa não está logada, o sistema permite abrir os termos de uso e a política de privacidade. (RN-GER-06)
2. Validar se, quando aberta a tela "Sobre", o sistema exibe "O Colecity não é um canal oficial da Prefeitura e não encaminha manifestações a órgãos públicos." (RN-GER-08)
3. Validar se, quando o usuário ainda não registrou, não filtrou por distância nem usou o transporte ao vivo, o sistema não pediu a localização. (RN-GER-07)
4. Validar se, quando o leitor de tela (TalkBack) está ativo, o sistema anuncia todos os botões, ícones e imagens com rótulo. (RN-GER-01)
5. Validar se, quando o tamanho da fonte do sistema é aumentado, o app acompanha sem cortar conteúdo essencial. (RN-GER-02)
6. Validar se, quando o usuário alterna entre tema claro e escuro, o sistema aplica o tema em todas as telas e o mantém ao reabrir o app. (RN-GER-04)
