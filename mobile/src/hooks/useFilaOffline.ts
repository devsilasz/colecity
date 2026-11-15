import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { filaOffline, type ItemFila } from '@/services/offlineQueue';

/** Itens "Aguardando envio" da fila offline (RN-GER-10). */
export function useFilaOffline(uid: string | null) {
  const todos = useSyncExternalStore(filaOffline.assinar, filaOffline.obter, filaOffline.obter);

  useEffect(() => {
    void filaOffline.carregar();
  }, []);

  const itens = useMemo<ItemFila[]>(
    () => (uid ? todos.filter((item) => item.uid === uid) : []),
    [todos, uid],
  );

  const comErro = useMemo(() => itens.filter((item) => item.status === 'ERRO'), [itens]);

  return {
    itens,
    pendentes: itens.length - comErro.length,
    comErro,
    remover: filaOffline.remover,
    tentarNovamente: filaOffline.tentarNovamente,
  };
}

/** Ações pendentes de uma ocorrência específica (para o selo "Aguardando envio"). */
export function pendentesDaOcorrencia(itens: readonly ItemFila[], ocorrenciaId: string): ItemFila[] {
  return itens.filter(
    (item) => item.acao.tipo !== 'CRIAR_OCORRENCIA' && item.acao.ocorrenciaId === ocorrenciaId,
  );
}
