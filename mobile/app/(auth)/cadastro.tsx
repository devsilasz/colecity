import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Checkbox } from '@/components/ui/Checkbox';
import { CustomButton } from '@/components/ui/CustomButton';
import { CustomInput } from '@/components/ui/CustomInput';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useSairDoLogin } from '@/hooks/useSairDoLogin';
import { ehErroApi, mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';
import { VERSAO_TERMOS } from '@/types/usuario';
import { emailValido, nomeValido, senhaValida } from '@/utils/validacoes';

interface Erros {
  nome?: string;
  email?: string;
  senha?: string;
  aceite?: string;
  geral?: string;
}

/** Cadastro com e-mail e senha (RN-CON-01 a 03). */
export default function CadastroScreen() {
  const router = useRouter();
  const fechar = useSairDoLogin();
  const { cadastrar } = useAuth();
  const { mostrarToast } = useToast();
  const campoEmail = useRef<ComponentRef<typeof TextInput>>(null);
  const campoSenha = useRef<ComponentRef<typeof TextInput>>(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceite, setAceite] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);

  const aoCadastrar = async () => {
    const novos: Erros = {};
    if (!nomeValido(nome)) novos.nome = 'Informe um nome com 2 a 80 caracteres.';
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido.';
    if (!senhaValida(senha)) novos.senha = 'A senha deve ter no mínimo 8 caracteres, com letras e números.';
    if (!aceite) novos.aceite = 'Aceite os termos de uso e a política de privacidade para continuar.';
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      await cadastrar({ nome, email, senha, aceiteTermosVersao: VERSAO_TERMOS });
      mostrarToast('Conta criada. Boas-vindas ao Colecity!', 'sucesso');
      fechar();
    } catch (erro) {
      const mensagem = mensagemDeErro(erro);
      const code = ehErroApi(erro) ? erro.code : null;
      if (code === 'EMAIL_JA_CADASTRADO' || code === 'EMAIL_INVALIDO') setErros({ email: mensagem });
      else if (code === 'SENHA_FRACA') setErros({ senha: mensagem });
      else if (code === 'NOME_INVALIDO') setErros({ nome: mensagem });
      else setErros({ geral: mensagem });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScreenScroll titulo="Criar conta" subtitulo="Leva menos de um minuto" aoVoltar={fechar} evitarTeclado>
      <View style={styles.formulario}>
        <CustomInput
          rotulo="Nome"
          obrigatorio
          icone="person-outline"
          value={nome}
          onChangeText={setNome}
          erro={erros.nome}
          ajuda="É o nome que aparece para outras pessoas."
          maxLength={80}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => campoEmail.current?.focus()}
          editable={!enviando}
        />
        <CustomInput
          ref={campoEmail}
          rotulo="E-mail"
          obrigatorio
          icone="mail-outline"
          value={email}
          onChangeText={setEmail}
          erro={erros.email}
          ajuda="Nunca é exibido para outras pessoas."
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => campoSenha.current?.focus()}
          editable={!enviando}
        />
        <CustomInput
          ref={campoSenha}
          rotulo="Senha"
          obrigatorio
          icone="lock-closed-outline"
          senha
          value={senha}
          onChangeText={setSenha}
          erro={erros.senha}
          ajuda="Mínimo de 8 caracteres, com letras e números."
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          editable={!enviando}
        />

        <Checkbox
          rotulo="Li e aceito os termos de uso e a política de privacidade"
          marcado={aceite}
          aoMudar={setAceite}
          erro={erros.aceite}
          disabled={enviando}
        />
        <CustomButton
          titulo="Ler os termos e a política"
          variante="texto"
          tamanho="medio"
          larguraTotal={false}
          onPress={() => router.push('/termos')}
        />

        {erros.geral ? (
          <AppText variante="subtitulo" cor="perigo" accessibilityRole="alert" accessibilityLiveRegion="polite">
            {erros.geral}
          </AppText>
        ) : null}

        <CustomButton titulo="Criar conta" onPress={() => void aoCadastrar()} carregando={enviando} />
        <CustomButton
          titulo="Já tenho conta"
          variante="texto"
          tamanho="medio"
          onPress={() => router.replace('/login')}
          disabled={enviando}
        />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: espacos.sm },
});
