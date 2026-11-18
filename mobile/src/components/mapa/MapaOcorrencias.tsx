import { useMemo, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Heatmap, Marker, PROVIDER_GOOGLE, type EdgePadding, type Region } from 'react-native-maps';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { NOME_CATEGORIA } from '@/config/categorias';
import { env } from '@/config/env';
import { useTema } from '@/context/ThemeContext';
import { useRedesenhoMarcadores } from '@/hooks/useRedesenhoMarcadores';
import { aparenciaCategoria, comAlfa, espacos, raios } from '@/theme';
import type { OcorrenciaResumo, PontoCalor, ZonaAtencao } from '@/types/ocorrencia';
import { CENTRO_SAO_PAULO } from '@/utils/distancia';

import { ESTILO_MAPA_ESCURO } from './estiloMapa';

export type CamadaMapa = 'ocorrencias' | 'calor';

export const REGIAO_SAO_PAULO: Region = {
  latitude: CENTRO_SAO_PAULO.lat,
  longitude: CENTRO_SAO_PAULO.lng,
  latitudeDelta: 0.22,
  longitudeDelta: 0.22,
};

export interface MapaOcorrenciasProps {
  ref?: Ref<MapView>;
  camada: CamadaMapa;
  ocorrencias: readonly OcorrenciaResumo[];
  pontosCalor: readonly PontoCalor[];
  zonas: readonly ZonaAtencao[];
  selecionadaId: string | null;
  aoSelecionar: (id: string | null) => void;
  mostrarUsuario: boolean;
  /** Área livre do mapa (cabeçalho e painéis flutuantes por cima). */
  recuos: EdgePadding;
}

/** RN-DES-02: mais participação = marcador maior. */
function tamanhoMarcador(ocorrencia: OcorrenciaResumo): number {
  const participacao = ocorrencia.totalAfetados + ocorrencia.totalApoios;
  if (participacao >= 50) return 48;
  if (participacao >= 10) return 40;
  return 32;
}

interface PontoMapa {
  latitude: number;
  longitude: number;
}

/**
 * Posição de cada marcador. Como a localização exibida é aproximada (RN-GER-05), ocorrências da
 * mesma rua caem no mesmo ponto e os marcadores ficariam um sobre o outro. As que coincidem são
 * distribuídas em um pequeno círculo em volta do ponto, sempre na mesma ordem.
 */
function espalharCoincidentes(ocorrencias: readonly OcorrenciaResumo[]): Map<string, PontoMapa> {
  const grupos = new Map<string, OcorrenciaResumo[]>();
  for (const ocorrencia of ocorrencias) {
    const { lat, lng } = ocorrencia.localizacaoAproximada;
    // 4 casas decimais ≈ 11 m: mais perto que isso, os marcadores se cobrem.
    const chave = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), ocorrencia]);
  }

  const posicoes = new Map<string, PontoMapa>();
  for (const grupo of grupos.values()) {
    const primeira = grupo[0];
    if (!primeira) continue;
    const centro = primeira.localizacaoAproximada;
    if (grupo.length === 1) {
      posicoes.set(primeira.id, { latitude: centro.lat, longitude: centro.lng });
      continue;
    }
    // Raio em metros: cresce com o grupo para os marcadores não se tocarem.
    const raio = Math.max(30, grupo.length * 8);
    const grausLat = raio / 111_320;
    const grausLng = raio / (111_320 * Math.cos((centro.lat * Math.PI) / 180));
    [...grupo]
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach((ocorrencia, indice) => {
        const angulo = (2 * Math.PI * indice) / grupo.length;
        posicoes.set(ocorrencia.id, {
          latitude: centro.lat + grausLat * Math.cos(angulo),
          longitude: centro.lng + grausLng * Math.sin(angulo),
        });
      });
  }
  return posicoes;
}

/** Raio (m) do círculo de calor no modo sem heatmap nativo. */
function raioCalor(peso: number): number {
  return 220 + Math.min(peso, 120) * 6;
}

/**
 * Mapa das ocorrências (RN-CSL-02). Camadas:
 * - "ocorrencias": um marcador por ocorrência, maior conforme a participação;
 * - "calor": intensidade por afetados na área (RN-DES-01), sempre com o número (RN-GER-03).
 * As Zonas de atenção aparecem nas duas, com o texto de origem (RN-ZON-02).
 */
