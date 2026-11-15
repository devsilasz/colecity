import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { userDataService } from '@/services';
import { chaves, queryClient } from '@/services/queryClient';
import type { EstadoOcorrenciaUsuario } from '@/types/usuario';

type Estados = Record<string, EstadoOcorrenciaUsuario>;

/** Estados por ocorrência do usuário: silenciada e última visita (RN-NOT-04, RN-MIN-04). */
export function useEstadosOcorrencias(uid: string | null) {
  return useQuery({
    queryKey: [...chaves.dadosUsuario(uid ?? ''), 'ocorrencias'] as const,
    queryFn: () => userDataService.obterEstados(uid ?? ''),
    enabled: uid !== null,
    networkMode: 'always',
  });
}

/**
 * Para a tela de detalhe: registra a visita (base do indicador "novidade")
 * e permite silenciar as notificações da ocorrência.
 */
export function useEstadoOcorrenciaUsuario(uid: string | null, ocorrenciaId: string) {
  const chave = [...chaves.dadosUsuario(uid ?? ''), 'ocorrencias'] as const;
  const estados = useEstadosOcorrencias(uid);

  useEffect(() => {
    if (!uid || !ocorrenciaId) return;
    void userDataService
      .registrarVisita(uid, ocorrenciaId)
      .then(() => queryClient.invalidateQueries({ queryKey: chave }))
      .catch(() => undefined);
    // `chave` é derivada de `uid`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, ocorrenciaId]);

  const silenciar = useMutation({
    mutationFn: (silenciada: boolean) => userDataService.definirSilenciada(uid ?? '', ocorrenciaId, silenciada),
    onMutate: (silenciada) => {
      queryClient.setQueryData<Estados>(chave, (atual = {}) => ({
        ...atual,
        [ocorrenciaId]: { lastSeenAt: atual[ocorrenciaId]?.lastSeenAt ?? null, muted: silenciada },
      }));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: chave }),
  });

  return {
    silenciada: estados.data?.[ocorrenciaId]?.muted ?? false,
    definirSilenciada: silenciar.mutateAsync,
  };
}
