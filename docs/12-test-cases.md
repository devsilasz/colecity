# 12 — Test Cases de Homologação

Casos de teste funcionais, caixa-preta, um por critério de aceite do [doc 11](11-features.md). Formato da aula: título "Teste de Homologação para validar…", OBJETIVO, PREPARAÇÃO, INPUTS ESPERADOS, OUTPUTS ESPERADOS e passos com resultado esperado.


## F01 — Cadastrar conta com e-mail e senha

### TC-F01-01 — Teste de Homologação para validar o cadastro de conta com e-mail e senha com sucesso

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para inserir uma nova conta com dados válidos
- **PREPARAÇÃO:** garantir que o e-mail usado no teste não esteja cadastrado
- **INPUTS ESPERADOS:** nome, e-mail válido, senha com 8 ou mais caracteres com letras e números, aceite dos termos
- **OUTPUTS ESPERADOS:** conta criada e acesso ao app com o usuário logado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e tocar em 'Criar conta' | A tela de cadastro com nome, e-mail, senha e aceite dos termos é exibida |
| 2 | Informar os dados: nome, e-mail e senha válidos | Os dados digitados são exibidos nos campos correspondentes, com a senha mascarada |
| 3 | Marcar o aceite dos termos e da política de privacidade | O aceite é exibido como marcado |
| 4 | Confirmar o cadastro | A conta é criada e a tela inicial é exibida com o usuário logado |

### TC-F01-02 — Teste de Homologação para validar que o sistema impede o cadastro com campos obrigatórios em branco

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir o cadastro sem nome, e-mail ou senha
- **PREPARAÇÃO:** nenhuma
- **INPUTS ESPERADOS:** cadastro com o campo nome em branco (repetir com e-mail e com senha em branco)
- **OUTPUTS ESPERADOS:** indicação do campo obrigatório e conta não criada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e tocar em 'Criar conta' | A tela de cadastro é exibida |
| 2 | Informar e-mail e senha válidos, deixar o nome em branco e marcar o aceite dos termos | Os dados digitados são exibidos e o campo nome permanece vazio |
| 3 | Confirmar o cadastro | O campo nome é destacado como obrigatório e a conta não é criada |

### TC-F01-03 — Teste de Homologação para validar que o sistema impede o cadastro com e-mail em formato inválido

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir o cadastro com e-mail inválido
- **PREPARAÇÃO:** nenhuma
- **INPUTS ESPERADOS:** nome válido, e-mail 'usuario@' , senha válida, aceite dos termos
- **OUTPUTS ESPERADOS:** mensagem de e-mail inválido e conta não criada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e tocar em 'Criar conta' | A tela de cadastro é exibida |
| 2 | Informar nome e senha válidos e o e-mail 'usuario@', e marcar o aceite | Os dados digitados são exibidos nos campos |
| 3 | Confirmar o cadastro | A mensagem de e-mail inválido é exibida e a conta não é criada |

### TC-F01-04 — Teste de Homologação para validar que o sistema impede o cadastro com e-mail já cadastrado

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir conta duplicada para o mesmo e-mail
- **PREPARAÇÃO:** garantir que exista uma conta cadastrada com o e-mail usado no teste
- **INPUTS ESPERADOS:** nome válido, e-mail já cadastrado, senha válida, aceite dos termos
- **OUTPUTS ESPERADOS:** mensagem de e-mail já em uso e conta não criada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e tocar em 'Criar conta' | A tela de cadastro é exibida |
| 2 | Informar nome e senha válidos e o e-mail já cadastrado, e marcar o aceite | Os dados digitados são exibidos nos campos |
| 3 | Confirmar o cadastro | A mensagem de e-mail já em uso é exibida e a conta não é criada |

### TC-F01-05 — Teste de Homologação para validar que o sistema impede o cadastro com senha fora da regra

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir senha com menos de 8 caracteres, sem letra ou sem número
- **PREPARAÇÃO:** nenhuma
- **INPUTS ESPERADOS:** senhas 'abc123' (curta), '12345678' (sem letra) e 'abcdefgh' (sem número)
- **OUTPUTS ESPERADOS:** regra da senha exibida e conta não criada em cada tentativa

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e tocar em 'Criar conta' | A tela de cadastro é exibida |
| 2 | Informar nome e e-mail válidos, a senha 'abc123' e marcar o aceite | Os dados digitados são exibidos, com a senha mascarada |
| 3 | Confirmar o cadastro | A regra da senha é exibida e a conta não é criada |
| 4 | Repetir os passos 2 e 3 com as senhas '12345678' e 'abcdefgh' | Em cada tentativa a regra da senha é exibida e a conta não é criada |

### TC-F01-06 — Teste de Homologação para validar que o sistema impede o cadastro sem aceite dos termos

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir o cadastro sem o aceite dos termos e da política de privacidade
- **PREPARAÇÃO:** nenhuma
- **INPUTS ESPERADOS:** nome, e-mail e senha válidos, aceite dos termos desmarcado
- **OUTPUTS ESPERADOS:** cadastro não concluído e indicação de aceite obrigatório

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e tocar em 'Criar conta' | A tela de cadastro é exibida |
| 2 | Informar nome, e-mail e senha válidos sem marcar o aceite dos termos | Os dados são exibidos e o aceite permanece desmarcado |
| 3 | Confirmar o cadastro | O aceite é indicado como obrigatório e a conta não é criada |

### TC-F01-07 — Teste de Homologação para validar que o sistema exibe apenas o nome do usuário para outras pessoas

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para garantir que o e-mail do usuário nunca seja exibido publicamente
- **PREPARAÇÃO:** usuário A com ocorrência e comentário publicados; usuário B logado em outro aparelho
- **INPUTS ESPERADOS:** conta do usuário B
- **OUTPUTS ESPERADOS:** nome do usuário A exibido e e-mail ausente

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com o usuário B, abrir uma ocorrência registrada pelo usuário A | O detalhe da ocorrência é exibido |
| 2 | Verificar a identificação do autor da ocorrência | Apenas o nome do usuário A é exibido, sem e-mail |
| 3 | Verificar a identificação do autor nos comentários do usuário A | Apenas o nome do usuário A é exibido, sem e-mail |


## F02 — Acessar o app com login, sessão e logout

### TC-F02-01 — Teste de Homologação para validar o login com e-mail e senha com sucesso

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para acessar o app com credenciais corretas
- **PREPARAÇÃO:** garantir que exista uma conta cadastrada
- **INPUTS ESPERADOS:** e-mail e senha corretos
- **OUTPUTS ESPERADOS:** acesso ao app com o usuário logado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e tocar em 'Entrar' | A tela de login é exibida |
| 2 | Informar e-mail e senha corretos | Os dados são exibidos, com a senha mascarada |
| 3 | Confirmar o login | A tela inicial é exibida com o usuário logado |

### TC-F02-02 — Teste de Homologação para validar que o sistema impede o login com credenciais incorretas sem indicar o campo errado

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir o acesso com e-mail ou senha incorretos
- **PREPARAÇÃO:** garantir que exista uma conta cadastrada
- **INPUTS ESPERADOS:** e-mail correto com senha errada; e-mail inexistente com qualquer senha
- **OUTPUTS ESPERADOS:** mensagem 'E-mail ou senha inválidos' em ambos os casos

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar a tela de login | A tela de login é exibida |
| 2 | Informar o e-mail correto com senha errada e confirmar | A mensagem 'E-mail ou senha inválidos' é exibida e o acesso não é liberado |
| 3 | Informar um e-mail inexistente com qualquer senha e confirmar | A mesma mensagem 'E-mail ou senha inválidos' é exibida, sem indicar qual campo está errado |

### TC-F02-03 — Teste de Homologação para validar que o sistema não bloqueia a conta após várias senhas erradas

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para garantir acesso com a senha correta após várias tentativas erradas
- **PREPARAÇÃO:** garantir que exista uma conta cadastrada
- **INPUTS ESPERADOS:** 5 tentativas com senha errada seguidas da senha correta
- **OUTPUTS ESPERADOS:** acesso liberado normalmente na tentativa correta

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar a tela de login | A tela de login é exibida |
| 2 | Informar o e-mail correto com senha errada e confirmar, 5 vezes | Em cada tentativa a mensagem 'E-mail ou senha inválidos' é exibida |
| 3 | Informar o e-mail e a senha corretos e confirmar | A tela inicial é exibida com o usuário logado, sem bloqueio da conta |

### TC-F02-04 — Teste de Homologação para validar que o sistema mantém a sessão ao reabrir o app

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para manter o usuário logado após fechar e reabrir o app
- **PREPARAÇÃO:** usuário logado no app
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** usuário continua logado sem nova autenticação

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Fechar o app completamente | O app é encerrado |
| 3 | Abrir o app novamente | A tela inicial é exibida com o mesmo usuário logado, sem pedir login |

### TC-F02-05 — Teste de Homologação para validar o logout com encerramento da sessão

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para encerrar a sessão e bloquear áreas que exigem conta
- **PREPARAÇÃO:** usuário logado no app
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** sessão encerrada e áreas restritas pedem login

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir o perfil e tocar em 'Sair' e confirmar | A sessão é encerrada e o app volta ao estado sem login |
| 3 | Tentar acessar 'Minhas ocorrências' | O app solicita login para continuar |

### TC-F02-06 — Teste de Homologação para validar que o sistema limita ações excessivas com aviso ao usuário

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir mais de 30 requisições por minuto
- **PREPARAÇÃO:** usuário logado; ferramenta ou roteiro capaz de repetir a mesma ação rapidamente
- **INPUTS ESPERADOS:** mais de 30 ações em menos de 1 minuto (ex.: atualizar a lista repetidamente)
- **OUTPUTS ESPERADOS:** mensagem 'Muitas ações seguidas, aguarde um instante'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Repetir a atualização da lista de ocorrências mais de 30 vezes em menos de 1 minuto | As primeiras requisições são atendidas normalmente |
| 3 | Verificar a resposta após exceder o limite | A mensagem 'Muitas ações seguidas, aguarde um instante' é exibida |
| 4 | Aguardar 1 minuto e atualizar a lista | A lista é atualizada normalmente |


## F03 — Entrar com conta Google

### TC-F03-01 — Teste de Homologação para validar o primeiro login com conta Google com aceite dos termos

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para criar a conta pelo Google após o aceite dos termos
- **PREPARAÇÃO:** conta Google sem cadastro no Colecity configurada no aparelho
- **INPUTS ESPERADOS:** conta Google, aceite dos termos
- **OUTPUTS ESPERADOS:** conta criada com o nome vindo do Google e acesso ao app

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar a tela de login e tocar em 'Entrar com Google' | A tela de escolha de conta do Google é exibida |
| 2 | Selecionar a conta Google | O app exibe a tela de aceite dos termos e da política de privacidade |
| 3 | Aceitar os termos e confirmar | A conta é criada e a tela inicial é exibida com o usuário logado |
| 4 | Abrir o perfil | O nome exibido é o nome da conta Google |

