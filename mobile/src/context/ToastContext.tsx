import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Icon } from '@/components/ui/Icon';
import { espacos, raios, type NomeIcone } from '@/theme';
import { vibrar } from '@/utils/haptics';

export type TipoToast = 'sucesso' | 'erro' | 'info';

interface ToastAtual {
  id: number;
  mensagem: string;
  tipo: TipoToast;
}

interface ToastContextValue {
  /** Feedback visual curto ao salvar/enviar (doc 09 §2). Também é anunciado ao leitor de tela. */
  mostrarToast: (mensagem: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURACAO_MS = 3500;

const APARENCIA: Record<TipoToast, { icone: NomeIcone; cor: 'sucesso' | 'perigo' | 'info' }> = {
  sucesso: { icone: 'checkmark-circle-outline', cor: 'sucesso' },
  erro: { icone: 'alert-circle-outline', cor: 'perigo' },
  info: { icone: 'information-circle-outline', cor: 'info' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastAtual | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contador = useRef(0);

  const mostrarToast = useCallback((mensagem: string, tipo: TipoToast = 'info') => {
    if (temporizador.current) clearTimeout(temporizador.current);
    contador.current += 1;
    setToast({ id: contador.current, mensagem, tipo });
    AccessibilityInfo.announceForAccessibility(mensagem);
    vibrar(tipo === 'sucesso' ? 'sucesso' : tipo === 'erro' ? 'erro' : 'leve');
    temporizador.current = setTimeout(() => setToast(null), DURACAO_MS);
  }, []);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  const valor = useMemo(() => ({ mostrarToast }), [mostrarToast]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.area, { top: insets.top + espacos.sm }]}>
          <Animated.View key={toast.id} entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(180)}>
            <GlassSurface semBlur raio={raios.lg} sombra="media" style={styles.toast}>
              <Icon nome={APARENCIA[toast.tipo].icone} cor={APARENCIA[toast.tipo].cor} />
              <AppText variante="notaForte" style={styles.texto}>
                {toast.mensagem}
              </AppText>
            </GlassSurface>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast deve ser usado dentro de ToastProvider.');
  return contexto;
}

const styles = StyleSheet.create({
  area: { position: 'absolute', left: espacos.lg, right: espacos.lg, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
    paddingVertical: espacos.md,
    paddingHorizontal: espacos.lg,
    maxWidth: 480,
  },
  texto: { flexShrink: 1 },
});
