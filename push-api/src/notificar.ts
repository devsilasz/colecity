import type { Firestore } from 'firebase-admin/firestore';

import { ehTokenExpo, enviarPush, type MensagemPush } from './expoPush.js';
import { banco } from './firebase.js';
import { textoDaNotificacao } from './textos.js';
import {
  ErroHttp,
  type ComentarioDoc,
  type DeviceDoc,
  type OcorrenciaDoc,
  type ParticipacaoDoc,
  type PedidoNotificacao,
  type ResultadoNotificacao,
} from './tipos.js';

/** RN-NOT-02: no máximo 1 push de comentário por ocorrência a cada 30 minutos, por destinatário. */
const INTERVALO_COMENTARIOS_MS = 30 * 60 * 1000;
/** Uma reabertura só é notificada logo depois de acontecer. */
const JANELA_REABERTURA_MS = 15 * 60 * 1000;
/** Canal de notificação criado pelo app no Android. */
const CANAL_ANDROID = 'ocorrencias';

/** Ids dos eventos de mudança de estado: o app monta igual e o servidor confere com o Firestore. */
export function idEventoEstado(ocorrenciaId: string, evento: 'concluida' | 'reaberta', em: string): string {
  return `${ocorrenciaId}_${evento}_${em}`;
}

function jaExiste(erro: unknown): boolean {
  // Código gRPC 6 = ALREADY_EXISTS (documento criado por uma chamada anterior).
  return typeof erro === 'object' && erro !== null && 'code' in erro && erro.code === 6;
}

/**
 * Confirma no Firestore que o evento aconteceu e foi feito por quem está chamando.
 * Sem isso, qualquer conta poderia disparar notificações à vontade.
 */
async function confirmarEvento(
  db: Firestore,
  uid: string,
  pedido: PedidoNotificacao,
  ocorrencia: OcorrenciaDoc,
): Promise<void> {
  const { ocorrenciaId, evento, eventoId } = pedido;
  const naoConfere = new ErroHttp(409, 'EVENTO_NAO_CONFERE', 'O evento informado não foi encontrado.');

  if (evento === 'comentario') {
    const comentario = (await db.doc(`comentarios/${eventoId}`).get()).data() as ComentarioDoc | undefined;
    if (!comentario || comentario.ocorrenciaId !== ocorrenciaId) throw naoConfere;
    if (comentario.autorId !== uid) throw new ErroHttp(403, 'SEM_PERMISSAO', 'O comentário é de outra conta.');
    return;
  }

  if (evento === 'concluida') {
    // RN-ACO-04: só o autor conclui.
    if (ocorrencia.autorId !== uid) throw new ErroHttp(403, 'SEM_PERMISSAO', 'Só o autor conclui.');
    if (ocorrencia.estado !== 'CONCLUIDA' || !ocorrencia.concluidaEm) throw naoConfere;
    if (eventoId !== idEventoEstado(ocorrenciaId, 'concluida', ocorrencia.concluidaEm)) throw naoConfere;
    return;
  }

  // Reaberta (RN-ACO-07): feita por um afetado, registrada na linha do tempo.
  if (ocorrencia.estado === 'CONCLUIDA') throw naoConfere;
  const participacao = (await db.doc(`participacoes/${ocorrenciaId}_${uid}`).get()).data() as
    | ParticipacaoDoc
    | undefined;
  if (!participacao?.afetado) throw new ErroHttp(403, 'SEM_PERMISSAO', 'Só um afetado reabre.');

  const eventos = await db
    .collection(`ocorrencias/${ocorrenciaId}/linhaDoTempo`)
    .where('tipo', '==', 'REABERTA')
    .get();
  const confere = eventos.docs.some((item) => {
    const em: unknown = item.get('em');
    return (
      typeof em === 'string' &&
      eventoId === idEventoEstado(ocorrenciaId, 'reaberta', em) &&
      Date.now() - new Date(em).getTime() <= JANELA_REABERTURA_MS
    );
  });
  if (!confere) throw naoConfere;
}

/** Autor, afetados e apoiadores da ocorrência (RN-NOT-02), sem quem fez a ação. */
async function listarInteressados(
  db: Firestore,
  ocorrenciaId: string,
  ocorrencia: OcorrenciaDoc,
  autorDaAcao: string,
): Promise<string[]> {
  const participacoes = await db.collection('participacoes').where('ocorrenciaId', '==', ocorrenciaId).get();
  const uids = new Set<string>([ocorrencia.autorId]);
  for (const item of participacoes.docs) {
    const participacao = item.data() as ParticipacaoDoc;
    if (participacao.afetado || participacao.apoio) uids.add(participacao.uid);
  }
  uids.delete(autorDaAcao);
  return [...uids];
}

