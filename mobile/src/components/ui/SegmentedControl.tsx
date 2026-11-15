import { StyleSheet, View } from 'react-native';

import { useTema } from '@/context/ThemeContext';
import { espacos, raios, sombras, TOQUE_MINIMO, type NomeIcone } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export interface OpcaoSegmento<T extends string> {
  valor: T;
  rotulo: string;
  icone?: NomeIcone;
  /** Mostra um ponto de "novidade" ao lado do rótulo. */
  novidade?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  opcoes: readonly OpcaoSegmento<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
  /** Descreve o grupo para o leitor de tela (ex.: "Modo de visualização"). */
  rotulo: string;
}

export function SegmentedControl<T extends string>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
}: SegmentedControlProps<T>) {
  const { cores } = useTema();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={rotulo}
      style={[styles.raiz, { backgroundColor: cores.superficieAlt, borderColor: cores.borda }]}>
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <PressableScale
            key={opcao.valor}
            accessibilityRole="tab"
            accessibilityLabel={opcao.novidade ? `${opcao.rotulo}, com novidades` : opcao.rotulo}
            accessibilityState={{ selected: ativo }}
            onPress={() => aoMudar(opcao.valor)}
            haptico="selecao"
            style={[
              styles.segmento,
              ativo && {
                backgroundColor: cores.superficie,
                boxShadow: sombras.suave(cores.sombra),
              },
            ]}>
            {opcao.icone ? (
              <Icon nome={opcao.icone} tamanho={16} cor={ativo ? 'primaria' : 'textoSecundario'} />
            ) : null}
            <AppText
              variante="notaForte"
              cor={ativo ? 'primaria' : 'textoSecundario'}
              numberOfLines={1}>
              {opcao.rotulo}
            </AppText>
            {opcao.novidade ? (
              <View style={[styles.ponto, { backgroundColor: cores.perigo }]} />
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flexDirection: 'row',
    padding: espacos.xs,
    borderRadius: raios.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    gap: espacos.xs,
  },
  segmento: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacos.xs,
    minHeight: TOQUE_MINIMO,
    paddingHorizontal: espacos.sm,
    borderRadius: raios.sm,
    borderCurve: 'continuous',
  },
  ponto: { width: 8, height: 8, borderRadius: 4 },
});