### TC-F03-02 — Teste de Homologação para validar que o sistema não cria a conta quando o aceite dos termos é recusado no login com Google

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir a criação de conta sem aceite dos termos
- **PREPARAÇÃO:** conta Google sem cadastro no Colecity
- **INPUTS ESPERADOS:** conta Google, recusa dos termos
- **OUTPUTS ESPERADOS:** conta não criada e usuário fora do app

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar a tela de login e tocar em 'Entrar com Google' | A tela de escolha de conta do Google é exibida |
| 2 | Selecionar a conta Google | A tela de aceite dos termos é exibida |
| 3 | Recusar os termos | A conta não é criada e o app volta à tela de login |

### TC-F03-03 — Teste de Homologação para validar que o login com Google acessa a mesma conta já cadastrada com e-mail e senha

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para vincular os dois métodos de login à mesma conta
- **PREPARAÇÃO:** conta com e-mail e senha cadastrada, com ocorrência registrada; conta Google com o mesmo e-mail
- **INPUTS ESPERADOS:** conta Google com o mesmo e-mail
- **OUTPUTS ESPERADOS:** acesso à mesma conta, com ocorrências e participações

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar a tela de login e tocar em 'Entrar com Google' | A tela de escolha de conta do Google é exibida |
| 2 | Selecionar a conta Google com o mesmo e-mail | O app exibe a tela inicial com o usuário logado |
| 3 | Abrir 'Minhas ocorrências' | As ocorrências e participações da conta original são exibidas |

### TC-F03-04 — Teste de Homologação para validar que o perfil de conta só Google desabilita o e-mail e oferece definir senha

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para garantir o comportamento do perfil em conta criada só com Google
- **PREPARAÇÃO:** usuário logado com conta criada só com Google
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** e-mail desabilitado e opção 'Definir senha' exibida

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir o perfil | O perfil é exibido |
| 3 | Verificar o campo de e-mail e as opções de senha | O e-mail está desabilitado para edição e a opção exibida é 'Definir senha' |

### TC-F03-05 — Teste de Homologação para validar que o cancelamento da escolha de conta Google mantém o usuário na tela de login

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para tratar o cancelamento do login com Google sem erro
- **PREPARAÇÃO:** nenhuma
- **INPUTS ESPERADOS:** cancelamento da tela do Google
- **OUTPUTS ESPERADOS:** usuário permanece na tela de login, sem mensagem de erro

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar a tela de login e tocar em 'Entrar com Google' | A tela de escolha de conta do Google é exibida |
| 2 | Cancelar a escolha de conta | O app volta à tela de login sem erro e sem criar conta |


## F04 — Recuperar senha

### TC-F04-01 — Teste de Homologação para validar o envio do link de recuperação de senha

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para enviar o link de redefinição para conta com senha
- **PREPARAÇÃO:** conta com e-mail e senha cadastrada; acesso à caixa de e-mail
- **INPUTS ESPERADOS:** e-mail cadastrado
- **OUTPUTS ESPERADOS:** mensagem genérica exibida e e-mail com link recebido

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar a tela de login e tocar em 'Esqueci a senha' | A tela de recuperação é exibida |
| 2 | Informar o e-mail cadastrado e confirmar | A mensagem 'Se o e-mail existir, enviaremos instruções' é exibida |
| 3 | Verificar a caixa de e-mail | O e-mail com o link de redefinição é recebido |

### TC-F04-02 — Teste de Homologação para validar que o sistema não revela e-mail não cadastrado na recuperação de senha

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir a descoberta de e-mails cadastrados
- **PREPARAÇÃO:** garantir que o e-mail do teste não esteja cadastrado; acesso à caixa de e-mail
- **INPUTS ESPERADOS:** e-mail não cadastrado
- **OUTPUTS ESPERADOS:** mesma mensagem genérica e nenhum e-mail enviado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar a tela de recuperação de senha | A tela de recuperação é exibida |
| 2 | Informar o e-mail não cadastrado e confirmar | A mensagem 'Se o e-mail existir, enviaremos instruções' é exibida |
| 3 | Verificar a caixa de e-mail | Nenhum e-mail de redefinição é recebido |

### TC-F04-03 — Teste de Homologação para validar a redefinição de senha pelo link com sucesso

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para redefinir a senha e invalidar a anterior
- **PREPARAÇÃO:** link de redefinição recebido para conta com senha
- **INPUTS ESPERADOS:** nova senha válida
- **OUTPUTS ESPERADOS:** login aceito com a nova senha e recusado com a anterior

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir o link de redefinição recebido por e-mail | A tela de nova senha é exibida |
| 2 | Informar uma nova senha válida e confirmar | A senha é redefinida com mensagem de sucesso |
| 3 | Fazer login com a senha anterior | A mensagem 'E-mail ou senha inválidos' é exibida |
| 4 | Fazer login com a nova senha | A tela inicial é exibida com o usuário logado |

### TC-F04-04 — Teste de Homologação para validar que o sistema impede redefinir senha fora da regra

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir nova senha com menos de 8 caracteres, sem letra ou sem número
- **PREPARAÇÃO:** link de redefinição recebido
- **INPUTS ESPERADOS:** nova senha 'abc123'
- **OUTPUTS ESPERADOS:** redefinição recusada com a regra da senha

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir o link de redefinição recebido por e-mail | A tela de nova senha é exibida |
| 2 | Informar a nova senha 'abc123' e confirmar | A regra da senha é exibida e a senha não é redefinida |

### TC-F04-05 — Teste de Homologação para validar que o sistema impede reutilizar o link de redefinição

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir o uso repetido do mesmo link
- **PREPARAÇÃO:** link de redefinição já usado para redefinir a senha
- **INPUTS ESPERADOS:** link já usado
- **OUTPUTS ESPERADOS:** link recusado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir novamente o link de redefinição já utilizado | O link é recusado com mensagem de link inválido ou expirado |

### TC-F04-06 — Teste de Homologação para validar a orientação de login com Google na recuperação de senha de conta só Google

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para orientar o usuário de conta só Google sem revelar dados na tela
- **PREPARAÇÃO:** conta criada só com Google; acesso à caixa de e-mail
- **INPUTS ESPERADOS:** e-mail da conta Google
- **OUTPUTS ESPERADOS:** mensagem genérica na tela e e-mail orientando entrar com Google

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar a tela de recuperação de senha | A tela de recuperação é exibida |
| 2 | Informar o e-mail da conta Google e confirmar | A mensagem 'Se o e-mail existir, enviaremos instruções' é exibida |
| 3 | Verificar a caixa de e-mail | O e-mail recebido orienta a entrar com Google |


## F05 — Gerenciar perfil e excluir conta

### TC-F05-01 — Teste de Homologação para validar a alteração do nome no perfil

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para alterar o nome e refletir em todo o app
- **PREPARAÇÃO:** usuário logado com ocorrência e comentário publicados
- **INPUTS ESPERADOS:** novo nome
- **OUTPUTS ESPERADOS:** novo nome exibido no perfil, nas ocorrências e nos comentários

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir o perfil, alterar o nome e salvar | O novo nome é exibido no perfil com mensagem de sucesso |
| 3 | Abrir uma ocorrência registrada e um comentário do usuário | O novo nome é exibido como autor |

### TC-F05-02 — Teste de Homologação para validar a alteração de e-mail com a senha atual correta

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para alterar o e-mail confirmando a senha
- **PREPARAÇÃO:** usuário logado com conta com senha; novo e-mail não cadastrado
- **INPUTS ESPERADOS:** novo e-mail, senha atual correta
- **OUTPUTS ESPERADOS:** e-mail atualizado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir o perfil e tocar em alterar e-mail | Os campos de novo e-mail e senha atual são exibidos |
| 3 | Informar o novo e-mail e a senha atual correta e confirmar | O e-mail é atualizado com mensagem de sucesso |

### TC-F05-03 — Teste de Homologação para validar que o sistema impede a troca de e-mail com senha atual incorreta

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir a troca de e-mail sem confirmação correta da senha
- **PREPARAÇÃO:** usuário logado com conta com senha
- **INPUTS ESPERADOS:** novo e-mail, senha atual incorreta
- **OUTPUTS ESPERADOS:** troca recusada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir o perfil e tocar em alterar e-mail | Os campos de novo e-mail e senha atual são exibidos |
| 3 | Informar o novo e-mail e uma senha incorreta e confirmar | A troca é recusada com mensagem de senha incorreta e o e-mail permanece o mesmo |

### TC-F05-04 — Teste de Homologação para validar que o sistema impede a troca para e-mail já cadastrado

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir dois usuários com o mesmo e-mail
- **PREPARAÇÃO:** usuário logado; outro usuário cadastrado com o e-mail do teste
- **INPUTS ESPERADOS:** e-mail já cadastrado, senha atual correta
- **OUTPUTS ESPERADOS:** troca recusada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir o perfil e tocar em alterar e-mail | Os campos são exibidos |
| 3 | Informar o e-mail já cadastrado e a senha atual correta e confirmar | A troca é recusada com mensagem de e-mail já em uso |

### TC-F05-05 — Teste de Homologação para validar a exclusão de conta com confirmação forte

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para excluir a conta com senha e digitação de 'EXCLUIR'
- **PREPARAÇÃO:** usuário logado com conta com senha
- **INPUTS ESPERADOS:** senha correta, texto 'EXCLUIR'
- **OUTPUTS ESPERADOS:** conta excluída, sessão encerrada e novo login recusado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir o perfil e tocar em 'Excluir conta' | A tela de confirmação pede a senha e a digitação de 'EXCLUIR' |
| 3 | Informar a senha correta, digitar 'EXCLUIR' e confirmar | A conta é excluída e o app volta ao estado sem login |
| 4 | Tentar fazer login com o e-mail e a senha da conta excluída | A mensagem 'E-mail ou senha inválidos' é exibida |

### TC-F05-06 — Teste de Homologação para validar que o sistema não exclui a conta sem confirmação correta

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir exclusão acidental
- **PREPARAÇÃO:** usuário logado com conta com senha
- **INPUTS ESPERADOS:** senha incorreta com 'EXCLUIR'; senha correta com 'excluir errado'
- **OUTPUTS ESPERADOS:** conta mantida em ambos os casos

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir o perfil e tocar em 'Excluir conta' | A tela de confirmação é exibida |
| 3 | Informar senha incorreta, digitar 'EXCLUIR' e confirmar | A exclusão é recusada e a conta permanece ativa |
| 4 | Informar a senha correta, digitar 'EXCLUI' e confirmar | A exclusão não é realizada e a conta permanece ativa |

