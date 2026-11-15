import { useSegments } from 'expo-router';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTema } from '@/context/ThemeContext';
import {
  ALTURA_TAB_BAR,
  duracoes,
  espacos,
  MARGEM_TAB_BAR,
  raios,
  sombras,
  type NomeIcone,
} from '@/theme';

export interface AbaConfig {
  nome: 'explorar' | 'registrar' | 'transporte' | 'minhas' | 'perfil';
  rotulo: string;
  icone: NomeIcone;
  iconeAtivo: NomeIcone;
  /** Ação principal do app: botão central em destaque. */
  destaque?: boolean;
}

export const ABAS: readonly AbaConfig[] = [
  { nome: 'explorar', rotulo: 'Explorar', icone: 'compass-outline', iconeAtivo: 'compass' },
  { nome: 'transporte', rotulo: 'Transporte', icone: 'bus-outline', iconeAtivo: 'bus' },
  { nome: 'registrar', rotulo: 'Registrar', icone: 'add', iconeAtivo: 'add', destaque: true },
  { nome: 'minhas', rotulo: 'Minhas', icone: 'bookmark-outline', iconeAtivo: 'bookmark' },
  { nome: 'perfil', rotulo: 'Perfil', icone: 'person-outline', iconeAtivo: 'person' },
];

type ItemAbaProps = TabTriggerSlotProps & { aba: AbaConfig };

function ItemAba({ aba, isFocused = false, onPress, onLongPress }: ItemAbaProps) {
  const { cores } = useTema();

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityLabel={aba.rotulo}
      accessibilityState={{ selected: isFocused }}
      onPress={onPress ?? undefined}
      onLongPress={onLongPress ?? undefined}
      haptico="selecao"
      escala={0.9}
      style={styles.item}>
      {aba.destaque ? (
        <View
          style={[
            styles.destaque,
            { backgroundColor: cores.primaria, boxShadow: sombras.suave(cores.sombra) },
          ]}>
          <Icon nome={aba.icone} tamanho={26} cor="sobrePrimaria" />
        </View>
      ) : (
        <Icon
          nome={isFocused ? aba.iconeAtivo : aba.icone}
          tamanho={23}
          cor={isFocused ? 'primaria' : 'textoSecundario'}
        />
      )}
      <AppText
        variante="legenda"
        cor={isFocused ? 'primaria' : 'textoSecundario'}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={isFocused && styles.rotuloAtivo}>
        {aba.rotulo}
      </AppText>
    </PressableScale>
  );
}

/** Tab bar flutuante em vidro. Some nas telas empilhadas (detalhe, formulários). */
export function GlassTabBar() {
  const insets = useSafeAreaInsets();
  const segmentos = useSegments();
  // ['(tabs)', 'explorar'] = raiz da aba; mais segmentos = tela empilhada.
  const naRaizDaAba = segmentos.length <= 2;

  const visivel = useSharedValue(1);
  useEffect(() => {
    visivel.set(withTiming(naRaizDaAba ? 1 : 0, { duration: duracoes.normal }));
  }, [naRaizDaAba, visivel]);

  const estilo = useAnimatedStyle(() => ({
    opacity: visivel.value,
    transform: [{ translateY: (1 - visivel.value) * (ALTURA_TAB_BAR + 40) }],
  }));

  return (
    <Animated.View
      pointerEvents={naRaizDaAba ? 'box-none' : 'none'}
      accessibilityElementsHidden={!naRaizDaAba}
      importantForAccessibility={naRaizDaAba ? 'auto' : 'no-hide-descendants'}
      style={[
        styles.raiz,
        { bottom: Math.max(insets.bottom, MARGEM_TAB_BAR), left: MARGEM_TAB_BAR, right: MARGEM_TAB_BAR },
        estilo,
      ]}>
      <GlassSurface raio={raios.xl} intensidade="espessa" sombra="flutuante">
        <View accessibilityRole="tablist" style={styles.barra}>
          {ABAS.map((aba) => (
            <TabTrigger key={aba.nome} name={aba.nome} asChild>
              <ItemAba aba={aba} />
            </TabTrigger>
          ))}
        </View>
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  raiz: { position: 'absolute' },
  barra: {
    height: ALTURA_TAB_BAR,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espacos.xs,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacos.xxs, height: ALTURA_TAB_BAR },
  destaque: {
    width: 42,
    height: 34,
    borderRadius: raios.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotuloAtivo: { fontWeight: '700' },
});
