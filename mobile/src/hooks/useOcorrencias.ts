import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ocorrenciaService } from '@/services';
import { chaves } from '@/services/queryClient';
import type { FiltrosOcorrencias, OcorrenciaResumo } from '@/types/ocorrencia';

const TAMANHO_PAGINA = 20;

export const FILTROS_PADRAO: FiltrosOcorrencias = { categorias: [], estados: [], proximidade: null };

/** Lista paginada de ocorrências com filtros (RN-CSL-02 a 05). */
export function useOcorrencias(
  filtros: FiltrosOcorrencias = FILTROS_PADRAO,
  tamanhoPagina: number = TAMANHO_PAGINA,
) {
  const consulta = useInfiniteQuery({
    queryKey: [...chaves.listaOcorrencias(filtros), tamanhoPagina] as const,
    queryFn: ({ pageParam }) => ocorrenciaService.listar(filtros, pageParam, tamanhoPagina),
    initialPageParam: 1,
    getNextPageParam: (ultima) =>
      ultima.page * ultima.pageSize < ultima.total ? ultima.page + 1 : undefined,
  });

  const ocorrencias = useMemo<OcorrenciaResumo[]>(
    () => consulta.data?.pages.flatMap((pagina) => pagina.items) ?? [],
    [consulta.data],
  );

  return {
    ocorrencias,
    total: consulta.data?.pages[0]?.total ?? 0,
    carregando: consulta.isPending,
    erro: consulta.isError ? consulta.error : null,
    atualizando: consulta.isRefetching,
    /** Sem conexão e sem cache: a consulta fica pausada. */
    pausada: consulta.fetchStatus === 'paused',
    temMais: consulta.hasNextPage,
    carregandoMais: consulta.isFetchingNextPage,
    carregarMais: consulta.fetchNextPage,
    recarregar: consulta.refetch,
  };
}