### TC-F05-07 — Teste de Homologação para validar a exibição de 'Usuário removido' após exclusão de conta

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para garantir a anonimização do conteúdo da conta excluída
- **PREPARAÇÃO:** usuário A com ocorrência registrada e apoio em outra ocorrência; conta do usuário A excluída; usuário B para verificação
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** autor exibido como 'Usuário removido' e participações fora das contagens

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com o usuário B, abrir a ocorrência registrada pelo usuário A | O autor é exibido como 'Usuário removido' |
| 2 | Abrir a ocorrência que o usuário A apoiava | A contagem de apoios não inclui o usuário A e seu nome não está na lista de apoiadores |


## F06 — Consultar ocorrências em lista

### TC-F06-01 — Teste de Homologação para validar a consulta de ocorrências sem login

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir consulta aberta
- **PREPARAÇÃO:** app sem usuário logado; ocorrências cadastradas
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** lista de ocorrências exibida

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app sem estar logado | A tela inicial é exibida |
| 2 | Abrir a aba 'Explorar' em modo lista | A lista de ocorrências é exibida sem pedir login |

### TC-F06-02 — Teste de Homologação para validar a lista padrão sem concluídas e ordenada por participação

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para exibir apenas ocorrências não concluídas, as mais participadas primeiro
- **PREPARAÇÃO:** ocorrências abertas com participações diferentes e ao menos uma concluída
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** lista sem concluídas, ordenada por afetados + apoios

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a lista de ocorrências sem filtros | A lista é exibida |
| 3 | Verificar estados e ordem dos itens | Não há ocorrências concluídas e as de maior participação aparecem primeiro |

### TC-F06-03 — Teste de Homologação para validar as informações exibidas em cada item da lista

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para garantir os dados mínimos de cada ocorrência na lista
- **PREPARAÇÃO:** ocorrências cadastradas
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** categoria, tipo, bairro, estado, afetados, apoios e tempo desde a última atualização

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a lista de ocorrências | A lista é exibida |
| 3 | Verificar um item da lista | São exibidos categoria, tipo, bairro, estado, nº de afetados, nº de apoios e tempo desde a última atualização |

### TC-F06-04 — Teste de Homologação para validar o filtro por categoria

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para filtrar a lista por categoria
- **PREPARAÇÃO:** ocorrências de categorias diferentes
- **INPUTS ESPERADOS:** categoria Água
- **OUTPUTS ESPERADOS:** apenas ocorrências de Água

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a lista e selecionar o filtro de categoria 'Água' | O filtro é aplicado |
| 3 | Verificar os itens exibidos | Somente ocorrências da categoria Água são exibidas |

### TC-F06-05 — Teste de Homologação para validar o filtro pelo estado Concluída

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para consultar ocorrências concluídas
- **PREPARAÇÃO:** ocorrências concluídas cadastradas
- **INPUTS ESPERADOS:** estado Concluída
- **OUTPUTS ESPERADOS:** ocorrências concluídas exibidas

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a lista e selecionar o filtro de estado 'Concluída' | O filtro é aplicado |
| 3 | Verificar os itens exibidos | As ocorrências concluídas são exibidas |

### TC-F06-06 — Teste de Homologação para validar o filtro por distância

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para filtrar ocorrências por raio a partir da posição atual
- **PREPARAÇÃO:** localização permitida; ocorrências a menos e a mais de 1 km da posição do teste
- **INPUTS ESPERADOS:** raio de 1 km
- **OUTPUTS ESPERADOS:** apenas ocorrências dentro de 1 km

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a lista e selecionar o filtro de distância '1 km' | O filtro é aplicado |
| 3 | Verificar os itens exibidos | Somente ocorrências a até 1 km são exibidas |
| 4 | Repetir com os raios de 5 km e 10 km | Em cada raio, somente ocorrências dentro da distância são exibidas |

### TC-F06-07 — Teste de Homologação para validar que o filtro de distância não aparece sem permissão de localização

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para ocultar o filtro de distância quando a localização é negada
- **PREPARAÇÃO:** permissão de localização negada ao app
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** filtro de distância não exibido

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a lista e os filtros | Os filtros disponíveis são exibidos |
| 3 | Verificar o filtro de distância | O filtro de distância não é exibido |

### TC-F06-08 — Teste de Homologação para validar o estado vazio quando nenhum resultado atende aos filtros

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para orientar o usuário quando não há resultados
- **PREPARAÇÃO:** combinação de filtros sem ocorrências correspondentes
- **INPUTS ESPERADOS:** categoria e estado sem resultados
- **OUTPUTS ESPERADOS:** estado vazio com orientação

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Aplicar filtros que não retornam ocorrências | A lista fica sem itens |
| 3 | Verificar a tela | É exibida uma mensagem de estado vazio com orientação para alterar os filtros |

### TC-F06-09 — Teste de Homologação para validar o aviso de origem das contagens

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para informar que as contagens não representam o total de afetados
- **PREPARAÇÃO:** ocorrências cadastradas
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** aviso exibido junto às contagens

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a lista de ocorrências | A lista é exibida com as contagens |
| 3 | Verificar o aviso junto às contagens | O aviso 'Participações registradas no Colecity; não representam o total de afetados.' é exibido |


## F07 — Visualizar ocorrências no mapa, mapa de calor e Zona de atenção

### TC-F07-01 — Teste de Homologação para validar os marcadores no mapa proporcionais à participação

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para destacar no mapa as ocorrências com mais participação
- **PREPARAÇÃO:** ocorrências com participações diferentes na mesma região
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** marcadores maiores para ocorrências mais participadas

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Alternar a aba 'Explorar' para o modo mapa | O mapa é exibido com marcadores |
| 3 | Comparar os marcadores de ocorrências com participações diferentes | O marcador da ocorrência com mais participação é maior |

### TC-F07-02 — Teste de Homologação para validar a exibição de posição aproximada no mapa

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para proteger a localização exata registrada
- **PREPARAÇÃO:** ocorrência registrada em ponto conhecido
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** marcador em posição aproximada (cerca de 100 m)

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir o mapa na região da ocorrência | O marcador da ocorrência é exibido |
| 3 | Comparar a posição do marcador com o ponto exato registrado | O marcador não está no ponto exato, mas em posição aproximada |

### TC-F07-03 — Teste de Homologação para validar o mapa de calor por pessoas afetadas

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para representar a concentração de afetados independentemente do número de ocorrências
- **PREPARAÇÃO:** região A com 1 ocorrência e 20 afetados; região B com 10 ocorrências e 20 afetados no total
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** intensidade equivalente nas regiões A e B

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir o mapa com a camada de calor | O mapa de calor é exibido |
| 3 | Comparar a intensidade das regiões A e B | As duas regiões têm intensidade equivalente |

### TC-F07-04 — Teste de Homologação para validar a exibição da Zona de atenção com 5 relatos

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para sinalizar área com concentração de relatos de Segurança
- **PREPARAÇÃO:** 5 relatos de Segurança de contas distintas num raio de 300 m nos últimos 30 dias
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** selo 'Zona de atenção' com o texto de origem

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir o mapa na região dos relatos | O mapa é exibido |
| 3 | Verificar a área dos relatos | O selo 'Zona de atenção' é exibido com o texto '5 relatos da comunidade nos últimos 30 dias' |

### TC-F07-05 — Teste de Homologação para validar que o sistema não exibe Zona de atenção com 4 relatos

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para respeitar o limite mínimo de relatos
- **PREPARAÇÃO:** 4 relatos de Segurança de contas distintas num raio de 300 m nos últimos 30 dias
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** Zona de atenção não exibida

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir o mapa na região dos relatos | O mapa é exibido |
| 3 | Verificar a área dos relatos | Nenhum selo de Zona de atenção é exibido |

### TC-F07-06 — Teste de Homologação para validar a remoção da Zona de atenção após 30 dias

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para retirar o selo quando os relatos saem da janela de 30 dias
- **PREPARAÇÃO:** Zona de atenção com 5 relatos, dos quais 1 completa mais de 30 dias
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** Zona de atenção deixa de ser exibida

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir o mapa na região da zona após um dos relatos completar mais de 30 dias | O mapa é exibido |
| 3 | Verificar a área | O selo de Zona de atenção não é mais exibido |

### TC-F07-07 — Teste de Homologação para validar que o sistema não exibe Zona de atenção para outras categorias

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para limitar a Zona de atenção a Segurança e Riscos
- **PREPARAÇÃO:** 10 relatos de Água de contas distintas num raio de 300 m
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** apenas mapa de calor, sem Zona de atenção

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir o mapa na região dos relatos de Água | O mapa de calor da região é exibido |
| 3 | Verificar a área | Nenhum selo de Zona de atenção é exibido |

### TC-F07-08 — Teste de Homologação para validar que o mapa apresenta texto ou número além da cor

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para garantir que a informação não dependa só de cor
- **PREPARAÇÃO:** área com mapa de calor e Zona de atenção
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** texto ou número exibido junto às cores

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir o mapa em área com mapa de calor e Zona de atenção | O mapa é exibido |
| 3 | Tocar na área colorida e na Zona de atenção | Números de afetados e o texto de relatos são exibidos além da cor |


## F08 — Visualizar detalhes da ocorrência

### TC-F08-01 — Teste de Homologação para validar o detalhe completo da ocorrência

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para exibir todas as informações da ocorrência
- **PREPARAÇÃO:** ocorrência com fotos, participações, linha do tempo e comentários
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** título 'Tipo – Rua, Bairro' e demais informações

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir uma ocorrência na lista | O detalhe da ocorrência é exibido |
| 3 | Verificar as informações | São exibidos título no formato 'Tipo – Rua, Bairro', descrição, fotos, localização aproximada, estado, afetados e apoios separados, linha do tempo e comentários |

### TC-F08-02 — Teste de Homologação para validar a lista de apoiadores

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para exibir quem apoia a manifestação
- **PREPARAÇÃO:** ocorrência (fora de Segurança) com apoiadores
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** lista com o nome de cada apoiador

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a ocorrência | O detalhe é exibido |
| 3 | Abrir a lista de apoiadores | O nome de cada apoiador é exibido |

### TC-F08-03 — Teste de Homologação para validar que o sistema não exibe a lista de afetados

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para proteger a identidade de quem é afetado
- **PREPARAÇÃO:** ocorrência com afetados
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** apenas a contagem de afetados

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a ocorrência | O detalhe é exibido com a contagem de afetados |
| 3 | Procurar a lista de afetados | Nenhuma lista de nomes de afetados é exibida |

### TC-F08-04 — Teste de Homologação para validar que o sistema não exibe listas de pessoas em ocorrência de Segurança

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para proteger vítimas em relatos de Segurança
- **PREPARAÇÃO:** ocorrência de Segurança com afetados e apoios
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** nenhuma lista de pessoas

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a ocorrência de Segurança | O detalhe é exibido com as contagens |
| 3 | Procurar listas de apoiadores ou afetados | Nenhuma lista de pessoas é exibida |

