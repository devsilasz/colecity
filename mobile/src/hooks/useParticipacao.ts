import { useMutation } from '@tanstack/react-query';

import { userDataService } from '@/services';
import { enviarOuEnfileirar } from '@/services/offlineQueue';
import { chaves, queryClient } from '@/services/queryClient';
import type { OcorrenciaDetalhe, TipoParticipacao } from '@/types/ocorrencia';

import { useAuth } from './useAuth';
import { useConectividade } from './useConectividade';

interface Pedido {
  tipo: TipoParticipacao;
  marcar: boolean;
}

/**
 * Marcar/retirar "Também estou sendo afetado" e "Apoiar" (RN-PAR-01 a 05).
 * Sem conexão, a ação vai para a fila "Aguardando envio" (RN-GER-10).
 * `enfileirada` no resultado diz à tela qual feedback mostrar.
 */
export function useParticipacao(ocorrenciaId: string) {
  const { usuario } = useAuth();
  const { online } = useConectividade();

  return useMutation({
    mutationFn: async ({ tipo, marcar }: Pedido) => {
      if (!usuario) throw new Error('Participação exige login.');
      return enviarOuEnfileirar(
        { tipo: 'PARTICIPAR', ocorrenciaId, participacao: tipo, marcar },
        usuario.uid,
        online,
      );
    },
    onSuccess: (envio, pedido) => {
      // Ao passar a acompanhar, a visita vira a base do indicador "novidade" (RN-MIN-04).
      if (usuario && pedido.marcar) {
        void userDataService
          .registrarVisita(usuario.uid, ocorrenciaId)
          .then(() => queryClient.invalidateQueries({ queryKey: chaves.dadosUsuario(usuario.uid) }))
          .catch(() => undefined);
      }
      if (envio.enfileirada) return;

      const { resultado } = envio;
      if (resultado.tipo === 'PARTICIPAR' && resultado.resposta) {
        const { resposta } = resultado;
        queryClient.setQueryData<OcorrenciaDetalhe>(chaves.ocorrencia(ocorrenciaId), (atual) =>
          atual ? { ...atual, ...resposta } : atual,
        );
      }
      // Contagens, estado (3 afetados → Em acompanhamento), linha do tempo, apoiadores e "Minhas".
      void queryClient.invalidateQueries({ queryKey: chaves.ocorrencias });
      void queryClient.invalidateQueries({ queryKey: chaves.mapa });
    },
  });
}
