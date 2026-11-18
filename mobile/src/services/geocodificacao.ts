import * as Location from 'expo-location';

import { BAIRROS_REFERENCIA } from '@/mocks/ocorrencias';
import type { Coordenada } from '@/types/api';
import { distanciaMetros } from '@/utils/distancia';

/**
 * Geocodificação reversa para montar o título "Tipo – Rua, Bairro" (RN-REG-07).
 * Sem a API de domínio, quem faz isso é o geocodificador do aparelho; se ele falhar
 * (sem permissão ou sem serviço), usa o bairro conhecido mais próximo.
 */
export async function geocodificar(ponto: Coordenada): Promise<{ rua: string; bairro: string }> {
  const maisProximo = BAIRROS_REFERENCIA.reduce((melhor, atual) =>
    distanciaMetros(ponto, atual) < distanciaMetros(ponto, melhor) ? atual : melhor,
  );
  try {
    const limite = new Promise<null>((resolver) => setTimeout(() => resolver(null), 2500));
    const resultado = await Promise.race([
      Location.reverseGeocodeAsync({ latitude: ponto.lat, longitude: ponto.lng }),
      limite,
    ]);
    const endereco = resultado?.[0];
    if (endereco) {
      return {
        rua: endereco.street ?? '',
        bairro: endereco.district ?? endereco.subregion ?? maisProximo.bairro,
      };
    }
  } catch {
    // Sem permissão ou sem serviço de geocodificação: segue com o bairro de referência.
  }
  return { rua: '', bairro: maisProximo.bairro };
}
