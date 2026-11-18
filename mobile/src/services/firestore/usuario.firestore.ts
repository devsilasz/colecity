import { collection, deleteDoc, doc, getDoc, getDocs, query, runTransaction, setDoc, where } from 'firebase/firestore';

import type { UserDataService, UsuarioService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { auth, comErroTratado, db } from '@/services/firebase';
import type { OcorrenciaResumo } from '@/types/ocorrencia';
import type { Usuario } from '@/types/usuario';
import { nomeValido } from '@/utils/validacoes';

import {
  carregarMinhasParticipacoes,
  carregarOcorrencias,
  colecoes,
  esquecerPerfil,
  exigirUid,
  invalidarCacheFirestore,
  oculto,
  paraResumo,
  zonasDe,
  type EstadoOcorrenciaDoc,
  type OcorrenciaRegistro,
  type UsuarioDoc,
} from './base';
import { paginar } from './paginar';

/** RN-MIN-02: não concluídas primeiro; em cada grupo, atividade mais recente primeiro. */
function ordemMinhas(a: OcorrenciaRegistro, b: OcorrenciaRegistro): number {
  const concluidaA = a.estado === 'CONCLUIDA' ? 1 : 0;
  const concluidaB = b.estado === 'CONCLUIDA' ? 1 : 0;
  return concluidaA - concluidaB || b.ultimaAtividadeEm.localeCompare(a.ultimaAtividadeEm);
}

async function lerUsuario(uid: string): Promise<UsuarioDoc | undefined> {
  return (await getDoc(doc(colecoes.usuarios, uid))).data();
}

/** O e-mail fica só no Firebase Auth; o Firestore não o guarda (RN-CON-06). */
function paraUsuario(uid: string, nome: string, dados: UsuarioDoc): Usuario {
  return {
    id: uid,
    nome,
    email: auth.currentUser?.email ?? '',
    aceiteTermosVersao: dados.aceiteTermosVersao,
    criadoEm: dados.criadoEm,
  };
}

/** Usuário no Cloud Firestore: `perfis/{uid}` (nome público) e `users/{uid}` (dados privados). */
export const usuarioFirestore: UsuarioService = {
  registrarAcesso(dados) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      if (!nomeValido(dados.nome)) throw new ErroApi('NOME_INVALIDO', 422);

      const existente = await lerUsuario(uid);
      const aceiteTermosVersao = dados.aceiteTermosVersao ?? existente?.aceiteTermosVersao;
      // RN-CON-01: a conta só existe no banco com o aceite dos termos.
      if (!aceiteTermosVersao) throw new ErroApi('ACEITE_TERMOS_OBRIGATORIO', 422);

      const agora = new Date().toISOString();
      const usuario: UsuarioDoc = {
        aceiteTermosVersao,
        criadoEm: existente?.criadoEm ?? agora,
        notificationsEnabled: existente?.notificationsEnabled ?? true,
        updatedAt: agora,
      };
      const nome = dados.nome.trim();
      await Promise.all([
        setDoc(doc(colecoes.usuarios, uid), usuario),
        setDoc(doc(colecoes.perfis, uid), { nome, removido: false }),
      ]);
      esquecerPerfil(uid);
      return paraUsuario(uid, nome, usuario);
    });
  },

  obterPerfil() {
    return comErroTratado(async () => {
      const uid = exigirUid();
      const [usuario, perfil] = await Promise.all([lerUsuario(uid), getDoc(doc(colecoes.perfis, uid))]);
      if (!usuario) throw new ErroApi('USUARIO_NAO_CADASTRADO', 403);
      return paraUsuario(uid, perfil.data()?.nome ?? '', usuario);
    });
  },

  atualizarPerfil(dados) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      const usuario = await lerUsuario(uid);
      if (!usuario) throw new ErroApi('USUARIO_NAO_CADASTRADO', 403);

      const perfilAtual = (await getDoc(doc(colecoes.perfis, uid))).data();
      let nome = perfilAtual?.nome ?? '';
      if (dados.nome !== undefined) {
        if (!nomeValido(dados.nome)) throw new ErroApi('NOME_INVALIDO', 422);
        nome = dados.nome.trim();
        await setDoc(doc(colecoes.perfis, uid), { nome, removido: false });
        esquecerPerfil(uid);
      }
      // A troca de e-mail acontece só no Firebase Auth: não há e-mail no Firestore.
      return paraUsuario(uid, nome, usuario);
    });
  },

  excluirConta() {
    return comErroTratado(async () => {
      const uid = exigirUid();

      // RN-CON-08, anonimização: 1) as participações saem das contagens.
      const participacoes = await getDocs(query(colecoes.participacoes, where('uid', '==', uid)));
      for (const item of participacoes.docs) {
        await runTransaction(db, async (transacao) => {
          const participacao = (await transacao.get(item.ref)).data();
          if (!participacao || (!participacao.afetado && !participacao.apoio)) return;

          const refOcorrencia = doc(colecoes.ocorrencias, participacao.ocorrenciaId);
          const ocorrencia = (await transacao.get(refOcorrencia)).data();
          if (ocorrencia) {
            transacao.update(refOcorrencia, {
              totalAfetados: ocorrencia.totalAfetados - Number(participacao.afetado),
              totalApoios: ocorrencia.totalApoios - Number(participacao.apoio),
            });
          }
          transacao.set(item.ref, {
            ...participacao,
            afetado: false,
            apoio: false,
            atualizadoEm: new Date().toISOString(),
          });
        });
      }

      // 2) O nome público some: ocorrências e comentários passam a mostrar "Usuário removido".
      await setDoc(doc(colecoes.perfis, uid), { nome: '', removido: true });

      // 3) Os dados privados (preferências e estado por ocorrência) são apagados.
      const estados = await getDocs(colecoes.estadosDoUsuario(uid));
      await Promise.all(estados.docs.map((item) => deleteDoc(item.ref)));
      // Aparelhos registrados para push: saem junto com a conta.
      const aparelhos = await getDocs(collection(db, 'users', uid, 'devices'));
      await Promise.all(aparelhos.docs.map((item) => deleteDoc(item.ref)));
      await deleteDoc(doc(colecoes.usuarios, uid));

      esquecerPerfil(uid);
      invalidarCacheFirestore();
    });
  },

  minhasOcorrencias(aba, page) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      const [todas, participacoes] = await Promise.all([
        carregarOcorrencias(),
        carregarMinhasParticipacoes(uid),
      ]);
      const zonas = zonasDe(todas);

      const itens = todas
        // O autor continua vendo a própria ocorrência mesmo oculta por moderação.
        .filter((o) => !oculto(o) || o.autorId === uid)
        .filter((o) => {
          const participacao = participacoes.get(o.id);
          if (aba === 'REGISTRADAS') return o.autorId === uid;
          if (aba === 'AFETADO') return participacao?.afetado === true;
          return participacao?.apoio === true;
        })
        .sort(ordemMinhas)
        .map<OcorrenciaResumo>((o) => paraResumo(o, uid, participacoes.get(o.id), zonas));

      return paginar(itens, page, 20);
    });
  },
};

