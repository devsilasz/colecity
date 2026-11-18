import {
  exigirUsuario,
  novoId,
  salvarBanco,
  simularRede,
  uidAtual,
  type ComentarioMock,
} from '@/mocks/banco';
import type { ComentarioService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { comentarioValido } from '@/utils/validacoes';

import { buscarOcorrencia, oculto, paginar, paraComentario, resolverFotos } from './conversores';

export const comentarioMock: ComentarioService = {
  async listar(ocorrenciaId, page) {
    const db = await simularRede();
    const uid = uidAtual(db);
    buscarOcorrencia(db, ocorrenciaId, uid);

    const itens = db.comentarios
      .filter((c) => c.ocorrenciaId === ocorrenciaId)
      // Ocultos por moderação não aparecem, exceto para o próprio autor.
      .filter((c) => !oculto(db, 'COMENTARIO', c.id) || c.autorId === uid)
      // RN-COM-05: mais antigo primeiro.
      .sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime())
      .map((c) => paraComentario(db, c, uid));

    return paginar(itens, page, 20);
  },

  async criar(ocorrenciaId, dados, idempotencyKey) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const ocorrencia = buscarOcorrencia(db, ocorrenciaId, usuario.id);

    const idExistente = db.idempotencia[idempotencyKey];
    const existente = idExistente ? db.comentarios.find((c) => c.id === idExistente) : undefined;
    if (existente) return paraComentario(db, existente, usuario.id);

    // RN-COM-01.
    if (ocorrencia.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);
    if (!comentarioValido(dados.texto)) throw new ErroApi('COMENTARIO_TAMANHO_INVALIDO', 422);
    const fotos = resolverFotos(db, dados.fotos, usuario.id);

    const agora = new Date().toISOString();
    const novo: ComentarioMock = {
      id: novoId(),
      ocorrenciaId,
      texto: dados.texto.trim(),
      fotos,
      autorId: usuario.id,
      criadoEm: agora,
    };
    db.comentarios = [...db.comentarios, novo];
    db.idempotencia = { ...db.idempotencia, [idempotencyKey]: novo.id };
    ocorrencia.ultimaAtividadeEm = agora;
    await salvarBanco();
    return paraComentario(db, novo, usuario.id);
  },

  async excluir(comentarioId) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const comentario = db.comentarios.find((c) => c.id === comentarioId);

    if (!comentario) throw new ErroApi('NAO_ENCONTRADO', 404);
    // RN-COM-04.
    if (comentario.autorId !== usuario.id) throw new ErroApi('SOMENTE_AUTOR', 403);
    const ocorrencia = db.ocorrencias.find((o) => o.id === comentario.ocorrenciaId);
    if (ocorrencia?.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);

    db.comentarios = db.comentarios.filter((c) => c.id !== comentarioId);
    await salvarBanco();
  },
};
