import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { useTema } from '@/context/ThemeContext';
import { espacos, raios } from '@/theme';

export interface SkeletonProps {
  largura?: DimensionValue;
  altura?: number;
  raio?: number;
}

/** Bloco pulsante que ocupa o lugar do conteúdo enquanto carrega. */
export function Skeleton({ largura = '100%', altura = 16, raio = raios.sm }: SkeletonProps) {
  const { cores } = useTema();
  const reduzirMovimento = useReducedMotion();
  const pulso = useSharedValue(0);

  useEffect(() => {
    if (reduzirMovimento) return;
    pulso.set(withRepeat(withTiming(1, { duration: 900 }), -1, true));
    return () => cancelAnimation(pulso);
  }, [pulso, reduzirMovimento]);

  const estilo = useAnimatedStyle(() => ({ opacity: 0.55 + pulso.value * 0.45 }));

  return (
    <Animated.View
      style={[
        { width: largura, height: altura, borderRadius: raio, backgroundColor: cores.esqueletoBrilho },
        estilo,
      ]}
    />
  );
}

/** Esqueleto no formato de um cartão de ocorrência. */
export function SkeletonCard() {
  return (
    <Card>
      <View style={styles.cartao}>
        <View style={styles.linha}>
          <Skeleton largura={96} altura={24} raio={raios.pilula} />
          <Skeleton largura={120} altura={24} raio={raios.pilula} />
        </View>
        <Skeleton largura="85%" altura={20} />
        <Skeleton largura="50%" altura={14} />
        <View style={styles.linha}>
          <Skeleton largura={88} altura={36} />
          <Skeleton largura={88} altura={36} />
        </View>
      </View>
    </Card>
  );
}

/** Lista de esqueletos, anunciada como "carregando" ao leitor de tela. */
export function SkeletonList({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando conteúdo"
      style={styles.lista}>
      {Array.from({ length: quantidade }, (_, indice) => (
        <SkeletonCard key={indice} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { gap: espacos.md },
  linha: { flexDirection: 'row', gap: espacos.sm },
  lista: { gap: espacos.md },
});
