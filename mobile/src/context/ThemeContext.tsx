import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import { CHAVES, lerJson, salvarJson } from '@/services/storage';
import { criarTema, type Tema } from '@/theme';

export type PreferenciaTema = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  tema: Tema;
  /** Preferência salva: seguir o sistema (padrão), claro ou escuro. */
  preferencia: PreferenciaTema;
  definirPreferencia: (preferencia: PreferenciaTema) => void;
  /** Vidro sem blur: preferência do app ou "Reduzir transparência" do sistema. */
  reduzirTransparencia: boolean;
  reduzirTransparenciaApp: boolean;
  definirReduzirTransparencia: (ativo: boolean) => void;
  /** `false` enquanto as preferências ainda não foram lidas do AsyncStorage. */
  pronto: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const esquemaSistema = useColorScheme();
  const [preferencia, setPreferencia] = useState<PreferenciaTema>('system');
  const [reduzirApp, setReduzirApp] = useState(false);
  const [reduzirSistema, setReduzirSistema] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      lerJson<PreferenciaTema>(CHAVES.tema),
      lerJson<boolean>(CHAVES.reduzirTransparencia),
    ]).then(([temaSalvo, reduzirSalvo]) => {
      if (!ativo) return;
      if (temaSalvo === 'light' || temaSalvo === 'dark' || temaSalvo === 'system') {
        setPreferencia(temaSalvo);
      }
      if (typeof reduzirSalvo === 'boolean') setReduzirApp(reduzirSalvo);
      setPronto(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((valor) => {
        if (ativo) setReduzirSistema(valor);
      })
      .catch(() => undefined);
    const inscricao = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduzirSistema,
    );
    return () => {
      ativo = false;
      inscricao.remove();
    };
  }, []);

  const definirPreferencia = useCallback((nova: PreferenciaTema) => {
    setPreferencia(nova);
    void salvarJson(CHAVES.tema, nova);
  }, []);

  const definirReduzirTransparencia = useCallback((ativo: boolean) => {
    setReduzirApp(ativo);
    void salvarJson(CHAVES.reduzirTransparencia, ativo);
  }, []);

  const esquema =
    preferencia === 'system' ? (esquemaSistema === 'dark' ? 'dark' : 'light') : preferencia;

  const valor = useMemo<ThemeContextValue>(
    () => ({
      tema: criarTema(esquema),
      preferencia,
      definirPreferencia,
      reduzirTransparencia: reduzirApp || reduzirSistema,
      reduzirTransparenciaApp: reduzirApp,
      definirReduzirTransparencia,
      pronto,
    }),
    [
      esquema,
      preferencia,
      definirPreferencia,
      reduzirApp,
      reduzirSistema,
      definirReduzirTransparencia,
      pronto,
    ],
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error('useThemeContext deve ser usado dentro de ThemeProvider.');
  return contexto;
}

/** Atalho para o tema atual (cores e esquema). */
export function useTema(): Tema {
  return useThemeContext().tema;
}
