import { useEffect } from 'react';

import { useToast } from '@/context/ToastContext';
import { filaOffline } from '@/services/offlineQueue';
import { chaves, queryClient } from '@/services/queryClient';

import { useAuth } from './useAuth';
import { useConectividade } from './useConectividade';

/**
 * Envia a fila "Aguardando envio" quando há sessão e a conexão volta (RN-GER-10).
 * Usado uma única vez, no layout raiz.
 */
export function useSincronizarFila(): void {
  const { usuario } = useAuth();
  const { online } = useConectividade();
  const { mostrarToast } = useToast();
  const uid = usuario?.uid ?? null;

  useEffect(() => {
    if (!uid || !online) return;
    let ativo = true;

    void filaOffline.processar(uid).then((enviados) => {
      if (enviados === 0) return;
      void queryClient.invalidateQueries({ queryKey: chaves.ocorrencias });
      void queryClient.invalidateQueries({ queryKey: chaves.mapa });
      if (ativo) {
        mostrarToast(
          enviados === 1 ? '1 ação pendente foi enviada.' : `${enviados} ações pendentes foram enviadas.`,
          'sucesso',
        );
      }
    });

    return () => {
      ativo = false;
    };
  }, [uid, online, mostrarToast]);
}
