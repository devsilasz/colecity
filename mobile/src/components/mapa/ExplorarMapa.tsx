import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';

import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { FilterBar } from '@/components/ocorrencia/FilterBar';
import { OcorrenciaCard } from '@/components/ocorrencia/OcorrenciaCard';
import { AppText } from '@/components/ui/AppText';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { IconButton } from '@/components/ui/IconButton';
import { SegmentedControl, type OpcaoSegmento } from '@/components/ui/SegmentedControl';
import { useToast } from '@/context/ToastContext';
import { useEspacosTela } from '@/hooks/useCabecalhoRolavel';
import { useLocalizacao } from '@/hooks/useLocalizacao';
import { AREA_SAO_PAULO, useMapaDeCalor, useZonasDeAtencao } from '@/hooks/useMapa';
import { useOcorrencias } from '@/hooks/useOcorrencias';
import { mensagemDeErro } from '@/services/erros';
import { espacos, raios } from '@/theme';
import type { FiltrosOcorrencias } from '@/types/ocorrencia';
import { dentroDeSaoPaulo } from '@/utils/distancia';

import { MapaOcorrencias, type CamadaMapa } from './MapaOcorrencias';

/** Doc 10: tamanho máximo de página. O mapa mostra as ocorrências com mais participação. */
const LIMITE_MAPA = 50;

const CAMADAS: readonly OpcaoSegmento<CamadaMapa>[] = [
  { valor: 'ocorrencias', rotulo: 'Ocorrências', icone: 'location-outline' },
  { valor: 'calor', rotulo: 'Mapa de calor', icone: 'flame-outline' },
];

export interface ExplorarMapaProps {
  filtros: FiltrosOcorrencias;
  quantidadeFiltros: number;
  aoMudarFiltros: (filtros: FiltrosOcorrencias) => void;
  aoAbrirFiltros: () => void;
  aoAbrir: (id: string) => void;
}

/** Visualização em mapa da aba Explorar: ocorrências, mapa de calor e Zonas de atenção. */
export function ExplorarMapa({
  filtros,
  quantidadeFiltros,
  aoMudarFiltros,
  aoAbrirFiltros,
  aoAbrir,
}: ExplorarMapaProps) {
  const { topo, base } = useEspacosTela({ comTabBar: true });
  const { mostrarToast } = useToast();
  const mapa = useRef<MapView>(null);
  const localizacao = useLocalizacao();

  const [camada, setCamada] = useState<CamadaMapa>('ocorrencias');
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);

  const lista = useOcorrencias(filtros, LIMITE_MAPA);
  // O contrato aceita uma categoria no mapa de calor: usada quando há exatamente uma no filtro.
  const categoriaCalor = filtros.categorias.length === 1 ? filtros.categorias[0] : undefined;
  const calor = useMapaDeCalor(AREA_SAO_PAULO, categoriaCalor, camada === 'calor');
  const zonas = useZonasDeAtencao();

  const selecionada = useMemo(
    () => lista.ocorrencias.find((ocorrencia) => ocorrencia.id === selecionadaId) ?? null,
    [lista.ocorrencias, selecionadaId],
  );

  const irParaMinhaPosicao = async () => {
    // RN-GER-07: localização pedida só neste toque.
    const posicao = await localizacao.obter();
    if (!posicao) {
      mostrarToast('Não foi possível usar sua localização. Verifique a permissão e o GPS.', 'erro');
      return;
    }
    if (!dentroDeSaoPaulo(posicao)) {
      mostrarToast('Por enquanto o Colecity funciona apenas na cidade de São Paulo.');
      return;
    }
    mapa.current?.animateToRegion(
      { latitude: posicao.lat, longitude: posicao.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 },
      500,
    );
  };

  const erro = camada === 'calor' ? (calor.error ?? null) : lista.erro;
  const carregando = camada === 'calor' ? calor.isPending : lista.carregando;
  const escondidas = lista.total - lista.ocorrencias.length;

  return (
    <View style={styles.raiz}>
      <MapaOcorrencias
        ref={mapa}
        camada={camada}
        ocorrencias={lista.ocorrencias}
        pontosCalor={calor.data ?? []}
        zonas={zonas.data ?? []}
        selecionadaId={selecionadaId}
        aoSelecionar={setSelecionadaId}
        mostrarUsuario={localizacao.permissao === 'concedida'}
        recuos={{ top: topo + 120, bottom: base + (selecionada ? 180 : 60), left: 0, right: 0 }}
      />

      <View pointerEvents="box-none" style={[styles.topo, { top: topo + espacos.sm }]}>
        <FilterBar
          filtros={filtros}
          quantidade={quantidadeFiltros}
          aoMudar={aoMudarFiltros}
          aoAbrirFiltros={aoAbrirFiltros}
        />
        <SegmentedControl rotulo="Camada do mapa" opcoes={CAMADAS} valor={camada} aoMudar={setCamada} />
        <OfflineBanner detalhe="O mapa mostra os últimos dados carregados." />
        {erro ? (
          <GlassSurface raio={raios.md} sombra="suave">
            <ErrorMessage
              compacto
              mensagem={mensagemDeErro(erro)}
              aoTentarNovamente={() => void (camada === 'calor' ? calor.refetch() : lista.recarregar())}
            />
          </GlassSurface>
        ) : null}
      </View>

      <View pointerEvents="box-none" style={[styles.base, { bottom: base }]}>
        <View style={styles.botaoPosicao}>
          <IconButton
            icone="locate-outline"
            rotulo="Ir para a minha localização"
            variante="vidro"
            onPress={() => void irParaMinhaPosicao()}
            disabled={localizacao.buscando}
          />
        </View>

        {camada === 'ocorrencias' && selecionada ? (
          <OcorrenciaCard ocorrencia={selecionada} onPress={aoAbrir} />
        ) : (
          <GlassSurface raio={raios.md} sombra="suave" style={styles.legenda}>
            <AppText variante="nota" cor="textoSecundario" accessibilityLiveRegion="polite">
              {carregando
                ? 'Carregando o mapa…'
                : camada === 'calor'
                  ? 'Cada número é o total de pessoas afetadas naquela área.'
                  : lista.ocorrencias.length === 0
                    ? 'Nenhuma ocorrência com esses filtros.'
                    : escondidas > 0
                      ? `Mostrando as ${lista.ocorrencias.length} ocorrências com mais participação de ${lista.total}. Toque em um marcador para ver o resumo.`
                      : 'Toque em um marcador para ver o resumo. Marcadores maiores têm mais participação.'}
            </AppText>
          </GlassSurface>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  topo: { position: 'absolute', left: 0, right: 0, paddingHorizontal: espacos.lg, gap: espacos.sm },
  base: { position: 'absolute', left: 0, right: 0, paddingHorizontal: espacos.lg, gap: espacos.sm },
  botaoPosicao: { alignSelf: 'flex-end' },
  legenda: { paddingVertical: espacos.md, paddingHorizontal: espacos.lg },
});
