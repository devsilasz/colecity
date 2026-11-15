import { StyleSheet, View } from 'react-native';

import { espacos, TOQUE_MINIMO } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export interface CheckboxProps {
  rotulo: string;
  marcado: boolean;
  aoMudar: (marcado: boolean) => void;
  erro?: string | null;
  disabled?: boolean;
}

/** Caixa de seleção com rótulo (ex.: aceite dos termos). */
export function Checkbox({ rotulo, marcado, aoMudar, erro, disabled = false }: CheckboxProps) {
  return (
    <View style={styles.raiz}>
      <PressableScale
        accessibilityRole="checkbox"
        accessibilityLabel={rotulo}
        accessibilityState={{ checked: marcado, disabled }}
        accessibilityHint={erro ?? undefined}
        disabled={disabled}
        haptico="selecao"
        escala={0.99}
        onPress={() => aoMudar(!marcado)}
        style={styles.linha}>
        <Icon
          nome={marcado ? 'checkbox' : 'square-outline'}
          tamanho={26}
          cor={marcado ? 'primaria' : erro ? 'perigo' : 'textoTerciario'}
        />
        <AppText variante="subtitulo" style={styles.texto}>
          {rotulo}
        </AppText>
      </PressableScale>
      {erro ? (
        <AppText variante="nota" cor="perigo" accessibilityLiveRegion="polite">
          {erro}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espacos.xs },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.md, minHeight: TOQUE_MINIMO },
  texto: { flex: 1 },
});
