import { useEffect, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTema } from '@/context/ThemeContext';
import { duracoes, espacos, raios } from '@/theme';

import { AppText } from './AppText';
import { BlurTargetContext, GlassSurface } from './GlassSurface';
import { IconButton } from './IconButton';

export interface BottomSheetProps {
  visivel: boolean;
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
  /** Ações fixas no rodapé do sheet. */
  rodape?: ReactNode;
}

/** Painel inferior em vidro, usado para filtros, seleções e formulários curtos. */
export function BottomSheet({ visivel, aoFechar, titulo, children, rodape }: BottomSheetProps) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const progresso = useSharedValue(0);

  useEffect(() => {
    progresso.set(withTiming(visivel ? 1 : 0, { duration: duracoes.normal }));
  }, [visivel, progresso]);

  const estiloVeu = useAnimatedStyle(() => ({ opacity: progresso.value }));
  const estiloPainel = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progresso.value) * 48 }],
    opacity: progresso.value,
  }));

  return (
    <Modal
      visible={visivel}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={aoFechar}>
      {/* O Modal é outra janela nativa: no Android o vidro usa o fallback sólido aqui. */}
      <BlurTargetContext.Provider value={null}>
        <KeyboardAvoidingView
          style={styles.raiz}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cores.veu }, estiloVeu]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={aoFechar}
              accessibilityRole="button"
              accessibilityLabel="Fechar painel"
            />
          </Animated.View>

          <Animated.View style={[styles.painel, { marginTop: insets.top + espacos.xxl }, estiloPainel]}>
            <GlassSurface
              raio={raios.xl}
              baseReta
              intensidade="espessa"
              sombra="flutuante"
              style={styles.vidro}>
              <View accessibilityViewIsModal style={{ paddingBottom: insets.bottom + espacos.lg }}>
                <View style={[styles.alca, { backgroundColor: cores.borda }]} />
                <View style={styles.cabecalho}>
                  <AppText variante="titulo3" style={styles.titulo} accessibilityRole="header">
                    {titulo}
                  </AppText>
                  <IconButton
                    icone="close"
                    rotulo="Fechar"
                    variante="tonal"
                    tamanhoIcone={20}
                    onPress={aoFechar}
                  />
                </View>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.conteudo}>
                  {children}
                </ScrollView>
                {rodape ? <View style={styles.rodape}>{rodape}</View> : null}
              </View>
            </GlassSurface>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurTargetContext.Provider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, justifyContent: 'flex-end' },
  painel: { flexShrink: 1 },
  vidro: { flexShrink: 1 },
  alca: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: espacos.sm },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: espacos.xl,
    paddingRight: espacos.md,
    paddingTop: espacos.sm,
    gap: espacos.sm,
  },
  titulo: { flex: 1 },
  conteudo: { paddingHorizontal: espacos.xl, paddingVertical: espacos.lg, gap: espacos.lg },
  rodape: { paddingHorizontal: espacos.xl, paddingTop: espacos.sm, gap: espacos.sm },
});
