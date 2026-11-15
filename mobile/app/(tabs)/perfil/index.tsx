import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConviteLogin } from '@/components/auth/AuthGate';
import { Loading } from '@/components/feedback/Loading';
import { AparenciaSection } from '@/components/perfil/AparenciaSection';
import { ExcluirContaDialog } from '@/components/perfil/ExcluirContaDialog';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ListRow, ToggleRow } from '@/components/ui/ListRow';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { env } from '@/config/env';
import { useTema } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useNotificacoesAtivas } from '@/hooks/useNotificacoesAtivas';
import { mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';

function descricaoNotificacoes(): string {
  if (env.recursos.push) return 'Avisos sobre as ocorrências que você registrou, afetam você ou apoia.';
  // RN-NOT: push só no Android e fora do Expo Go; a preferência fica salva mesmo assim.
  return 'O envio funciona no aplicativo Android instalado por APK. Sua preferência fica salva.';
}

export default function PerfilScreen() {
  const router = useRouter();
  const { cores } = useTema();
  const { mostrarToast } = useToast();
  const { usuario, carregando, temSenha, sair } = useAuth();
  const notificacoes = useNotificacoesAtivas(usuario?.uid ?? null);

  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const aoSair = async () => {
    setSaindo(true);
    try {
      await sair();
      setConfirmandoSaida(false);
      mostrarToast('Você saiu da sua conta.');
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setSaindo(false);
    }
  };

  return (
    <ScreenScroll titulo="Perfil" comTabBar>
      {carregando ? (
        <Loading />
      ) : usuario ? (
        <>
          <Card style={styles.identidade}>
            <View
              style={[styles.avatar, { backgroundColor: cores.primariaSuave }]}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden>
              <AppText variante="titulo2" cor="primaria">
                {usuario.nome.trim().charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variante="titulo3" numberOfLines={2}>
                {usuario.nome}
              </AppText>
              <AppText variante="subtitulo" cor="textoSecundario" numberOfLines={1}>
                {usuario.email}
              </AppText>
            </View>
          </Card>

          <SectionTitle>Conta</SectionTitle>
          <Card semPadding>
            <ListRow
              icone="person-outline"
              titulo="Dados da conta"
              descricao={temSenha ? 'Nome, e-mail e senha' : 'Nome e definição de senha'}
              onPress={() => router.push('/perfil/conta')}
              divisor
            />
            <ToggleRow
              icone="notifications-outline"
              titulo="Notificações"
              descricao={descricaoNotificacoes()}
              valor={notificacoes.ativas}
              aoMudar={notificacoes.definir}
              disabled={notificacoes.carregando}
            />
          </Card>
        </>
      ) : (
        <Card>
          <ConviteLogin descricao="Crie sua conta ou entre para registrar, participar e acompanhar ocorrências." />
        </Card>
      )}

      <AparenciaSection />

      <SectionTitle>Informações</SectionTitle>
      <Card semPadding>
        <ListRow
          icone="information-circle-outline"
          titulo="Sobre o Colecity"
          onPress={() => router.push('/perfil/sobre')}
          divisor
        />
        <ListRow
          icone="document-text-outline"
          titulo="Termos de uso e privacidade"
          onPress={() => router.push('/termos')}
        />
      </Card>

      {usuario ? (
        <Card semPadding>
          <ListRow
            icone="log-out-outline"
            titulo="Sair"
            seta={false}
            onPress={() => setConfirmandoSaida(true)}
            divisor
          />
          <ListRow
            icone="trash-outline"
            titulo="Excluir conta"
            descricao="Apaga seus dados de forma imediata e definitiva."
            cor="perigo"
            seta={false}
            onPress={() => setExcluindo(true)}
          />
        </Card>
      ) : null}

      <ConfirmDialog
        visivel={confirmandoSaida}
        icone="log-out-outline"
        titulo="Sair da conta?"
        mensagem="Ações que ainda aguardam envio neste aparelho serão descartadas."
        rotuloConfirmar="Sair"
        aoConfirmar={() => void aoSair()}
        aoCancelar={() => setConfirmandoSaida(false)}
        carregando={saindo}
      />

      <ExcluirContaDialog visivel={excluindo} aoFechar={() => setExcluindo(false)} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  identidade: { flexDirection: 'row', alignItems: 'center', gap: espacos.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: espacos.xxs },
});
