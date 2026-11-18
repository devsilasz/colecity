import type { VercelRequest, VercelResponse } from '@vercel/node';

import { autenticacao } from '../src/firebase.js';
import { notificar } from '../src/notificar.js';
import { ErroHttp, EVENTOS, type Evento, type PedidoNotificacao } from '../src/tipos.js';

function ehEvento(valor: unknown): valor is Evento {
  return typeof valor === 'string' && (EVENTOS as readonly string[]).includes(valor);
}

/** Ids viram parte de caminhos do Firestore: texto curto, sem barra. */
function ehId(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0 && valor.length <= 200 && !valor.includes('/');
}

function lerPedido(corpo: unknown): PedidoNotificacao {
  let dados: unknown = corpo;
  if (typeof corpo === 'string') {
    try {
      dados = JSON.parse(corpo);
    } catch {
      dados = null;
    }
  }
  if (typeof dados !== 'object' || dados === null) {
    throw new ErroHttp(400, 'REQUISICAO_INVALIDA', 'Corpo JSON obrigatório.');
  }
  const { ocorrenciaId, evento, eventoId } = dados as Record<string, unknown>;
  if (!ehId(ocorrenciaId) || !ehId(eventoId) || !ehEvento(evento)) {
    throw new ErroHttp(400, 'REQUISICAO_INVALIDA', 'Informe ocorrenciaId, evento e eventoId válidos.');
  }
  // Só estes três campos são lidos: destinatários e texto são decididos no servidor.
  return { ocorrenciaId, evento, eventoId };
}

async function uidDoToken(cabecalho: string | undefined): Promise<string> {
  const token = cabecalho?.startsWith('Bearer ') ? cabecalho.slice('Bearer '.length).trim() : '';
  if (!token) throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Envie o ID token do Firebase.');
  try {
    return (await autenticacao().verifyIdToken(token)).uid;
  } catch (falha) {
    // Só o código e a mensagem do Admin SDK vão para o log (sem o token).
    const codigo = typeof falha === 'object' && falha !== null && 'code' in falha ? String(falha.code) : '';
    console.warn('verifyIdToken falhou:', codigo, falha instanceof Error ? falha.message : '');
    throw new ErroHttp(401, 'NAO_AUTENTICADO', 'ID token inválido ou expirado.');
  }
}

/** POST /notificar — chamado pelo app depois de comentar, concluir ou reabrir uma ocorrência. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ erro: 'METODO_NAO_PERMITIDO', mensagem: 'Use POST.' });
    return;
  }

  try {
    const uid = await uidDoToken(req.headers.authorization);
    const resultado = await notificar(uid, lerPedido(req.body));
    res.status(200).json(resultado);
  } catch (erro) {
    if (erro instanceof ErroHttp) {
      res.status(erro.status).json({ erro: erro.codigo, mensagem: erro.message });
      return;
    }
    // Detalhes só no log da Vercel; nada interno vai para o cliente.
    console.error('Falha em /notificar:', erro instanceof Error ? erro.message : erro);
    res.status(500).json({ erro: 'ERRO_INTERNO', mensagem: 'Não foi possível enviar a notificação.' });
  }
}
