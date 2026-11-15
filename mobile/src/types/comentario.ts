import type { Foto, FotoRef } from './ocorrencia';

/** Doc 10, seção 3.4. */
export interface Comentario {
  id: string;
  texto: string;
  fotos: Foto[];
  autor: { nome: string; afetado: boolean; removido: boolean };
  criadoEm: string;
  podeExcluir: boolean;
  /** Só vem `true` para o autor de comentário oculto por moderação. */
  oculto?: boolean;
}

/** Corpo de `POST /ocorrencias/{id}/comentarios`. */
export interface NovoComentario {
  texto: string;
  fotos: FotoRef[];
}
