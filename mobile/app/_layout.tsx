import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';

import { PerguntaDesvio } from '@/components/transporte/PerguntaDesvio';
import { AuthProvider } from '@/context/AuthContext';
import { ViagemProvider } from '@/context/ViagemContext';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { useSincronizarFila } from '@/hooks/useSincronizarFila';
import { opcoesPersistencia, queryClient } from '@/services/queryClient';

void SplashScreen.preventAutoHideAsync();

function Navegacao() {
  const { tema, pronto } = useThemeContext();
  const { cores, escuro } = tema;

  useEffect(() => {
    if (pronto) void SplashScreen.hideAsync();
  }, [pronto]);

  const temaNavegacao = useMemo(() => {
    const base = escuro ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: cores.primaria,
        background: cores.fundo,
        card: cores.superficie,
        text: cores.texto,
        border: cores.borda,
        notification: cores.perigo,
      },
    };
  }, [cores, escuro]);

  if (!pronto) return null;

  return (
    <NavigationThemeProvider value={temaNavegacao}>
      <StatusBar style={escuro ? 'light' : 'dark'} />
      <ToastProvider>
        <SincronizadorFila />
        <PerguntaDesvio />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
          <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </ToastProvider>
    </NavigationThemeProvider>
  );
}

/** Envia a fila offline quando a conexão volta (RN-GER-10). */
function SincronizadorFila() {
  useSincronizarFila();
  return null;
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={opcoesPersistencia}>
      <ThemeProvider>
        <AuthProvider>
          <ViagemProvider>
            <Navegacao />
          </ViagemProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
