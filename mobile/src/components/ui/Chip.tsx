import { StyleSheet } from 'react-native';

import { useTema } from '@/context/ThemeContext';
import { espacos, raios, TOQUE_MINIMO, type NomeIcone } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export interface ChipProps {
  rotulo: string;
  selecionado: boolean;
  onPress: () => void;
  icone?: NomeIcone;
  /** Cor de destaque quando selecionado (ex.: cor da categoria). */
  corDestaque?: string;
  rotuloAcessivel?: string;
}

/** Chip de filtro. Selecionado = fundo preenchido + ícone de check (não só cor, RN-GER-03). */
export function Chip({ rotulo, selecionado, onPress, icone, corDestaque, rotuloAcessivel }: ChipProps) {
  const { cores } = useTema();
  const destaque = corDestaque ?? cores.primaria;
  const corConteudo = selecionado ? cores.textoInverso : cores.texto;

  return (
    <PressableScale
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      onPress={onPress}
      haptico="selecao"
      escala={0.95}
      style={[
        styles.raiz,
        {
          backgroundColor: selecionado ? destaque : cores.superficie,
          borderColor: selecionado ? destaque : cores.borda,
        },
      ]}>
      {selecionado ? (
        <Icon nome="checkmark" tamanho={16} corCustom={corConteudo} />
      ) : icone ? (
        <Icon nome={icone} tamanho={16} corCustom={corDestaque ?? cores.textoSecundario} />
      ) : null}
      <AppText variante="notaForte" corCustom={corConteudo} numberOfLines={1}>
        {rotulo}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.xs,
    minHeight: TOQUE_MINIMO,
    paddingHorizontal: espacos.lg,
    borderRadius: raios.pilula,
    borderWidth: 1,
  },
});
