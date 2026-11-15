import type { Coordenada } from './api';

/** Modelos do Transporte ao vivo — doc 10, seção 4.8. */

export type FontePosicao = 'SPTRANS' | 'PASSAGEIROS';

export interface LinhaRef {
  codigo: string;
  nome: string;
}

export interface SentidoLinha {
  sentido: 1 | 2;
  destino: string;
}

export interface Linha extends LinhaRef {
  sentidos: SentidoLinha[];
}

export interface Trajeto {
  pontos: Coordenada[];
}

export interface Veiculo {
  fonte: FontePosicao;
  /** `null` para posições relatadas por passageiros. */
  prefixo: string | null;
  posicao: Coordenada;
  atualizadoEm: string;
  acessivel: boolean | null;
}

export interface Viagem {
  viagemId: string;
  expiraEm: string;
}

export interface NovaPosicao {
  posicao: Coordenada;
  registradaEm: string;
}

export interface RespostaPosicao {
  ativa: boolean;
  desvioSuspeito: boolean;
  trechoDesvio: Coordenada[] | null;
}

export interface RespostaDesvio {
  ocorrenciaId: string | null;
}
