import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { espacos, raios } from '@/theme';

import { GlassSurface } from './GlassSurface';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  semPadding?: boolean;
}

/**
 * Cartão de conteúdo dentro de listas e telas roláveis.
 * Usa o vidro sem blur (translúcido sólido): blur item a item pesaria em listas longas.
 */
export function Card({ children, style, semPadding = false }: CardProps) {
  return (
    <GlassSurface semBlur sombra="suave" raio={raios.lg} style={[!semPadding && styles.padding, style]}>
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  padding: { padding: espacos.lg },
});
