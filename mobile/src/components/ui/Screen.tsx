import { BlurTargetView } from 'expo-blur';
import { useRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { useTema } from '@/context/ThemeContext';

import { BlurTargetContext, type AlvoBlur } from './GlassSurface';
import { GradientBackground } from './GradientBackground';

export interface ScreenProps {
  children: ReactNode;
  /** Camadas de vidro flutuantes (cabeçalho, barras de ação, sheets). Recebem blur real. */
  sobreposicao?: ReactNode;
  /** Empurra o conteúdo quando o teclado abre (telas com formulário). */
  evitarTeclado?: boolean;
}

/**
 * Estrutura base de toda tela: fundo em gradiente + conteúdo (alvo do blur) e,
 * por cima, as camadas de vidro.
 */
export function Screen({ children, sobreposicao, evitarTeclado = false }: ScreenProps) {
  const { cores } = useTema();
  const alvo = useRef<AlvoBlur | null>(null);

  const conteudo = (
    <BlurTargetView ref={alvo} style={styles.preenche}>
      <GradientBackground />
      <BlurTargetContext.Provider value={null}>{children}</BlurTargetContext.Provider>
    </BlurTargetView>
  );

  return (
    <View style={[styles.preenche, { backgroundColor: cores.fundo }]}>
      {evitarTeclado ? (
        <KeyboardAvoidingView
          style={styles.preenche}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {conteudo}
        </KeyboardAvoidingView>
      ) : (
        conteudo
      )}
      {sobreposicao ? (
        <BlurTargetContext.Provider value={alvo}>
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {sobreposicao}
          </View>
        </BlurTargetContext.Provider>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  preenche: { flex: 1 },
});
