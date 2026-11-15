import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/CustomButton';
import { Icon } from '@/components/ui/Icon';
import { useTema } from '@/context/ThemeContext';
import { espacos, type NomeIcone } from '@/theme';

export interface EmptyStateProps {
  icone: NomeIcone;
  titulo: string;
  descricao?: string;
  rotuloAcao?: string;
  aoAgir?: () => void;
  iconeAcao?: NomeIcone;
  /** Segunda ação, discreta (ex.: "Limpar filtros"). */
  rotuloAcaoSecundaria?: string;
  aoAgirSecundaria?: () => void;
}

/** Ilustração simples: ícone em um disco com gradiente e "satélites" decorativos. */
function Ilustracao({ icone }: { icone: NomeIcone }) {
  const { cores } = useTema();
  return (
    <View
      style={styles.ilustracao}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden>
      <View style={[styles.anel, { borderColor: cores.primariaSuave }]} />
      <View style={[styles.satelite, styles.sateliteA, { backgroundColor: cores.afetados }]} />
      <View style={[styles.satelite, styles.sateliteB, { backgroundColor: cores.sucesso }]} />
      <View style={[styles.satelite, styles.sateliteC, { backgroundColor: cores.primaria }]} />
      <LinearGradient
        colors={[cores.primariaSuave, cores.infoSuave]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.disco, { borderColor: cores.vidroBorda }]}>
        <Icon nome={icone} tamanho={44} cor="primaria" />
      </LinearGradient>
    </View>
  );
}

/** Estado vazio ilustrado, com ação opcional. */
export function EmptyState({
  icone,
  titulo,
  descricao,
  rotuloAcao,
  aoAgir,
  iconeAcao,
  rotuloAcaoSecundaria,
  aoAgirSecundaria,
}: EmptyStateProps) {
  return (
    <View style={styles.raiz}>
      <Ilustracao icone={icone} />
      <AppText variante="titulo3" centralizado>
        {titulo}
      </AppText>
      {descricao ? (
        <AppText variante="subtitulo" cor="textoSecundario" centralizado>
          {descricao}
        </AppText>
      ) : null}
      {rotuloAcao && aoAgir ? (
        <CustomButton
          titulo={rotuloAcao}
          icone={iconeAcao}
          onPress={aoAgir}
          larguraTotal={false}
          style={styles.acao}
        />
      ) : null}
      {rotuloAcaoSecundaria && aoAgirSecundaria ? (
        <CustomButton
          titulo={rotuloAcaoSecundaria}
          variante="texto"
          onPress={aoAgirSecundaria}
          larguraTotal={false}
          style={styles.acaoSecundaria}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', gap: espacos.sm, paddingVertical: espacos.xxxl, paddingHorizontal: espacos.xxl },
  ilustracao: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacos.md,
  },
  anel: { position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 2 },
  disco: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  satelite: { position: 'absolute', borderRadius: 999 },
  sateliteA: { width: 12, height: 12, top: 14, right: 22 },
  sateliteB: { width: 8, height: 8, bottom: 22, left: 16 },
  sateliteC: { width: 6, height: 6, top: 40, left: 6 },
  acao: { alignSelf: 'center', marginTop: espacos.md },
  acaoSecundaria: { alignSelf: 'center' },
});