### TC-F08-05 — Teste de Homologação para validar o registro do marco de 10 afetados na linha do tempo

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para registrar marcos de participação
- **PREPARAÇÃO:** ocorrência com 9 afetados; usuário logado que não participa dela
- **INPUTS ESPERADOS:** marcação 'Também estou sendo afetado'
- **OUTPUTS ESPERADOS:** marco de 10 afetados na linha do tempo

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência e marcar 'Também estou sendo afetado' | A contagem passa para 10 afetados |
| 3 | Abrir a linha do tempo | O marco '10 pessoas afetadas' é exibido |

### TC-F08-06 — Teste de Homologação para validar o destaque do feedback de conclusão

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para exibir como o problema foi resolvido
- **PREPARAÇÃO:** ocorrência concluída com feedback e fotos
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** feedback e fotos em destaque no topo

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a ocorrência concluída | O detalhe é exibido |
| 3 | Verificar o topo da tela | O feedback de conclusão e suas fotos aparecem em destaque |


## F09 — Registrar ocorrência urbana

### TC-F09-01 — Teste de Homologação para validar que o sistema pede login para registrar ocorrência

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir registro sem conta
- **PREPARAÇÃO:** app sem usuário logado
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** solicitação de login

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app sem estar logado | A tela inicial é exibida |
| 2 | Tocar em 'Registrar' | O app solicita login antes de continuar |

### TC-F09-02 — Teste de Homologação para validar o registro de ocorrência com sucesso

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para registrar uma ocorrência com dados válidos
- **PREPARAÇÃO:** usuário logado; localização dentro de São Paulo sem ocorrências semelhantes
- **INPUTS ESPERADOS:** categoria Vias, tipo Buraco, localização em São Paulo, descrição com 10 a 500 caracteres
- **OUTPUTS ESPERADOS:** ocorrência criada como 'Aberta' com o autor como afetado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Tocar em 'Registrar' e escolher categoria 'Vias', tipo 'Buraco' e a localização | Os dados são exibidos e o app segue para a descrição |
| 3 | Informar uma descrição válida e confirmar | A mensagem de sucesso é exibida |
| 4 | Abrir a ocorrência criada | O estado é 'Aberta', o título segue o formato 'Tipo – Rua, Bairro' e a contagem de afetados é 1 |

### TC-F09-03 — Teste de Homologação para validar que o sistema impede registro com descrição fora do tamanho

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir descrição com menos de 10 ou mais de 500 caracteres
- **PREPARAÇÃO:** usuário logado
- **INPUTS ESPERADOS:** descrição 'buraco' (6 caracteres) e descrição com 501 caracteres
- **OUTPUTS ESPERADOS:** registro recusado com a regra exibida

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com categoria, tipo e localização válidos | O app segue para a descrição |
| 3 | Informar a descrição 'buraco' e confirmar | A regra de 10 a 500 caracteres é exibida e o registro não é feito |
| 4 | Informar uma descrição com 501 caracteres e confirmar | A regra é exibida e o registro não é feito |

### TC-F09-04 — Teste de Homologação para validar que o sistema impede registro fora do município de São Paulo

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para restringir o registro ao território da v1
- **PREPARAÇÃO:** usuário logado
- **INPUTS ESPERADOS:** localização em Guarulhos
- **OUTPUTS ESPERADOS:** mensagem de território e registro não realizado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro e escolher uma localização em Guarulhos no mapa | A localização é selecionada |
| 3 | Confirmar a localização | A mensagem 'Por enquanto o Colecity funciona apenas na cidade de São Paulo.' é exibida e o registro não prossegue |

### TC-F09-05 — Teste de Homologação para validar a escolha de local no mapa sem permissão de localização

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir registro sem GPS
- **PREPARAÇÃO:** usuário logado; permissão de localização negada
- **INPUTS ESPERADOS:** endereço em São Paulo
- **OUTPUTS ESPERADOS:** local escolhido pelo endereço e registro possível

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro | O app informa que a localização não está permitida e oferece mapa ou endereço |
| 3 | Informar um endereço em São Paulo | O local é marcado no mapa e o registro pode prosseguir |

### TC-F09-06 — Teste de Homologação para validar o anexo de até 3 fotos em WebP

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para aceitar até 3 fotos e convertê-las antes do envio
- **PREPARAÇÃO:** usuário logado; 4 fotos na galeria com resolução acima de 1920 px
- **INPUTS ESPERADOS:** 4 fotos
- **OUTPUTS ESPERADOS:** 3 fotos aceitas em WebP com maior lado até 1920 px e 4ª foto impedida

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro e anexar 3 fotos | As 3 fotos são exibidas como anexadas |
| 3 | Tentar anexar a 4ª foto | O app impede o anexo e informa o limite de 3 fotos |
| 4 | Concluir o registro e verificar as fotos enviadas no armazenamento | As fotos estão em WebP com o maior lado de até 1920 px |

### TC-F09-07 — Teste de Homologação para validar o campo de linha apenas na categoria Transporte

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para exibir campo específico por categoria
- **PREPARAÇÃO:** usuário logado
- **INPUTS ESPERADOS:** categoria Transporte e categoria Água
- **OUTPUTS ESPERADOS:** campo de linha exibido só em Transporte

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com a categoria 'Transporte' | O campo de linha é exibido |
| 3 | Voltar e escolher a categoria 'Água' | O campo de linha não é exibido |

### TC-F09-08 — Teste de Homologação para validar a data do ocorrido e o aviso de emergência em Segurança

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir relato posterior de Segurança com orientação de emergência
- **PREPARAÇÃO:** usuário logado
- **INPUTS ESPERADOS:** categoria Segurança, tipo Furto, data e hora de ontem
- **OUTPUTS ESPERADOS:** campo de data e hora e aviso 'Em emergência, ligue 190…' exibidos

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com a categoria 'Segurança' | O aviso 'Em emergência, ligue 190…' e o campo de data e hora do ocorrido são exibidos |
| 3 | Informar a data e hora de ontem, descrição válida e confirmar | A ocorrência é registrada com a data e hora informadas |

### TC-F09-09 — Teste de Homologação para validar que o sistema impede data do ocorrido futura ou anterior a 30 dias

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para validar a data informada em Segurança
- **PREPARAÇÃO:** usuário logado
- **INPUTS ESPERADOS:** data de amanhã e data de 31 dias atrás
- **OUTPUTS ESPERADOS:** registro recusado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com a categoria 'Segurança' e informar a data de amanhã | O registro é recusado com mensagem de data inválida |
| 3 | Informar a data de 31 dias atrás | O registro é recusado com mensagem de data inválida |

### TC-F09-10 — Teste de Homologação para validar a edição de descrição e fotos pelo autor

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir ao autor corrigir a ocorrência aberta
- **PREPARAÇÃO:** usuário logado autor de ocorrência aberta
- **INPUTS ESPERADOS:** nova descrição
- **OUTPUTS ESPERADOS:** descrição atualizada e categoria, tipo e localização bloqueados

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a própria ocorrência e tocar em 'Editar' | Descrição e fotos são editáveis; categoria, tipo e localização não |
| 3 | Alterar a descrição e salvar | A nova descrição é exibida na ocorrência |

### TC-F09-11 — Teste de Homologação para validar que o sistema não oferece edição para quem não é autor

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir edição por terceiros
- **PREPARAÇÃO:** usuário logado que não é autor da ocorrência
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** opção de editar ausente

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir uma ocorrência de outro usuário | O detalhe é exibido |
| 3 | Procurar a opção de editar | A opção de editar não é exibida |

### TC-F09-12 — Teste de Homologação para validar que o sistema não oferece exclusão de ocorrência

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir a exclusão de ocorrências
- **PREPARAÇÃO:** usuário logado autor de ocorrência
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** opção de excluir ausente

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a própria ocorrência | O detalhe é exibido com as ações do autor |
| 3 | Procurar a opção de excluir | A opção de excluir não é exibida; apenas 'Concluir' está disponível |


## F10 — Sugerir ocorrências semelhantes no registro

### TC-F10-01 — Teste de Homologação para validar a sugestão de ocorrência semelhante

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para sugerir ocorrência existente antes da descrição
- **PREPARAÇÃO:** usuário logado; ocorrência aberta de Água/Falta de abastecimento a 200 m com atividade há 2 dias
- **INPUTS ESPERADOS:** categoria Água, tipo Falta de abastecimento, localização a 200 m
- **OUTPUTS ESPERADOS:** ocorrência existente sugerida

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro e escolher categoria, tipo e localização | O app exibe a etapa de ocorrências semelhantes antes da descrição |
| 3 | Verificar as sugestões | A ocorrência existente a 200 m é sugerida |

### TC-F10-02 — Teste de Homologação para validar que o sistema não sugere ocorrências fora dos critérios de semelhança

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para respeitar distância, tipo, estado e janela de 7 dias
- **PREPARAÇÃO:** ocorrências de Água/Falta de abastecimento: uma a 700 m, uma concluída, uma sem atividade há 10 dias; uma de Água/Baixa pressão a 100 m
- **INPUTS ESPERADOS:** categoria Água, tipo Falta de abastecimento
- **OUTPUTS ESPERADOS:** nenhuma dessas ocorrências sugerida

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com categoria Água, tipo Falta de abastecimento e a localização do teste | O app avança |
| 3 | Verificar as sugestões | Nenhuma das ocorrências preparadas é sugerida e o app segue para a descrição |

### TC-F10-03 — Teste de Homologação para validar a sugestão por mesma linha em Transporte

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para sugerir ocorrência da mesma linha mesmo distante
- **PREPARAÇÃO:** usuário logado; ocorrência aberta de Transporte da linha 8700-10 a 3 km
- **INPUTS ESPERADOS:** categoria Transporte, mesmo tipo, linha 8700-10
- **OUTPUTS ESPERADOS:** ocorrência da mesma linha sugerida

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com categoria Transporte, tipo e linha 8700-10 | O app exibe as semelhantes |
| 3 | Verificar as sugestões | A ocorrência da mesma linha a 3 km é sugerida |

### TC-F10-04 — Teste de Homologação para validar que o sistema não sugere semelhantes em Segurança

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para manter relatos de Segurança separados
- **PREPARAÇÃO:** usuário logado; relato de Segurança/Furto a 50 m
- **INPUTS ESPERADOS:** categoria Segurança, tipo Furto
- **OUTPUTS ESPERADOS:** nenhuma sugestão

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com categoria Segurança, tipo Furto e localização próxima ao relato existente | O app segue direto para a descrição, sem etapa de semelhantes |

