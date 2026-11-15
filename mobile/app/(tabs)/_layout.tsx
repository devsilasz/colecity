import { BlurTargetView } from 'expo-blur';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { useRef } from 'react';
import { StyleSheet } from 'react-native';

import { GlassTabBar } from '@/components/navigation/GlassTabBar';
import { BlurTargetContext, type AlvoBlur } from '@/components/ui/GlassSurface';

export default function TabsLayout() {
  const alvo = useRef<AlvoBlur | null>(null);

  return (
    <Tabs>
      {/* As telas são o alvo do blur da tab bar (necessário no Android). */}
      <BlurTargetView ref={alvo} style={styles.telas}>
        <TabSlot />
      </BlurTargetView>

      <BlurTargetContext.Provider value={alvo}>
        <GlassTabBar />
      </BlurTargetContext.Provider>

      {/* Define as rotas das abas; a barra visível é a GlassTabBar. */}
      <TabList style={styles.oculto}>
        <TabTrigger name="explorar" href="/explorar" />
        <TabTrigger name="transporte" href="/transporte" />
        <TabTrigger name="registrar" href="/registrar" />
        <TabTrigger name="minhas" href="/minhas" />
        <TabTrigger name="perfil" href="/perfil" />
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  telas: { flex: 1 },
  oculto: { display: 'none' },
});
