import { useQuery } from '@tanstack/react-query';

import { ocorrenciaService } from '@/services';
import { chaves } from '@/services/queryClient';
import type { AreaMapa } from '@/types/api';
import type { Categoria } from '@/types/categoria';

/** Área que cobre o município de São Paulo com folga. */
export const AREA_SAO_PAULO: AreaMapa = { minLat: -24.05, minLng: -46.9, maxLat: -23.3, maxLng: -46.3 };

const CINCO_MINUTOS = 5 * 60 * 1000;

/** Mapa de calor: peso = afetados distintos por área (RN-DES-01, RN-ZON-04). */
export function useMapaDeCalor(area: AreaMapa = AREA_SAO_PAULO, categoria?: Categoria, ativo = true) {
  return useQuery({
    queryKey: chaves.mapaCalor(area, categoria),
    queryFn: () => ocorrenciaService.mapaDeCalor(area, categoria),
    // O domínio recalcula a agregação a cada 5 minutos.
    staleTime: CINCO_MINUTOS,
    enabled: ativo,
  });
}

/** Zonas de atenção (RN-ZON-01 a 03). */
export function useZonasDeAtencao(area: AreaMapa = AREA_SAO_PAULO, ativo = true) {
  return useQuery({
    queryKey: chaves.mapaZonas(area),
    queryFn: () => ocorrenciaService.zonasDeAtencao(area),
    staleTime: CINCO_MINUTOS,
    enabled: ativo,
  });
}
