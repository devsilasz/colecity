import { doc, runTransaction, type Transaction } from 'firebase/firestore';

import type { ParticipacaoService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { comErroTratado, db } from '@/services/firebase';
import type { EstadoOcorrencia } from '@/types/estado';
import type { RespostaParticipacao, TipoParticipacao } from '@/types/ocorrencia';
import { estadoPorRegra } from '@/utils/regrasOcorrencia';

import {
  colecoes,
  exigirUid,
  idParticipacao,
  invalidarCacheFirestore,
  oculto,
  type OcorrenciaDoc,
  type ParticipacaoDoc,
} from './base';

/** Marcos de afetados registrados na linha do tempo (RN-ACO-03). */
const MARCOS_AFETADOS: readonly number[] = [10, 50, 100];

interface Mudanca {
  ocorrenciaId: string;
  uid: string;
  tipo: TipoParticipacao;
  marcar: boolean;
}

/**
 * Aplica uma mudança de participação dentro de uma transação: lê a ocorrência e a participação,
 * valida as regras (RN-PAR-02 a 05) e grava a participação junto com as contagens. Como tudo
 * acontece na mesma transação, duas pessoas participando ao mesmo tempo não perdem contagem.
 * Devolve `null` quando não havia o que retirar.
 */
export async function aplicarParticipacao(
  transacao: Transaction,
  { ocorrenciaId, uid, tipo, marcar }: Mudanca,
): Promise<RespostaParticipacao | null> {
  const refOcorrencia = doc(colecoes.ocorrencias, ocorrenciaId);
  const refParticipacao = doc(colecoes.participacoes, idParticipacao(ocorrenciaId, uid));

  const ocorrencia = (await transacao.get(refOcorrencia)).data();
  if (!ocorrencia || (oculto(ocorrencia) && ocorrencia.autorId !== uid)) {
    throw new ErroApi('NAO_ENCONTRADO', 404);
  }
  const atual = (await transacao.get(refParticipacao)).data();

  // RN-PAR-05: concluída não aceita participar nem retirar.
  if (ocorrencia.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);

  const autor = ocorrencia.autorId === uid;
  const antes = { afetado: atual?.afetado ?? false, apoio: atual?.apoio ?? false };
  const depois = { ...antes };

  if (tipo === 'apoio') {
    // RN-PAR-03: o autor não apoia a própria ocorrência.
    if (marcar && autor) throw new ErroApi('AUTOR_NAO_PODE_APOIAR', 422);
    if (!marcar && !antes.apoio) return null;
    depois.apoio = marcar;
  } else {
    // RN-PAR-03: o autor não retira a marcação de afetado.
    if (!marcar && autor) throw new ErroApi('AUTOR_SEMPRE_AFETADO', 422);
    if (!marcar && !antes.afetado) return null;
    depois.afetado = marcar;
  }

  const resposta = (totais: Pick<OcorrenciaDoc, 'totalAfetados' | 'totalApoios'>): RespostaParticipacao => ({
    ...totais,
    minhaParticipacao: { ...depois, autor },
  });

  // Marcar de novo o que já estava marcado não duplica (RN-PAR-02).
  if (antes.afetado === depois.afetado && antes.apoio === depois.apoio) {
    return resposta({ totalAfetados: ocorrencia.totalAfetados, totalApoios: ocorrencia.totalApoios });
  }

  const agora = new Date().toISOString();
  const totalAfetados = ocorrencia.totalAfetados + Number(depois.afetado) - Number(antes.afetado);
  const totalApoios = ocorrencia.totalApoios + Number(depois.apoio) - Number(antes.apoio);
  const novoAfetado = depois.afetado && !antes.afetado;

  // Leituras vêm antes das escritas na transação: confere se o marco já foi registrado.
  const refMarco = doc(colecoes.linhaDoTempo(ocorrenciaId), `marco-${totalAfetados}`);
  const registrarMarco =
    novoAfetado && MARCOS_AFETADOS.includes(totalAfetados) && !(await transacao.get(refMarco)).exists();

  // RN-ACO-02: passa a Em acompanhamento ao atingir 3 afetados.
  let estado: EstadoOcorrencia = ocorrencia.estado;
  if (
    novoAfetado &&
    estado === 'ABERTA' &&
    estadoPorRegra(ocorrencia.categoria, totalAfetados) === 'EM_ACOMPANHAMENTO'
  ) {
    estado = 'EM_ACOMPANHAMENTO';
    transacao.set(doc(colecoes.linhaDoTempo(ocorrenciaId)), {
      tipo: 'ESTADO_ALTERADO',
      descricao: 'Passou para Em acompanhamento ao atingir 3 afetados',
      em: agora,
    });
  }
  if (registrarMarco) {
    // O id fixo por marco impede registrar o mesmo marco duas vezes.
    transacao.set(refMarco, {
      tipo: 'MARCO_AFETADOS',
      descricao: `${totalAfetados} pessoas afetadas`,
      em: agora,
    });
  }

  const participacao: ParticipacaoDoc = { uid, ocorrenciaId, ...depois, atualizadoEm: agora };
  transacao.set(refParticipacao, participacao);
  transacao.update(refOcorrencia, {
    totalAfetados,
    totalApoios,
    estado,
    // Retirar participação não conta como atividade nova.
    ...(marcar ? { ultimaAtividadeEm: agora } : {}),
  });

  return resposta({ totalAfetados, totalApoios });
}

async function mudar(ocorrenciaId: string, tipo: TipoParticipacao, marcar: boolean) {
  const uid = exigirUid();
  const resposta = await comErroTratado(() =>
    runTransaction(db, (transacao) => aplicarParticipacao(transacao, { ocorrenciaId, uid, tipo, marcar })),
  );
  invalidarCacheFirestore();
  return resposta;
}

/** Participação com contagens transacionais no Firestore (RN-PAR). */
export const participacaoFirestore: ParticipacaoService = {
  async marcar(ocorrenciaId, tipo) {
    const resposta = await mudar(ocorrenciaId, tipo, true);
    // Marcar sempre devolve as contagens; `null` só existe ao retirar.
    if (!resposta) throw new ErroApi('ERRO_INTERNO', 500);
    return resposta;
  },

  retirar: (ocorrenciaId, tipo) => mudar(ocorrenciaId, tipo, false),
};
