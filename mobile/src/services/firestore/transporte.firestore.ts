import * as Crypto from 'expo-crypto';
import { addDoc, doc, runTransaction, updateDoc } from 'firebase/firestore';

import type { TransporteService } from '@/services/contratos';
import { comErroTratado, db } from '@/services/firebase';
import { criarTransporteSimulado } from '@/services/mock/transporte.mock';

import { carregarOcorrencias, colecoes, exigirUid, invalidarCacheFirestore, oculto } from './base';
import { ocorrenciaFirestore } from './ocorrencia.firestore';
import { aplicarParticipacao } from './participacao.firestore';

/**
 * Transporte ao vivo com o Firestore como fonte de dados: linhas, trajetos, ônibus e viagens
 * continuam simulados no app (dependem do BFF com a SPTrans), mas o usuário é o do Firebase Auth
 * e a ocorrência de desvio de rota (RN-TAV-07) é gravada no Firestore.
 */
export const transporteFirestore: TransporteService = criarTransporteSimulado({
  uid: () => exigirUid(),

  registrarDesvio: (_bancoLocal, uid, linha, local) =>
    comErroTratado(async () => {
      const agora = new Date().toISOString();
      const evento = {
        tipo: 'DESVIO_DETECTADO' as const,
        descricao: `Desvio de rota confirmado por passageiro na linha ${linha.codigo}`,
        em: agora,
      };

      const existente = (await carregarOcorrencias()).find(
        (o) =>
          !oculto(o) &&
          o.estado !== 'CONCLUIDA' &&
          o.categoria === 'TRANSPORTE' &&
          o.tipo === 'ALTERACAO_ROTA_SEM_AVISO' &&
          o.linha?.codigo === linha.codigo,
      );

      if (existente) {
        // Reforça a ocorrência da linha: quem confirmou o desvio passa a contar como afetado.
        await runTransaction(db, (transacao) =>
          aplicarParticipacao(transacao, { ocorrenciaId: existente.id, uid, tipo: 'afetado', marcar: true }),
        );
        await addDoc(colecoes.linhaDoTempo(existente.id), evento);
        await updateDoc(doc(colecoes.ocorrencias, existente.id), { ultimaAtividadeEm: agora });
        invalidarCacheFirestore();
        return existente.id;
      }

      const criada = await ocorrenciaFirestore.criar(
        {
          categoria: 'TRANSPORTE',
          tipo: 'ALTERACAO_ROTA_SEM_AVISO',
          descricao: `Desvio de rota detectado pelo Transporte ao vivo na linha ${linha.codigo} (${linha.nome}).`,
          localizacao: local,
          linha: linha.codigo,
          dataHoraOcorrido: null,
          fotos: [],
        },
        Crypto.randomUUID(),
      );
      await addDoc(colecoes.linhaDoTempo(criada.id), evento);
      return criada.id;
    }),
});
