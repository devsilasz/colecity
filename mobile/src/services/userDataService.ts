import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EstadoOcorrenciaUsuario } from '@/types/usuario';

import type { UserDataService } from './contratos';
import { CHAVES } from './storage';

/**
 * Dados do próprio usuário: preferência de notificações, ocorrências silenciadas e última visita
 * (RN-MIN-04, RN-NOT-04), no AsyncStorage, por usuário. Usado só no mock; com o BFF, o adaptador é
 * o do Firestore (`firestore/userData.firestore.ts`, `users/{uid}`, doc 08 §8).
 */

interface DadosUsuarioLocal {
  notificationsEnabled: boolean;
  occurrenceState: Record<string, EstadoOcorrenciaUsuario>;
}

const PADRAO: DadosUsuarioLocal = { notificationsEnabled: true, occurrenceState: {} };

function chave(uid: string): string {
  return `${CHAVES.dadosUsuario}/${uid}`;
}

async function ler(uid: string): Promise<DadosUsuarioLocal> {
  try {
    const bruto = await AsyncStorage.getItem(chave(uid));
    return bruto ? { ...PADRAO, ...(JSON.parse(bruto) as Partial<DadosUsuarioLocal>) } : PADRAO;
  } catch {
    return PADRAO;
  }
}

async function gravar(uid: string, dados: DadosUsuarioLocal): Promise<void> {
  await AsyncStorage.setItem(chave(uid), JSON.stringify(dados));
}

async function atualizarEstado(
  uid: string,
  ocorrenciaId: string,
  mudanca: Partial<EstadoOcorrenciaUsuario>,
): Promise<void> {
  const dados = await ler(uid);
  const atual = dados.occurrenceState[ocorrenciaId] ?? { muted: false, lastSeenAt: null };
  await gravar(uid, {
    ...dados,
    occurrenceState: { ...dados.occurrenceState, [ocorrenciaId]: { ...atual, ...mudanca } },
  });
}

export const userDataLocal: UserDataService = {
  // No mock, o aceite já fica no usuário de demonstração (`mocks/banco.ts`).
  registrarAceite: () => Promise.resolve(),

  async obterNotificacoesAtivas(uid) {
    return (await ler(uid)).notificationsEnabled;
  },

  async definirNotificacoesAtivas(uid, ativas) {
    await gravar(uid, { ...(await ler(uid)), notificationsEnabled: ativas });
  },

  async obterEstados(uid) {
    return (await ler(uid)).occurrenceState;
  },

  definirSilenciada(uid, ocorrenciaId, silenciada) {
    return atualizarEstado(uid, ocorrenciaId, { muted: silenciada });
  },

  registrarVisita(uid, ocorrenciaId) {
    return atualizarEstado(uid, ocorrenciaId, { lastSeenAt: new Date().toISOString() });
  },

  async limpar(uid) {
    await AsyncStorage.removeItem(chave(uid));
  },
};
