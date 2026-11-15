import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/feedback/EmptyState';
import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/CustomButton';
import { CustomInput } from '@/components/ui/CustomInput';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useAuth } from '@/hooks/useAuth';
import { ehErroApi, mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';
import { emailValido } from '@/utils/validacoes';

/** Recuperação de senha (RN-CON-09): a resposta é sempre a mesma, exista ou não o e-mail. */
export default function RecuperarSenhaScreen() {
  const router = useRouter();
  const { recuperarSenha } = useAuth();

  const [email, setEmail] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const aoEnviar = async () => {
    if (!emailValido(email)) {
      setErro('Informe um e-mail válido.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await recuperarSenha(email);
      setEnviado(true);
    } catch (falha) {
      // Só falhas de conexão/servidor chegam aqui; nunca "e-mail não encontrado".
      if (ehErroApi(falha) && (falha.offline || falha.status === 429 || falha.status >= 500)) {
        setErro(mensagemDeErro(falha));
      } else {
        setEnviado(true);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScreenScroll titulo="Recuperar senha" aoVoltar={() => router.back()} evitarTeclado>
      {enviado ? (
        <EmptyState
          icone="mail-unread-outline"
          titulo="Confira seu e-mail"
          descricao="Se o e-mail existir, enviaremos instruções para criar uma nova senha."
          rotuloAcao="Voltar para o login"
          aoAgir={() => router.back()}
        />
      ) : (
        <View style={styles.formulario}>
          <AppText variante="subtitulo" cor="textoSecundario">
            Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
          </AppText>
          <CustomInput
            rotulo="E-mail"
            icone="mail-outline"
            value={email}
            onChangeText={setEmail}
            erro={erro}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={() => void aoEnviar()}
            editable={!enviando}
          />
          <CustomButton titulo="Enviar instruções" onPress={() => void aoEnviar()} carregando={enviando} />
        </View>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: espacos.md },
});
