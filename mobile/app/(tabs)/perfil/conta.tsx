import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthGate } from '@/components/auth/AuthGate';
import { Card } from '@/components/ui/Card';
import { CustomButton } from '@/components/ui/CustomButton';
import { CustomInput } from '@/components/ui/CustomInput';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { ehErroApi, mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';
import type { UsuarioAuth } from '@/types/usuario';
import { emailValido, nomeValido, senhaValida } from '@/utils/validacoes';

const ERRO_SENHA_FRACA = 'A senha deve ter no mínimo 8 caracteres, com letras e números.';

function CartaoNome({ usuario }: { usuario: UsuarioAuth }) {
  const { atualizarNome } = useAuth();
  const { mostrarToast } = useToast();
  const [nome, setNome] = useState(usuario.nome);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!nomeValido(nome)) {
      setErro('Informe um nome com 2 a 80 caracteres.');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      await atualizarNome(nome);
      mostrarToast('Nome atualizado.', 'sucesso');
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card style={styles.cartao}>
      <CustomInput
        rotulo="Nome"
        value={nome}
        onChangeText={setNome}
        erro={erro}
        ajuda="É o nome que aparece para outras pessoas."
        maxLength={80}
        autoCapitalize="words"
        autoComplete="name"
        editable={!salvando}
      />
      <CustomButton
        titulo="Salvar nome"
        variante="tonal"
        onPress={() => void salvar()}
        carregando={salvando}
        disabled={nome.trim() === usuario.nome}
      />
    </Card>
  );
}

function CartaoEmail({ usuario, temSenha }: { usuario: UsuarioAuth; temSenha: boolean }) {
  const { alterarEmail } = useAuth();
  const { mostrarToast } = useToast();
  const [email, setEmail] = useState(usuario.email);
  const [senha, setSenha] = useState('');
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // RN-CON-14: em conta só com Google o e-mail é o do Google.
  if (!temSenha) {
    return (
      <Card style={styles.cartao}>
        <CustomInput
          rotulo="E-mail"
          value={usuario.email}
          editable={false}
          ajuda="Esta conta usa o e-mail do Google, que não pode ser alterado aqui."
        />
      </Card>
    );
  }

  const mudou = email.trim().toLowerCase() !== usuario.email;

  const salvar = async () => {
    const emailOk = emailValido(email);
    setErroEmail(emailOk ? null : 'Informe um e-mail válido.');
    setErroSenha(senha ? null : 'Informe sua senha atual para trocar o e-mail.');
    if (!emailOk || !senha) return;

    setSalvando(true);
    try {
      await alterarEmail(email, senha);
      setSenha('');
      mostrarToast('E-mail atualizado.', 'sucesso');
    } catch (falha) {
      const mensagem = mensagemDeErro(falha);
      if (ehErroApi(falha) && falha.code === 'SENHA_INCORRETA') setErroSenha(mensagem);
      else setErroEmail(mensagem);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card style={styles.cartao}>
      <CustomInput
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        erro={erroEmail}
        ajuda="Nunca é exibido para outras pessoas."
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        editable={!salvando}
      />
      {mudou ? (
        <CustomInput
          rotulo="Senha atual"
          senha
          value={senha}
          onChangeText={setSenha}
          erro={erroSenha}
          ajuda="Necessária para trocar o e-mail."
          autoCapitalize="none"
          autoComplete="current-password"
          editable={!salvando}
        />
      ) : null}
      <CustomButton
        titulo="Salvar e-mail"
        variante="tonal"
        onPress={() => void salvar()}
        carregando={salvando}
        disabled={!mudou}
      />
    </Card>
  );
}

function CartaoSenha({ temSenha }: { temSenha: boolean }) {
  const { alterarSenha, definirSenha } = useAuth();
  const { mostrarToast } = useToast();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [erroAtual, setErroAtual] = useState<string | null>(null);
  const [erroNova, setErroNova] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const atualOk = !temSenha || atual.length > 0;
    const novaOk = senhaValida(nova);
    setErroAtual(atualOk ? null : 'Informe sua senha atual.');
    setErroNova(novaOk ? null : ERRO_SENHA_FRACA);
    if (!atualOk || !novaOk) return;

    setSalvando(true);
    try {
      if (temSenha) await alterarSenha(atual, nova);
      else await definirSenha(nova);
      setAtual('');
      setNova('');
      mostrarToast(temSenha ? 'Senha alterada.' : 'Senha definida. Agora você também pode entrar com e-mail e senha.', 'sucesso');
    } catch (falha) {
      const mensagem = mensagemDeErro(falha);
      if (ehErroApi(falha) && falha.code === 'SENHA_INCORRETA') setErroAtual(mensagem);
      else setErroNova(mensagem);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card style={styles.cartao}>
      {temSenha ? (
        <CustomInput
          rotulo="Senha atual"
          senha
          value={atual}
          onChangeText={setAtual}
          erro={erroAtual}
          autoCapitalize="none"
          autoComplete="current-password"
          editable={!salvando}
        />
      ) : null}
      <CustomInput
        rotulo="Nova senha"
        senha
        value={nova}
        onChangeText={setNova}
        erro={erroNova}
        ajuda={
          temSenha
            ? 'Mínimo de 8 caracteres, com letras e números.'
            : 'Sua conta foi criada com Google e ainda não tem senha. Mínimo de 8 caracteres, com letras e números.'
        }
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!salvando}
      />
      <CustomButton
        titulo={temSenha ? 'Alterar senha' : 'Definir senha'}
        variante="tonal"
        onPress={() => void salvar()}
        carregando={salvando}
        disabled={nova.length === 0}
      />
    </Card>
  );
}

/** Dados da conta: nome, e-mail e senha (RN-CON-07, 13, 14). */
export default function ContaScreen() {
  const router = useRouter();
  const { usuario, temSenha } = useAuth();

  return (
    <AuthGate titulo="Dados da conta" descricao="Entre para ver e alterar os dados da sua conta.">
      {usuario ? (
        <ScreenScroll titulo="Dados da conta" aoVoltar={() => router.back()} evitarTeclado>
          <SectionTitle>Nome</SectionTitle>
          <CartaoNome usuario={usuario} />

          <SectionTitle>E-mail</SectionTitle>
          {/* A `key` recria o cartão quando a conta passa a ter senha ou o e-mail muda. */}
          <CartaoEmail key={`${usuario.email}-${String(temSenha)}`} usuario={usuario} temSenha={temSenha} />

          <SectionTitle>Senha</SectionTitle>
          <CartaoSenha key={String(temSenha)} temSenha={temSenha} />
        </ScreenScroll>
      ) : null}
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  cartao: { gap: espacos.sm },
});
