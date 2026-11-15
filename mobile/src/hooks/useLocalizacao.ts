import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { Coordenada } from '@/types/api';

export type PermissaoLocalizacao = 'indefinida' | 'concedida' | 'negada';

function paraPermissao(status: Location.PermissionStatus): PermissaoLocalizacao {
  if (status === Location.PermissionStatus.GRANTED) return 'concedida';
  if (status === Location.PermissionStatus.DENIED) return 'negada';
  return 'indefinida';
}

/**
 * Localização do aparelho, pedida só no momento de uso (RN-GER-07).
 * Ao montar, apenas consulta a permissão já dada; o pedido acontece em `obter()`.
 */
export function useLocalizacao() {
  const [permissao, setPermissao] = useState<PermissaoLocalizacao>('indefinida');
  const [posicao, setPosicao] = useState<Coordenada | null>(null);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    let ativo = true;
    Location.getForegroundPermissionsAsync()
      .then((resposta) => {
        if (ativo) setPermissao(paraPermissao(resposta.status));
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);

  /** Pede a permissão (se preciso) e devolve a posição atual, ou `null` se negada/indisponível. */
  const obter = useCallback(async (): Promise<Coordenada | null> => {
    setBuscando(true);
    try {
      const resposta = await Location.requestForegroundPermissionsAsync();
      const nova = paraPermissao(resposta.status);
      setPermissao(nova);
      if (nova !== 'concedida') return null;

      const atual =
        (await Location.getLastKnownPositionAsync({ maxAge: 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const coordenada = { lat: atual.coords.latitude, lng: atual.coords.longitude };
      setPosicao(coordenada);
      return coordenada;
    } catch {
      // GPS desligado ou sem sinal: tratado por quem chamou como "posição indisponível".
      return null;
    } finally {
      setBuscando(false);
    }
  }, []);

  return { permissao, posicao, buscando, obter };
}
