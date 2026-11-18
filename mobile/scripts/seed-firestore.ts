/**
 * Dados iniciais do Colecity no Firebase (Auth + Cloud Firestore).
 *
 *   npm run seed
 *
 * Cria as contas de demonstração e grava as ocorrências semente. Usa apenas o SDK cliente e a
 * configuração pública (`firebaseConfig.json`): cada escrita é feita logado como a conta dona do
 * dado, obedecendo às regras de segurança (`firestore.rules`). Nenhuma credencial administrativa.
 *
 * Pré-requisitos: login por e-mail/senha ativo, banco Firestore criado e regras publicadas.
 * Pode ser executado de novo: ocorrências que já existem são puladas.
 */
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import firebaseConfig from '../firebaseConfig.json';
import type { OcorrenciaMock } from '../src/mocks/banco';
import { montarSementes } from '../src/mocks/sementes';
import { UID_DEMO, USUARIOS_SEMENTE } from '../src/mocks/usuarios';
import { VERSAO_TERMOS } from '../src/types/usuario';
import { estadoPorRegra } from '../src/utils/regrasOcorrencia';

// O projeto não inclui os tipos do Node; o script só precisa encerrar o processo ao final.
declare const process: { exit(codigo: number): never };

interface Sessao {
  uid: string;
  db: Firestore;
  nome: string;
}

function arredondar(valor: number): number {
  return Math.round(valor * 1000) / 1000;
}

/** Abre uma sessão por conta (um app Firebase para cada), criando a conta se ainda não existir. */
async function abrirSessoes(): Promise<Map<string, Sessao>> {
  const sessoes = new Map<string, Sessao>();

  for (const [indice, semente] of USUARIOS_SEMENTE.entries()) {
    if (semente.senha === null) continue;
    const app = initializeApp(firebaseConfig, `seed-${indice}`);
    const auth = getAuth(app);

    let uid: string;
    try {
      uid = (await signInWithEmailAndPassword(auth, semente.email, semente.senha)).user.uid;
    } catch {
      const credencial = await createUserWithEmailAndPassword(auth, semente.email, semente.senha);
      await updateProfile(credencial.user, { displayName: semente.nome });
      uid = credencial.user.uid;
    }

    const db = getFirestore(app);
    const agora = new Date().toISOString();
    await setDoc(doc(db, 'perfis', uid), { nome: semente.nome, removido: false });
    await setDoc(
      doc(db, 'users', uid),
      { aceiteTermosVersao: VERSAO_TERMOS, criadoEm: agora, notificationsEnabled: true, updatedAt: agora },
      { merge: true },
    );

    sessoes.set(semente.id, { uid, db, nome: semente.nome });
    console.log(`Conta pronta: ${semente.email}`);
  }
  return sessoes;
}

/**
 * Completa a lista de participantes com outras contas de demonstração até chegar perto do total
 * da semente. A conta principal (Ana) só entra onde a semente pede, para as abas dela fazerem sentido.
 */
function participantes(marcados: readonly string[], total: number, autorId: string): string[] {
  const lista = marcados.filter((id) => id !== autorId);
  const candidatos = USUARIOS_SEMENTE.map((u) => u.id).filter(
    (id) => id !== autorId && id !== UID_DEMO && !lista.includes(id),
  );
  // `total` inclui quem já está em `marcados` (no caso de afetados, também o autor).
  const faltam = Math.max(0, total - marcados.length);
  return [...lista, ...candidatos.slice(0, faltam)];
}

async function participar(
  sessao: Sessao,
  ocorrencia: OcorrenciaMock,
  afetado: boolean,
  apoio: boolean,
  em: string,
): Promise<void> {
  const refOcorrencia = doc(sessao.db, 'ocorrencias', ocorrencia.id);
  const refParticipacao = doc(sessao.db, 'participacoes', `${ocorrencia.id}_${sessao.uid}`);

  await runTransaction(sessao.db, async (transacao) => {
    const atual = (await transacao.get(refOcorrencia)).data();
    if (!atual) throw new Error(`Ocorrência ${ocorrencia.id} não encontrada.`);

    const totalAfetados = Number(atual.totalAfetados) + Number(afetado);
    const totalApoios = Number(atual.totalApoios) + Number(apoio);
    // RN-ACO-02: passa a Em acompanhamento ao atingir 3 afetados.
    const mudaEstado =
      afetado &&
      atual.estado === 'ABERTA' &&
      estadoPorRegra(ocorrencia.categoria, totalAfetados) === 'EM_ACOMPANHAMENTO';

    transacao.set(refParticipacao, {
      uid: sessao.uid,
      ocorrenciaId: ocorrencia.id,
      afetado,
      apoio,
      atualizadoEm: em,
    });
    transacao.update(refOcorrencia, {
      totalAfetados,
      totalApoios,
      estado: mudaEstado ? 'EM_ACOMPANHAMENTO' : atual.estado,
    });
    if (mudaEstado) {
      transacao.set(doc(sessao.db, 'ocorrencias', ocorrencia.id, 'linhaDoTempo', 'em-acompanhamento'), {
        tipo: 'ESTADO_ALTERADO',
        descricao: 'Passou para Em acompanhamento ao atingir 3 afetados',
        em,
      });
    }
  });
}

