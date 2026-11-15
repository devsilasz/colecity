import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ToggleRow } from '@/components/ui/ListRow';
import { SegmentedControl, type OpcaoSegmento } from '@/components/ui/SegmentedControl';
import { useThemeContext, type PreferenciaTema } from '@/context/ThemeContext';
import { espacos } from '@/theme';

const OPCOES_TEMA: readonly OpcaoSegmento<PreferenciaTema>[] = [
  { valor: 'system', rotulo: 'Sistema', icone: 'phone-portrait-outline' },
  { valor: 'light', rotulo: 'Claro', icone: 'sunny-outline' },
  { valor: 'dark', rotulo: 'Escuro', icone: 'moon-outline' },
];

/** Tema claro/escuro/sistema e "reduzir transparência", persistidos no AsyncStorage. */
export function AparenciaSection() {
  const { preferencia, definirPreferencia, reduzirTransparenciaApp, definirReduzirTransparencia } =
    useThemeContext();

  return (
    <View style={styles.raiz}>
      <AppText variante="notaForte" cor="textoSecundario" style={styles.titulo}>
        APARÊNCIA
      </AppText>
      <Card semPadding>
        <View style={styles.tema}>
          <AppText variante="chamada">Tema</AppText>
          <SegmentedControl
            rotulo="Tema do aplicativo"
            opcoes={OPCOES_TEMA}
            valor={preferencia}
            aoMudar={definirPreferencia}
          />
        </View>
        <ToggleRow
          icone="contrast-outline"
          titulo="Reduzir transparência"
          descricao="Troca o efeito de vidro por fundos sólidos, com mais contraste."
          valor={reduzirTransparenciaApp}
          aoMudar={definirReduzirTransparencia}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espacos.sm },
  titulo: { marginLeft: espacos.sm, letterSpacing: 0.6 },
  tema: { padding: espacos.lg, gap: espacos.md },
});
