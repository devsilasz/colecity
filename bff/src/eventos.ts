import type { Firestore } from 'firebase-admin/firestore';

import { ehTokenExpo, enviarPush, type MensagemPush } from './expoPush.js';
import { banco } from './firebase.js';
import { ErroHttp } from './http.js';
import { textoDaNotificacao } from './textos.js';
import { TIPOS_EVENTO, type DeviceDoc, type EventoDominio, type ResultadoEvento, type TipoEvento } from './tipos.js';

/** Canal de notificação criado pelo app no Android. */
/**
 * Canal do Android usado quando o aparelho não informa o seu (APK anterior a 19/11/2026, que só tem
 * este canal). As versões novas gravam `canal` no aparelho (`ocorrencias-alerta`, com som). Enviar para
 * um canal que não existe no aparelho faz o Android descartar a notificação.
 */
const CANAL_PADRAO = 'ocorrencias';
const MAX_DESTINATARIOS = 500;

/** Ids viram parte de caminhos do Firestore: texto curto, sem barra. */
function ehId(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0 && valor.length <= 128 && !valor.includes('/');
}

function ehTipo(valor: unknown): valor is TipoEvento {
  return typeof valor === 'string' && (TIPOS_EVENTO as readonly string[]).includes(valor);
}

/** Valida o envelope do domínio. Tipo desconhecido não é erro: é ignorado (o domínio pode evoluir). */
export function lerEvento(corpo: unknown): EventoDominio | 'TIPO_DESCONHECIDO' {
  const invalido = new ErroHttp(400, 'EVENTO_INVALIDO', 'Envelope de evento inválido.');
  if (typeof corpo !== 'object' || corpo === null) throw invalido;
  const { eventId, tipo, ocorridoEm, dados } = corpo as Record<string, unknown>;
  if (!ehId(eventId) || typeof dados !== 'object' || dados === null) throw invalido;
  if (!ehTipo(tipo)) return 'TIPO_DESCONHECIDO';

  const d = dados as Record<string, unknown>;
  const uids = Array.isArray(d.destinatariosUids) ? d.destinatariosUids.filter(ehId) : [];
  if (!ehId(d.ocorrenciaId)) throw invalido;

  return {
    eventId,
    tipo,
    ocorridoEm: typeof ocorridoEm === 'string' ? ocorridoEm : new Date().toISOString(),
    dados: {
      ocorrenciaId: d.ocorrenciaId,
      titulo: typeof d.titulo === 'string' ? d.titulo : 'Ocorrência',
      destinatariosUids: [...new Set(uids)].slice(0, MAX_DESTINATARIOS),
      ...(d.novoEstado === 'ABERTA' || d.novoEstado === 'EM_ACOMPANHAMENTO' || d.novoEstado === 'CONCLUIDA'
        ? { novoEstado: d.novoEstado }
        : {}),
      ...(typeof d.linha === 'string' ? { linha: d.linha } : {}),
    },
  };
}

function jaExiste(erro: unknown): boolean {
  // Código gRPC 6 = ALREADY_EXISTS (documento criado por uma entrega anterior).
  return typeof erro === 'object' && erro !== null && 'code' in erro && erro.code === 6;
}

interface Destinatario {
  uid: string;
  /** Token → documento do aparelho (para desativar tokens inválidos) e canal do Android. */
  aparelhos: Map<string, { caminho: string; canal: string }>;
}

/**
 * Aplica as preferências de cada pessoa (RN-NOT-04) e devolve os aparelhos. Todo comentário gera push,
 * sem o antigo limite de 30 minutos (decisão de 19/11/2026, RN-NOT-02).
 */
async function prepararDestinatario(db: Firestore, uid: string, evento: EventoDominio): Promise<Destinatario | null> {
  const { ocorrenciaId } = evento.dados;
  const [usuario, estado, aparelhos] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`users/${uid}/occurrenceState/${ocorrenciaId}`).get(),
    db.collection(`users/${uid}/devices`).where('enabled', '==', true).get(),
  ]);

  // Desligou todas as notificações no perfil, ou silenciou esta ocorrência.
  if (usuario.get('notificationsEnabled') === false) return null;
  if (estado.get('muted') === true) return null;

  const tokens = new Map<string, { caminho: string; canal: string }>();
  for (const item of aparelhos.docs) {
    const aparelho = item.data() as DeviceDoc;
    if (typeof aparelho.token === 'string' && ehTokenExpo(aparelho.token)) {
      const canal = typeof aparelho.canal === 'string' && aparelho.canal ? aparelho.canal : CANAL_PADRAO;
      tokens.set(aparelho.token, { caminho: item.ref.path, canal });
    }
  }
  return tokens.size > 0 ? { uid, aparelhos: tokens } : null;
}

/**
 * Processa um evento do domínio: descarta repetidos (`eventId`), aplica preferências, envia pelo Expo Push e desativa tokens inválidos. Os destinatários vêm
 * calculados pelo domínio (autor, afetados e apoiadores, sem quem fez a ação).
 */
export async function processarEvento(evento: EventoDominio): Promise<ResultadoEvento> {
  const db = banco();
  const nada = { enviado: false, destinatarios: 0, aparelhos: 0, tokensDesativados: 0 };
  const agora = new Date().toISOString();

  // Entrega "pelo menos uma vez": `create` falha se o evento já foi processado.
  const marca = db.doc(`eventosProcessados/${evento.eventId}`);
  try {
    await marca.create({ tipo: evento.tipo, ocorrenciaId: evento.dados.ocorrenciaId, processadoEm: agora });
  } catch (erro) {
    if (jaExiste(erro)) return { ...nada, motivo: 'DUPLICADO' };
    throw erro;
  }

  try {
    const preparados = await Promise.all(
      evento.dados.destinatariosUids.map((uid) => prepararDestinatario(db, uid, evento)),
    );
    const destinatarios = preparados.filter((item): item is Destinatario => item !== null);
    if (destinatarios.length === 0) return { ...nada, motivo: 'SEM_DESTINATARIOS' };

    const texto = textoDaNotificacao(evento);
    const caminhoPorToken = new Map<string, string>();
    const mensagens: MensagemPush[] = [];
    for (const destinatario of destinatarios) {
      for (const [token, { caminho, canal }] of destinatario.aparelhos) {
        caminhoPorToken.set(token, caminho);
        mensagens.push({
          to: token,
          title: texto.titulo,
          body: texto.corpo,
          data: { occurrenceId: evento.dados.ocorrenciaId },
          channelId: canal,
          sound: 'default',
          priority: 'high',
        });
      }
    }

    console.info('Canais usados:', [...new Set(mensagens.map((m) => m.channelId))].join(', '));
    const { invalidos, erros } = await enviarPush(mensagens);

    const lote = db.batch();
    // Tokens que o Expo recusou deixam de ser usados.
    for (const token of invalidos) {
      const caminho = caminhoPorToken.get(token);
      if (caminho) lote.update(db.doc(caminho), { enabled: false, updatedAt: agora });
    }
    await lote.commit();

    return {
      enviado: true,
      destinatarios: destinatarios.length,
      aparelhos: mensagens.length,
      tokensDesativados: invalidos.length,
      ...(erros.length > 0 ? { errosEnvio: erros } : {}),
    };
  } catch (erro) {
    // Falhou antes de concluir: libera o eventId para a nova tentativa do domínio.
    await marca.delete().catch(() => undefined);
    throw erro;
  }
}