async function main(): Promise<void> {
  console.log(`Projeto: ${firebaseConfig.projectId}`);
  const sessoes = await abrirSessoes();
  const { ocorrencias, comentarios } = montarSementes(Date.now());

  const sessaoDe = (idSemente: string): Sessao => {
    const sessao = sessoes.get(idSemente);
    if (!sessao) throw new Error(`Conta semente ${idSemente} sem sessão.`);
    return sessao;
  };

  let criadas = 0;
  for (const ocorrencia of ocorrencias) {
    const autor = sessaoDe(ocorrencia.autorId);
    const ref = doc(autor.db, 'ocorrencias', ocorrencia.id);
    if ((await getDoc(ref)).exists()) continue;

    // 1) O autor cria a ocorrência, já como único afetado (RN-REG-08).
    const lote = writeBatch(autor.db);
    lote.set(ref, {
      categoria: ocorrencia.categoria,
      tipo: ocorrencia.tipo,
      estado: 'ABERTA',
      rua: ocorrencia.rua,
      bairro: ocorrencia.bairro,
      localizacao: ocorrencia.localizacao,
      localizacaoAproximada: {
        lat: arredondar(ocorrencia.localizacao.lat),
        lng: arredondar(ocorrencia.localizacao.lng),
      },
      descricao: ocorrencia.descricao,
      linha: ocorrencia.linha,
      dataHoraOcorrido: ocorrencia.dataHoraOcorrido,
      fotos: ocorrencia.fotos,
      autorId: autor.uid,
      criadaEm: ocorrencia.criadaEm,
      ultimaAtividadeEm: ocorrencia.criadaEm,
      concluidaEm: null,
      conclusao: null,
      totalAfetados: 1,
      totalApoios: 0,
      totalDenuncias: 0,
    });
    lote.set(doc(autor.db, 'participacoes', `${ocorrencia.id}_${autor.uid}`), {
      uid: autor.uid,
      ocorrenciaId: ocorrencia.id,
      afetado: true,
      apoio: false,
      atualizadoEm: ocorrencia.criadaEm,
    });
    lote.set(doc(autor.db, 'ocorrencias', ocorrencia.id, 'linhaDoTempo', 'criada'), {
      tipo: 'CRIADA',
      descricao: 'Ocorrência registrada',
      em: ocorrencia.criadaEm,
    });
    await lote.commit();

    // 2) As outras contas participam, cada uma com a própria sessão.
    const afetados = participantes(
      ocorrencia.afetadosIds,
      ocorrencia.afetadosIds.length + ocorrencia.afetadosExtras,
      ocorrencia.autorId,
    );
    const apoiadores = participantes(
      ocorrencia.apoiadoresIds,
      ocorrencia.apoiadoresIds.length + ocorrencia.apoiosExtras,
      ocorrencia.autorId,
    );
    for (const idSemente of new Set([...afetados, ...apoiadores])) {
      await participar(
        sessaoDe(idSemente),
        ocorrencia,
        afetados.includes(idSemente),
        apoiadores.includes(idSemente),
        ocorrencia.ultimaAtividadeEm,
      );
    }

    // 3) Comentários, cada um pelo seu autor.
    for (const comentario of comentarios.filter((c) => c.ocorrenciaId === ocorrencia.id)) {
      const comentarista = sessaoDe(comentario.autorId);
      await setDoc(doc(comentarista.db, 'comentarios', comentario.id), {
        ocorrenciaId: ocorrencia.id,
        texto: comentario.texto,
        fotos: [],
        autorId: comentarista.uid,
        criadoEm: comentario.criadoEm,
        totalDenuncias: 0,
      });
    }

    // 4) O autor fecha: conclui, ou só registra a data da última atividade.
    if (ocorrencia.estado === 'CONCLUIDA' && ocorrencia.concluidaEm && ocorrencia.conclusao) {
      const fechamento = writeBatch(autor.db);
      fechamento.update(ref, {
        estado: 'CONCLUIDA',
        concluidaEm: ocorrencia.concluidaEm,
        ultimaAtividadeEm: ocorrencia.concluidaEm,
        conclusao: ocorrencia.conclusao,
      });
      fechamento.set(doc(autor.db, 'ocorrencias', ocorrencia.id, 'linhaDoTempo', 'concluida'), {
        tipo: 'CONCLUIDA',
        descricao:
          ocorrencia.conclusao.motivo === 'AUTOR'
            ? 'Marcada como concluída por quem registrou'
            : 'Encerrada automaticamente por inatividade',
        em: ocorrencia.concluidaEm,
      });
      await fechamento.commit();
    } else {
      await updateDoc(ref, { ultimaAtividadeEm: ocorrencia.ultimaAtividadeEm });
    }

    criadas += 1;
    console.log(`Ocorrência ${criadas}: ${ocorrencia.tipo} – ${ocorrencia.bairro}`);
  }

  console.log(
    criadas === 0
      ? 'Nada a fazer: as ocorrências semente já estavam no Firestore.'
      : `Pronto: ${criadas} ocorrências gravadas.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((erro: unknown) => {
    console.error('Falha no seed:', erro instanceof Error ? erro.message : erro);
    console.error('Confira se o login por e-mail/senha está ativo e se as regras foram publicadas.');
    process.exit(1);
  });
