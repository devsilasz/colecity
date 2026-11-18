import { doc, onSnapshot, query, where } from 'firebase/firestore';

import type { TempoRealService } from '@/services/contratos';

import { colecoes, invalidarCacheFirestore } from './base';

/**
 * Listeners em tempo real do Firestore. Cada função devolve o cancelamento do listener,
 * que a tela chama no cleanup do `useEffect`. O primeiro disparo (estado atual) é ignorado:
 * só interessam as mudanças feitas depois que a tela abriu.
 */
function ouvir(assinar: (aoReceber: () => void) => () => void, aoMudar: () => void): () => void {
  let primeiro = true;
  return assinar(() => {
    if (primeiro) {
      primeiro = false;
      return;
    }
    invalidarCacheFirestore();
    aoMudar();
  });
}

export const tempoRealFirestore: TempoRealService = {
  assinarOcorrencia: (ocorrenciaId, aoMudar) =>
    ouvir(
      (aoReceber) =>
        onSnapshot(doc(colecoes.ocorrencias, ocorrenciaId), aoReceber, () => {
          // Sem conexão ou sem permissão: a tela continua com os dados já carregados.
        }),
      aoMudar,
    ),

  assinarComentarios: (ocorrenciaId, aoMudar) =>
    ouvir(
      (aoReceber) =>
        onSnapshot(
          query(colecoes.comentarios, where('ocorrenciaId', '==', ocorrenciaId)),
          aoReceber,
          () => {
            // Idem: falha no listener não derruba a tela.
          },
        ),
      aoMudar,
    ),
};
