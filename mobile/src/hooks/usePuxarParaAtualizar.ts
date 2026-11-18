import { useCallback, useState } from 'react';

/**
 * Estado do "puxar para atualizar" que só liga quando a pessoa puxa a lista.
 * As atualizações automáticas (tempo real a cada 20 s, foco na tela) correm em segundo plano,
 * sem mostrar o indicador: no iOS, o indicador ligado sozinho empurrava o conteúdo para baixo.
 */
export function usePuxarParaAtualizar(recarregar: () => unknown) {
  const [puxando, setPuxando] = useState(false);
  const aoPuxar = useCallback(() => {
    setPuxando(true);
    void Promise.resolve(recarregar()).finally(() => setPuxando(false));
  }, [recarregar]);
  return { puxando, aoPuxar };
}
