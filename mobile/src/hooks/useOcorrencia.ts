import { useQuery } from '@tanstack/react-query';

import { ocorrenciaService } from '@/services';
import { chaves } from '@/services/queryClient';

/** Detalhe da ocorrência (RN-CSL-06). */
export function useOcorrencia(id: string) {
  return useQuery({
    queryKey: chaves.ocorrencia(id),
    queryFn: () => ocorrenciaService.obter(id),
    enabled: id.length > 0,
  });
}

/** Linha do tempo automática (RN-ACO-03). */
export function useLinhaDoTempo(id: string) {
  return useQuery({
    queryKey: chaves.linhaDoTempo(id),
    queryFn: () => ocorrenciaService.linhaDoTempo(id),
    enabled: id.length > 0,
  });
}

/** Lista de apoiadores, só o nome público (RN-PAR-06). `ativo: false` em Segurança (RN-PAR-07). */
export function useApoiadores(id: string, ativo = true) {
  return useQuery({
    queryKey: chaves.apoiadores(id),
    queryFn: () => ocorrenciaService.apoiadores(id, 1),
    enabled: ativo && id.length > 0,
  });
}
