import { useQuery } from '@tanstack/react-query';

import { useViagemContext } from '@/context/ViagemContext';
import { transporteService } from '@/services';
import { chaves } from '@/services/queryClient';
import type { Linha } from '@/types/transporte';

/** Viagem "Estou neste ônibus" do usuário (RN-TAV-04, 05, 07). */
export function useViagem() {
  return useViagemContext();
}

/** Busca de linhas por número ou nome; o contrato exige ao menos 2 caracteres (RN-TAV-01). */
export function useBuscaLinhas(busca: string) {
  const termo = busca.trim();
  return useQuery({
    queryKey: chaves.linhas(termo),
    queryFn: () => transporteService.buscarLinhas(termo),
    enabled: termo.length >= 2,
    staleTime: 10 * 60 * 1000,
  });
}

/** Dados de uma linha pelo código (o contrato só tem a busca; filtramos o código exato). */
export function useLinha(codigo: string) {
  return useQuery({
    queryKey: chaves.linhas(codigo),
    queryFn: () => transporteService.buscarLinhas(codigo),
    enabled: codigo.length >= 2,
    staleTime: 10 * 60 * 1000,
    select: (linhas): Linha | null => linhas.find((linha) => linha.codigo === codigo) ?? null,
  });
}

/** Trajeto oficial da linha no sentido escolhido (RN-TAV-02). */
export function useTrajeto(codigo: string, sentido: 1 | 2) {
  return useQuery({
    queryKey: chaves.trajeto(codigo, sentido),
    queryFn: () => transporteService.trajeto(codigo, sentido),
    enabled: codigo.length > 0,
    staleTime: 60 * 60 * 1000,
  });
}

/** Posições dos ônibus, atualizadas a cada 15 s enquanto a tela está aberta (RN-TAV-03, 04). */
export function useVeiculos(codigo: string, sentido: 1 | 2) {
  return useQuery({
    queryKey: chaves.veiculos(codigo, sentido),
    queryFn: () => transporteService.veiculos(codigo, sentido),
    enabled: codigo.length > 0,
    refetchInterval: 15 * 1000,
    staleTime: 10 * 1000,
  });
}
