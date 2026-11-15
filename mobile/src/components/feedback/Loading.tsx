import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTema } from '@/context/ThemeContext';
import { espacos } from '@/theme';

export interface LoadingProps {
  mensagem?: string;
  /** Ocupa a área toda e centraliza. */
  telaCheia?: boolean;
}

export function Loading({ mensagem = 'Carregando…', telaCheia = false }: LoadingProps) {
  const { cores } = useTema();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={mensagem}
      style={[styles.raiz, telaCheia && styles.telaCheia]}>
      <ActivityIndicator size="large" color={cores.primaria} />
      <AppText variante="subtitulo" cor="textoSecundario">
        {mensagem}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', justifyContent: 'center', gap: espacos.md, padding: espacos.xxl },
  telaCheia: { flex: 1 },
});
