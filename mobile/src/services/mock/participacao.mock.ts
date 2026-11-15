import { exigirUsuario, salvarBanco, simularRede, type OcorrenciaMock } from '@/mocks/banco';
import type { ParticipacaoService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import type { RespostaParticipacao } from '@/types/ocorrencia';

import { buscarOcorrencia, totalAfetados, totalApoios } from './conversores';
import { registrarNovoAfetado } from './ocorrencia.mock';

function resposta(ocorrencia: OcorrenciaMock, uid: string): RespostaParticipacao {
  return {
    totalAfetados: totalAfetados(ocorrencia),
    totalApoios: totalApoios(ocorrencia),
    minhaParticipacao: {
      afetado: ocorrencia.afetadosIds.includes(uid),
      apoio: ocorrencia.apoiadoresIds.includes(uid),
      autor: ocorrencia.autorId === uid,
    },
  };
}

export const participacaoMock: ParticipacaoService = {
  async marcar(ocorrenciaId, tipo) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const ocorrencia = buscarOcorrencia(db, ocorrenciaId, usuario.id);

    // RN-PAR-05.
    if (ocorrencia.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);
    const agora = new Date().toISOString();

    if (tipo === 'apoio') {
      // RN-PAR-03.
      if (ocorrencia.autorId === usuario.id) throw new ErroApi('AUTOR_NAO_PODE_APOIAR', 422);
      // Idempotente: marcar duas vezes não duplica (RN-PAR-02).
      if (!ocorrencia.apoiadoresIds.includes(usuario.id)) {
        ocorrencia.apoiadoresIds = [...ocorrencia.apoiadoresIds, usuario.id];
        ocorrencia.ultimaAtividadeEm = agora;
      }
    } else if (!ocorrencia.afetadosIds.includes(usuario.id)) {
      ocorrencia.afetadosIds = [...ocorrencia.afetadosIds, usuario.id];
      registrarNovoAfetado(ocorrencia, agora);
    }

    await salvarBanco();
    return resposta(ocorrencia, usuario.id);
  },

  async retirar(ocorrenciaId, tipo) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const ocorrencia = buscarOcorrencia(db, ocorrenciaId, usuario.id);

    if (ocorrencia.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);

    if (tipo === 'afetado') {
      // RN-PAR-03: o autor não pode retirar sua marcação de afetado.
      if (ocorrencia.autorId === usuario.id) throw new ErroApi('AUTOR_SEMPRE_AFETADO', 422);
      if (!ocorrencia.afetadosIds.includes(usuario.id)) return null;
      ocorrencia.afetadosIds = ocorrencia.afetadosIds.filter((id) => id !== usuario.id);
    } else {
      if (!ocorrencia.apoiadoresIds.includes(usuario.id)) return null;
      ocorrencia.apoiadoresIds = ocorrencia.apoiadoresIds.filter((id) => id !== usuario.id);
    }

    await salvarBanco();
    return resposta(ocorrencia, usuario.id);
  },
};
