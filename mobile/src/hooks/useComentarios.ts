import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';

import { comentarioService } from '@/services';
import type { FotoLocal } from '@/services/contratos';
import { enviarOuEnfileirar } from '@/services/offlineQueue';
import { chaves, queryClient } from '@/services/queryClient';
import type { Comentario } from '@/types/comentario';

import { useAuth } from './useAuth';
import { useConectividade } from './useConectividade';

/** Comentários da ocorrência, do mais antigo para o mais novo (RN-COM-05). */
export function useComentarios(ocorrenciaId: string) {
  const { usuario } = useAuth();
  const { online } = useConectividade();
  const chave = chaves.comentarios(ocorrenciaId);

  const consulta = useInfiniteQuery({
    queryKey: chave,
    queryFn: ({ pageParam }) => comentarioService.listar(ocorrenciaId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (ultima) =>
      ultima.page * ultima.pageSize < ultima.total ? ultima.page + 1 : undefined,
    enabled: ocorrenciaId.length > 0,
  });

  const comentarios = useMemo<Comentario[]>(
    () => consulta.data?.pages.flatMap((pagina) => pagina.items) ?? [],
    [consulta.data],
  );

  const atualizarTudo = () => {
    void queryClient.invalidateQueries({ queryKey: chave });
    // A última atividade da ocorrência muda com o comentário.
    void queryClient.invalidateQueries({ queryKey: chaves.ocorrencia(ocorrenciaId) });
  };

  const criar = useMutation({
    mutationFn: async ({ texto, fotos }: { texto: string; fotos: FotoLocal[] }) => {
      if (!usuario) throw new Error('Comentar exige login.');
      return enviarOuEnfileirar(
        { tipo: 'COMENTAR', ocorrenciaId, texto: texto.trim(), fotosLocais: fotos },
        usuario.uid,
        online,
      );
    },
    onSuccess: (envio) => {
      if (!envio.enfileirada) atualizarTudo();
    },
  });

  const excluir = useMutation({
    mutationFn: (comentarioId: string) => comentarioService.excluir(comentarioId),
    onSuccess: atualizarTudo,
  });

  return {
    comentarios,
    total: consulta.data?.pages[0]?.total ?? 0,
    carregando: consulta.isPending,
    erro: consulta.isError ? consulta.error : null,
    atualizando: consulta.isRefetching,
    pausada: consulta.fetchStatus === 'paused',
    temMais: consulta.hasNextPage,
    carregandoMais: consulta.isFetchingNextPage,
    carregarMais: consulta.fetchNextPage,
    recarregar: consulta.refetch,
    criar,
    excluir,
  };
}
