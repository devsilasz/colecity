import type { Coordenada } from './api';
import type { Categoria, TipoOcorrencia } from './categoria';
import type { EstadoOcorrencia } from './estado';
import type { LinhaRef } from './transporte';

/** Modelos de ocorrência — doc 10, seções 2.2 e 3. */

export type MotivoConclusao = 'AUTOR' | 'INATIVIDADE';
export type MotivoDenuncia = 'OFENSIVO' | 'DADOS_PESSOAIS' | 'SPAM' | 'FALSO';
export type TipoConteudo = 'OCORRENCIA' | 'COMENTARIO' | 'FOTO';
export type TipoEventoLinhaDoTempo =
  | 'CRIADA'
  | 'ESTADO_ALTERADO'
  | 'MARCO_AFETADOS'
  | 'DESVIO_DETECTADO'
  | 'CONCLUIDA'
  | 'REABERTA';
export type AbaMinhas = 'REGISTRADAS' | 'AFETADO' | 'APOIO';
export type TipoParticipacao = 'afetado' | 'apoio';

/** Referência enviada ao domínio (doc 10, seção 3.1). */
export interface FotoRef {
  path: string;
}

/** Foto devolvida: `id` e `path` vêm do domínio; `url` pública é montada pelo BFF. */
export interface Foto extends FotoRef {
  id: string;
  url: string;
}

export interface MinhaParticipacao {
  afetado: boolean;
  apoio: boolean;
  autor: boolean;
}

/** Doc 10, seção 3.2. */
export interface OcorrenciaResumo {
  id: string;
  titulo: string;
  categoria: Categoria;
  tipo: TipoOcorrencia;
  estado: EstadoOcorrencia;
  bairro: string | null;
  /** Arredondada para ~100 m (RN-CSL-08). */
  localizacaoAproximada: Coordenada;
  totalAfetados: number;
  totalApoios: number;
  ultimaAtividadeEm: string;
  zonaAtencao: boolean;
  /** `null` para visitante (sem usuário logado). */
  minhaParticipacao: MinhaParticipacao | null;
}

export interface Conclusao {
  motivo: MotivoConclusao;
  feedback: string | null;
  fotos: Foto[];
}

/** Doc 10, seção 3.3. */
export interface OcorrenciaDetalhe extends OcorrenciaResumo {
  descricao: string;
  rua: string | null;
  linha: LinhaRef | null;
  dataHoraOcorrido: string | null;
  fotos: Foto[];
  autor: { nome: string; removido: boolean };
  criadaEm: string;
  concluidaEm: string | null;
  conclusao: Conclusao | null;
  podeEditar: boolean;
  podeConcluir: boolean;
  podeReabrir: boolean;
  avisoContagem: string;
  /** Só vem `true` para o autor de ocorrência oculta por moderação. */
  oculta?: boolean;
}

/** `POST /ocorrencias/semelhantes`: resumo + distância. */
export interface OcorrenciaSemelhante extends OcorrenciaResumo {
  distanciaMetros: number;
}

export interface EventoLinhaDoTempo {
  tipo: TipoEventoLinhaDoTempo;
  descricao: string;
  em: string;
}

export interface Apoiador {
  nome: string;
}

/** Parâmetros de `GET /ocorrencias`. */
export interface FiltrosOcorrencias {
  categorias: Categoria[];
  /** Vazio = padrão do contrato (ABERTA e EM_ACOMPANHAMENTO, RN-CSL-04). */
  estados: EstadoOcorrencia[];
  /** Filtro de distância: exige a posição atual (RN-CSL-03). */
  proximidade: { centro: Coordenada; raioKm: 1 | 5 | 10 } | null;
  linha?: string;
}

export interface BuscaSemelhantes {
  categoria: Categoria;
  tipo: TipoOcorrencia;
  localizacao: Coordenada;
  linha: string | null;
}

/** Corpo de `POST /ocorrencias`. */
export interface NovaOcorrencia {
  categoria: Categoria;
  tipo: TipoOcorrencia;
  descricao: string;
  localizacao: Coordenada;
  linha: string | null;
  dataHoraOcorrido: string | null;
  fotos: FotoRef[];
}

/** Corpo de `PATCH /ocorrencias/{id}`. */
export interface EdicaoOcorrencia {
  descricao?: string;
  fotos?: FotoRef[];
}

/** Corpo de `POST /ocorrencias/{id}/conclusao`. */
export interface DadosConclusao {
  feedback?: string;
  fotos?: FotoRef[];
}

/** Resposta de marcar/retirar participação (doc 10, seção 4.5). */
export interface RespostaParticipacao {
  totalAfetados: number;
  totalApoios: number;
  minhaParticipacao: MinhaParticipacao;
}

export interface PontoCalor extends Coordenada {
  /** Afetados distintos na célula (RN-DES-01). */
  peso: number;
}

export interface ZonaAtencao {
  categoria: Categoria;
  centro: Coordenada;
  raioMetros: number;
  totalRelatos: number;
  /** "X relatos da comunidade nos últimos 30 dias" (RN-ZON-02). */
  texto: string;
}

export interface NovaDenuncia {
  tipoConteudo: TipoConteudo;
  conteudoId: string;
  motivo: MotivoDenuncia;
}
