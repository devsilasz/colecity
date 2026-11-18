import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PerguntaDesvio } from '@/components/transporte/PerguntaDesvio';
import { AuthProvider } from '@/context/AuthContext';
import { ViagemProvider } from '@/context/ViagemContext';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useNotificacoesPush } from '@/hooks/useNotificacoesPush';
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
        <GerenciadorPush />
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

/** Push: registra o aparelho da conta logada e abre a ocorrência ao tocar na notificação. */
function GerenciadorPush() {
  const { usuario } = useAuth();
  useNotificacoesPush(usuario?.uid ?? null);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.raiz}>
      <PersistQueryClientProvider client={queryClient} persistOptions={opcoesPersistencia}>
        <ThemeProvider>
          <AuthProvider>
            <ViagemProvider>
              <Navegacao />
            </ViagemProvider>
          </AuthProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
});