### TC-F10-05 — Teste de Homologação para validar o limite de 5 sugestões ordenadas por participação

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para exibir no máximo 5 semelhantes, as mais participadas primeiro
- **PREPARAÇÃO:** usuário logado; 7 ocorrências semelhantes com participações diferentes
- **INPUTS ESPERADOS:** categoria, tipo e localização das ocorrências
- **OUTPUTS ESPERADOS:** 5 sugestões ordenadas com distância, contagens e última atualização

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com os dados do teste | A etapa de semelhantes é exibida |
| 3 | Verificar a quantidade, a ordem e as informações | 5 sugestões são exibidas, da maior para a menor participação, com distância, contagens e última atualização |

### TC-F10-06 — Teste de Homologação para validar a participação a partir da sugestão sem criar nova ocorrência

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para juntar o usuário à ocorrência existente
- **PREPARAÇÃO:** usuário logado; ocorrência semelhante sugerida
- **INPUTS ESPERADOS:** toque em 'Também estou sendo afetado'
- **OUTPUTS ESPERADOS:** participação registrada e nenhuma ocorrência nova

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro até a etapa de semelhantes | A sugestão é exibida |
| 3 | Tocar em 'Também estou sendo afetado' na sugestão | A contagem de afetados aumenta e o app confirma a participação |
| 4 | Abrir 'Minhas ocorrências' | A ocorrência aparece em 'Sou afetado' e nenhuma ocorrência nova foi registrada |

### TC-F10-07 — Teste de Homologação para validar a criação de nova ocorrência ignorando as sugestões

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir criar nova mesmo com semelhantes
- **PREPARAÇÃO:** usuário logado; ocorrência semelhante sugerida
- **INPUTS ESPERADOS:** toque em 'Não é o meu caso, criar nova'
- **OUTPUTS ESPERADOS:** app segue para a descrição

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro até a etapa de semelhantes | A sugestão é exibida |
| 3 | Tocar em 'Não é o meu caso, criar nova' | O app segue para a descrição do registro |

### TC-F10-08 — Teste de Homologação para validar a indicação de participação já existente na sugestão

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para informar que o usuário já participa
- **PREPARAÇÃO:** usuário logado afetado em uma ocorrência que será sugerida
- **INPUTS ESPERADOS:** categoria, tipo e localização da ocorrência
- **OUTPUTS ESPERADOS:** sugestão marcada com 'Você já participa'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com os dados da ocorrência em que já participa | A etapa de semelhantes é exibida |
| 3 | Verificar a sugestão | A ocorrência aparece com a marcação 'Você já participa' |

### TC-F10-09 — Teste de Homologação para validar o registro direto quando não há semelhantes

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para não interromper o registro sem sugestões
- **PREPARAÇÃO:** usuário logado; nenhuma ocorrência semelhante na região
- **INPUTS ESPERADOS:** categoria, tipo e localização sem semelhantes
- **OUTPUTS ESPERADOS:** app segue direto para a descrição

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Iniciar o registro com os dados do teste | O app segue direto para a descrição, sem etapa de semelhantes |


## F11 — Participar como afetado ou apoiador

### TC-F11-01 — Teste de Homologação para validar que o sistema pede login para participar

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir participação sem conta
- **PREPARAÇÃO:** app sem usuário logado; ocorrência aberta
- **INPUTS ESPERADOS:** toque em 'Também estou sendo afetado'
- **OUTPUTS ESPERADOS:** solicitação de login

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app sem login e abrir uma ocorrência aberta | O detalhe é exibido |
| 2 | Tocar em 'Também estou sendo afetado' | O app solicita login antes de registrar a participação |

### TC-F11-02 — Teste de Homologação para validar a marcação de 'Também estou sendo afetado'

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para registrar o usuário como afetado
- **PREPARAÇÃO:** usuário logado que não participa da ocorrência
- **INPUTS ESPERADOS:** toque em 'Também estou sendo afetado'
- **OUTPUTS ESPERADOS:** afetados +1 e apoios inalterados

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência e anotar as contagens | As contagens de afetados e apoios são exibidas |
| 3 | Tocar em 'Também estou sendo afetado' | A contagem de afetados aumenta em 1 e a de apoios não muda |

### TC-F11-03 — Teste de Homologação para validar a marcação de 'Apoiar manifestação' com aviso e lista

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para registrar apoio com transparência sobre a exibição do nome
- **PREPARAÇÃO:** usuário logado que não participa da ocorrência (fora de Segurança)
- **INPUTS ESPERADOS:** toque em 'Apoiar'
- **OUTPUTS ESPERADOS:** aviso exibido, apoios +1 e nome na lista

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência e tocar em 'Apoiar' | O app avisa que o nome aparecerá na lista de apoiadores |
| 3 | Confirmar o apoio | A contagem de apoios aumenta em 1 |
| 4 | Abrir a lista de apoiadores | O nome do usuário é exibido na lista |

### TC-F11-04 — Teste de Homologação para validar que o sistema não duplica a marcação de afetado

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir participação repetida da mesma conta
- **PREPARAÇÃO:** usuário logado já marcado como afetado
- **INPUTS ESPERADOS:** nova tentativa de marcar afetado
- **OUTPUTS ESPERADOS:** contagem inalterada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência em que já é afetado | A opção 'Também estou sendo afetado' aparece como marcada |
| 3 | Tentar marcar novamente | A contagem de afetados não aumenta |

### TC-F11-05 — Teste de Homologação para validar a marcação de afetado e apoio na mesma ocorrência

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir as duas formas de participação
- **PREPARAÇÃO:** usuário logado que não participa da ocorrência
- **INPUTS ESPERADOS:** toque em 'Também estou sendo afetado' e em 'Apoiar'
- **OUTPUTS ESPERADOS:** as duas contagens aumentam em 1

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência e marcar 'Também estou sendo afetado' | A contagem de afetados aumenta em 1 |
| 3 | Marcar 'Apoiar' e confirmar | A contagem de apoios aumenta em 1 e as duas marcações permanecem ativas |

### TC-F11-06 — Teste de Homologação para validar que o autor não pode apoiar a própria ocorrência nem retirar seu afetado

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir autoapoio e retirada do autor
- **PREPARAÇÃO:** usuário logado autor da ocorrência
- **INPUTS ESPERADOS:** toque em 'Apoiar' e em retirar 'afetado'
- **OUTPUTS ESPERADOS:** ações impedidas

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a própria ocorrência e tentar 'Apoiar' | A ação é impedida com mensagem informando que o autor não pode apoiar |
| 3 | Tentar retirar a marcação de afetado | A ação é impedida e a marcação permanece |

### TC-F11-07 — Teste de Homologação para validar a retirada da participação

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir desfazer a participação
- **PREPARAÇÃO:** usuário logado com apoio em ocorrência aberta
- **INPUTS ESPERADOS:** toque para retirar o apoio
- **OUTPUTS ESPERADOS:** apoios -1

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência apoiada e anotar a contagem | A contagem de apoios é exibida |
| 3 | Retirar o apoio e confirmar | A contagem de apoios diminui em 1 e o nome sai da lista |

### TC-F11-08 — Teste de Homologação para validar que o sistema impede participar em ocorrência concluída

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para bloquear participação após a conclusão
- **PREPARAÇÃO:** usuário logado; ocorrência concluída
- **INPUTS ESPERADOS:** toque em 'Também estou sendo afetado' e em retirar participação
- **OUTPUTS ESPERADOS:** ações indisponíveis

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência concluída | O detalhe é exibido com estado 'Concluída' |
| 3 | Verificar as opções de participação | As opções de participar e de retirar participação estão indisponíveis |

### TC-F11-09 — Teste de Homologação para validar a mudança para 'Em acompanhamento' ao atingir 3 afetados

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para atualizar o estado conforme a participação
- **PREPARAÇÃO:** ocorrência 'Aberta' com 2 afetados; usuário logado que não participa
- **INPUTS ESPERADOS:** toque em 'Também estou sendo afetado'
- **OUTPUTS ESPERADOS:** estado 'Em acompanhamento'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência 'Aberta' com 2 afetados | O estado 'Aberta' é exibido |
| 3 | Marcar 'Também estou sendo afetado' | A contagem passa para 3 e o estado muda para 'Em acompanhamento' |


## F12 — Comentar ocorrência

### TC-F12-01 — Teste de Homologação para validar que o sistema permite ler e impede comentar sem login

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para manter leitura aberta e exigir conta para comentar
- **PREPARAÇÃO:** app sem usuário logado; ocorrência com comentários
- **INPUTS ESPERADOS:** tentativa de comentar
- **OUTPUTS ESPERADOS:** comentários visíveis e solicitação de login

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app sem login e abrir a ocorrência | Os comentários são exibidos |
| 2 | Tocar no campo de comentário | O app solicita login para comentar |

### TC-F12-02 — Teste de Homologação para validar a publicação de comentário com foto

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para publicar informação nova com evidência
- **PREPARAÇÃO:** usuário logado; ocorrência aberta
- **INPUTS ESPERADOS:** texto de 1 a 500 caracteres e 1 foto
- **OUTPUTS ESPERADOS:** comentário no fim da lista com nome e horário

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência e os comentários | A lista de comentários é exibida |
| 3 | Escrever o comentário, anexar 1 foto e enviar | O comentário aparece no fim da lista com nome, horário e foto |

### TC-F12-03 — Teste de Homologação para validar que o sistema impede comentário vazio ou acima de 500 caracteres

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para validar o tamanho do comentário
- **PREPARAÇÃO:** usuário logado; ocorrência aberta
- **INPUTS ESPERADOS:** comentário vazio e comentário com 501 caracteres
- **OUTPUTS ESPERADOS:** comentário recusado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir os comentários e tentar enviar sem texto | O envio é impedido |
| 3 | Escrever 501 caracteres e enviar | O comentário é recusado com a regra de até 500 caracteres |

### TC-F12-04 — Teste de Homologação para validar o selo 'Afetado' nos comentários

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para dar peso ao relato de quem é afetado
- **PREPARAÇÃO:** usuário logado marcado como afetado na ocorrência
- **INPUTS ESPERADOS:** comentário válido
- **OUTPUTS ESPERADOS:** comentário com selo 'Afetado'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência em que é afetado e enviar um comentário | O comentário é publicado |
| 3 | Verificar a identificação do comentário | O selo 'Afetado' é exibido ao lado do nome |

### TC-F12-05 — Teste de Homologação para validar a exclusão do próprio comentário sem opção de edição

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir ao autor remover o comentário
- **PREPARAÇÃO:** usuário logado com comentário publicado
- **INPUTS ESPERADOS:** toque em excluir e confirmar
- **OUTPUTS ESPERADOS:** comentário removido; edição indisponível

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir as opções do próprio comentário | A opção excluir é exibida e não há opção de editar |
| 3 | Excluir e confirmar | O comentário é removido da lista |

### TC-F12-06 — Teste de Homologação para validar que o sistema não permite excluir comentário de outra pessoa

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para proteger o conteúdo de terceiros
- **PREPARAÇÃO:** usuário logado; comentário de outro usuário
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** opção de excluir ausente

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir as opções de um comentário de outro usuário | A opção de excluir não é exibida |

