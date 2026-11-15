import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, type RefreshControlProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useCabecalhoRolavel, useEspacosTela } from '@/hooks/useCabecalhoRolavel';
import { espacos } from '@/theme';

import { LargeTitle } from './LargeTitle';
import { Screen } from './Screen';
import { ScreenHeader } from './ScreenHeader';

export interface ScreenScrollProps {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  aoVoltar?: () => void;
  direita?: ReactNode;
  /** Tela raiz de aba: reserva espaço para a tab bar flutuante. */
  comTabBar?: boolean;
  /** Barra de vidro fixa no rodapé (ações). */
  rodape?: ReactNode;
  /** Espaço extra no fim do conteúdo quando há `rodape`. */
  alturaRodape?: number;
  refreshControl?: ReactElement<RefreshControlProps>;
  evitarTeclado?: boolean;
}

/** Tela rolável padrão: título grande que encolhe + cabeçalho de vidro. */
export function ScreenScroll({
  titulo,
  subtitulo,
  children,
  aoVoltar,
  direita,
  comTabBar = false,
  rodape,
  alturaRodape = 0,
  refreshControl,
  evitarTeclado = false,
}: ScreenScrollProps) {
  const { scrollY, aoRolar } = useCabecalhoRolavel();
  const { topo, base } = useEspacosTela({ comTabBar });

  return (
    <Screen
      evitarTeclado={evitarTeclado}
      sobreposicao={
        <>
          <ScreenHeader titulo={titulo} scrollY={scrollY} aoVoltar={aoVoltar} direita={direita} />
          {rodape}
        </>
      }>
      <Animated.ScrollView
        onScroll={aoRolar}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: topo, paddingBottom: base + alturaRodape },
        ]}>
        <LargeTitle titulo={titulo} subtitulo={subtitulo} scrollY={scrollY} />
        {children}
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  conteudo: { paddingHorizontal: espacos.lg, gap: espacos.lg },
});
