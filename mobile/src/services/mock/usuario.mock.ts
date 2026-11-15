import { exigirUsuario, salvarBanco, simularRede, type OcorrenciaMock } from '@/mocks/banco';
import type { UsuarioService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { nomeValido } from '@/utils/validacoes';

import { calcularZonas, oculto, paginar, paraResumo, paraUsuario } from './conversores';

/** RN-MIN-02: não concluídas primeiro; em cada grupo, atividade mais recente primeiro. */
function ordemMinhas(a: OcorrenciaMock, b: OcorrenciaMock): number {
  const concluidaA = a.estado === 'CONCLUIDA' ? 1 : 0;
  const concluidaB = b.estado === 'CONCLUIDA' ? 1 : 0;
  return (
    concluidaA - concluidaB ||
    new Date(b.ultimaAtividadeEm).getTime() - new Date(a.ultimaAtividadeEm).getTime()
  );
}

export const usuarioMock: UsuarioService = {
  async registrarAcesso(dados) {
    const db = await simularRede();
    if (!db.sessaoUid) throw new ErroApi('NAO_AUTENTICADO', 401);
    const usuario = db.usuarios.find((u) => u.id === db.sessaoUid);
    if (!usuario) throw new ErroApi('USUARIO_NAO_CADASTRADO', 403);

    if (!nomeValido(dados.nome)) throw new ErroApi('NOME_INVALIDO', 422);
    if (!usuario.aceiteTermosVersao && !dados.aceiteTermosVersao) {
      throw new ErroApi('ACEITE_TERMOS_OBRIGATORIO', 422);
    }
    usuario.nome = dados.nome.trim();
    usuario.aceiteTermosVersao = dados.aceiteTermosVersao ?? usuario.aceiteTermosVersao;
    await salvarBanco();
    return paraUsuario(usuario);
  },

  async obterPerfil() {
    const db = await simularRede();
    return paraUsuario(exigirUsuario(db));
  },

  async atualizarPerfil(dados) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);

    if (dados.nome !== undefined) {
      if (!nomeValido(dados.nome)) throw new ErroApi('NOME_INVALIDO', 422);
      usuario.nome = dados.nome.trim();
    }
    if (dados.email !== undefined) {
      const email = dados.email.trim().toLowerCase();
      const emUso = db.usuarios.some((u) => u.id !== usuario.id && u.email === email);
      if (emUso) throw new ErroApi('EMAIL_JA_CADASTRADO', 409);
      usuario.email = email;
    }
    await salvarBanco();
    return paraUsuario(usuario);
  },

  async excluirConta() {
    const db = await simularRede();
    const usuario = exigirUsuario(db);

    // RN-CON-08: anonimização. Participações saem das contagens;
    // ocorrências e comentários permanecem como "Usuário removido".
    usuario.nome = '';
    usuario.email = '';
    usuario.senha = null;
    usuario.google = false;
    usuario.removido = true;
    db.ocorrencias.forEach((o) => {
      o.afetadosIds = o.afetadosIds.filter((id) => id !== usuario.id);
      o.apoiadoresIds = o.apoiadoresIds.filter((id) => id !== usuario.id);
    });
    db.viagens = db.viagens.filter((v) => v.uid !== usuario.id);
    await salvarBanco();
  },

  async minhasOcorrencias(aba, page) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const zonas = calcularZonas(db);

    const itens = db.ocorrencias
      .filter((o) => !oculto(db, 'OCORRENCIA', o.id) || o.autorId === usuario.id)
      .filter((o) => {
        if (aba === 'REGISTRADAS') return o.autorId === usuario.id;
        if (aba === 'AFETADO') return o.afetadosIds.includes(usuario.id);
        return o.apoiadoresIds.includes(usuario.id);
      })
      .sort(ordemMinhas)
      .map((o) => paraResumo(o, usuario.id, zonas));

    return paginar(itens, page, 20);
  },
};
