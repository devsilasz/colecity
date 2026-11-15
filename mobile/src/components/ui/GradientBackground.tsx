import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useTema } from '@/context/ThemeContext';

const TRANSPARENTE = 'rgba(0, 0, 0, 0)';

/** Fundo com gradientes sutis: dá profundidade e algo para o vidro refletir. */
export function GradientBackground() {
  const { cores } = useTema();

  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[StyleSheet.absoluteFill, { backgroundColor: cores.fundo }]}>
      <LinearGradient
        colors={cores.fundoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[cores.brilhoA, TRANSPARENTE]}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.3, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[TRANSPARENTE, cores.brilhoB]}
        start={{ x: 0.6, y: 0.5 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
