import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { CustomInput } from '@/components/ui/CustomInput';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { env } from '@/config/env';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useSairDoLogin } from '@/hooks/useSairDoLogin';
import { CONTA_DEMO } from '@/mocks/usuarios';
import { ehErroApi, mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';
import { VERSAO_TERMOS } from '@/types/usuario';
import { emailValido } from '@/utils/validacoes';

interface ContaGoogle {
  nome: string;
  email: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const fechar = useSairDoLogin();
  const { entrar, entrarComGoogle } = useAuth();
  const { mostrarToast } = useToast();
  const campoSenha = useRef<ComponentRef<typeof TextInput>>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviandoGoogle, setEnviandoGoogle] = useState(false);

  // RN-CON-11: primeiro login com Google pede o aceite dos termos.
  const [contaGoogle, setContaGoogle] = useState<ContaGoogle | null>(null);
  const [aceite, setAceite] = useState(false);

  const ocupado = enviando || enviandoGoogle;

  const aoEntrar = async () => {
    const emailOk = emailValido(email);
    setErroEmail(emailOk ? null : 'Informe um e-mail válido.');
    setErroSenha(senha ? null : 'Informe sua senha.');
    setErroGeral(null);
    if (!emailOk || !senha) return;

    setEnviando(true);
    try {
      await entrar(email, senha);
      mostrarToast('Você entrou na sua conta.', 'sucesso');
      fechar();
    } catch (erro) {
      // RN-CON-04: mensagem genérica, sem indicar o campo errado.
      setErroGeral(mensagemDeErro(erro));
    } finally {
      setEnviando(false);
    }
  };

  const aoEntrarComGoogle = async (aceiteVersao?: string) => {
    setErroGeral(null);
    setEnviandoGoogle(true);
    try {
      const resultado = await entrarComGoogle(aceiteVersao);
      if (resultado.tipo === 'ACEITE_NECESSARIO') {
        setAceite(false);
        setContaGoogle({ nome: resultado.nome, email: resultado.email });
        return;
      }
      setContaGoogle(null);
      mostrarToast('Você entrou com Google.', 'sucesso');
      fechar();
    } catch (erro) {
      setContaGoogle(null);
      // Fechar a escolha de conta do Google não é erro.
      if (ehErroApi(erro) && erro.code === 'LOGIN_CANCELADO') return;
      setErroGeral(
        ehErroApi(erro) && erro.code === 'RECURSO_INDISPONIVEL'
          ? 'Entrar com Google estará disponível na versão instalada por APK. Por enquanto, use e-mail e senha.'
          : mensagemDeErro(erro),
      );
    } finally {
      setEnviandoGoogle(false);
    }
  };

  return (
    <ScreenScroll titulo="Entrar" subtitulo="Acesse sua conta do Colecity" aoVoltar={fechar} evitarTeclado>
      {env.usarMock ? (
        <Card style={styles.demo}>
          <AppText variante="notaForte" cor="textoSecundario">
            CONTA DE DEMONSTRAÇÃO
          </AppText>
          <AppText variante="subtitulo">
            {CONTA_DEMO.email} · senha {CONTA_DEMO.senha}
          </AppText>
          <CustomButton
            titulo="Preencher"
            variante="tonal"
            tamanho="medio"
            larguraTotal={false}
            rotuloAcessivel="Preencher com a conta de demonstração"
            onPress={() => {
              setEmail(CONTA_DEMO.email);
              setSenha(CONTA_DEMO.senha);
              setErroEmail(null);
              setErroSenha(null);
            }}
          />
        </Card>
      ) : null}

      <View style={styles.formulario}>
        <CustomInput
          rotulo="E-mail"
          icone="mail-outline"
          value={email}
          onChangeText={setEmail}
          erro={erroEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => campoSenha.current?.focus()}
          editable={!ocupado}
        />
        <CustomInput
          ref={campoSenha}
          rotulo="Senha"
          icone="lock-closed-outline"
          senha
          value={senha}
          onChangeText={setSenha}
          erro={erroSenha}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void aoEntrar()}
          editable={!ocupado}
        />

        {erroGeral ? (
          <AppText variante="subtitulo" cor="perigo" accessibilityRole="alert" accessibilityLiveRegion="polite">
            {erroGeral}
          </AppText>
        ) : null}

        <CustomButton
          titulo="Entrar"
          onPress={() => void aoEntrar()}
          carregando={enviando}
          disabled={enviandoGoogle}
        />
        <CustomButton
          titulo="Esqueci a senha"
          variante="texto"
          tamanho="medio"
          onPress={() => router.push('/recuperar-senha')}
          disabled={ocupado}
        />
      </View>

      <View style={styles.formulario}>
        <CustomButton
          titulo="Entrar com Google"
          variante="contorno"
          icone="logo-google"
          onPress={() => void aoEntrarComGoogle()}
          carregando={enviandoGoogle && !contaGoogle}
          disabled={enviando}
        />
        <CustomButton
          titulo="Criar conta"
          variante="tonal"
          onPress={() => router.replace('/cadastro')}
          disabled={ocupado}
        />
        <CustomButton
          titulo="Termos de uso e privacidade"
          variante="texto"
          tamanho="medio"
          onPress={() => router.push('/termos')}
        />
      </View>

      <ConfirmDialog
        visivel={contaGoogle !== null}
        icone="logo-google"
        titulo="Criar conta com Google"
        mensagem={
          contaGoogle
            ? `Você vai criar a conta de ${contaGoogle.nome} (${contaGoogle.email}). O nome pode ser alterado depois no Perfil.`
            : ''
        }
        rotuloConfirmar="Aceitar e continuar"
        aoConfirmar={() => void aoEntrarComGoogle(VERSAO_TERMOS)}
        aoCancelar={() => setContaGoogle(null)}
        carregando={enviandoGoogle}
        confirmarDesabilitado={!aceite}>
        <Checkbox
          rotulo="Li e aceito os termos de uso e a política de privacidade"
          marcado={aceite}
          aoMudar={setAceite}
          disabled={enviandoGoogle}
        />
        <CustomButton
          titulo="Ler os termos"
          variante="texto"
          tamanho="medio"
          disabled={enviandoGoogle}
          onPress={() => {
            setContaGoogle(null);
            router.push('/termos');
          }}
        />
      </ConfirmDialog>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  demo: { gap: espacos.sm },
  formulario: { gap: espacos.sm },
});