### TC-F12-07 — Teste de Homologação para validar que o sistema impede comentar em ocorrência concluída

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para bloquear comentários após a conclusão
- **PREPARAÇÃO:** usuário logado; ocorrência concluída
- **INPUTS ESPERADOS:** tentativa de comentar
- **OUTPUTS ESPERADOS:** campo de comentário indisponível

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência concluída | O detalhe é exibido com estado 'Concluída' |
| 3 | Verificar a área de comentários | Os comentários são exibidos e o envio de novos comentários está indisponível |

### TC-F12-08 — Teste de Homologação para validar a publicação de comentário com link sem selo de verificação

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para manter links livres sem classificação
- **PREPARAÇÃO:** usuário logado; ocorrência aberta
- **INPUTS ESPERADOS:** comentário com link de um site público
- **OUTPUTS ESPERADOS:** comentário publicado sem selo

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Enviar um comentário contendo um link | O comentário é publicado |
| 3 | Verificar o comentário | O link é exibido sem nenhum selo de fonte oficial ou verificação |


## F13 — Denunciar conteúdo impróprio

### TC-F13-01 — Teste de Homologação para validar o registro de denúncia de conteúdo

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para registrar denúncia com motivo
- **PREPARAÇÃO:** usuário logado; comentário de outro usuário
- **INPUTS ESPERADOS:** motivo 'Ofensivo'
- **OUTPUTS ESPERADOS:** denúncia registrada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir as opções de um comentário e tocar em 'Denunciar' | Os motivos ofensivo, dados pessoais, spam e falso são exibidos |
| 3 | Selecionar 'Ofensivo' e confirmar | A mensagem de denúncia registrada é exibida |
| 4 | Repetir para uma ocorrência e para uma foto | Em cada caso a denúncia é registrada |

### TC-F13-02 — Teste de Homologação para validar que o sistema impede denunciar o mesmo conteúdo duas vezes

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para permitir uma denúncia por conta por conteúdo
- **PREPARAÇÃO:** usuário logado que já denunciou o comentário
- **INPUTS ESPERADOS:** nova denúncia do mesmo comentário
- **OUTPUTS ESPERADOS:** aviso de denúncia já registrada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Tentar denunciar novamente o mesmo comentário | O app informa que a denúncia já foi registrada |

### TC-F13-03 — Teste de Homologação para validar a ocultação de conteúdo com 5 denúncias

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para ocultar conteúdo denunciado por várias contas
- **PREPARAÇÃO:** comentário com 4 denúncias de contas distintas; quinta conta logada
- **INPUTS ESPERADOS:** 5ª denúncia
- **OUTPUTS ESPERADOS:** conteúdo oculto para os demais usuários

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Com a quinta conta, denunciar o comentário | A denúncia é registrada |
| 3 | Com outra conta, abrir a ocorrência | O comentário não é mais exibido |

### TC-F13-04 — Teste de Homologação para validar que o sistema mantém visível conteúdo com 4 denúncias

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para respeitar o limite de 5 denúncias
- **PREPARAÇÃO:** comentário com 4 denúncias de contas distintas
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** comentário visível

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a ocorrência com o comentário | O comentário continua visível |

### TC-F13-05 — Teste de Homologação para validar que o sistema pede login para denunciar

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir denúncia sem conta
- **PREPARAÇÃO:** app sem usuário logado
- **INPUTS ESPERADOS:** toque em 'Denunciar'
- **OUTPUTS ESPERADOS:** solicitação de login

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app sem login, abrir uma ocorrência e tocar em 'Denunciar' | O app solicita login |


## F14 — Concluir, reabrir e encerrar ocorrências

### TC-F14-01 — Teste de Homologação para validar a conclusão da ocorrência com feedback e fotos

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para registrar a resolução do problema
- **PREPARAÇÃO:** usuário logado autor de ocorrência aberta
- **INPUTS ESPERADOS:** feedback de até 500 caracteres e 1 foto
- **OUTPUTS ESPERADOS:** estado 'Concluída' e feedback em destaque

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a própria ocorrência e tocar em 'Concluir' | A tela de conclusão com feedback e fotos opcionais é exibida |
| 3 | Informar o feedback, anexar 1 foto e confirmar | O estado muda para 'Concluída' |
| 4 | Verificar o topo da ocorrência | O feedback e a foto aparecem em destaque |

### TC-F14-02 — Teste de Homologação para validar a conclusão da ocorrência sem feedback

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir conclusão sem feedback
- **PREPARAÇÃO:** usuário logado autor de ocorrência aberta
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** estado 'Concluída'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a própria ocorrência e tocar em 'Concluir' | A tela de conclusão é exibida |
| 3 | Confirmar sem preencher feedback | O estado muda para 'Concluída' |

### TC-F14-03 — Teste de Homologação para validar que o sistema não oferece conclusão para quem não é autor

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para restringir a conclusão ao autor
- **PREPARAÇÃO:** usuário logado que não é autor
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** opção de concluir ausente

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir uma ocorrência de outro usuário | A opção 'Concluir' não é exibida |

### TC-F14-04 — Teste de Homologação para validar a reabertura por afetado em até 7 dias

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir reabrir quando o problema volta
- **PREPARAÇÃO:** usuário logado afetado; ocorrência concluída há 3 dias (fora de Segurança)
- **INPUTS ESPERADOS:** toque em 'Reabrir'
- **OUTPUTS ESPERADOS:** estado 'Em acompanhamento'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência concluída | A opção 'Reabrir' é exibida |
| 3 | Tocar em 'Reabrir' e confirmar | O estado muda para 'Em acompanhamento' |

### TC-F14-05 — Teste de Homologação para validar que o sistema impede reabrir após 7 dias

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para respeitar o prazo de reabertura
- **PREPARAÇÃO:** usuário logado afetado; ocorrência concluída há 8 dias
- **INPUTS ESPERADOS:** tentativa de reabrir
- **OUTPUTS ESPERADOS:** reabertura indisponível

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência concluída há 8 dias | A opção 'Reabrir' não está disponível |

### TC-F14-06 — Teste de Homologação para validar que o sistema não oferece reabertura para quem não é afetado

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para restringir a reabertura aos afetados
- **PREPARAÇÃO:** usuário logado não afetado; ocorrência concluída há 2 dias
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** opção de reabrir ausente

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência concluída | A opção 'Reabrir' não é exibida |

### TC-F14-07 — Teste de Homologação para validar que o sistema impede reabrir relato de Segurança

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para manter relatos de Segurança encerrados
- **PREPARAÇÃO:** usuário logado afetado; relato de Segurança concluído há 1 dia
- **INPUTS ESPERADOS:** tentativa de reabrir
- **OUTPUTS ESPERADOS:** reabertura indisponível

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir o relato de Segurança concluído | A opção 'Reabrir' não está disponível |

### TC-F14-08 — Teste de Homologação para validar o encerramento automático de Água e Energia após 7 dias

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para concluir ocorrências abandonadas de Água e Energia
- **PREPARAÇÃO:** ocorrências de Água e de Energia sem atividade há 7 dias
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** estado 'Concluída' por inatividade

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir as ocorrências de Água e Energia após 7 dias sem atividade | As duas ocorrências estão com estado 'Concluída' |
| 3 | Verificar a linha do tempo | O evento de conclusão por inatividade é exibido |

### TC-F14-09 — Teste de Homologação para validar o encerramento automático das demais categorias após 30 dias

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para concluir ocorrências abandonadas das demais categorias
- **PREPARAÇÃO:** ocorrência de Vias sem atividade há 30 dias; ocorrência de Vias sem atividade há 29 dias
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** a de 30 dias concluída e a de 29 dias aberta

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a ocorrência sem atividade há 30 dias | O estado é 'Concluída' |
| 3 | Abrir a ocorrência sem atividade há 29 dias | O estado continua aberto |

### TC-F14-10 — Teste de Homologação para validar o encerramento automático de Segurança após 30 dias

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para concluir relatos de Segurança após 30 dias
- **PREPARAÇÃO:** relato de Segurança registrado há 30 dias
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** estado 'Concluída'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir o relato de Segurança registrado há 30 dias | O estado é 'Concluída' |

### TC-F14-11 — Teste de Homologação para validar a consulta de ocorrência concluída fora da lista padrão

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para manter o histórico acessível
- **PREPARAÇÃO:** ocorrência concluída
- **INPUTS ESPERADOS:** filtro de estado 'Concluída'
- **OUTPUTS ESPERADOS:** ocorrência fora da lista padrão e acessível pelo filtro

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity | A tela inicial do app é exibida |
| 2 | Abrir a lista sem filtros | A ocorrência concluída não aparece |
| 3 | Aplicar o filtro de estado 'Concluída' | A ocorrência concluída aparece e pode ser aberta |


## F15 — Acompanhar minhas ocorrências

### TC-F15-01 — Teste de Homologação para validar que o sistema pede login para acessar Minhas ocorrências

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para restringir a área pessoal
- **PREPARAÇÃO:** app sem usuário logado
- **INPUTS ESPERADOS:** toque em 'Minhas'
- **OUTPUTS ESPERADOS:** solicitação de login

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app sem login e tocar na aba 'Minhas' | O app solicita login |

### TC-F15-02 — Teste de Homologação para validar as abas de Minhas ocorrências

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para agrupar o que o usuário registrou e onde participa
- **PREPARAÇÃO:** usuário logado que registrou, é afetado e apoia ocorrências diferentes
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** abas com as ocorrências corretas

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a aba 'Minhas' | As abas 'Registradas por mim', 'Sou afetado' e 'Apoio' são exibidas |
| 3 | Navegar pelas três abas | Cada aba exibe as ocorrências correspondentes |

### TC-F15-03 — Teste de Homologação para validar a ordem das ocorrências em Minhas ocorrências

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para priorizar o que ainda está em andamento
- **PREPARAÇÃO:** usuário logado com ocorrências registradas abertas e concluídas
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** não concluídas primeiro

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a aba 'Registradas por mim' | A lista é exibida |
| 3 | Verificar a ordem | As não concluídas aparecem antes das concluídas |

### TC-F15-04 — Teste de Homologação para validar a remoção da ocorrência da aba Apoio ao retirar o apoio

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para manter as abas coerentes com a participação
- **PREPARAÇÃO:** usuário logado com apoio em ocorrência aberta
- **INPUTS ESPERADOS:** retirada do apoio
- **OUTPUTS ESPERADOS:** ocorrência fora da aba 'Apoio'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a ocorrência pela aba 'Apoio' e retirar o apoio | O apoio é retirado |
| 3 | Voltar à aba 'Apoio' | A ocorrência não aparece mais na aba |

