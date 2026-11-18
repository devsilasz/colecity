import type { IncomingMessage } from 'node:http';

import { autenticacao } from './firebase.js';
import { cabecalho, ErroHttp } from './http.js';

export interface UsuarioLogado {
  uid: string;
  nome: string | null;
  email: string | null;
}

/**
 * Valida o ID token do Firebase (`Authorization: Bearer <token>`).
 * Sem header → `null` (rota pública). Header presente e inválido → 401.
 */
export async function usuarioDaRequisicao(req: IncomingMessage): Promise<UsuarioLogado | null> {
  const valor = cabecalho(req, 'authorization');
  if (!valor) return null;

  const token = valor.startsWith('Bearer ') ? valor.slice('Bearer '.length).trim() : '';
  if (!token) throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Envie o ID token do Firebase.');
  try {
    const decodificado = await autenticacao().verifyIdToken(token);
    const nome: unknown = decodificado.name;
    return {
      uid: decodificado.uid,
      nome: typeof nome === 'string' ? nome : null,
      email: decodificado.email ?? null,
    };
  } catch (falha) {
    // Só o código do Admin SDK vai para o log (nunca o token).
    const codigo = typeof falha === 'object' && falha !== null && 'code' in falha ? String(falha.code) : '';
    console.warn('verifyIdToken falhou:', codigo);
    throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Sessão inválida ou expirada. Entre novamente.');
  }
}

export async function exigirUsuario(req: IncomingMessage): Promise<UsuarioLogado> {
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Envie o ID token do Firebase.');
  return usuario;
}
