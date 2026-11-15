import { StyleSheet, View } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';

import { env } from '@/config/env';
import { useTema } from '@/context/ThemeContext';
import { comAlfa, raios } from '@/theme';
import type { Coordenada } from '@/types/api';

import { ESTILO_MAPA_ESCURO } from './estiloMapa';

export interface MiniMapaProps {
  centro: Coordenada;
  /** Descrição textual do local, lida no lugar do mapa (RN-GER-05). */
  descricao: string;
}

/** Mapa estático com a localização aproximada (~100 m), nunca o ponto exato (RN-CSL-08). */
export function MiniMapa({ centro, descricao }: MiniMapaProps) {
  const { cores, escuro } = useTema();
  const coordenada = { latitude: centro.lat, longitude: centro.lng };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Mapa com a localização aproximada: ${descricao}`}
      pointerEvents="none"
      style={styles.raiz}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={env.recursos.mapaGoogle ? PROVIDER_GOOGLE : undefined}
        liteMode
        initialRegion={{ ...coordenada, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
        customMapStyle={escuro ? ESTILO_MAPA_ESCURO : []}
        userInterfaceStyle={escuro ? 'dark' : 'light'}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}>
        <Circle
          center={coordenada}
          radius={100}
          strokeColor={cores.primaria}
          strokeWidth={2}
          fillColor={comAlfa(cores.primaria, 0.2)}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { height: 160, borderRadius: raios.lg, borderCurve: 'continuous', overflow: 'hidden' },
});
