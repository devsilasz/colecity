import type { UsuarioLogado } from './auth.js';
import { chamarDominio } from './dominio.js';
import { banco } from './firebase.js';

/**
 * Cadastro do usuário no domínio (`PUT /usuarios/me`, doc 10).
 *
 * O app chama `PUT /usuarios/me` no cadastro, com o aceite dos termos. O BFF guarda a versão
 * aceita em `bffUsuarios/{uid}` (só o Admin SDK acessa) para poder recadastrar sozinho quando o
 * domínio não conhece o uid: primeiro acesso por outro aparelho ou banco do domínio recriado.
 */
const COLECAO = 'bffUsuarios';

export async function guardarAceite(uid: string, aceiteTermosVersao: string): Promise<void> {
  await banco().doc(`${COLECAO}/${uid}`).set({ aceiteTermosVersao, atualizadoEm: new Date().toISOString() });
}

export async function esquecerUsuario(uid: string): Promise<void> {
  await banco().doc(`${COLECAO}/${uid}`).delete();
}

/** Versão aceita: a guardada pelo BFF ou, para contas criadas antes dele, a de `users/{uid}`. */
async function aceiteGuardado(uid: string): Promise<string | null> {
  const [doBff, doApp] = await Promise.all([
    banco().doc(`${COLECAO}/${uid}`).get(),
    banco().doc(`users/${uid}`).get(),
  ]);
  for (const valor of [doBff.get('aceiteTermosVersao'), doApp.get('aceiteTermosVersao')] as unknown[]) {
    if (typeof valor === 'string' && valor.length > 0) return valor;
  }
  return null;
}

/** Nome válido para o domínio (2 a 80 caracteres): o do token, ou a parte local do e-mail. */
function nomeParaCadastro(usuario: UsuarioLogado): string {
  const candidato = (usuario.nome ?? usuario.email?.split('@')[0] ?? '').trim();
  const nome = candidato.length >= 2 ? candidato : 'Usuário Colecity';
  return nome.slice(0, 80);
}

/** Tenta cadastrar o usuário no domínio. Devolve `true` se deu certo. */
export async function recadastrar(usuario: UsuarioLogado): Promise<boolean> {
  const aceite = await aceiteGuardado(usuario.uid);
  if (!aceite || !usuario.email) return false;

  const corpo = { nome: nomeParaCadastro(usuario), email: usuario.email, aceiteTermosVersao: aceite };
  const resposta = await chamarDominio({
    metodo: 'PUT',
    caminho: 'usuarios/me',
    uid: usuario.uid,
    corpo: Buffer.from(JSON.stringify(corpo)),
    headers: { 'Content-Type': 'application/json' },
  });
  return resposta.status >= 200 && resposta.status < 300;
}

/**
 * Completa o corpo do `PUT /usuarios/me` vindo do app com o e-mail do token (fonte confiável)
 * e devolve a versão dos termos informada, para guardar depois do sucesso.
 */
export function prepararCadastro(corpo: Buffer, usuario: UsuarioLogado): { corpo: Buffer; aceite: string | null } {
  let dados: Record<string, unknown> = {};
  try {
    const lido: unknown = JSON.parse(corpo.toString('utf8') || '{}');
    if (typeof lido === 'object' && lido !== null && !Array.isArray(lido)) dados = lido as Record<string, unknown>;
  } catch {
    return { corpo, aceite: null };
  }
  if (usuario.email) dados.email = usuario.email;
  if (typeof dados.nome !== 'string' || dados.nome.trim().length === 0) dados.nome = nomeParaCadastro(usuario);
  const aceite = typeof dados.aceiteTermosVersao === 'string' ? dados.aceiteTermosVersao : null;
  return { corpo: Buffer.from(JSON.stringify(dados)), aceite };
}
