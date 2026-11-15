import type { Coordenada } from '@/types/api';
import type { Linha } from '@/types/transporte';

/**
 * Linhas fictícias inspiradas na rede da SPTrans, no formato de `GET /transporte/linhas`.
 * Os trajetos são aproximações com poucos pontos, apenas para demonstração.
 */
export interface LinhaSemente extends Linha {
  /** Trajeto do sentido 1; o sentido 2 é o inverso. */
  trajeto: Coordenada[];
  /** Quantos ônibus "SPTrans" o mock simula por sentido. */
  frota: number;
}

function p(lat: number, lng: number): Coordenada {
  return { lat, lng };
}

export const LINHAS_SEMENTE: LinhaSemente[] = [
  {
    codigo: '8700-10',
    nome: 'Pq. Continental – Pça. Ramos',
    sentidos: [
      { sentido: 1, destino: 'Pça. Ramos' },
      { sentido: 2, destino: 'Pq. Continental' },
    ],
    frota: 4,
    trajeto: [
      p(-23.529, -46.779), p(-23.5385, -46.764), p(-23.548, -46.749), p(-23.56, -46.728),
      p(-23.571, -46.708), p(-23.5675, -46.693), p(-23.564, -46.679), p(-23.5585, -46.669),
      p(-23.553, -46.66), p(-23.549, -46.649), p(-23.546, -46.639),
    ],
  },
  {
    codigo: '875A-10',
    nome: 'Aeroporto – Perdizes',
    sentidos: [
      { sentido: 1, destino: 'Perdizes' },
      { sentido: 2, destino: 'Aeroporto' },
    ],
    frota: 3,
    trajeto: [
      p(-23.6265, -46.6565), p(-23.612, -46.655), p(-23.598, -46.652), p(-23.585, -46.648),
      p(-23.571, -46.65), p(-23.561, -46.656), p(-23.552, -46.664), p(-23.543, -46.671), p(-23.536, -46.677),
    ],
  },
  {
    codigo: '177H-10',
    nome: 'Metrô Santana – Butantã USP',
    sentidos: [
      { sentido: 1, destino: 'Butantã USP' },
      { sentido: 2, destino: 'Metrô Santana' },
    ],
    frota: 3,
    trajeto: [
      p(-23.5025, -46.626), p(-23.515, -46.632), p(-23.528, -46.64), p(-23.54, -46.648),
      p(-23.551, -46.658), p(-23.558, -46.672), p(-23.565, -46.688), p(-23.5705, -46.705), p(-23.563, -46.722),
    ],
  },
  {
    codigo: '6913-10',
    nome: 'Term. Varginha – Term. Bandeira',
    sentidos: [
      { sentido: 1, destino: 'Term. Bandeira' },
      { sentido: 2, destino: 'Term. Varginha' },
    ],
    frota: 4,
    trajeto: [
      p(-23.781, -46.69), p(-23.748, -46.696), p(-23.715, -46.699), p(-23.682, -46.702),
      p(-23.65, -46.707), p(-23.622, -46.695), p(-23.598, -46.68), p(-23.575, -46.662), p(-23.5505, -46.639),
    ],
  },
  {
    codigo: '2290-10',
    nome: 'Term. São Mateus – Term. Pq. D. Pedro II',
    sentidos: [
      { sentido: 1, destino: 'Term. Pq. D. Pedro II' },
      { sentido: 2, destino: 'Term. São Mateus' },
    ],
    frota: 3,
    trajeto: [
      p(-23.612, -46.477), p(-23.607, -46.495), p(-23.602, -46.51), p(-23.594, -46.535),
      p(-23.586, -46.56), p(-23.583, -46.581), p(-23.572, -46.6), p(-23.558, -46.615), p(-23.5475, -46.628),
    ],
  },
  {
    codigo: '917H-10',
    nome: 'Term. Pirituba – Metrô Vila Mariana',
    sentidos: [
      { sentido: 1, destino: 'Metrô Vila Mariana' },
      { sentido: 2, destino: 'Term. Pirituba' },
    ],
    frota: 3,
    trajeto: [
      p(-23.487, -46.727), p(-23.501, -46.714), p(-23.5225, -46.701), p(-23.536, -46.677),
      p(-23.548, -46.662), p(-23.559, -46.647), p(-23.571, -46.641), p(-23.589, -46.635),
    ],
  },
  {
    codigo: '5119-10',
    nome: 'Term. Capelinha – Lgo. São Francisco',
    sentidos: [
      { sentido: 1, destino: 'Lgo. São Francisco' },
      { sentido: 2, destino: 'Term. Capelinha' },
    ],
    frota: 4,
    trajeto: [
      p(-23.659, -46.77), p(-23.653, -46.748), p(-23.65, -46.725), p(-23.65, -46.707),
      p(-23.628, -46.695), p(-23.604, -46.676), p(-23.58, -46.658), p(-23.562, -46.645), p(-23.549, -46.637),
    ],
  },
  {
    codigo: '4313-10',
    nome: 'Term. Cid. Tiradentes – Term. Pq. D. Pedro II',
    sentidos: [
      { sentido: 1, destino: 'Term. Pq. D. Pedro II' },
      { sentido: 2, destino: 'Term. Cid. Tiradentes' },
    ],
    frota: 3,
    trajeto: [
      p(-23.59, -46.401), p(-23.574, -46.43), p(-23.5405, -46.456), p(-23.54, -46.5),
      p(-23.535, -46.543), p(-23.54, -46.576), p(-23.544, -46.6), p(-23.5475, -46.628),
    ],
  },
  {
    codigo: '809L-10',
    nome: 'Campo Limpo – Lapa',
    sentidos: [
      { sentido: 1, destino: 'Lapa' },
      { sentido: 2, destino: 'Campo Limpo' },
    ],
    frota: 2,
    trajeto: [
      p(-23.648, -46.758), p(-23.625, -46.745), p(-23.6, -46.72), p(-23.5718, -46.7085),
      p(-23.556, -46.705), p(-23.54, -46.703), p(-23.5225, -46.701),
    ],
  },
  {
    codigo: '702U-10',
    nome: 'Cid. Universitária – Term. Pq. D. Pedro II',
    sentidos: [
      { sentido: 1, destino: 'Term. Pq. D. Pedro II' },
      { sentido: 2, destino: 'Cid. Universitária' },
    ],
    frota: 3,
    trajeto: [
      p(-23.561, -46.73), p(-23.5705, -46.708), p(-23.5667, -46.685), p(-23.561, -46.67),
      p(-23.554, -46.657), p(-23.549, -46.645), p(-23.5475, -46.628),
    ],
  },
];
