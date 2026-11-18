import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { doc, setDoc } from 'firebase/firestore';

import { env } from '@/config/env';

import { auth, db } from './firebase';

/**
 * Push notifications (somente Android, somente no APK / development build).
 *
 * - O app só registra o aparelho (Expo push token em `users/{uid}/devices/{deviceId}`) e avisa a
 *   API de push que um evento aconteceu. Quem recebe é decidido no servidor (`push-api/`).
 * - No Expo Go, no iOS e fora da fonte `firestore` tudo aqui vira "não faz nada", sem erro.
 *   Por isso o `expo-notifications` é carregado sob demanda: no Expo Go ele nem é importado.
 */

export type EstadoPush =
  /** Expo Go, iOS ou fonte de dados sem Firebase. */
  | 'INDISPONIVEL'
  /** Permissão ainda não pedida (RN-NOT-01: só após o primeiro registro ou participação). */
  | 'NAO_PEDIDA'
  | 'ATIVO'
  /** A pessoa negou a permissão do Android. */
  | 'NEGADA'
  /** Permissão dada, mas o aparelho não conseguiu um token (emulador, sem Google Play, sem rede). */
  | 'SEM_TOKEN';

export type EventoPush = 'comentario' | 'concluida' | 'reaberta';

type ModuloNotificacoes = typeof import('expo-notifications');

/** Canal do Android; o mesmo nome é usado pela API de push. */
export const CANAL_OCORRENCIAS = 'ocorrencias';
const CHAVE_APARELHO = '@colecity/push/deviceId';

const disponivel = env.recursos.push && env.fonteDados === 'firestore';

/**
 * Último aparelho gravado nesta sessão (conta + token). Evita regravar o mesmo token e, junto com
 * o filtro em `aoMudarToken`, impede um laço: pedir o token faz o Android emitir o evento de
 * "token novo", que pediria o token de novo.
 */
let ultimoGravado: string | null = null;
let ultimoTokenDoAparelho: string | null = null;

function carregarModulo(): Promise<ModuloNotificacoes> {
  return import('expo-notifications');
}

// ── Estado observável (para o Perfil explicar por que o push não está ativo) ─────────────
let estado: EstadoPush = disponivel ? 'NAO_PEDIDA' : 'INDISPONIVEL';
const ouvintes = new Set<() => void>();

function definirEstado(novo: EstadoPush): EstadoPush {
  if (novo !== estado) {
    estado = novo;
    ouvintes.forEach((avisar) => avisar());
  }
  return novo;
}

async function idDoAparelho(): Promise<string> {
  const salvo = await AsyncStorage.getItem(CHAVE_APARELHO);
  if (salvo) return salvo;
  const novo = Crypto.randomUUID();
  await AsyncStorage.setItem(CHAVE_APARELHO, novo);
  return novo;
}

function idDoProjetoEas(): string | null {
  const extra: unknown = Constants.expoConfig?.extra?.eas;
  const doExtra =
    typeof extra === 'object' && extra !== null && 'projectId' in extra && typeof extra.projectId === 'string'
      ? extra.projectId
      : null;
  return doExtra ?? Constants.easConfig?.projectId ?? null;
}

/** Evento que o app relata à API de push depois de gravar no Firestore. */
export function idEventoEstado(ocorrenciaId: string, evento: 'concluida' | 'reaberta', em: string): string {
  return `${ocorrenciaId}_${evento}_${em}`;
}