const ESTADO_PADRAO: EstadoOcorrenciaDoc = { muted: false, lastSeenAt: null };

/** Dados do próprio usuário no Firestore: `users/{uid}` e `users/{uid}/occurrenceState` (doc 08 §8). */
export const userDataFirestore: UserDataService = {
  obterNotificacoesAtivas(uid) {
    return comErroTratado(async () => (await lerUsuario(uid))?.notificationsEnabled ?? true);
  },

  definirNotificacoesAtivas(uid, ativas) {
    return comErroTratado(() =>
      setDoc(
        doc(colecoes.usuarios, uid),
        { notificationsEnabled: ativas, updatedAt: new Date().toISOString() },
        { merge: true },
      ),
    );
  },

  obterEstados(uid) {
    return comErroTratado(async () => {
      const resultado = await getDocs(colecoes.estadosDoUsuario(uid));
      return Object.fromEntries(
        resultado.docs.map((item) => [item.id, { ...ESTADO_PADRAO, ...item.data() }]),
      );
    });
  },

  // RN-NOT-04
  definirSilenciada(uid, ocorrenciaId, silenciada) {
    return comErroTratado(() =>
      setDoc(doc(colecoes.estadosDoUsuario(uid), ocorrenciaId), { muted: silenciada }, { merge: true }),
    );
  },

  // RN-MIN-04
  registrarVisita(uid, ocorrenciaId) {
    return comErroTratado(() =>
      setDoc(
        doc(colecoes.estadosDoUsuario(uid), ocorrenciaId),
        { lastSeenAt: new Date().toISOString() },
        { merge: true },
      ),
    );
  },

  limpar(uid) {
    return comErroTratado(async () => {
      const estados = await getDocs(colecoes.estadosDoUsuario(uid));
      await Promise.all(estados.docs.map((item) => deleteDoc(item.ref)));
    });
  },
};
