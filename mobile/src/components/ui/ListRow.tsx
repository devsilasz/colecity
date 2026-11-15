import type { ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { useTema } from '@/context/ThemeContext';
import { espacos, raios, TOQUE_MINIMO, type NomeIcone } from '@/theme';
import { vibrar } from '@/utils/haptics';

import { AppText, type CorTexto } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface LinhaBaseProps {
  titulo: string;
  descricao?: string;
  icone?: NomeIcone;
  cor?: CorTexto;
  /** Desenha a linha divisória inferior (use em todas menos a última do grupo). */
  divisor?: boolean;
}

function Conteudo({
  titulo,
  descricao,
  icone,
  cor = 'texto',
  direita,
}: LinhaBaseProps & { direita?: ReactNode }) {
  const { cores } = useTema();
  return (
    <>
      {icone ? (
        <View style={[styles.icone, { backgroundColor: cores.primariaSuave }]}>
          <Icon nome={icone} tamanho={18} cor={cor === 'texto' ? 'primaria' : cor} />
        </View>
      ) : null}
      <View style={styles.textos}>
        <AppText variante="chamada" cor={cor}>
          {titulo}
        </AppText>
        {descricao ? (
          <AppText variante="nota" cor="textoTerciario">
            {descricao}
          </AppText>
        ) : null}
      </View>
      {direita}
    </>
  );
}

export interface ListRowProps extends LinhaBaseProps {
  onPress?: () => void;
  /** Texto curto à direita (ex.: valor atual). */
  valor?: string;
  seta?: boolean;
}

/** Linha de lista de ajustes: navegação ou ação. */
export function ListRow({ onPress, valor, seta = true, divisor = false, ...base }: ListRowProps) {
  const { cores } = useTema();
  const estiloDivisor = divisor && {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cores.divisor,
  };

  const direita = (
    <>
      {valor ? (
        <AppText variante="subtitulo" cor="textoTerciario" numberOfLines={1}>
          {valor}
        </AppText>
      ) : null}
      {onPress && seta ? <Icon nome="chevron-forward" tamanho={18} cor="textoTerciario" /> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.linha, estiloDivisor]}>
        <Conteudo {...base} direita={direita} />
      </View>
    );
  }

  return (
    <PressableScale
      accessibilityLabel={[base.titulo, valor, base.descricao].filter(Boolean).join(', ')}
      onPress={onPress}
      escala={0.99}
      style={[styles.linha, estiloDivisor]}>
      <Conteudo {...base} direita={direita} />
    </PressableScale>
  );
}

export interface ToggleRowProps extends LinhaBaseProps {
  valor: boolean;
  aoMudar: (valor: boolean) => void;
  disabled?: boolean;
}

/** Linha com interruptor. */
export function ToggleRow({ valor, aoMudar, disabled = false, divisor = false, ...base }: ToggleRowProps) {
  const { cores } = useTema();
  return (
    <View
      style={[
        styles.linha,
        divisor && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: cores.divisor,
        },
      ]}>
      <Conteudo
        {...base}
        direita={
          <Switch
            accessibilityLabel={base.titulo}
            accessibilityHint={base.descricao}
            value={valor}
            disabled={disabled}
            onValueChange={(novo) => {
              vibrar('selecao');
              aoMudar(novo);
            }}
            trackColor={{ true: cores.primaria, false: cores.borda }}
            thumbColor={cores.superficie}
            ios_backgroundColor={cores.borda}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.md,
    minHeight: TOQUE_MINIMO + espacos.md,
    paddingVertical: espacos.sm,
    paddingHorizontal: espacos.lg,
  },
  icone: {
    width: 32,
    height: 32,
    borderRadius: raios.sm,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1, gap: espacos.xxs },
});
