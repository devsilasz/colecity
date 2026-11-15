import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALTURA_CABECALHO, ALTURA_TAB_BAR, espacos, MARGEM_TAB_BAR } from '@/theme';

/** Posição de rolagem compartilhada entre a lista e o cabeçalho de vidro. */
export function useCabecalhoRolavel() {
  const scrollY = useSharedValue(0);
  const aoRolar = useAnimatedScrollHandler((evento) => {
    scrollY.value = evento.contentOffset.y;
  });
  return { scrollY, aoRolar };
}

/** Recuos para o conteúdo não ficar atrás do cabeçalho e da tab bar flutuantes. */
export function useEspacosTela(opcoes: { comTabBar?: boolean } = {}) {
  const insets = useSafeAreaInsets();
  const topo = insets.top + ALTURA_CABECALHO;
  const base = opcoes.comTabBar
    ? insets.bottom + ALTURA_TAB_BAR + MARGEM_TAB_BAR * 2 + espacos.lg
    : insets.bottom + espacos.xxl;
  return { topo, base, insets };
}
