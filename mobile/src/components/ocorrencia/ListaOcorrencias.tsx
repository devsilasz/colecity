import { useCallback, type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';

import { EmptyState, type EmptyStateProps } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { Card } from '@/components/ui/Card';
import { useTema } from '@/context/ThemeContext';
import { mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';
import type { OcorrenciaResumo } from '@/types/ocorrencia';

import { OcorrenciaCard } from './OcorrenciaCard';

type ScrollHandler = React.ComponentProps<typeof Animated.FlatList<OcorrenciaResumo>>['onScroll'];

export interface ListaOcorrenciasProps {
  ocorrencias: readonly OcorrenciaResumo[];
  carregando: boolean;
  erro: unknown;
  atualizando: boolean;
  /** Consulta pausada por falta de conexão e sem cache. */
  pausada?: boolean;
  aoRecarregar: () => void;
  aoAbrir: (id: string) => void;
  temMais?: boolean;
  carregandoMais?: boolean;
  aoCarregarMais?: () => void;
  /** Conteúdo acima da lista (título grande, filtros). */
  cabecalho?: ReactElement;
  vazio: EmptyStateProps;
  /** Ids com atividade nova (RN-MIN-04) e com ação na fila offline (RN-GER-10). */
  idsComNovidade?: ReadonlySet<string>;
  idsAguardandoEnvio?: ReadonlySet<string>;
  recuoTopo: number;
  recuoBase: number;
  aoRolar?: ScrollHandler;
  scrollY?: SharedValue<number>;
  rodape?: ReactNode;
}

/** Lista de ocorrências com loading, erro, vazio, offline, atualizar e paginação. */
export function ListaOcorrencias({
  ocorrencias,
  carregando,
  erro,
  atualizando,
  pausada = false,
  aoRecarregar,
  aoAbrir,
  temMais = false,
  carregandoMais = false,
  aoCarregarMais,
  cabecalho,
  vazio,
  idsComNovidade,
  idsAguardandoEnvio,
  recuoTopo,
  recuoBase,
  aoRolar,
  rodape,
}: ListaOcorrenciasProps) {
  const { cores } = useTema();

  const renderItem = useCallback<ListRenderItem<OcorrenciaResumo>>(
    ({ item }) => (
      <OcorrenciaCard
        ocorrencia={item}
        onPress={aoAbrir}
        novidade={idsComNovidade?.has(item.id)}
        aguardandoEnvio={idsAguardandoEnvio?.has(item.id)}
      />
    ),
    [aoAbrir, idsComNovidade, idsAguardandoEnvio],
  );

  const aoChegarAoFim = useCallback(() => {
    if (temMais && !carregandoMais) aoCarregarMais?.();
  }, [temMais, carregandoMais, aoCarregarMais]);

  const semDados = ocorrencias.length === 0;

  let estado: ReactElement | null = null;
  if (semDados) {
    if (carregando && !pausada) {
      estado = <SkeletonList />;
    } else if (pausada) {
      estado = (
        <Card semPadding>
          <EmptyState
            icone="cloud-offline-outline"
            titulo="Sem conexão"
            descricao="Conecte-se à internet para carregar as ocorrências."
            rotuloAcao="Tentar novamente"
            iconeAcao="refresh-outline"
            aoAgir={aoRecarregar}
          />
        </Card>
      );
    } else if (erro) {
      estado = (
        <Card semPadding>
          <ErrorMessage
            mensagem={mensagemDeErro(erro)}
            aoTentarNovamente={aoRecarregar}
            tentando={atualizando}
          />
        </Card>
      );
    } else {
      estado = (
        <Card semPadding>
          <EmptyState {...vazio} />
        </Card>
      );
    }
  }

  return (
    <Animated.FlatList
      data={ocorrencias}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onScroll={aoRolar}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onEndReached={aoChegarAoFim}
      onEndReachedThreshold={0.4}
      contentContainerStyle={[styles.conteudo, { paddingTop: recuoTopo, paddingBottom: recuoBase }]}
      refreshControl={
        <RefreshControl
          refreshing={atualizando && !carregandoMais}
          onRefresh={aoRecarregar}
          tintColor={cores.primaria}
          colors={[cores.primaria]}
          progressViewOffset={recuoTopo}
        />
      }
      ListHeaderComponent={
        <View style={styles.cabecalho}>
          {cabecalho}
          <OfflineBanner detalhe="Mostrando as últimas ocorrências carregadas." />
          {!semDados && erro ? (
            <Card semPadding>
              <ErrorMessage
                compacto
                mensagem="Não foi possível atualizar. Mostrando os últimos dados carregados."
                aoTentarNovamente={aoRecarregar}
                tentando={atualizando}
              />
            </Card>
          ) : null}
          {estado}
        </View>
      }
      ListFooterComponent={
        <View style={styles.rodape}>
          {carregandoMais ? (
            <ActivityIndicator color={cores.primaria} accessibilityLabel="Carregando mais ocorrências" />
          ) : null}
          {rodape}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  conteudo: { paddingHorizontal: espacos.lg, gap: espacos.md },
  cabecalho: { gap: espacos.md },
  rodape: { paddingVertical: espacos.sm, gap: espacos.md },
});
