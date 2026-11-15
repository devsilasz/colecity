import { StyleSheet, View } from 'react-native';

import { espacos, raios, type NomeIcone } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

export interface BadgeProps {
  rotulo: string;
  icone?: NomeIcone;
  /** Cor do texto e do ícone. */
  cor: string;
  /** Cor de fundo suave. */
  fundo: string;
  rotuloAcessivel?: string;
  tamanho?: 'pequeno' | 'medio';
}

/** Selo genérico: sempre ícone + texto, nunca só cor (RN-GER-03). */
export function Badge({ rotulo, icone, cor, fundo, rotuloAcessivel, tamanho = 'medio' }: BadgeProps) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      style={[styles.raiz, tamanho === 'pequeno' && styles.pequeno, { backgroundColor: fundo }]}>
      {icone ? <Icon nome={icone} tamanho={tamanho === 'pequeno' ? 12 : 14} corCustom={cor} /> : null}
      <AppText variante="legenda" corCustom={cor} numberOfLines={1} style={styles.texto}>
        {rotulo}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espacos.xs,
    paddingVertical: espacos.xs,
    paddingHorizontal: espacos.sm + 2,
    borderRadius: raios.pilula,
    flexShrink: 1,
  },
  pequeno: { paddingVertical: espacos.xxs, paddingHorizontal: espacos.sm },
  texto: { flexShrink: 1 },
});
