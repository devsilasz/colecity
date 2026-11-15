import type { Coordenada } from '@/types/api';

const RAIO_TERRA_M = 6371000;

function rad(graus: number): number {
  return (graus * Math.PI) / 180;
}

/** Distância em metros entre dois pontos (haversine). */
export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(h));
}

/** Distância em metros de um ponto a um segmento (aproximação plana, boa para trechos curtos). */
function distanciaAoSegmento(p: Coordenada, a: Coordenada, b: Coordenada): number {
  const escalaLng = Math.cos(rad(p.lat));
  const px = (p.lng - a.lng) * escalaLng;
  const py = p.lat - a.lat;
  const bx = (b.lng - a.lng) * escalaLng;
  const by = b.lat - a.lat;
  const comprimento2 = bx * bx + by * by;
  const t = comprimento2 === 0 ? 0 : Math.min(1, Math.max(0, (px * bx + py * by) / comprimento2));
  const projecao: Coordenada = { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) };
  return distanciaMetros(p, projecao);
}

/** Menor distância em metros de um ponto a um trajeto (RN-TAV-07). */
export function distanciaAoTrajeto(ponto: Coordenada, trajeto: readonly Coordenada[]): number {
  if (trajeto.length === 0) return Infinity;
  if (trajeto.length === 1) return distanciaMetros(ponto, trajeto[0]);
  let menor = Infinity;
  for (let i = 0; i < trajeto.length - 1; i += 1) {
    menor = Math.min(menor, distanciaAoSegmento(ponto, trajeto[i], trajeto[i + 1]));
  }
  return menor;
}

/** Ponto a uma fração (0 a 1) do comprimento do trajeto. */
export function pontoNoTrajeto(trajeto: readonly Coordenada[], fracao: number): Coordenada {
  if (trajeto.length === 1) return trajeto[0];
  const f = Math.min(1, Math.max(0, fracao)) * (trajeto.length - 1);
  const i = Math.min(Math.floor(f), trajeto.length - 2);
  const t = f - i;
  return {
    lat: trajeto[i].lat + (trajeto[i + 1].lat - trajeto[i].lat) * t,
    lng: trajeto[i].lng + (trajeto[i + 1].lng - trajeto[i].lng) * t,
  };
}

/** Arredonda para ~100 m (RN-CSL-08). */
export function aproximar(ponto: Coordenada): Coordenada {
  return { lat: Math.round(ponto.lat * 1000) / 1000, lng: Math.round(ponto.lng * 1000) / 1000 };
}

/** "350 m" ou "1,2 km". */
export function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

/**
 * Checagem aproximada do município de São Paulo (retângulo envolvente).
 * A validação oficial, com o polígono do município, é do domínio (doc 10, seção 6).
 */
export function dentroDeSaoPaulo(ponto: Coordenada): boolean {
  return ponto.lat >= -24.01 && ponto.lat <= -23.35 && ponto.lng >= -46.83 && ponto.lng <= -46.36;
}

export const CENTRO_SAO_PAULO: Coordenada = { lat: -23.5505, lng: -46.6333 };