export function MapaOcorrencias({
  ref,
  camada,
  ocorrencias,
  pontosCalor,
  zonas,
  selecionadaId,
  aoSelecionar,
  mostrarUsuario,
  recuos,
}: MapaOcorrenciasProps) {
  const { cores, escuro, esquema } = useTema();
  const posicoes = useMemo(() => espalharCoincidentes(ocorrencias), [ocorrencias]);
  const maiorPeso = pontosCalor.reduce((maior, ponto) => Math.max(maior, ponto.peso), 1);
  // Tudo o que muda o desenho de algum marcador (ver useRedesenhoMarcadores).
  const redesenhar = useRedesenhoMarcadores(
    [
      esquema,
      camada,
      selecionadaId ?? '',
      ocorrencias.map((o) => `${o.id}:${o.totalAfetados + o.totalApoios}`).join(','),
      pontosCalor.map((p) => `${p.lat},${p.lng},${p.peso}`).join(';'),
      zonas.map((z) => `${z.categoria},${z.centro.lat},${z.centro.lng},${z.totalRelatos}`).join(';'),
    ].join('|'),
  );

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      provider={env.recursos.mapaGoogle ? PROVIDER_GOOGLE : undefined}
      initialRegion={REGIAO_SAO_PAULO}
      mapPadding={recuos}
      customMapStyle={escuro ? ESTILO_MAPA_ESCURO : []}
      userInterfaceStyle={escuro ? 'dark' : 'light'}
      showsUserLocation={mostrarUsuario}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      onPress={() => aoSelecionar(null)}
      accessibilityLabel="Mapa das ocorrências. As mesmas ocorrências estão disponíveis na visualização em lista.">
      {zonas.map((zona) => (
        <Circle
          key={`zona-area-${zona.categoria}-${zona.centro.lat}-${zona.centro.lng}`}
          center={{ latitude: zona.centro.lat, longitude: zona.centro.lng }}
          radius={zona.raioMetros}
          strokeColor={cores.perigo}
          strokeWidth={2}
          fillColor={comAlfa(cores.perigo, 0.14)}
        />
      ))}
      {zonas.map((zona) => (
        <Marker
          key={`zona-selo-${zona.categoria}-${zona.centro.lat}-${zona.centro.lng}-${esquema}`}
          coordinate={{ latitude: zona.centro.lat, longitude: zona.centro.lng }}
          anchor={{ x: 0.5, y: 1.4 }}
          title={`Zona de atenção: ${NOME_CATEGORIA[zona.categoria]}`}
          description={zona.texto}
          tracksViewChanges={redesenhar}>
          <View style={[styles.seloZona, { backgroundColor: cores.perigo }]}>
            <Icon nome="alert-circle" tamanho={14} corCustom={cores.textoInverso} />
            <AppText variante="legenda" corCustom={cores.textoInverso} maxFontSizeMultiplier={1.2}>
              Zona de atenção · {zona.totalRelatos}
            </AppText>
          </View>
        </Marker>
      ))}

      {camada === 'calor' ? (
        <>
          {env.recursos.mapaGoogle && pontosCalor.length > 0 ? (
            <Heatmap
              points={pontosCalor.map((ponto) => ({
                latitude: ponto.lat,
                longitude: ponto.lng,
                weight: ponto.peso,
              }))}
              radius={50}
              opacity={0.75}
            />
          ) : (
            // Sem heatmap nativo (Apple Maps no iOS): círculos com densidade proporcional.
            pontosCalor.map((ponto) => (
              <Circle
                key={`calor-area-${ponto.lat}-${ponto.lng}`}
                center={{ latitude: ponto.lat, longitude: ponto.lng }}
                radius={raioCalor(ponto.peso)}
                strokeColor={comAlfa(cores.afetados, 0.5)}
                strokeWidth={1}
                fillColor={comAlfa(cores.afetados, 0.15 + 0.4 * (ponto.peso / maiorPeso))}
              />
            ))
          )}
          {pontosCalor.map((ponto) => (
            <Marker
              key={`calor-numero-${ponto.lat}-${ponto.lng}-${ponto.peso}-${esquema}`}
              coordinate={{ latitude: ponto.lat, longitude: ponto.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              title={ponto.peso === 1 ? '1 pessoa afetada nesta área' : `${ponto.peso} pessoas afetadas nesta área`}
              tracksViewChanges={redesenhar}>
              <View style={[styles.numeroCalor, { backgroundColor: cores.superficie, borderColor: cores.afetados }]}>
                <AppText variante="legenda" corCustom={cores.texto} maxFontSizeMultiplier={1.2}>
                  {ponto.peso}
                </AppText>
              </View>
            </Marker>
          ))}
        </>
      ) : (
        ocorrencias.map((ocorrencia) => {
          const selecionada = ocorrencia.id === selecionadaId;
          const tamanho = tamanhoMarcador(ocorrencia) + (selecionada ? 8 : 0);
          const aparencia = aparenciaCategoria[ocorrencia.categoria];
          return (
            <Marker
              // A `key` muda com a seleção e o tema para o marcador ser redesenhado.
              key={`${ocorrencia.id}-${String(selecionada)}-${esquema}`}
              coordinate={
                posicoes.get(ocorrencia.id) ?? {
                  latitude: ocorrencia.localizacaoAproximada.lat,
                  longitude: ocorrencia.localizacaoAproximada.lng,
                }
              }
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={selecionada ? 999 : ocorrencia.totalAfetados + ocorrencia.totalApoios}
              tracksViewChanges={redesenhar}
              accessibilityLabel={`${ocorrencia.titulo}. ${ocorrencia.totalAfetados} afetados, ${ocorrencia.totalApoios} apoios.`}
              onPress={(evento) => {
                evento.stopPropagation();
                aoSelecionar(ocorrencia.id);
              }}>
              <View
                style={[
                  styles.marcador,
                  {
                    width: tamanho,
                    height: tamanho,
                    borderRadius: tamanho / 2,
                    backgroundColor: selecionada ? cores.primaria : cores.superficie,
                    borderColor: selecionada ? cores.sobrePrimaria : aparencia.cor[esquema],
                  },
                ]}>
                <Icon
                  nome={aparencia.icone}
                  tamanho={tamanho * 0.5}
                  corCustom={selecionada ? cores.sobrePrimaria : aparencia.cor[esquema]}
                />
              </View>
            </Marker>
          );
        })
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  marcador: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  seloZona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.xs,
    paddingVertical: espacos.xs,
    paddingHorizontal: espacos.sm,
    borderRadius: raios.pilula,
  },
  numeroCalor: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: espacos.xs,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
