import { BlurView } from 'expo-blur';
import {
  createContext,
  useContext,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/context/ThemeContext';
import { raios, sombras } from '@/theme';

/**
 * No Android o blur precisa de um "alvo" (BlurTargetView) que NÃO contenha o próprio vidro.
 * `Screen` e o layout das abas fornecem esse alvo às camadas flutuantes (cabeçalho, tab bar,
 * barras e sheets). Conteúdo dentro do alvo recebe `null` e usa o fallback sólido.
 */
export type AlvoBlur = ComponentRef<typeof View>;

export const BlurTargetContext = createContext<RefObject<AlvoBlur | null> | null>(null);

const INTENSIDADE = { fina: 28, regular: 55, espessa: 85 } as const;

/** Android 12+ (API 31) tem blur nativo eficiente; abaixo disso usamos o fallback. */
const ANDROID_SUPORTA_BLUR = Platform.OS === 'android' && Number(Platform.Version) >= 31;

export interface GlassSurfaceProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  raio?: number;
  intensidade?: keyof typeof INTENSIDADE;
  borda?: boolean;
  sombra?: 'nenhuma' | 'suave' | 'media' | 'flutuante';
  /** Força o fallback translúcido sólido (use em itens de listas longas). */
  semBlur?: boolean;
  /** Cantos inferiores retos (painéis encostados na base da tela). */
  baseReta?: boolean;
}

/**
 * Superfície de vidro única do app: blur onde disponível e fallback translúcido sólido
 * quando não há suporte ou quando "reduzir transparência" está ativo.
 * A camada de tonalidade garante contraste AA para o texto sobre o vidro.
 */
export function GlassSurface({
  children,
  style,
  raio = raios.lg,
  intensidade = 'regular',
  borda = true,
  sombra = 'nenhuma',
  semBlur = false,
  baseReta = false,
}: GlassSurfaceProps) {
  const cantos = baseReta
    ? { borderTopLeftRadius: raio, borderTopRightRadius: raio }
    : { borderRadius: raio };
  const { tema, reduzirTransparencia } = useThemeContext();
  const alvo = useContext(BlurTargetContext);
  const { cores, escuro } = tema;

  const plataformaSuporta =
    Platform.OS === 'ios' || (ANDROID_SUPORTA_BLUR && alvo !== null);
  const usarBlur = !semBlur && !reduzirTransparencia && plataformaSuporta;

  const boxShadow = sombra === 'nenhuma' ? undefined : sombras[sombra](cores.sombra);

  return (
    <View style={[cantos, { borderCurve: 'continuous', boxShadow }, style]}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.recorte,
          cantos,
          borda && { borderWidth: StyleSheet.hairlineWidth, borderColor: cores.vidroBorda },
        ]}>
        {usarBlur ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={INTENSIDADE[intensidade]}
            tint={escuro ? 'dark' : 'light'}
            blurMethod="dimezisBlurViewSdk31Plus"
            blurTarget={alvo ?? undefined}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: usarBlur ? cores.vidroTom : cores.vidroSolido },
          ]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  recorte: { overflow: 'hidden', borderCurve: 'continuous' },
});