### TC-F15-05 — Teste de Homologação para validar o indicador de novidade

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para sinalizar atividade nova desde a última visita
- **PREPARAÇÃO:** usuário logado afetado em ocorrência; outro usuário comenta após a última visita
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** indicador exibido e removido após a abertura

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a aba 'Sou afetado' | A ocorrência exibe o indicador de novidade |
| 3 | Abrir a ocorrência e voltar à aba | O indicador de novidade não é mais exibido |

### TC-F15-06 — Teste de Homologação para validar o estado vazio nas abas sem ocorrências

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para orientar o usuário sem participações
- **PREPARAÇÃO:** usuário logado sem ocorrências registradas nem participações
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** estado vazio com orientação

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Abrir a aba 'Minhas' | Cada aba exibe estado vazio com orientação para explorar ou registrar |


## F16 — Receber notificações push

### TC-F16-01 — Teste de Homologação para validar o pedido de permissão de notificação após a primeira participação

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para pedir permissão no momento com contexto
- **PREPARAÇÃO:** usuário logado em aparelho Android sem permissão de notificação definida
- **INPUTS ESPERADOS:** primeira participação
- **OUTPUTS ESPERADOS:** permissão não pedida na abertura e pedida após a participação

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir o app pela primeira vez com o usuário logado | Nenhum pedido de permissão de notificação é exibido |
| 2 | Marcar 'Também estou sendo afetado' em uma ocorrência | O pedido de permissão de notificação é exibido |

### TC-F16-02 — Teste de Homologação para validar a notificação de conclusão e reabertura

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para avisar participantes sobre mudança de estado
- **PREPARAÇÃO:** usuário A apoiador de ocorrência com notificações permitidas; usuário B autor
- **INPUTS ESPERADOS:** conclusão e reabertura da ocorrência
- **OUTPUTS ESPERADOS:** notificações recebidas pelo usuário A

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com o usuário B, concluir a ocorrência | O usuário A recebe notificação de ocorrência concluída |
| 2 | Com um afetado, reabrir a ocorrência | O usuário A recebe notificação de ocorrência reaberta |

### TC-F16-03 — Teste de Homologação para validar o agrupamento de notificações de comentários

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para evitar excesso de notificações
- **PREPARAÇÃO:** usuário A participante com notificações permitidas; outros usuários comentando
- **INPUTS ESPERADOS:** 3 comentários em 10 minutos
- **OUTPUTS ESPERADOS:** apenas 1 notificação agrupada em 30 minutos

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Publicar 3 comentários de outros usuários em 10 minutos | Os comentários são publicados |
| 2 | Verificar as notificações do usuário A | O usuário A recebe uma única notificação agrupada, como '3 novos comentários' |

### TC-F16-04 — Teste de Homologação para validar que o sistema não notifica o usuário sobre o próprio comentário

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para evitar notificação desnecessária
- **PREPARAÇÃO:** usuário A participante com notificações permitidas
- **INPUTS ESPERADOS:** comentário do próprio usuário A
- **OUTPUTS ESPERADOS:** nenhuma notificação para o usuário A

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com o usuário A, publicar um comentário | O comentário é publicado |
| 2 | Verificar as notificações do usuário A | Nenhuma notificação do próprio comentário é recebida |

### TC-F16-05 — Teste de Homologação para validar que o sistema não notifica ocorrência silenciada

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para respeitar o silenciamento por ocorrência
- **PREPARAÇÃO:** usuário A participante com a ocorrência silenciada
- **INPUTS ESPERADOS:** novo comentário de outro usuário
- **OUTPUTS ESPERADOS:** nenhuma notificação

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com o usuário A, silenciar a ocorrência | A ocorrência é marcada como silenciada |
| 2 | Publicar um comentário com outro usuário | O usuário A não recebe notificação |

### TC-F16-06 — Teste de Homologação para validar que o sistema não envia notificações com todas desligadas

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para respeitar a preferência global
- **PREPARAÇÃO:** usuário A participante com todas as notificações desligadas no perfil
- **INPUTS ESPERADOS:** conclusão de ocorrência
- **OUTPUTS ESPERADOS:** nenhuma notificação

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com o usuário A, desligar todas as notificações no perfil | A preferência é salva |
| 2 | Concluir uma ocorrência de que o usuário A participa | O usuário A não recebe notificação |

### TC-F16-07 — Teste de Homologação para validar a abertura da ocorrência ao tocar na notificação

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para levar o usuário direto ao contexto
- **PREPARAÇÃO:** notificação recebida no aparelho
- **INPUTS ESPERADOS:** toque na notificação
- **OUTPUTS ESPERADOS:** ocorrência aberta

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Tocar na notificação recebida | O app abre direto no detalhe da ocorrência correspondente |

### TC-F16-08 — Teste de Homologação para validar o funcionamento com permissão de notificação negada

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para não depender da notificação para o acompanhamento
- **PREPARAÇÃO:** usuário logado com permissão de notificação negada
- **INPUTS ESPERADOS:** novo comentário em ocorrência de que participa
- **OUTPUTS ESPERADOS:** app funcionando e indicador de novidade exibido

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app Colecity com um usuário logado | A tela inicial do app é exibida com o usuário logado |
| 2 | Com permissão negada, aguardar comentário de outro usuário | Nenhuma notificação é recebida e o app funciona normalmente |
| 3 | Abrir a aba 'Minhas' | A ocorrência exibe o indicador de novidade |


## F17 — Consultar linhas, trajeto e ônibus em tempo real

### TC-F17-01 — Teste de Homologação para validar a busca de linha por número ou nome

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para encontrar a linha desejada
- **PREPARAÇÃO:** dados de linhas da SPTrans carregados
- **INPUTS ESPERADOS:** termo '8700' e termo 'Continental'
- **OUTPUTS ESPERADOS:** linhas correspondentes exibidas

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e abrir a aba 'Transporte' | A tela de busca de linhas é exibida |
| 2 | Buscar o termo '8700' | As linhas correspondentes, incluindo 8700-10, são exibidas |
| 3 | Buscar o termo 'Continental' | As linhas com 'Continental' no nome são exibidas |

### TC-F17-02 — Teste de Homologação para validar o estado vazio para busca de linha sem resultado

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para orientar quando a linha não existe
- **PREPARAÇÃO:** nenhuma
- **INPUTS ESPERADOS:** termo 'zzzz'
- **OUTPUTS ESPERADOS:** estado vazio

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e abrir a aba 'Transporte' | A tela de busca de linhas é exibida |
| 2 | Buscar o termo 'zzzz' | É exibido estado vazio informando que nenhuma linha foi encontrada |

### TC-F17-03 — Teste de Homologação para validar a exibição do trajeto oficial da linha

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para mostrar o percurso da linha no mapa
- **PREPARAÇÃO:** dados de trajeto da SPTrans carregados
- **INPUTS ESPERADOS:** linha 8700-10, sentido 1
- **OUTPUTS ESPERADOS:** trajeto exibido no mapa

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e abrir a aba 'Transporte' | A tela de busca de linhas é exibida |
| 2 | Abrir a linha 8700-10 e escolher o sentido 1 | O trajeto oficial do sentido 1 é desenhado no mapa |
| 3 | Alternar para o sentido 2 | O trajeto do sentido 2 é exibido |

### TC-F17-04 — Teste de Homologação para validar a exibição dos ônibus informados pela SPTrans

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para mostrar posição oficial dos ônibus
- **PREPARAÇÃO:** serviço Olho Vivo disponível com veículos na linha
- **INPUTS ESPERADOS:** linha 8700-10
- **OUTPUTS ESPERADOS:** ônibus marcados como 'SPTrans'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e abrir a aba 'Transporte' | A tela de busca de linhas é exibida |
| 2 | Abrir a linha 8700-10 | O mapa da linha é exibido |
| 3 | Verificar os ônibus no mapa | Os ônibus são exibidos com a marcação 'SPTrans' |

### TC-F17-05 — Teste de Homologação para validar a exibição da posição relatada por passageiros

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para mostrar ônibus a partir de passageiros sem expor pessoas
- **PREPARAÇÃO:** passageiro com viagem ativa na linha 8700-10
- **INPUTS ESPERADOS:** linha 8700-10
- **OUTPUTS ESPERADOS:** posição marcada como 'Relatado por passageiros' sem dados pessoais

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e abrir a aba 'Transporte' | A tela de busca de linhas é exibida |
| 2 | Abrir a linha 8700-10 com outro usuário | O mapa da linha é exibido |
| 3 | Verificar a posição relatada | O ônibus aparece como 'Relatado por passageiros', sem nome nem trajeto individual |

### TC-F17-06 — Teste de Homologação para validar o funcionamento do transporte com a SPTrans indisponível

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para manter informação útil sem a fonte oficial
- **PREPARAÇÃO:** serviço Olho Vivo indisponível; passageiro com viagem ativa na linha
- **INPUTS ESPERADOS:** linha 8700-10
- **OUTPUTS ESPERADOS:** aviso exibido, trajeto e posições de passageiros mantidos

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e abrir a aba 'Transporte' | A tela de busca de linhas é exibida |
| 2 | Abrir a linha 8700-10 | O app exibe aviso de indisponibilidade da SPTrans |
| 3 | Verificar o mapa | O trajeto e as posições relatadas por passageiros continuam exibidos |


## F18 — Compartilhar viagem e confirmar desvio de rota

### TC-F18-01 — Teste de Homologação para validar que o sistema pede login para compartilhar viagem

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para impedir compartilhamento sem conta
- **PREPARAÇÃO:** app sem usuário logado
- **INPUTS ESPERADOS:** toque em 'Estou neste ônibus'
- **OUTPUTS ESPERADOS:** solicitação de login

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app sem login e abrir a linha 8700-10 | O mapa da linha é exibido |
| 2 | Tocar em 'Estou neste ônibus' | O app solicita login |

### TC-F18-02 — Teste de Homologação para validar o compartilhamento de viagem com envio de posição

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para enviar a posição do passageiro durante a viagem
- **PREPARAÇÃO:** usuário logado; localização permitida
- **INPUTS ESPERADOS:** toque em 'Estou neste ônibus'
- **OUTPUTS ESPERADOS:** viagem ativa e posição enviada a cada 1 minuto

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app com usuário logado e abrir a linha 8700-10 na aba 'Transporte' | O mapa da linha e o botão 'Estou neste ônibus' são exibidos |
| 2 | Tocar em 'Estou neste ônibus' e confirmar o sentido | A viagem é iniciada e o indicador de compartilhamento é exibido |
| 3 | Manter o app aberto por 3 minutos e consultar a linha com outro usuário | A posição relatada é atualizada a cada minuto |

