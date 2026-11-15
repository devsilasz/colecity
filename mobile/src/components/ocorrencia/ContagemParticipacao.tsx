import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTema } from '@/context/ThemeContext';
import { comAlfa, espacos, raios, type NomeIcone } from '@/theme';

export interface ContagemParticipacaoProps {
  totalAfetados: number;
  totalApoios: number;
  /** `compacto` para cartões de lista; `destaque` para o detalhe. */
  tamanho?: 'compacto' | 'destaque';
}

function plural(total: number, singular: string, pluralTexto: string): string {
  return total === 1 ? singular : pluralTexto;
}

function Contador({
  total,
  rotulo,
  icone,
  cor,
  destaque,
}: {
  total: number;
  rotulo: string;
  icone: NomeIcone;
  cor: string;
  destaque: boolean;
}) {
  const { escuro } = useTema();
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${total} ${rotulo}`}
      style={[
        styles.contador,
        destaque && styles.contadorDestaque,
        { backgroundColor: comAlfa(cor, escuro ? 0.16 : 0.1) },
      ]}>
      <Icon nome={icone} tamanho={destaque ? 22 : 16} corCustom={cor} />
      <AppText variante={destaque ? 'titulo2' : 'destaque'} corCustom={cor}>
        {total}
      </AppText>
      <AppText variante={destaque ? 'subtitulo' : 'legenda'} cor="textoSecundario" numberOfLines={1}>
        {rotulo}
      </AppText>
    </View>
  );
}

/** Contagens separadas de afetados e apoios, sempre com ícone e texto (RN-PAR-01, RN-GER-03). */
export function ContagemParticipacao({
  totalAfetados,
  totalApoios,
  tamanho = 'compacto',
}: ContagemParticipacaoProps) {
  const { cores } = useTema();
  const destaque = tamanho === 'destaque';

  return (
    <View style={styles.raiz}>
      <Contador
        total={totalAfetados}
        rotulo={plural(totalAfetados, 'afetado', 'afetados')}
        icone="people-outline"
        cor={cores.afetados}
        destaque={destaque}
      />
      <Contador
        total={totalApoios}
        rotulo={plural(totalApoios, 'apoio', 'apoios')}
        icone="megaphone-outline"
        cor={cores.apoios}
        destaque={destaque}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flexDirection: 'row', gap: espacos.sm, flexWrap: 'wrap' },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.xs,
    paddingVertical: espacos.xs + 2,
    paddingHorizontal: espacos.md,
    borderRadius: raios.sm,
    borderCurve: 'continuous',
  },
  contadorDestaque: {
    flex: 1,
    paddingVertical: espacos.md,
    paddingHorizontal: espacos.lg,
    borderRadius: raios.md,
    gap: espacos.sm,
  },
});
