import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/feedback/EmptyState';
import { Loading } from '@/components/feedback/Loading';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useAuth } from '@/hooks/useAuth';
import { espacos, type NomeIcone } from '@/theme';

export interface ConviteLoginProps {
  /** Por que entrar (ex.: "Entre para registrar uma ocorrência."). */
  descricao: string;
  icone?: NomeIcone;
}

/** Convite "Entre para continuar", usado nas áreas que exigem conta. */
export function ConviteLogin({ descricao, icone = 'person-circle-outline' }: ConviteLoginProps) {
  const router = useRouter();
  return (
    <View style={styles.convite}>
      <EmptyState
        icone={icone}
        titulo="Entre para continuar"
        descricao={descricao}
        rotuloAcao="Entrar"
        iconeAcao="log-in-outline"
        aoAgir={() => router.push('/login')}
        rotuloAcaoSecundaria="Criar conta"
        aoAgirSecundaria={() => router.push('/cadastro')}
      />
    </View>
  );
}

export interface AuthGateProps extends ConviteLoginProps {
  /** Título da tela mostrado enquanto o visitante não entra. */
  titulo: string;
  comTabBar?: boolean;
  children: ReactNode;
}

/**
 * Protege uma tela inteira: visitante vê o convite de login; com sessão, vê o conteúdo.
 * Explorar e Transporte (consulta) ficam fora, pois são abertos a visitantes.
 */
export function AuthGate({ titulo, comTabBar = false, descricao, icone, children }: AuthGateProps) {
  const { usuario, carregando } = useAuth();

  if (usuario) return <>{children}</>;

  return (
    <ScreenScroll titulo={titulo} comTabBar={comTabBar}>
      {carregando ? <Loading /> : <ConviteLogin descricao={descricao} icone={icone} />}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  convite: { marginTop: -espacos.lg },
});
