import type { TipoParticipacao } from '@/types/ocorrencia';

/**
 * Rotas do BFF, em um só lugar.
 *
 * Seguem o contrato app ↔ BFF do doc 08, seção 11: os caminhos espelham o doc 10, agrupados por
 * recurso (`usuarios`, `ocorrencias`, `participacoes`, `comentarios`, `transporte`), sob
 * `EXPO_PUBLIC_BFF_URL`. O BFF converte cada um no caminho do domínio (`bff/src/rotas.ts`).
 * As fotos vão para `POST /fotos` (`upload.http.ts`).
 */
const id = encodeURIComponent;

export const rotas = {
  health: '/health',

  usuarioEu: '/usuarios/me',
  minhasOcorrencias: '/usuarios/me/ocorrencias',

  categorias: '/ocorrencias/categorias',

  ocorrencias: '/ocorrencias',
  ocorrencia: (ocorrenciaId: string) => `/ocorrencias/${id(ocorrenciaId)}`,
  linhaDoTempo: (ocorrenciaId: string) => `/ocorrencias/${id(ocorrenciaId)}/linha-do-tempo`,
  apoiadores: (ocorrenciaId: string) => `/ocorrencias/${id(ocorrenciaId)}/apoiadores`,
  semelhantes: '/ocorrencias/semelhantes',
  conclusao: (ocorrenciaId: string) => `/ocorrencias/${id(ocorrenciaId)}/conclusao`,
  reabertura: (ocorrenciaId: string) => `/ocorrencias/${id(ocorrenciaId)}/reabertura`,
  participacao: (ocorrenciaId: string, tipo: TipoParticipacao) =>
    `/participacoes/${id(ocorrenciaId)}/${tipo}`,
  comentarios: (ocorrenciaId: string) => `/comentarios/ocorrencia/${id(ocorrenciaId)}`,
  comentario: (comentarioId: string) => `/comentarios/${id(comentarioId)}`,

  mapaCalor: '/ocorrencias/mapa/calor',
  mapaZonas: '/ocorrencias/mapa/zonas-atencao',

  denuncias: '/comentarios/denuncias',

  linhas: '/transporte/linhas',
  trajeto: (codigo: string) => `/transporte/linhas/${id(codigo)}/trajeto`,
  veiculos: (codigo: string) => `/transporte/linhas/${id(codigo)}/veiculos`,
  viagens: '/transporte/viagens',
  posicoes: (viagemId: string) => `/transporte/viagens/${id(viagemId)}/posicoes`,
  desvio: (viagemId: string) => `/transporte/viagens/${id(viagemId)}/desvio`,
  encerrarViagem: (viagemId: string) => `/transporte/viagens/${id(viagemId)}/encerrar`,

} as const;
