import { useCallback } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { duracoes, TOQUE_MINIMO } from '@/theme';
import { vibrar, type TipoHaptico } from '@/utils/haptics';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Rótulo lido pelo leitor de tela (RN-GER-01). */
  accessibilityLabel: string;
  /** Escala ao pressionar. */
  escala?: number;
  /** Tipo de feedback tátil; `null` desliga. */
  haptico?: TipoHaptico | null;
  /** Não força a área mínima de 44 pt (use só dentro de áreas já tocáveis). */
  semTamanhoMinimo?: boolean;
}

/** Base de todo elemento tocável: escala + opacidade ao toque e haptic leve. */
export function PressableScale({
  children,
  style,
  escala = 0.97,
  haptico = 'leve',
  semTamanhoMinimo = false,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  accessibilityState,
  ...resto
}: PressableScaleProps) {
  const pressionado = useSharedValue(0);
  const desabilitado = Boolean(disabled);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressionado.value * (1 - escala) }],
    opacity: (desabilitado ? 0.5 : 1) * (1 - pressionado.value * 0.18),
  }));

  const aoPressionar = useCallback(
    (evento: GestureResponderEvent) => {
      pressionado.set(withTiming(1, { duration: duracoes.rapida }));
      onPressIn?.(evento);
    },
    [onPressIn, pressionado],
  );

  const aoSoltar = useCallback(
    (evento: GestureResponderEvent) => {
      pressionado.set(withTiming(0, { duration: duracoes.normal }));
      onPressOut?.(evento);
    },
    [onPressOut, pressionado],
  );

  const aoTocar = useCallback(
    (evento: GestureResponderEvent) => {
      if (haptico) vibrar(haptico);
      onPress?.(evento);
    },
    [haptico, onPress],
  );

  return (
    <PressableAnimado
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: Boolean(disabled), ...accessibilityState }}
      disabled={disabled}
      onPress={aoTocar}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      hitSlop={6}
      {...resto}
      style={[
        !semTamanhoMinimo && { minHeight: TOQUE_MINIMO, minWidth: TOQUE_MINIMO },
        style,
        estiloAnimado,
      ]}>
      {children}
    </PressableAnimado>
  );
}
