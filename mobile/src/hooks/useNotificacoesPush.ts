import { useRouter } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';

import { notificacoes, type EstadoPush } from '@/services/notificacoes';

/** Situação do push neste aparelho (ativo, permissão negada, sem token...). */
export function useEstadoPush(): EstadoPush {
  return useSyncExternalStore(notificacoes.assinar, notificacoes.obterEstado);
}

/**
 * Liga o push ao ciclo de vida do app (usado uma vez, no layout raiz):
 * configura o canal, renova o token da conta logada e abre a ocorrência ao tocar na notificação.
 * Todos os listeners são removidos no cleanup. No Expo Go não faz nada.
 */
export function useNotificacoesPush(uid: string | null): void {
  const router = useRouter();

  useEffect(() => {
    void notificacoes.configurar();
  }, []);

  // Não pede permissão aqui (RN-NOT-01): só regrava o token de quem já permitiu.
  useEffect(() => {
    if (!uid) return;
    void notificacoes.registrarAparelho({ pedir: false });
    return notificacoes.aoMudarToken();
  }, [uid]);

  useEffect(
    () =>
      notificacoes.aoTocar((ocorrenciaId) =>
        router.push({ pathname: '/explorar/[id]', params: { id: ocorrenciaId } }),
      ),
    [router],
  );
}
