import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ExplorarMapa } from '@/components/mapa/ExplorarMapa';
import { useBloquearGestoAbas } from '@/components/navigation/CarrosselAbas';
import { FilterBar } from '@/components/ocorrencia/FilterBar';
import { FiltrosSheet } from '@/components/ocorrencia/FiltrosSheet';
import { ListaOcorrencias } from '@/components/ocorrencia/ListaOcorrencias';
import { IconButton } from '@/components/ui/IconButton';
import { LargeTitle } from '@/components/ui/LargeTitle';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { useCabecalhoRolavel, useEspacosTela } from '@/hooks/useCabecalhoRolavel';
import { useFilaOffline } from '@/hooks/useFilaOffline';
import { useFiltrosExplorar } from '@/hooks/useFiltrosExplorar';
import { useOcorrencias } from '@/hooks/useOcorrencias';
import { espacos } from '@/theme';

type Modo = 'lista' | 'mapa';

/** Explorar: consulta aberta a visitantes, em lista ou mapa, com filtros (RN-CSL-01 a 05). */
export default function ExplorarScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { scrollY, aoRolar } = useCabecalhoRolavel();
  const { topo, base } = useEspacosTela({ comTabBar: true });
  const { filtros, definir, limpar, quantidade } = useFiltrosExplorar();
  const lista = useOcorrencias(filtros);
  const fila = useFilaOffline(usuario?.uid ?? null);

  const [modo, setModo] = useState<Modo>('lista');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  // No mapa, arrastar para os lados move o mapa, não troca de aba.
  useBloquearGestoAbas(modo === 'mapa');

  const abrir = useCallback(
    (id: string) => router.push({ pathname: '/explorar/[id]', params: { id } }),
    [router],
  );
  const abrirFiltros = useCallback(() => setFiltrosAbertos(true), []);

  const idsAguardando = new Set(
    fila.itens.flatMap((item) => (item.acao.tipo === 'CRIAR_OCORRENCIA' ? [] : [item.acao.ocorrenciaId])),
  );

  const alternarModo = (
    <IconButton
      icone={modo === 'lista' ? 'map-outline' : 'list-outline'}
      rotulo={modo === 'lista' ? 'Ver no mapa' : 'Ver em lista'}
      onPress={() => setModo(modo === 'lista' ? 'mapa' : 'lista')}
    />
  );

  const barraFiltros = (
    <FilterBar filtros={filtros} quantidade={quantidade} aoMudar={definir} aoAbrirFiltros={abrirFiltros} />
  );

  return (
    <>
      {modo === 'lista' ? (
        <Screen sobreposicao={<ScreenHeader titulo="Explorar" scrollY={scrollY} direita={alternarModo} />}>
          <ListaOcorrencias
            ocorrencias={lista.ocorrencias}
            carregando={lista.carregando}
            erro={lista.erro}
            atualizando={lista.atualizando}
            pausada={lista.pausada}
            aoRecarregar={lista.recarregar}
            aoAbrir={abrir}
            temMais={lista.temMais}
            carregandoMais={lista.carregandoMais}
            aoCarregarMais={lista.carregarMais}
            idsAguardandoEnvio={idsAguardando}
            recuoTopo={topo}
            recuoBase={base}
            aoRolar={aoRolar}
            cabecalho={
              <View style={styles.cabecalho}>
                <LargeTitle
                  titulo="Explorar"
                  subtitulo="O que está acontecendo em São Paulo"
                  scrollY={scrollY}
                />
                {barraFiltros}
              </View>
            }
            vazio={
              quantidade > 0
                ? {
                    icone: 'funnel-outline',
                    titulo: 'Nenhuma ocorrência com esses filtros',
                    descricao: 'Tente outra categoria, outro estado ou uma distância maior.',
                    rotuloAcao: 'Limpar filtros',
                    aoAgir: limpar,
                  }
                : {
                    icone: 'search-outline',
                    titulo: 'Nenhuma ocorrência por aqui',
                    descricao: 'Ainda não há ocorrências abertas. Registre o que está acontecendo no seu bairro.',
                    rotuloAcao: 'Registrar ocorrência',
                    iconeAcao: 'add',
                    aoAgir: () => router.push('/registrar'),
                  }
            }
          />
        </Screen>
      ) : (
        // O mapa é uma superfície nativa: as camadas por cima usam o vidro sem blur.
        <Screen>
          <ExplorarMapa
            filtros={filtros}
            quantidadeFiltros={quantidade}
            aoMudarFiltros={definir}
            aoAbrirFiltros={abrirFiltros}
            aoAbrir={abrir}
          />
          <ScreenHeader titulo="Explorar" direita={alternarModo} />
        </Screen>
      )}

      <FiltrosSheet
        visivel={filtrosAbertos}
        aoFechar={() => setFiltrosAbertos(false)}
        filtros={filtros}
        aoMudar={definir}
        aoLimpar={limpar}
        total={lista.carregando ? undefined : lista.total}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cabecalho: { gap: espacos.md },
});
