import { novoId, obterBanco, salvarBanco, simularRede, type BancoMock, type UsuarioMock } from '@/mocks/banco';
import { CONTA_GOOGLE_DEMO } from '@/mocks/usuarios';
import type { AuthService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { emailValido, nomeValido, senhaValida } from '@/utils/validacoes';

import { paraUsuarioAuth } from './conversores';

/**
 * Autenticação simulada, com as mesmas regras do doc 07 (RN-CON).
 * Na versão real este adaptador é substituído pelo do Firebase Authentication.
 */

function usuarioDaSessao(db: BancoMock): UsuarioMock {
  const usuario = db.usuarios.find((u) => u.id === db.sessaoUid && !u.removido);
  if (!usuario) throw new ErroApi('NAO_AUTENTICADO', 401);
  return usuario;
}

function normalizar(email: string): string {
  return email.trim().toLowerCase();
}

export const authMock: AuthService = {
  async restaurarSessao() {
    const db = await obterBanco();
    const usuario = db.usuarios.find((u) => u.id === db.sessaoUid && !u.removido);
    return usuario ? paraUsuarioAuth(usuario) : null;
  },

  async entrar(email, senha) {
    const db = await simularRede();
    const usuario = db.usuarios.find((u) => !u.removido && u.email === normalizar(email));
    // RN-CON-04: mensagem genérica, sem indicar qual campo está errado.
    if (!usuario || usuario.senha === null || usuario.senha !== senha) {
      throw new ErroApi('CREDENCIAIS_INVALIDAS', 401);
    }
    db.sessaoUid = usuario.id;
    await salvarBanco();
    return paraUsuarioAuth(usuario);
  },

  async cadastrar(dados) {
    const db = await simularRede();
    const email = normalizar(dados.email);

    if (!dados.aceiteTermosVersao) throw new ErroApi('ACEITE_TERMOS_OBRIGATORIO', 422);
    if (!nomeValido(dados.nome)) throw new ErroApi('NOME_INVALIDO', 422);
    if (!emailValido(email)) throw new ErroApi('EMAIL_INVALIDO', 422);
    if (!senhaValida(dados.senha)) throw new ErroApi('SENHA_FRACA', 422);
    if (db.usuarios.some((u) => u.email === email)) throw new ErroApi('EMAIL_JA_CADASTRADO', 409);

    const novo: UsuarioMock = {
      id: novoId(),
      nome: dados.nome.trim(),
      email,
      senha: dados.senha,
      google: false,
      aceiteTermosVersao: dados.aceiteTermosVersao,
      criadoEm: new Date().toISOString(),
      removido: false,
    };
    db.usuarios = [...db.usuarios, novo];
    db.sessaoUid = novo.id;
    await salvarBanco();
    return paraUsuarioAuth(novo);
  },

  async entrarComGoogle(aceiteTermosVersao) {
    const db = await simularRede();
    const email = normalizar(CONTA_GOOGLE_DEMO.email);
    let usuario = db.usuarios.find((u) => !u.removido && u.email === email);

    if (!usuario) {
      // RN-CON-11: primeiro login com Google pede o aceite antes de criar a conta.
      if (!aceiteTermosVersao) {
        return { tipo: 'ACEITE_NECESSARIO', nome: CONTA_GOOGLE_DEMO.nome, email };
      }
      usuario = {
        id: novoId(),
        nome: CONTA_GOOGLE_DEMO.nome,
        email,
        senha: null,
        google: true,
        aceiteTermosVersao,
        criadoEm: new Date().toISOString(),
        removido: false,
      };
      db.usuarios = [...db.usuarios, usuario];
    } else {
      // RN-CON-12: e-mail já cadastrado com senha → métodos vinculados à mesma conta.
      usuario.google = true;
    }

    db.sessaoUid = usuario.id;
    await salvarBanco();
    return { tipo: 'SESSAO', usuario: paraUsuarioAuth(usuario) };
  },

  async recuperarSenha() {
    // RN-CON-09: resposta sempre igual, exista ou não o e-mail.
    await simularRede();
  },

  async sair() {
    const db = await obterBanco();
    db.sessaoUid = null;
    await salvarBanco();
  },

  async obterToken() {
    const db = await obterBanco();
    return db.sessaoUid ? `mock-token-${db.sessaoUid}` : null;
  },

  async alterarEmail(novoEmail, senhaAtual) {
    const db = await simularRede();
    const usuario = usuarioDaSessao(db);
    const email = normalizar(novoEmail);

    // RN-CON-14: em conta só com Google o e-mail é o do Google.
    if (usuario.senha === null) throw new ErroApi('SEM_PERMISSAO', 403);
    if (usuario.senha !== senhaAtual) throw new ErroApi('SENHA_INCORRETA', 401);
    if (!emailValido(email)) throw new ErroApi('EMAIL_INVALIDO', 422);
    if (db.usuarios.some((u) => u.id !== usuario.id && u.email === email)) {
      throw new ErroApi('EMAIL_JA_CADASTRADO', 409);
    }
    usuario.email = email;
    await salvarBanco();
    return paraUsuarioAuth(usuario);
  },

  async alterarSenha(senhaAtual, novaSenha) {
    const db = await simularRede();
    const usuario = usuarioDaSessao(db);
    if (usuario.senha === null || usuario.senha !== senhaAtual) throw new ErroApi('SENHA_INCORRETA', 401);
    if (!senhaValida(novaSenha)) throw new ErroApi('SENHA_FRACA', 422);
    usuario.senha = novaSenha;
    await salvarBanco();
  },

  async definirSenha(novaSenha) {
    const db = await simularRede();
    const usuario = usuarioDaSessao(db);
    if (!senhaValida(novaSenha)) throw new ErroApi('SENHA_FRACA', 422);
    usuario.senha = novaSenha;
    await salvarBanco();
    return paraUsuarioAuth(usuario);
  },

  async atualizarNome(nome) {
    const db = await obterBanco();
    const usuario = usuarioDaSessao(db);
    if (!nomeValido(nome)) throw new ErroApi('NOME_INVALIDO', 422);
    usuario.nome = nome.trim();
    await salvarBanco();
    return paraUsuarioAuth(usuario);
  },

  async reautenticar(senha) {
    const db = await simularRede();
    const usuario = usuarioDaSessao(db);
    // Conta com senha confirma pela senha; conta só com Google refaz o login Google (simulado).
    if (usuario.senha !== null && usuario.senha !== senha) throw new ErroApi('SENHA_INCORRETA', 401);
  },

  async excluirConta() {
    const db = await obterBanco();
    db.sessaoUid = null;
    await salvarBanco();
  },
};
