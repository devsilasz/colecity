import { comIdempotencia, get, patch, post } from '@/services/api';
import type { OcorrenciaService } from '@/services/contratos';
import type { Pagina } from '@/types/api';
import type { CategoriaInfo } from '@/types/categoria';
import type {
  Apoiador,
  BuscaSemelhantes,
  DadosConclusao,
  EdicaoOcorrencia,
  EventoLinhaDoTempo,
  NovaDenuncia,
  NovaOcorrencia,
  OcorrenciaDetalhe,
  OcorrenciaResumo,
  OcorrenciaSemelhante,
  PontoCalor,
  ZonaAtencao,
} from '@/types/ocorrencia';

import { rotas } from './rotas';

/** Enums repetíveis viram `categoria=A&categoria=B` (doc 10, GET /ocorrencias). */
const repetirParametros = { paramsSerializer: { indexes: null } } as const;

export const ocorrenciaHttp: OcorrenciaService = {
  listarCategorias: () => get<CategoriaInfo[]>(rotas.categorias),

  listar: (filtros, page, pageSize = 20) =>
    get<Pagina<OcorrenciaResumo>>(rotas.ocorrencias, {
      ...repetirParametros,
      params: {
        categoria: filtros.categorias.length > 0 ? filtros.categorias : undefined,
        estado: filtros.estados.length > 0 ? filtros.estados : undefined,
        lat: filtros.proximidade?.centro.lat,
        lng: filtros.proximidade?.centro.lng,
        raioKm: filtros.proximidade?.raioKm,
        linha: filtros.linha,
        page,
        pageSize,
      },
    }),

  obter: (id) => get<OcorrenciaDetalhe>(rotas.ocorrencia(id)),

  linhaDoTempo: (id) => get<EventoLinhaDoTempo[]>(rotas.linhaDoTempo(id)),

  apoiadores: (id, page) => get<Pagina<Apoiador>>(rotas.apoiadores(id), { params: { page } }),

  mapaDeCalor: (area, categoria) =>
    get<PontoCalor[]>(rotas.mapaCalor, { params: { ...area, categoria } }),

  zonasDeAtencao: (area) => get<ZonaAtencao[]>(rotas.mapaZonas, { params: { ...area } }),

  semelhantes: (busca) => post<OcorrenciaSemelhante[], BuscaSemelhantes>(rotas.semelhantes, busca),

  criar: (dados, idempotencyKey) =>
    post<OcorrenciaDetalhe, NovaOcorrencia>(rotas.ocorrencias, dados, comIdempotencia(idempotencyKey)),

  editar: (id, dados) => patch<OcorrenciaDetalhe, EdicaoOcorrencia>(rotas.ocorrencia(id), dados),

  concluir: (id, dados) => post<OcorrenciaDetalhe, DadosConclusao>(rotas.conclusao(id), dados),

  reabrir: (id) => post<OcorrenciaDetalhe>(rotas.reabertura(id)),

  denunciar: async (denuncia) => {
    await post<void, NovaDenuncia>(rotas.denuncias, denuncia);
  },
};
