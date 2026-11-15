import { StyleSheet, View } from 'react-native';

import { useTema } from '@/context/ThemeContext';
import { raios, TOQUE_MINIMO, type NomeIcone } from '@/theme';

import type { CorTexto } from './AppText';
import { GlassSurface } from './GlassSurface';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export interface IconButtonProps {
  icone: NomeIcone;
  /** Obrigatório: botões só de ícone precisam de rótulo para o leitor de tela (RN-GER-01). */
  rotulo: string;
  onPress: () => void;
  variante?: 'plano' | 'tonal' | 'vidro';
  cor?: CorTexto;
  tamanhoIcone?: number;
  disabled?: boolean;
  selecionado?: boolean;
}

export function IconButton({
  icone,
  rotulo,
  onPress,
  variante = 'plano',
  cor = 'primaria',
  tamanhoIcone = 24,
  disabled = false,
  selecionado,
}: IconButtonProps) {
  const { cores } = useTema();

  const conteudo = <Icon nome={icone} tamanho={tamanhoIcone} cor={cor} />;

  return (
    <PressableScale
      accessibilityLabel={rotulo}
      accessibilityState={selecionado === undefined ? undefined : { selected: selecionado }}
      onPress={onPress}
      disabled={disabled}
      escala={0.9}
      style={styles.toque}>
      {variante === 'vidro' ? (
        <GlassSurface raio={raios.pilula} sombra="suave" style={styles.circulo}>
          {conteudo}
        </GlassSurface>
      ) : (
        <View
          style={[
            styles.circulo,
            variante === 'tonal' && { backgroundColor: cores.primariaSuave },
          ]}>
          {conteudo}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  toque: { alignItems: 'center', justifyContent: 'center' },
  circulo: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    borderRadius: raios.pilula,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
