import { deleteDoc, doc, getDoc, getDocs, query, runTransaction, where } from 'firebase/firestore';

import type { ComentarioService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { comErroTratado, db } from '@/services/firebase';
import type { Comentario } from '@/types/comentario';
import { comentarioValido } from '@/utils/validacoes';

import {
  buscarOcorrencia,
  carregarPerfis,
  colecoes,
  exigirUid,
  invalidarCacheFirestore,
  nomePublico,
  oculto,
  uidAtual,
  type ComentarioDoc,
  type PerfilDoc,
} from './base';
import { paginar } from './paginar';
import { resolverFotos } from './upload.local';

function paraComentario(
  id: string,
  comentario: ComentarioDoc,
  uid: string | null,
  perfil: PerfilDoc | undefined,
  afetados: ReadonlySet<string>,
): Comentario {
  const proprio = uid !== null && comentario.autorId === uid;
  return {
    id,
    texto: comentario.texto,
    fotos: comentario.fotos,
    // RN-COM-03: quem marcou "Também estou sendo afetado" aparece com o selo "Afetado".
    autor: { ...nomePublico(perfil), afetado: afetados.has(comentario.autorId) },
    criadoEm: comentario.criadoEm,
    podeExcluir: proprio,
    ...(proprio && oculto(comentario) ? { oculto: true } : {}),
  };
}

/** Quem está marcado como afetado na ocorrência (para o selo dos comentários). */
async function afetadosDa(ocorrenciaId: string): Promise<Set<string>> {
  const resultado = await getDocs(query(colecoes.participacoes, where('ocorrenciaId', '==', ocorrenciaId)));
  return new Set(
    resultado.docs
      .map((item) => item.data())
      .filter((participacao) => participacao.afetado)
      .map((participacao) => participacao.uid),
  );
}

/** Comentários no Cloud Firestore (RN-COM-01 a 05). */
export const comentarioFirestore: ComentarioService = {
  listar(ocorrenciaId, page) {
    return comErroTratado(async () => {
      const uid = uidAtual();
      await buscarOcorrencia(ocorrenciaId, uid);

      const [resultado, afetados] = await Promise.all([
        getDocs(query(colecoes.comentarios, where('ocorrenciaId', '==', ocorrenciaId))),
        afetadosDa(ocorrenciaId),
      ]);
      const visiveis = resultado.docs
        .map((item) => ({ id: item.id, dados: item.data() }))
        // Ocultos por moderação não aparecem, exceto para o próprio autor.
        .filter(({ dados }) => !oculto(dados) || dados.autorId === uid)
        // RN-COM-05: mais antigo primeiro.
        .sort((a, b) => a.dados.criadoEm.localeCompare(b.dados.criadoEm));

      const perfis = await carregarPerfis(visiveis.map(({ dados }) => dados.autorId));
      return paginar(
        visiveis.map(({ id, dados }) => paraComentario(id, dados, uid, perfis.get(dados.autorId), afetados)),
        page,
        20,
      );
    });
  },

  criar(ocorrenciaId, dados, idempotencyKey) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      // A Idempotency-Key é o id do documento: reenviar não duplica o comentário.
      const refComentario = doc(colecoes.comentarios, idempotencyKey);
      const refOcorrencia = doc(colecoes.ocorrencias, ocorrenciaId);

      if (!comentarioValido(dados.texto)) throw new ErroApi('COMENTARIO_TAMANHO_INVALIDO', 422);
      const fotos = resolverFotos(dados.fotos, uid);
      const agora = new Date().toISOString();

      const comentario = await runTransaction(db, async (transacao) => {
        const existente = (await transacao.get(refComentario)).data();
        if (existente) return existente;

        const ocorrencia = (await transacao.get(refOcorrencia)).data();
        if (!ocorrencia || (oculto(ocorrencia) && ocorrencia.autorId !== uid)) {
          throw new ErroApi('NAO_ENCONTRADO', 404);
        }
        // RN-COM-01: só em ocorrências não concluídas.
        if (ocorrencia.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);

        const novo: ComentarioDoc = {
          ocorrenciaId,
          texto: dados.texto.trim(),
          fotos,
          autorId: uid,
          criadoEm: agora,
          totalDenuncias: 0,
        };
        transacao.set(refComentario, novo);
        // O comentário conta como atividade da ocorrência.
        transacao.update(refOcorrencia, { ultimaAtividadeEm: agora });
        return novo;
      });

      invalidarCacheFirestore();
      const [perfis, afetados] = await Promise.all([carregarPerfis([uid]), afetadosDa(ocorrenciaId)]);
      return paraComentario(refComentario.id, comentario, uid, perfis.get(uid), afetados);
    });
  },

  excluir(comentarioId) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      const ref = doc(colecoes.comentarios, comentarioId);
      const comentario = (await getDoc(ref)).data();

      if (!comentario) throw new ErroApi('NAO_ENCONTRADO', 404);
      // RN-COM-04: só o autor exclui o próprio comentário.
      if (comentario.autorId !== uid) throw new ErroApi('SOMENTE_AUTOR', 403);
      await deleteDoc(ref);
    });
  },
};
