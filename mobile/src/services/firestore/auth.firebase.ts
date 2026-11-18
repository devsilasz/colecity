import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import type { AuthService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { auth, db, ehErroFirebase } from '@/services/firebase';
import { googleNativo } from '@/services/googleNativo';
import type { CodigoErro } from '@/types/api';
import type { ProvedorLogin, UsuarioAuth } from '@/types/usuario';
import { emailValido, nomeValido, senhaValida } from '@/utils/validacoes';

/** Autenticação com Firebase Authentication: e-mail e senha, e Google no APK (RN-CON). */

type Contexto = 'login' | 'cadastro' | 'reautenticacao' | 'geral';

const STATUS: Partial<Record<CodigoErro, number>> = {
  CREDENCIAIS_INVALIDAS: 401,
  SENHA_INCORRETA: 401,
  NAO_AUTENTICADO: 401,
  EMAIL_JA_CADASTRADO: 409,
  EMAIL_INVALIDO: 422,
  SENHA_FRACA: 422,
  MUITAS_REQUISICOES: 429,
  OFFLINE: 0,
  ERRO_INTERNO: 500,
};

function erro(code: CodigoErro): ErroApi {
  return new ErroApi(code, STATUS[code] ?? 400);
}

/** Traduz os códigos do Firebase Auth. No login a mensagem é sempre genérica (RN-CON-04). */
function converterErroAuth(falha: unknown, contexto: Contexto): ErroApi {
  if (falha instanceof ErroApi) return falha;
  if (!ehErroFirebase(falha)) return erro('ERRO_INTERNO');

  switch (falha.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/user-disabled':
    case 'auth/invalid-login-credentials':
      return erro(contexto === 'reautenticacao' ? 'SENHA_INCORRETA' : 'CREDENCIAIS_INVALIDAS');
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return erro(contexto === 'login' ? 'CREDENCIAIS_INVALIDAS' : 'EMAIL_INVALIDO');
    case 'auth/missing-password':
      return erro(contexto === 'login' ? 'CREDENCIAIS_INVALIDAS' : 'SENHA_INCORRETA');
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
    case 'auth/account-exists-with-different-credential':
      return erro('EMAIL_JA_CADASTRADO');
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return erro('SENHA_FRACA');
    case 'auth/too-many-requests':
      return erro('MUITAS_REQUISICOES');
    case 'auth/network-request-failed':
      return erro('OFFLINE');
    case 'auth/requires-recent-login':
    case 'auth/user-token-expired':
      return erro('NAO_AUTENTICADO');
    default:
      return erro('ERRO_INTERNO');
  }
}

function paraUsuarioAuth(usuario: User): UsuarioAuth {
  const provedores: ProvedorLogin[] = [];
  for (const provedor of usuario.providerData) {
    if (provedor.providerId === 'password') provedores.push('senha');
    if (provedor.providerId === 'google.com') provedores.push('google');
  }
  return {
    uid: usuario.uid,
    nome: usuario.displayName ?? '',
    email: usuario.email ?? '',
    provedores,
  };
}

function usuarioAtual(): User {
  const usuario = auth.currentUser;
  if (!usuario) throw erro('NAO_AUTENTICADO');
  return usuario;
}

/**
 * idToken do Google de quem ainda não aceitou os termos (RN-CON-11). Fica só em memória, entre a
 * primeira chamada (que descobre que a conta é nova) e a segunda (com o aceite), para não pedir a
 * escolha da conta duas vezes. Um idToken do Google vale por cerca de 1 hora.
 */
let googlePendente: string | null = null;

/** A conta já aceitou os termos (tem o documento `users/{uid}` com a versão aceita). */
async function jaAceitouTermos(uid: string): Promise<boolean> {
  const dados = (await getDoc(doc(db, 'users', uid))).data();
  return typeof dados?.aceiteTermosVersao === 'string' && dados.aceiteTermosVersao.length > 0;
}

async function idTokenDoGoogle(): Promise<string> {
  const resultado = await googleNativo.entrar();
  if (resultado.tipo === 'CANCELADO') throw new ErroApi('LOGIN_CANCELADO', 499);
  return resultado.idToken;
}

async function reautenticarComSenha(usuario: User, senha: string): Promise<void> {
  if (!usuario.email) throw erro('NAO_AUTENTICADO');
  try {
    await reauthenticateWithCredential(usuario, EmailAuthProvider.credential(usuario.email, senha));
  } catch (falha) {
    throw converterErroAuth(falha, 'reautenticacao');
  }
}

export const authFirebase: AuthService = {
  async restaurarSessao() {
    // Espera o SDK ler a sessão salva no AsyncStorage (RN-GER-13).
    await auth.authStateReady();
    return auth.currentUser ? paraUsuarioAuth(auth.currentUser) : null;
  },

  async entrar(email, senha) {
    try {
      const credencial = await signInWithEmailAndPassword(auth, email.trim(), senha);
      return paraUsuarioAuth(credencial.user);
    } catch (falha) {
      throw converterErroAuth(falha, 'login');
    }
  },

  async cadastrar(dados) {
    // Mesmas validações do contrato, antes de criar a conta (RN-CON-01 a 03).
    if (!dados.aceiteTermosVersao) throw new ErroApi('ACEITE_TERMOS_OBRIGATORIO', 422);
    if (!nomeValido(dados.nome)) throw new ErroApi('NOME_INVALIDO', 422);
    if (!emailValido(dados.email)) throw erro('EMAIL_INVALIDO');
    if (!senhaValida(dados.senha)) throw erro('SENHA_FRACA');

    try {
      const credencial = await createUserWithEmailAndPassword(auth, dados.email.trim(), dados.senha);
      await updateProfile(credencial.user, { displayName: dados.nome.trim() });
      return paraUsuarioAuth(credencial.user);
    } catch (falha) {
      throw converterErroAuth(falha, 'cadastro');
    }
  },

  async entrarComGoogle(aceiteTermosVersao) {
    // Segunda chamada, depois do aceite: reaproveita a conta escolhida na primeira.
    const idToken = aceiteTermosVersao && googlePendente ? googlePendente : await idTokenDoGoogle();
    googlePendente = null;

    let usuario: User;
    try {
      usuario = (await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))).user;
    } catch (falha) {
      throw converterErroAuth(falha, 'login');
    }

    // RN-CON-11: primeiro acesso com Google pede o aceite dos termos antes de criar a conta no banco.
    // Sem o aceite a sessão não fica aberta: se a pessoa desistir, ela não entra.
    if (!aceiteTermosVersao) {
      let aceitou = false;
      try {
        aceitou = await jaAceitouTermos(usuario.uid);
      } catch {
        // Sem conseguir ler o banco, trata como conta nova: o aceite é pedido de novo.
      }
      if (!aceitou) {
        const pendente = { nome: usuario.displayName ?? '', email: usuario.email ?? '' };
        googlePendente = idToken;
        await signOut(auth);
        return { tipo: 'ACEITE_NECESSARIO', ...pendente };
      }
    }
    return { tipo: 'SESSAO', usuario: paraUsuarioAuth(usuario) };
  },

  async recuperarSenha(email) {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (falha) {
      const convertido = converterErroAuth(falha, 'geral');
      // RN-CON-09: nunca revela se o e-mail existe. Só problemas de conexão/limite chegam à tela.
      if (convertido.code === 'OFFLINE' || convertido.code === 'MUITAS_REQUISICOES') throw convertido;
    }
  },

  async sair() {
    googlePendente = null;
    await signOut(auth);
    // Também encerra a sessão do Google no aparelho, para o próximo login poder escolher outra conta.
    await googleNativo.sair();
  },

  async obterToken(forcarRenovacao) {
    return auth.currentUser ? auth.currentUser.getIdToken(forcarRenovacao) : null;
  },

  async alterarEmail(novoEmail, senhaAtual) {
    const usuario = usuarioAtual();
    const email = novoEmail.trim().toLowerCase();
    if (!emailValido(email)) throw erro('EMAIL_INVALIDO');

    // RN-CON-07: a troca exige a senha atual.
    await reautenticarComSenha(usuario, senhaAtual);
    try {
      // Com a proteção contra enumeração de e-mails ativa, o Firebase só troca o e-mail depois
      // que a pessoa confirma pelo link enviado ao novo endereço. Até lá o e-mail não muda.
      await verifyBeforeUpdateEmail(usuario, email);
    } catch (falha) {
      throw converterErroAuth(falha, 'geral');
    }
    return paraUsuarioAuth(usuario);
  },

  async alterarSenha(senhaAtual, novaSenha) {
    const usuario = usuarioAtual();
    if (!senhaValida(novaSenha)) throw erro('SENHA_FRACA');
    await reautenticarComSenha(usuario, senhaAtual);
    try {
      await updatePassword(usuario, novaSenha);
    } catch (falha) {
      throw converterErroAuth(falha, 'geral');
    }
  },

  async definirSenha(novaSenha) {
    const usuario = usuarioAtual();
    if (!senhaValida(novaSenha)) throw erro('SENHA_FRACA');
    if (!usuario.email) throw erro('NAO_AUTENTICADO');
    try {
      // RN-CON-13: conta só com Google ganha o login por senha, com o mesmo e-mail do Google.
      await linkWithCredential(usuario, EmailAuthProvider.credential(usuario.email, novaSenha));
      await usuario.reload();
    } catch (falha) {
      throw converterErroAuth(falha, 'geral');
    }
    return paraUsuarioAuth(usuario);
  },

  async atualizarNome(nome) {
    const usuario = usuarioAtual();
    if (!nomeValido(nome)) throw new ErroApi('NOME_INVALIDO', 422);
    try {
      await updateProfile(usuario, { displayName: nome.trim() });
    } catch (falha) {
      throw converterErroAuth(falha, 'geral');
    }
    return paraUsuarioAuth(usuario);
  },

  async reautenticar(senha) {
    // RN-CON-08: confirmação forte antes de excluir. Conta com senha: a senha.
    // Conta só com Google: um novo login com Google, na mesma conta.
    const usuario = usuarioAtual();
    if (senha !== undefined) {
      await reautenticarComSenha(usuario, senha);
      return;
    }
    const idToken = await idTokenDoGoogle();
    try {
      await reauthenticateWithCredential(usuario, GoogleAuthProvider.credential(idToken));
    } catch (falha) {
      // Outra conta do Google escolhida: não confirma a identidade.
      if (ehErroFirebase(falha) && falha.code === 'auth/user-mismatch') throw erro('CREDENCIAIS_INVALIDAS');
      throw converterErroAuth(falha, 'reautenticacao');
    }
  },

  async excluirConta() {
    try {
      await deleteUser(usuarioAtual());
    } catch (falha) {
      throw converterErroAuth(falha, 'geral');
    }
  },
};
