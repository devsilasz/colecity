import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { ESTILO_MAPA_ESCURO } from '@/components/mapa/estiloMapa';
import { REGIAO_SAO_PAULO } from '@/components/mapa/MapaOcorrencias';
import { Icon } from '@/components/ui/Icon';
import { env } from '@/config/env';
import { useTema } from '@/context/ThemeContext';
import { useRedesenhoMarcadores } from '@/hooks/useRedesenhoMarcadores';
import { raios } from '@/theme';
import type { Coordenada } from '@/types/api';
import type { Veiculo } from '@/types/transporte';
import { tempoRelativo } from '@/utils/formatarData';

export interface MapaLinhaProps {
  /** Trajeto oficial da linha (RN-TAV-02). */
  trajeto: readonly Coordenada[];
  veiculos: readonly Veiculo[];
  /** Trecho fora do trajeto, quando há suspeita de desvio (RN-TAV-07). */
  trechoDesvio?: readonly Coordenada[] | null;
  descricao: string;
}

function paraMapa(ponto: Coordenada) {
  return { latitude: ponto.lat, longitude: ponto.lng };
}

/** Rótulo de origem da posição, sempre em texto (RN-TAV-03, RN-TAV-04, RN-GER-03). */
export function nomeFonte(veiculo: Veiculo): string {
  return veiculo.fonte === 'SPTRANS' ? 'SPTrans' : 'Relatado por passageiros';
}

/** Mapa da linha: trajeto oficial e ônibus. Nunca mostra passageiros (RN-TAV-06). */
export function MapaLinha({ trajeto, veiculos, trechoDesvio, descricao }: MapaLinhaProps) {
  const { cores, escuro, esquema } = useTema();
  const mapa = useRef<MapView>(null);
  const redesenhar = useRedesenhoMarcadores(
    `${esquema}|${veiculos.map((v) => `${v.fonte},${v.posicao.lat.toFixed(5)},${v.posicao.lng.toFixed(5)}`).join(';')}`,
  );

  // Enquadra o trajeto inteiro quando ele chega ou muda de sentido.
  useEffect(() => {
    if (trajeto.length < 2) return;
    mapa.current?.fitToCoordinates(trajeto.map(paraMapa), {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [trajeto]);

  return (
    <View style={styles.raiz}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        provider={env.recursos.mapaGoogle ? PROVIDER_GOOGLE : undefined}
        initialRegion={REGIAO_SAO_PAULO}
        customMapStyle={escuro ? ESTILO_MAPA_ESCURO : []}
        userInterfaceStyle={escuro ? 'dark' : 'light'}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        showsCompass={false}
        onMapReady={() => {
          if (trajeto.length >= 2) {
            mapa.current?.fitToCoordinates(trajeto.map(paraMapa), {
              edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
              animated: false,
            });
          }
        }}
        accessibilityLabel={`${descricao}. Os mesmos ônibus estão na lista abaixo do mapa.`}>
        {trajeto.length >= 2 ? (
          <Polyline coordinates={trajeto.map(paraMapa)} strokeColor={cores.primaria} strokeWidth={4} />
        ) : null}

        {trechoDesvio && trechoDesvio.length >= 2 ? (
          <Polyline
            coordinates={trechoDesvio.map(paraMapa)}
            strokeColor={cores.perigo}
            strokeWidth={4}
            lineDashPattern={[8, 6]}
          />
        ) : null}

        {veiculos.map((veiculo, indice) => {
          const sptrans = veiculo.fonte === 'SPTRANS';
          const cor = sptrans ? cores.primaria : cores.afetados;
          return (
            <Marker
              // A posição entra na `key` para o marcador ser redesenhado quando o ônibus anda.
              key={`${veiculo.fonte}-${veiculo.prefixo ?? indice}-${veiculo.posicao.lat.toFixed(5)}-${veiculo.posicao.lng.toFixed(5)}-${esquema}`}
              coordinate={paraMapa(veiculo.posicao)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={redesenhar}
              title={sptrans ? `Ônibus ${veiculo.prefixo ?? ''} · SPTrans` : 'Relatado por passageiros'}
              description={`Atualizado ${tempoRelativo(veiculo.atualizadoEm)}`}>
              <View style={[styles.onibus, { backgroundColor: cor, borderColor: cores.superficie }]}>
                <Icon nome={sptrans ? 'bus' : 'people'} tamanho={16} corCustom={cores.textoInverso} />
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { height: 300, borderRadius: raios.lg, borderCurve: 'continuous', overflow: 'hidden' },
  onibus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