### TC-F18-03 — Teste de Homologação para validar que o sistema não inicia viagem sem permissão de localização

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para explicar a necessidade da localização
- **PREPARAÇÃO:** usuário logado; localização negada
- **INPUTS ESPERADOS:** toque em 'Estou neste ônibus'
- **OUTPUTS ESPERADOS:** viagem não iniciada e motivo explicado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app com usuário logado e abrir a linha 8700-10 na aba 'Transporte' | O mapa da linha e o botão 'Estou neste ônibus' são exibidos |
| 2 | Tocar em 'Estou neste ônibus' e negar a localização | A viagem não é iniciada e o app explica que a localização é necessária |

### TC-F18-04 — Teste de Homologação para validar o encerramento da viagem anterior ao iniciar nova

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para manter uma viagem ativa por usuário
- **PREPARAÇÃO:** usuário logado com viagem ativa na linha 8700-10
- **INPUTS ESPERADOS:** nova viagem na linha 875A-10
- **OUTPUTS ESPERADOS:** viagem anterior encerrada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com a viagem ativa na 8700-10, abrir a linha 875A-10 e tocar em 'Estou neste ônibus' | A nova viagem é iniciada |
| 2 | Verificar a linha 8700-10 | A viagem anterior foi encerrada e não envia mais posição |

### TC-F18-05 — Teste de Homologação para validar o encerramento manual da viagem

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para parar o envio quando o passageiro desce
- **PREPARAÇÃO:** usuário logado com viagem ativa
- **INPUTS ESPERADOS:** toque em 'Encerrar viagem'
- **OUTPUTS ESPERADOS:** envio interrompido

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com a viagem ativa, tocar em 'Encerrar viagem' | O indicador de compartilhamento some |
| 2 | Consultar a linha com outro usuário após 2 minutos | A posição do passageiro não é mais atualizada |

### TC-F18-06 — Teste de Homologação para validar o encerramento automático da viagem

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para encerrar viagens esquecidas
- **PREPARAÇÃO:** usuário logado com viagem ativa; simulação de 2 horas de viagem e, em outro teste, 10 minutos parado fora do trajeto
- **INPUTS ESPERADOS:** tempo de viagem e posição simulada
- **OUTPUTS ESPERADOS:** viagem encerrada automaticamente nos dois casos

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Manter a viagem ativa por 2 horas | A viagem é encerrada automaticamente com aviso ao usuário |
| 2 | Iniciar nova viagem e permanecer parado fora do trajeto por 10 minutos | A viagem é encerrada automaticamente |

### TC-F18-07 — Teste de Homologação para validar a pergunta de desvio de rota

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para detectar ônibus fora do trajeto oficial
- **PREPARAÇÃO:** usuário logado com viagem ativa; simulação de posição a mais de 300 m do trajeto
- **INPUTS ESPERADOS:** posições fora do trajeto por mais de 2 minutos
- **OUTPUTS ESPERADOS:** pergunta 'O ônibus mudou de rota?'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com a viagem ativa, simular posições a mais de 300 m do trajeto por 3 minutos | As posições são enviadas |
| 2 | Verificar a tela do app | A pergunta 'O ônibus mudou de rota?' é exibida |

### TC-F18-08 — Teste de Homologação para validar o registro de desvio confirmado

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para transformar o desvio em ocorrência
- **PREPARAÇÃO:** pergunta de desvio exibida
- **INPUTS ESPERADOS:** resposta 'Sim'
- **OUTPUTS ESPERADOS:** ocorrência 'Alteração de rota sem aviso' com trecho e usuário afetado

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Responder 'Sim' à pergunta 'O ônibus mudou de rota?' | O app confirma o registro do desvio |
| 2 | Abrir a ocorrência da linha | A ocorrência 'Alteração de rota sem aviso' exibe o trecho desviado no mapa e o usuário como afetado |

### TC-F18-09 — Teste de Homologação para validar que o sistema não cria ocorrência quando o desvio não é confirmado

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para evitar ocorrência sem confirmação
- **PREPARAÇÃO:** pergunta de desvio exibida; nenhuma ocorrência de desvio na linha
- **INPUTS ESPERADOS:** resposta 'Não'
- **OUTPUTS ESPERADOS:** nenhuma ocorrência criada

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Responder 'Não' à pergunta 'O ônibus mudou de rota?' | A pergunta é fechada |
| 2 | Consultar as ocorrências da linha | Nenhuma ocorrência de alteração de rota foi criada |

### TC-F18-10 — Teste de Homologação para validar que o sistema não envia posição com o app em segundo plano

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para respeitar o uso apenas em primeiro plano
- **PREPARAÇÃO:** usuário logado com viagem ativa
- **INPUTS ESPERADOS:** app em segundo plano por 3 minutos
- **OUTPUTS ESPERADOS:** nenhuma posição enviada no período

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com a viagem ativa, colocar o app em segundo plano por 3 minutos | O app fica em segundo plano |
| 2 | Consultar a linha com outro usuário | A posição do passageiro não foi atualizada no período |


## F19 — Usar o app sem conexão

### TC-F19-01 — Teste de Homologação para validar a consulta offline das últimas ocorrências

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para manter a consulta sem internet
- **PREPARAÇÃO:** ocorrências carregadas anteriormente; aparelho em modo avião
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** últimas ocorrências exibidas com aviso offline

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir a lista de ocorrências com internet | As ocorrências são carregadas |
| 2 | Ativar o modo avião e reabrir o app | As últimas ocorrências carregadas são exibidas com o aviso 'Você está offline' |

### TC-F19-02 — Teste de Homologação para validar o registro de ação offline com status de pendência

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para não perder ações feitas sem internet
- **PREPARAÇÃO:** usuário logado; aparelho em modo avião
- **INPUTS ESPERADOS:** registro de ocorrência, participação e comentário
- **OUTPUTS ESPERADOS:** ações com status 'Aguardando envio'

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Com o modo avião ativo, registrar uma ocorrência | O registro aparece com status 'Aguardando envio' |
| 2 | Marcar participação e enviar um comentário em uma ocorrência carregada | As ações aparecem com status 'Aguardando envio' |

### TC-F19-03 — Teste de Homologação para validar a sincronização automática ao voltar a conexão

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para enviar as ações pendentes na ordem
- **PREPARAÇÃO:** ações pendentes registradas offline
- **INPUTS ESPERADOS:** desativação do modo avião
- **OUTPUTS ESPERADOS:** ações enviadas na ordem em que foram feitas

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Desativar o modo avião | O app detecta a conexão |
| 2 | Verificar as ações pendentes | As ações são enviadas na ordem em que foram feitas e o status 'Aguardando envio' some |

### TC-F19-04 — Teste de Homologação para validar que o sistema não duplica ação reenviada

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para garantir envio único após falha
- **PREPARAÇÃO:** ação pendente; conexão interrompida durante o envio
- **INPUTS ESPERADOS:** reenvio automático
- **OUTPUTS ESPERADOS:** ação registrada uma única vez

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Iniciar o envio de uma ação pendente e interromper a conexão durante o envio | O envio falha e a ação continua pendente |
| 2 | Restabelecer a conexão | A ação é reenviada |
| 3 | Verificar o resultado | A ação aparece registrada uma única vez |

### TC-F19-05 — Teste de Homologação para validar a mensagem compreensível em erro de envio

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para orientar o usuário em falhas
- **PREPARAÇÃO:** usuário logado; falha simulada no envio de foto
- **INPUTS ESPERADOS:** envio de comentário com foto
- **OUTPUTS ESPERADOS:** mensagem sem código técnico com opção de tentar novamente

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Enviar um comentário com foto durante a falha simulada | O envio falha |
| 2 | Verificar a mensagem | Uma mensagem compreensível, sem código técnico, é exibida com a opção 'Tentar novamente' |


## F20 — Garantir privacidade, transparência e acessibilidade

### TC-F20-01 — Teste de Homologação para validar o acesso aos termos e à política de privacidade sem login

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para garantir transparência a qualquer pessoa
- **PREPARAÇÃO:** app sem usuário logado
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** termos e política exibidos

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app sem login e abrir 'Sobre' | A tela 'Sobre' é exibida |
| 2 | Abrir os termos de uso e a política de privacidade | Os dois documentos são exibidos |

### TC-F20-02 — Teste de Homologação para validar o aviso de que o Colecity não é canal oficial

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para deixar claros os limites da plataforma
- **PREPARAÇÃO:** nenhuma
- **INPUTS ESPERADOS:** nenhum
- **OUTPUTS ESPERADOS:** aviso exibido

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Acessar o app e abrir 'Sobre' | A tela 'Sobre' exibe 'O Colecity não é um canal oficial da Prefeitura e não encaminha manifestações a órgãos públicos.' |

### TC-F20-03 — Teste de Homologação para validar que o sistema não pede localização antes do uso

- **OBJETIVO:** teste negativo, funcional, caixa-preta, para pedir a localização só quando necessária
- **PREPARAÇÃO:** app recém-instalado
- **INPUTS ESPERADOS:** navegação pela lista e detalhes
- **OUTPUTS ESPERADOS:** nenhum pedido de localização

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir o app recém-instalado e navegar pela lista e por detalhes de ocorrências | Nenhum pedido de permissão de localização é exibido |
| 2 | Tocar em 'Registrar' com usuário logado | O pedido de permissão de localização é exibido nesse momento |

### TC-F20-04 — Teste de Homologação para validar o uso do app com leitor de tela

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para garantir acessibilidade a pessoas com deficiência visual
- **PREPARAÇÃO:** TalkBack ativado no aparelho
- **INPUTS ESPERADOS:** navegação pelas telas principais
- **OUTPUTS ESPERADOS:** botões, ícones e imagens anunciados com rótulo

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Ativar o TalkBack e abrir o app | O leitor anuncia a tela inicial |
| 2 | Navegar pela lista, detalhe, registro e perfil | Todos os botões, ícones e imagens são anunciados com rótulo compreensível |

### TC-F20-05 — Teste de Homologação para validar o uso do app com fonte ampliada

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para respeitar o tamanho de fonte do sistema
- **PREPARAÇÃO:** fonte do sistema no tamanho máximo
- **INPUTS ESPERADOS:** navegação pelas telas principais
- **OUTPUTS ESPERADOS:** textos ampliados sem corte de conteúdo essencial

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Aumentar a fonte do sistema ao máximo e abrir o app | Os textos do app aparecem ampliados |
| 2 | Navegar pela lista, detalhe, registro e perfil | Nenhum conteúdo essencial é cortado |

### TC-F20-06 — Teste de Homologação para validar a alternância e persistência do tema claro e escuro

- **OBJETIVO:** teste positivo, funcional, caixa-preta, para permitir preferência visual
- **PREPARAÇÃO:** nenhuma
- **INPUTS ESPERADOS:** tema escuro
- **OUTPUTS ESPERADOS:** tema aplicado em todas as telas e mantido ao reabrir

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir o perfil e selecionar o tema escuro | O tema escuro é aplicado |
| 2 | Navegar pelas telas principais | Todas as telas usam o tema escuro |
| 3 | Fechar e reabrir o app | O tema escuro é mantido |
