import { useEffect } from 'react';

import { tempoRealService } from '@/services';
import { chaves, queryClient } from '@/services/queryClient';

/**
 * Mantém o detalhe da ocorrência atualizado em tempo real (contagens, estado, conclusão):
 * quando outra pessoa participa ou o autor conclui, a tela é atualizada sozinha.
 * O listener é removido no cleanup.
 */
export function useOcorrenciaAoVivo(ocorrenciaId: string): void {
  useEffect(() => {
    if (!ocorrenciaId) return;
    return tempoRealService.assinarOcorrencia(ocorrenciaId, () => {
      void queryClient.invalidateQueries({ queryKey: chaves.ocorrencia(ocorrenciaId) });
      void queryClient.invalidateQueries({ queryKey: chaves.linhaDoTempo(ocorrenciaId) });
      void queryClient.invalidateQueries({ queryKey: chaves.apoiadores(ocorrenciaId) });
      // Estado e contagens aparecem também nas listas, no mapa e em Minhas.
      void queryClient.invalidateQueries({ queryKey: chaves.ocorrencias });
      void queryClient.invalidateQueries({ queryKey: chaves.todasMinhas });
      void queryClient.invalidateQueries({ queryKey: chaves.mapa });
    });
  }, [ocorrenciaId]);
}

/** Novos comentários aparecem sem precisar puxar para atualizar. O listener é removido no cleanup. */
export function useComentariosAoVivo(ocorrenciaId: string): void {
  useEffect(() => {
    if (!ocorrenciaId) return;
    return tempoRealService.assinarComentarios(ocorrenciaId, () => {
      void queryClient.invalidateQueries({ queryKey: chaves.comentarios(ocorrenciaId) });
    });
  }, [ocorrenciaId]);
}