export const notificacoes = {
  disponivel,

  assinar(avisar: () => void): () => void {
    ouvintes.add(avisar);
    return () => {
      ouvintes.delete(avisar);
    };
  },

  obterEstado(): EstadoPush {
    return estado;
  },

  /** Como a notificação aparece com o app aberto, e o canal do Android. Chamar uma vez. */
  async configurar(): Promise<void> {
    if (!disponivel) return;
    const Notifications = await carregarModulo();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    await Notifications.setNotificationChannelAsync(CANAL_OCORRENCIAS, {
      name: 'Ocorrências',
      description: 'Novidades nas ocorrências que você registrou, afetam você ou apoia.',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  },

  /**
   * Obtém o Expo push token e grava o aparelho da conta logada.
   * `pedir: true` mostra o pedido de permissão do Android (RN-NOT-01); com `false` só renova o
   * token de quem já tinha permitido (abertura do app, login, troca de token).
   */
  async registrarAparelho({ pedir }: { pedir: boolean }): Promise<EstadoPush> {
    if (!disponivel) return estado;
    const uid = auth.currentUser?.uid;
    if (!uid) return estado;

    try {
      const Notifications = await carregarModulo();
      let permissao = await Notifications.getPermissionsAsync();
      if (!permissao.granted) {
        if (!pedir) return definirEstado(permissao.canAskAgain ? 'NAO_PEDIDA' : 'NEGADA');
        permissao = await Notifications.requestPermissionsAsync();
        if (!permissao.granted) return definirEstado('NEGADA');
      }

      // Emulador sem Google Play ou build sem projeto EAS não conseguem token.
      const projectId = idDoProjetoEas();
      if (!Device.isDevice || !projectId) return definirEstado('SEM_TOKEN');

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      const chave = `${uid}|${token}`;
      if (ultimoGravado === chave) return definirEstado('ATIVO');
      await setDoc(doc(db, 'users', uid, 'devices', await idDoAparelho()), {
        token,
        plataforma: 'android',
        enabled: true,
        updatedAt: new Date().toISOString(),
      });
      ultimoGravado = chave;
      return definirEstado('ATIVO');
    } catch {
      // Sem rede, sem Google Play Services ou `google-services.json` ausente no build.
      return definirEstado('SEM_TOKEN');
    }
  },

  /** No logout: este aparelho deixa de receber as notificações da conta que saiu. */
  async desativarAparelho(uid: string): Promise<void> {
    if (!disponivel) return;
    try {
      const salvo = await AsyncStorage.getItem(CHAVE_APARELHO);
      if (!salvo) return;
      await setDoc(
        doc(db, 'users', uid, 'devices', salvo),
        { enabled: false, updatedAt: new Date().toISOString() },
        { merge: true },
      );
    } catch {
      // Sem conexão no logout: o token é desativado pelo servidor quando o Expo o recusar.
    } finally {
      ultimoGravado = null;
      definirEstado('NAO_PEDIDA');
    }
  },

  /**
   * Avisa a API de push que um evento aconteceu (já gravado no Firestore). O app não escolhe
   * destinatários nem texto. Falha aqui nunca desfaz a ação nem aparece para a pessoa.
   */
  async avisarEvento(ocorrenciaId: string, evento: EventoPush, eventoId: string): Promise<void> {
    if (env.fonteDados !== 'firestore' || !env.pushApiUrl) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await axios.post(
        `${env.pushApiUrl.replace(/\/+$/, '')}/notificar`,
        { ocorrenciaId, evento, eventoId },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10_000 },
      );
    } catch {
      // Silencioso de propósito.
    }
  },

  /**
   * Chama `aoAbrir` com o id da ocorrência quando a pessoa toca em uma notificação (RN-NOT-05),
   * inclusive a que abriu o app. Devolve a função que remove o listener.
   */
  aoTocar(aoAbrir: (ocorrenciaId: string) => void): () => void {
    if (!disponivel) return () => undefined;
    let ativo = true;
    let remover: (() => void) | null = null;

    const tratar = (dados: unknown) => {
      const id =
        typeof dados === 'object' && dados !== null && 'occurrenceId' in dados ? dados.occurrenceId : null;
      if (typeof id === 'string' && id) aoAbrir(id);
    };

    void carregarModulo().then((Notifications) => {
      if (!ativo) return;
      // Notificação que abriu o app fechado.
      const inicial = Notifications.getLastNotificationResponse();
      if (inicial) {
        tratar(inicial.notification.request.content.data);
        Notifications.clearLastNotificationResponse();
      }
      const inscricao = Notifications.addNotificationResponseReceivedListener((resposta) =>
        tratar(resposta.notification.request.content.data),
      );
      remover = () => inscricao.remove();
    });

    return () => {
      ativo = false;
      remover?.();
    };
  },

  /** O token do aparelho pode mudar (reinstalação, restauração): regrava quando isso acontece. */
  aoMudarToken(): () => void {
    if (!disponivel) return () => undefined;
    let ativo = true;
    let remover: (() => void) | null = null;

    void carregarModulo().then((Notifications) => {
      if (!ativo) return;
      const inscricao = Notifications.addPushTokenListener((novo) => {
        // O mesmo token é emitido de novo a cada consulta: só um token diferente é regravado.
        const valor = typeof novo.data === 'string' ? novo.data : JSON.stringify(novo.data);
        if (valor === ultimoTokenDoAparelho) return;
        const primeiro = ultimoTokenDoAparelho === null;
        ultimoTokenDoAparelho = valor;
        // O primeiro evento é o token atual, que `registrarAparelho` já gravou.
        if (!primeiro) void notificacoes.registrarAparelho({ pedir: false });
      });
      remover = () => inscricao.remove();
    });

    return () => {
      ativo = false;
      remover?.();
    };
  },
};
