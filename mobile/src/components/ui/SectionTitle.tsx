import { StyleSheet } from 'react-native';

import { espacos } from '@/theme';

import { AppText } from './AppText';

/** Título de grupo em telas de ajustes (ex.: "CONTA"). */
export function SectionTitle({ children }: { children: string }) {
  return (
    <AppText variante="notaForte" cor="textoSecundario" accessibilityRole="header" style={styles.titulo}>
      {children.toUpperCase()}
    </AppText>
  );
}

const styles = StyleSheet.create({
  titulo: { marginLeft: espacos.sm, marginBottom: -espacos.sm, letterSpacing: 0.6 },
});
