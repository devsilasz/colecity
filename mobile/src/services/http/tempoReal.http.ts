import { AppState } from 'react-native';

import type { TempoRealService } from '@/services/contratos';

/**
 * "Ao vivo" com o BFF: o domínio não tem canal de tempo real, então a tela aberta é
 * atualizada a cada 20 s (só com o app em primeiro plano). Cada assinatura devolve a função
 * que para o intervalo, chamada no cleanup do hook.
 */
const INTERVALO_MS = 20_000;

function assinar(aoMudar: () => void): () => void {
  const timer = setInterval(() => {
    if (AppState.currentState === 'active') aoMudar();
  }, INTERVALO_MS);
  return () => clearInterval(timer);
}

export const tempoRealHttp: TempoRealService = {
  assinarOcorrencia: (_ocorrenciaId, aoMudar) => assinar(aoMudar),
  assinarComentarios: (_ocorrenciaId, aoMudar) => assinar(aoMudar),
};
