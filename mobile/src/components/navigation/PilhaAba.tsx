import { Stack } from 'expo-router';

import { useTema } from '@/context/ThemeContext';

/** Stack padrão de cada aba: sem cabeçalho nativo (usamos o cabeçalho de vidro). */
export function PilhaAba() {
  const { cores } = useTema();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
        animation: 'slide_from_right',
      }}
    />
  );
}
