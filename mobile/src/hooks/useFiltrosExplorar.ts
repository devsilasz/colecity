import { useCallback, useEffect, useState } from 'react';

import { CHAVES, lerJson, salvarJson } from '@/services/storage';
import type { Categoria } from '@/types/categoria';
import type { EstadoOcorrencia } from '@/types/estado';
import type { FiltrosOcorrencias } from '@/types/ocorrencia';

import { FILTROS_PADRAO } from './useOcorrencias';

/** Parte dos filtros que é lembrada entre aberturas do app (a distância depende da posição atual). */
interface FiltrosSalvos {
  categorias: Categoria[];
  estados: EstadoOcorrencia[];
}

/** Filtros da aba Explorar (RN-CSL-03), com categoria e estado salvos no AsyncStorage. */
export function useFiltrosExplorar() {
  const [filtros, setFiltros] = useState<FiltrosOcorrencias>(FILTROS_PADRAO);

  useEffect(() => {
    let ativo = true;
    void lerJson<FiltrosSalvos>(CHAVES.filtros).then((salvos) => {
      if (!ativo || !salvos) return;
      setFiltros((atual) => ({
        ...atual,
        categorias: salvos.categorias ?? [],
        estados: salvos.estados ?? [],
      }));
    });
    return () => {
      ativo = false;
    };
  }, []);

  const definir = useCallback((novos: FiltrosOcorrencias) => {
    setFiltros(novos);
    void salvarJson<FiltrosSalvos>(CHAVES.filtros, { categorias: novos.categorias, estados: novos.estados });
  }, []);

  const limpar = useCallback(() => definir(FILTROS_PADRAO), [definir]);

  const quantidade =
    filtros.categorias.length + filtros.estados.length + (filtros.proximidade ? 1 : 0);

  return { filtros, definir, limpar, quantidade };
}
