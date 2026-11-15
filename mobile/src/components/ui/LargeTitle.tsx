import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { espacos } from '@/theme';

import { AppText } from './AppText';

export interface LargeTitleProps {
  titulo: string;
  subtitulo?: string;
  scrollY?: SharedValue<number>;
}

/** Título grande no topo do conteúdo rolável: encolhe e some ao rolar (estilo large title). */
export function LargeTitle({ titulo, subtitulo, scrollY }: LargeTitleProps) {
  const estilo = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return {
      opacity: interpolate(scrollY.value, [0, 44], [1, 0], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(scrollY.value, [-80, 0, 60], [1.08, 1, 0.9], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.raiz, estilo]}>
      <AppText variante="tituloGrande">{titulo}</AppText>
      {subtitulo ? (
        <AppText variante="subtitulo" cor="textoSecundario" style={styles.subtitulo}>
          {subtitulo}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    paddingTop: espacos.sm,
    paddingBottom: espacos.lg,
    transformOrigin: 'left center',
  },
  subtitulo: { marginTop: espacos.xs },
});
