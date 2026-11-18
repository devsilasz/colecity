import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

import type { UserDataService } from '@/services/contratos';
import { comErroTratado, db } from '@/services/firebase';
import type { EstadoOcorrenciaUsuario } from '@/types/usuario';

/**
 * O que fica no Cloud Firestore: só os dados do próprio usuário (doc 08, seção 8).
 * Todo o domínio (ocorrências, participações, comentários) vem da API C# pelo BFF.
 *
 * - `users/{uid}`: aceite dos termos e preferência de notificações. O aceite também é usado
 *   no login com Google (RN-CON-11) e pelo BFF para recadastrar a conta no domínio.
 * - `users/{uid}/occurrenceState/{ocorrenciaId}`: silenciada e última visita (RN-NOT-04, RN-MIN-04).
 * - `users/{uid}/devices/{id}`: tokens de push, gravados por `notificacoes.ts`.
 */
const usuario = (uid: string) => doc(db, 'users', uid);
const estados = (uid: string) => collection(db, 'users', uid, 'occurrenceState');
const aparelhos = (uid: string) => collection(db, 'users', uid, 'devices');

const ESTADO_PADRAO: EstadoOcorrenciaUsuario = { muted: false, lastSeenAt: null };

function lerEstado(dados: Record<string, unknown>): EstadoOcorrenciaUsuario {
  return {
    muted: dados.muted === true,
    lastSeenAt: typeof dados.lastSeenAt === 'string' ? dados.lastSeenAt : null,
  };
}

export const userDataFirestore: UserDataService = {
  // RN-CON-01, RN-CON-11
  registrarAceite(uid, aceiteTermosVersao) {
    return comErroTratado(() =>
      setDoc(usuario(uid), { aceiteTermosVersao, updatedAt: new Date().toISOString() }, { merge: true }),
    );
  },

  obterNotificacoesAtivas(uid) {
    return comErroTratado(async () => (await getDoc(usuario(uid))).get('notificationsEnabled') !== false);
  },

  definirNotificacoesAtivas(uid, ativas) {
    return comErroTratado(() =>
      setDoc(usuario(uid), { notificationsEnabled: ativas, updatedAt: new Date().toISOString() }, { merge: true }),
    );
  },

  obterEstados(uid) {
    return comErroTratado(async () => {
      const resultado = await getDocs(estados(uid));
      return Object.fromEntries(resultado.docs.map((item) => [item.id, { ...ESTADO_PADRAO, ...lerEstado(item.data()) }]));
    });
  },

  // RN-NOT-04
  definirSilenciada(uid, ocorrenciaId, silenciada) {
    return comErroTratado(() => setDoc(doc(estados(uid), ocorrenciaId), { muted: silenciada }, { merge: true }));
  },

  // RN-MIN-04
  registrarVisita(uid, ocorrenciaId) {
    return comErroTratado(() =>
      setDoc(doc(estados(uid), ocorrenciaId), { lastSeenAt: new Date().toISOString() }, { merge: true }),
    );
  },

  /** Exclusão de conta (RN-CON-08): apaga estados, aparelhos e o próprio `users/{uid}`. */
  limpar(uid) {
    return comErroTratado(async () => {
      const [listaEstados, listaAparelhos] = await Promise.all([getDocs(estados(uid)), getDocs(aparelhos(uid))]);
      await Promise.all([...listaEstados.docs, ...listaAparelhos.docs].map((item) => deleteDoc(item.ref)));
      await deleteDoc(usuario(uid));
    });
  },
};