interface Destinatario {
  uid: string;
  /** Token → caminho do documento do aparelho (para desativar tokens inválidos). */
  aparelhos: Map<string, string>;
}

/** Aplica as preferências de cada pessoa (RN-NOT-04) e o limite de comentários; devolve os aparelhos. */
async function prepararDestinatario(
  db: Firestore,
  uid: string,
  pedido: PedidoNotificacao,
): Promise<Destinatario | null> {
  const [usuario, estado, controle, aparelhos] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`users/${uid}/occurrenceState/${pedido.ocorrenciaId}`).get(),
    db.doc(`pushControle/${uid}_${pedido.ocorrenciaId}`).get(),
    db.collection(`users/${uid}/devices`).where('enabled', '==', true).get(),
  ]);

  // Desligou todas as notificações no perfil, ou silenciou esta ocorrência.
  if (usuario.get('notificationsEnabled') === false) return null;
  if (estado.get('muted') === true) return null;

  if (pedido.evento === 'comentario') {
    const ultimo: unknown = controle.get('ultimoComentarioEm');
    if (typeof ultimo === 'string' && Date.now() - new Date(ultimo).getTime() < INTERVALO_COMENTARIOS_MS) {
      return null;
    }
  }

  const tokens = new Map<string, string>();
  for (const item of aparelhos.docs) {
    const aparelho = item.data() as DeviceDoc;
    if (typeof aparelho.token === 'string' && ehTokenExpo(aparelho.token)) {
      tokens.set(aparelho.token, item.ref.path);
    }
  }
  return tokens.size > 0 ? { uid, aparelhos: tokens } : null;
}

/**
 * Processa um evento vindo do app: confere, calcula os destinatários no servidor e envia.
 * `uid` vem do ID token já validado; nunca do corpo da requisição.
 */
export async function notificar(uid: string, pedido: PedidoNotificacao): Promise<ResultadoNotificacao> {
  const db = banco();
  const nada = { enviado: false, destinatarios: 0, aparelhos: 0, tokensDesativados: 0 };

  const ocorrencia = (await db.doc(`ocorrencias/${pedido.ocorrenciaId}`).get()).data() as
    | OcorrenciaDoc
    | undefined;
  if (!ocorrencia) throw new ErroHttp(404, 'NAO_ENCONTRADO', 'Ocorrência não encontrada.');

  await confirmarEvento(db, uid, pedido, ocorrencia);

  // Proteção contra duplicidade: `create` falha se o evento já foi processado.
  const agora = new Date().toISOString();
  try {
    await db.doc(`eventosProcessados/${pedido.evento}_${pedido.eventoId}`).create({
      ocorrenciaId: pedido.ocorrenciaId,
      evento: pedido.evento,
      uid,
      processadoEm: agora,
    });
  } catch (erro) {
    if (jaExiste(erro)) return { ...nada, motivo: 'DUPLICADO' };
    throw erro;
  }

  const interessados = await listarInteressados(db, pedido.ocorrenciaId, ocorrencia, uid);
  const preparados = await Promise.all(interessados.map((alvo) => prepararDestinatario(db, alvo, pedido)));
  const destinatarios = preparados.filter((item): item is Destinatario => item !== null);
  if (destinatarios.length === 0) return { ...nada, motivo: 'SEM_DESTINATARIOS' };

  const texto = textoDaNotificacao(pedido.evento, ocorrencia);
  const caminhoPorToken = new Map<string, string>();
  const mensagens: MensagemPush[] = [];
  for (const destinatario of destinatarios) {
    for (const [token, caminho] of destinatario.aparelhos) {
      caminhoPorToken.set(token, caminho);
      mensagens.push({
        to: token,
        title: texto.titulo,
        body: texto.corpo,
        data: { occurrenceId: pedido.ocorrenciaId },
        channelId: CANAL_ANDROID,
        sound: 'default',
        priority: 'high',
      });
    }
  }

  const { invalidos, erros } = await enviarPush(mensagens);

  const lote = db.batch();
  // Tokens que o Expo recusou deixam de ser usados.
  for (const token of invalidos) {
    const caminho = caminhoPorToken.get(token);
    if (caminho) lote.update(db.doc(caminho), { enabled: false, updatedAt: agora });
  }
  if (pedido.evento === 'comentario') {
    for (const destinatario of destinatarios) {
      lote.set(db.doc(`pushControle/${destinatario.uid}_${pedido.ocorrenciaId}`), { ultimoComentarioEm: agora });
    }
  }
  await lote.commit();

  return {
    enviado: true,
    destinatarios: destinatarios.length,
    aparelhos: mensagens.length,
    tokensDesativados: invalidos.length,
    ...(erros.length > 0 ? { errosEnvio: erros } : {}),
  };
}
