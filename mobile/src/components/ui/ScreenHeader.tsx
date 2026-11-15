import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTema } from '@/context/ThemeContext';
import { ALTURA_CABECALHO, espacos, TOQUE_MINIMO } from '@/theme';

import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';
import { IconButton } from './IconButton';

export interface ScreenHeaderProps {
  titulo: string;
  /** Com rolagem: o vidro e o título compacto surgem conforme o título grande some. */
  scrollY?: SharedValue<number>;
  aoVoltar?: () => void;
  direita?: ReactNode;
}

/** Barra de cabeçalho em vidro, fixa no topo. Use dentro de `Screen.sobreposicao`. */
export function ScreenHeader({ titulo, scrollY, aoVoltar, direita }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { cores } = useTema();

  const estiloSurgir = useAnimatedStyle(() => ({
    opacity: scrollY ? interpolate(scrollY.value, [12, 44], [0, 1], Extrapolation.CLAMP) : 1,
  }));

  return (
    <View style={[styles.raiz, { height: insets.top + ALTURA_CABECALHO }]}>
      <Animated.View style={[StyleSheet.absoluteFill, estiloSurgir]}>
        <GlassSurface raio={0} borda={false} intensidade="espessa" style={StyleSheet.absoluteFill} />
        <View style={[styles.linha, { backgroundColor: cores.divisor }]} />
      </Animated.View>

      <View style={[styles.barra, { marginTop: insets.top }]}>
        <View style={styles.lado}>
          {aoVoltar ? (
            <IconButton icone="chevron-back" rotulo="Voltar" onPress={aoVoltar} />
          ) : null}
        </View>
        <Animated.View style={[styles.centro, estiloSurgir]}>
          <AppText variante="destaque" numberOfLines={1} accessibilityRole="header">
            {titulo}
          </AppText>
        </Animated.View>
        <View style={[styles.lado, styles.ladoDireito]}>{direita}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { position: 'absolute', top: 0, left: 0, right: 0 },
  linha: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  barra: {
    height: ALTURA_CABECALHO,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espacos.sm,
  },
  lado: { minWidth: TOQUE_MINIMO * 2, flexDirection: 'row', alignItems: 'center' },
  ladoDireito: { justifyContent: 'flex-end' },
  centro: { flex: 1, alignItems: 'center' },
});
