import { Text, type TextProps } from 'react-native';

import { useTema } from '@/context/ThemeContext';
import { ESCALA_FONTE_MAXIMA, tipografia, type Paleta, type VarianteTexto } from '@/theme';

export type CorTexto = keyof Pick<
  Paleta,
  | 'texto'
  | 'textoSecundario'
  | 'textoTerciario'
  | 'textoInverso'
  | 'primaria'
  | 'sobrePrimaria'
  | 'sucesso'
  | 'alerta'
  | 'perigo'
  | 'info'
  | 'afetados'
  | 'apoios'
>;

export interface AppTextProps extends TextProps {
  variante?: VarianteTexto;
  /** Token de cor do tema. Para cores semânticas avulsas use `corCustom`. */
  cor?: CorTexto;
  corCustom?: string;
  centralizado?: boolean;
}

/** Texto do design system: tipografia do tema e fonte dinâmica do sistema (RN-GER-02). */
export function AppText({
  variante = 'corpo',
  cor = 'texto',
  corCustom,
  centralizado = false,
  style,
  ...resto
}: AppTextProps) {
  const { cores } = useTema();
  const titulo = variante === 'tituloGrande' || variante === 'titulo1' || variante === 'titulo2';

  return (
    <Text
      accessibilityRole={titulo ? 'header' : undefined}
      maxFontSizeMultiplier={ESCALA_FONTE_MAXIMA}
      {...resto}
      style={[
        tipografia[variante],
        { color: corCustom ?? cores[cor] },
        centralizado && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
