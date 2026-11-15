import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTema } from '@/context/ThemeContext';
import { useConectividade } from '@/hooks/useConectividade';
import { espacos, raios } from '@/theme';

export interface OfflineBannerProps {
  /** Complemento opcional (ex.: "Mostrando as últimas ocorrências carregadas."). */
  detalhe?: string;
}

/** Aviso "Você está offline" (RN-GER-09). Só aparece quando não há conexão. */
export function OfflineBanner({ detalhe }: OfflineBannerProps) {
  const { online } = useConectividade();
  const { cores } = useTema();

  if (online) return null;

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.raiz, { backgroundColor: cores.alertaSuave, borderColor: cores.alerta }]}>
      <Icon nome="cloud-offline-outline" tamanho={20} cor="alerta" />
      <View style={styles.textos}>
        <AppText variante="notaForte" cor="alerta">
          Você está offline
        </AppText>
        {detalhe ? (
          <AppText variante="nota" cor="textoSecundario">
            {detalhe}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
    paddingVertical: espacos.sm,
    paddingHorizontal: espacos.md,
    borderRadius: raios.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textos: { flex: 1 },
});
