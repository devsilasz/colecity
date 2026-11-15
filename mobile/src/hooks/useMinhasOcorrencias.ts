import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { usuarioService } from '@/services';
import { chaves } from '@/services/queryClient';
import type { AbaMinhas, OcorrenciaResumo } from '@/types/ocorrencia';
import type { EstadoOcorrenciaUsuario } from '@/types/usuario';

/** Ocorrências do usuário por aba: registradas, sou afetado e apoio (RN-MIN-01, 02). */
export function useMinhasOcorrencias(aba: AbaMinhas, ativo: boolean) {
  const consulta = useInfiniteQuery({
    queryKey: chaves.minhas(aba),
    queryFn: ({ pageParam }) => usuarioService.minhasOcorrencias(aba, pageParam),
    initialPageParam: 1,
    getNextPageParam: (ultima) =>
      ultima.page * ultima.pageSize < ultima.total ? ultima.page + 1 : undefined,
    enabled: ativo,
  });

  const ocorrencias = useMemo<OcorrenciaResumo[]>(
    () => consulta.data?.pages.flatMap((pagina) => pagina.items) ?? [],
    [consulta.data],
  );

  return {
    ocorrencias,
    carregando: consulta.isPending,
    erro: consulta.isError ? consulta.error : null,
    atualizando: consulta.isRefetching,
    pausada: consulta.fetchStatus === 'paused',
    temMais: consulta.hasNextPage,
    carregandoMais: consulta.isFetchingNextPage,
    carregarMais: consulta.fetchNextPage,
    recarregar: consulta.refetch,
  };
}

/**
 * Ids com atividade nova desde a última visita do usuário (RN-MIN-04).
 * Ocorrência que o usuário acompanha e nunca abriu também conta como novidade.
 */
export function idsComNovidade(
  ocorrencias: readonly OcorrenciaResumo[],
  estados: Record<string, EstadoOcorrenciaUsuario> | undefined,
): Set<string> {
  const ids = new Set<string>();
  // Sem os estados carregados ainda, não marca nada (evita "piscar" tudo como novo).
  if (!estados) return ids;

  for (const ocorrencia of ocorrencias) {
    const vistaEm = estados[ocorrencia.id]?.lastSeenAt ?? null;
    if (vistaEm === null || new Date(ocorrencia.ultimaAtividadeEm).getTime() > new Date(vistaEm).getTime()) {
      ids.add(ocorrencia.id);
    }
  }
  return ids;
}
