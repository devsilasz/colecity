import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTema } from '@/context/ThemeContext';
import { espacos, raios, sombras, type NomeIcone, type Paleta } from '@/theme';
import type { TipoHaptico } from '@/utils/haptics';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export type VarianteBotao = 'primario' | 'tonal' | 'contorno' | 'perigo' | 'texto';

export interface CustomButtonProps {
  titulo: string;
  onPress: () => void;
  variante?: VarianteBotao;
  tamanho?: 'medio' | 'grande';
  icone?: NomeIcone;
  carregando?: boolean;
  disabled?: boolean;
  /** Ocupa toda a largura disponível (padrão). */
  larguraTotal?: boolean;
  /** Rótulo alternativo para o leitor de tela; por padrão usa o título. */
  rotuloAcessivel?: string;
  dicaAcessivel?: string;
  haptico?: TipoHaptico | null;
  style?: StyleProp<ViewStyle>;
}

function coresDaVariante(variante: VarianteBotao, cores: Paleta) {
  switch (variante) {
    case 'primario':
      return { fundo: cores.primaria, texto: cores.sobrePrimaria, borda: undefined };
    case 'tonal':
      return { fundo: cores.primariaSuave, texto: cores.primaria, borda: undefined };
    case 'contorno':
      return { fundo: 'transparent', texto: cores.primaria, borda: cores.borda };
    case 'perigo':
      return { fundo: cores.perigoSuave, texto: cores.perigo, borda: undefined };
    case 'texto':
      return { fundo: 'transparent', texto: cores.primaria, borda: undefined };
  }
}

export function CustomButton({
  titulo,
  onPress,
  variante = 'primario',
  tamanho = 'grande',
  icone,
  carregando = false,
  disabled = false,
  larguraTotal = true,
  rotuloAcessivel,
  dicaAcessivel,
  haptico = 'leve',
  style,
}: CustomButtonProps) {
  const { cores } = useTema();
  const aparencia = coresDaVariante(variante, cores);
  const inativo = disabled || carregando;

  return (
    <PressableScale
      accessibilityLabel={rotuloAcessivel ?? titulo}
      accessibilityHint={dicaAcessivel}
      accessibilityState={{ busy: carregando }}
      onPress={onPress}
      disabled={inativo}
      haptico={haptico}
      style={[
        styles.base,
        tamanho === 'grande' ? styles.grande : styles.medio,
        {
          backgroundColor: aparencia.fundo,
          borderColor: aparencia.borda ?? 'transparent',
          borderWidth: aparencia.borda ? 1 : 0,
          boxShadow: variante === 'primario' && !inativo ? sombras.suave(cores.sombra) : undefined,
        },
        !larguraTotal && styles.ajustado,
        style,
      ]}>
      {carregando ? (
        <ActivityIndicator color={aparencia.texto} />
      ) : (
        <View style={styles.conteudo}>
          {icone ? <Icon nome={icone} tamanho={20} corCustom={aparencia.texto} /> : null}
          <AppText
            variante={tamanho === 'grande' ? 'destaque' : 'notaForte'}
            corCustom={aparencia.texto}
            numberOfLines={2}
            centralizado>
            {titulo}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raios.md,
    borderCurve: 'continuous',
    paddingHorizontal: espacos.xl,
  },
  grande: { minHeight: 52, paddingVertical: espacos.md },
  medio: { minHeight: 44, paddingVertical: espacos.sm, paddingHorizontal: espacos.lg },
  ajustado: { alignSelf: 'flex-start' },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm, flexShrink: 1 },
});
