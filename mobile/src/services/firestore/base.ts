import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type CollectionReference,
  type DocumentData,
  type FirestoreDataConverter,
} from 'firebase/firestore';

import { ErroApi } from '@/services/erros';
import { auth, db } from '@/services/firebase';
import type { Coordenada } from '@/types/api';
import type { Categoria, TipoOcorrencia } from '@/types/categoria';
import type { EstadoOcorrencia } from '@/types/estado';
import type {
  Conclusao,
  EventoLinhaDoTempo,
  Foto,
  MinhaParticipacao,
  MotivoDenuncia,
  OcorrenciaDetalhe,
  OcorrenciaResumo,
  TipoConteudo,
  ZonaAtencao,
} from '@/types/ocorrencia';
import type { LinhaRef } from '@/types/transporte';
import { MS } from '@/utils/formatarData';
import {
  AVISO_CONTAGEM,
  calcularZonas,
  DENUNCIAS_PARA_OCULTAR,
  emZona,
  tituloOcorrencia,
} from '@/utils/regrasOcorrencia';
import { LIMITES } from '@/utils/validacoes';

/**
 * Estrutura do Cloud Firestore (documentada em `mobile/README.md` e protegida por `firestore.rules`):
 *
 *   perfis/{uid}                          nome público (lido por todos, escrito só pelo dono)
 *   users/{uid}                           dados privados: aceite dos termos e preferências
 *   users/{uid}/occurrenceState/{id}      silenciada e última visita
 *   ocorrencias/{id}                      ocorrência + contagens desnormalizadas
 *   ocorrencias/{id}/linhaDoTempo/{eid}   eventos automáticos (RN-ACO-03)
 *   participacoes/{ocorrenciaId_uid}      afetado / apoio de cada conta
 *   comentarios/{id}                      comentários (campo `ocorrenciaId`)
 *   denuncias/{tipo_conteudoId_uid}       uma denúncia por conta por conteúdo
 *
 * Datas são gravadas como texto ISO 8601 (UTC), que ordena corretamente e é o formato do contrato.
 */

export interface PerfilDoc {
  nome: string;
  removido: boolean;
}

export interface UsuarioDoc {
  aceiteTermosVersao: string;
  criadoEm: string;
  notificationsEnabled: boolean;
  updatedAt: string;
}

export interface EstadoOcorrenciaDoc {
  muted: boolean;
  lastSeenAt: string | null;
}

export interface OcorrenciaDoc {
  categoria: Categoria;
  tipo: TipoOcorrencia;
  estado: EstadoOcorrencia;
  rua: string;
  bairro: string;
  /** Ponto exato informado no registro. O app só exibe a versão aproximada (RN-CSL-08). */
  localizacao: Coordenada;
  localizacaoAproximada: Coordenada;
  descricao: string;
  linha: LinhaRef | null;
  dataHoraOcorrido: string | null;
  fotos: Foto[];
  autorId: string;
  criadaEm: string;
  ultimaAtividadeEm: string;
  concluidaEm: string | null;
  conclusao: Conclusao | null;
  totalAfetados: number;
  totalApoios: number;
  totalDenuncias: number;
}

export interface ParticipacaoDoc {
  uid: string;
  ocorrenciaId: string;
  afetado: boolean;
  apoio: boolean;
  atualizadoEm: string;
}

export interface ComentarioDoc {
  ocorrenciaId: string;
  texto: string;
  fotos: Foto[];
  autorId: string;
  criadoEm: string;
  totalDenuncias: number;
}

export interface DenunciaDoc {
  uid: string;
  tipoConteudo: TipoConteudo;
  conteudoId: string;
  motivo: MotivoDenuncia;
  criadoEm: string;
}

/** Conversor tipado: os documentos entram e saem do Firestore com o tipo declarado, sem `any`. */
function conversor<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (dados) => dados,
    fromFirestore: (snapshot) => snapshot.data() as T,
  };
}

function colecao<T extends DocumentData>(caminho: string, ...segmentos: string[]): CollectionReference<T> {
  return collection(db, caminho, ...segmentos).withConverter(conversor<T>());
}

export const colecoes = {
  perfis: colecao<PerfilDoc>('perfis'),
  usuarios: colecao<UsuarioDoc>('users'),
  ocorrencias: colecao<OcorrenciaDoc>('ocorrencias'),
  participacoes: colecao<ParticipacaoDoc>('participacoes'),
  comentarios: colecao<ComentarioDoc>('comentarios'),
  denuncias: colecao<DenunciaDoc>('denuncias'),
  estadosDoUsuario: (uid: string) => colecao<EstadoOcorrenciaDoc>('users', uid, 'occurrenceState'),
  linhaDoTempo: (ocorrenciaId: string) =>
    colecao<EventoLinhaDoTempo>('ocorrencias', ocorrenciaId, 'linhaDoTempo'),
};

export function idParticipacao(ocorrenciaId: string, uid: string): string {
  return `${ocorrenciaId}_${uid}`;
}

export function idDenuncia(tipoConteudo: TipoConteudo, conteudoId: string, uid: string): string {
  return `${tipoConteudo}_${conteudoId}_${uid}`;
}

/** Usuário logado no Firebase Auth, ou `null` para visitante. */
export function uidAtual(): string | null {
  return auth.currentUser?.uid ?? null;
}

/** Operações 🔒 do contrato: exigem usuário logado. */
export function exigirUid(): string {
  const uid = uidAtual();
  if (!uid) throw new ErroApi('NAO_AUTENTICADO', 401);
  return uid;
}

export type OcorrenciaRegistro = OcorrenciaDoc & { id: string };

// ── Cache curto em memória ────────────────────────────────────────────────────────────────
// Lista, mapa, zonas, semelhantes e "Minhas" usam o mesmo conjunto de ocorrências. Guardar por
// alguns segundos evita reler a coleção inteira a cada tela (o cache longo é do TanStack Query).

const VALIDADE_MS = 15 * 1000;

let cacheOcorrencias: { em: number; itens: OcorrenciaRegistro[] } | null = null;
let cacheParticipacoes: { em: number; uid: string; porOcorrencia: Map<string, ParticipacaoDoc> } | null = null;
const cachePerfis = new Map<string, { em: number; perfil: PerfilDoc }>();

/** Chamado depois de qualquer escrita, para a próxima leitura vir do servidor. */
export function invalidarCacheFirestore(): void {
  cacheOcorrencias = null;
  cacheParticipacoes = null;
}

export function esquecerPerfil(uid: string): void {
  cachePerfis.delete(uid);
}

export async function carregarOcorrencias(): Promise<OcorrenciaRegistro[]> {
  if (cacheOcorrencias && Date.now() - cacheOcorrencias.em < VALIDADE_MS) return cacheOcorrencias.itens;
  const resultado = await getDocs(colecoes.ocorrencias);
  const itens = resultado.docs.map((item) => ({ ...item.data(), id: item.id }));
  cacheOcorrencias = { em: Date.now(), itens };
  return itens;
}

/** Participações do usuário logado, por ocorrência. Visitante recebe um mapa vazio. */
export async function carregarMinhasParticipacoes(uid: string | null): Promise<Map<string, ParticipacaoDoc>> {
  if (!uid) return new Map();
  if (
    cacheParticipacoes &&
    cacheParticipacoes.uid === uid &&
    Date.now() - cacheParticipacoes.em < VALIDADE_MS
  ) {
    return cacheParticipacoes.porOcorrencia;
  }
  const resultado = await getDocs(query(colecoes.participacoes, where('uid', '==', uid)));
  const porOcorrencia = new Map(resultado.docs.map((item) => [item.data().ocorrenciaId, item.data()]));
  cacheParticipacoes = { em: Date.now(), uid, porOcorrencia };
  return porOcorrencia;
}

const PERFIL_REMOVIDO: PerfilDoc = { nome: '', removido: true };
const NOME_REMOVIDO = 'Usuário removido';

/** Nomes públicos de várias contas de uma vez (RN-CON-06: só o nome é público). */
export async function carregarPerfis(uids: readonly string[]): Promise<Map<string, PerfilDoc>> {
  const unicos = [...new Set(uids)];
  const agora = Date.now();
  await Promise.all(
    unicos
      .filter((uid) => {
        const salvo = cachePerfis.get(uid);
        return !salvo || agora - salvo.em > 5 * MS.MINUTO;
      })
      .map(async (uid) => {
        const snapshot = await getDoc(doc(colecoes.perfis, uid));
        cachePerfis.set(uid, { em: agora, perfil: snapshot.data() ?? PERFIL_REMOVIDO });
      }),
  );
  return new Map(unicos.map((uid) => [uid, cachePerfis.get(uid)?.perfil ?? PERFIL_REMOVIDO]));
}

/** Conta excluída (anonimizada) aparece como "Usuário removido" (RN-CON-08). */
export function nomePublico(perfil: PerfilDoc | undefined): { nome: string; removido: boolean } {
  const removido = !perfil || perfil.removido || perfil.nome.length === 0;
  return { nome: removido ? NOME_REMOVIDO : perfil.nome, removido };
}

// ── Conversão para os modelos do contrato (doc 10, seção 3) ──────────────────────────────

/** RN-MOD-02. */
export function oculto(conteudo: { totalDenuncias: number }): boolean {
  return conteudo.totalDenuncias >= DENUNCIAS_PARA_OCULTAR;
}

export function zonasDe(ocorrencias: readonly OcorrenciaRegistro[]): ZonaAtencao[] {
  return calcularZonas(ocorrencias.filter((ocorrencia) => !oculto(ocorrencia)));
}

export function minhaParticipacaoDe(
  ocorrencia: OcorrenciaRegistro,
  uid: string | null,
  participacao: ParticipacaoDoc | undefined,
): MinhaParticipacao | null {
  if (!uid) return null;
  return {
    afetado: participacao?.afetado ?? false,
    apoio: participacao?.apoio ?? false,
    autor: ocorrencia.autorId === uid,
  };
}

export function paraResumo(
  ocorrencia: OcorrenciaRegistro,
  uid: string | null,
  participacao: ParticipacaoDoc | undefined,
  zonas: readonly ZonaAtencao[],
): OcorrenciaResumo {
  return {
    id: ocorrencia.id,
    titulo: tituloOcorrencia(ocorrencia.tipo, ocorrencia.rua, ocorrencia.bairro),
    categoria: ocorrencia.categoria,
    tipo: ocorrencia.tipo,
    estado: ocorrencia.estado,
    bairro: ocorrencia.bairro,
    localizacaoAproximada: ocorrencia.localizacaoAproximada,
    totalAfetados: ocorrencia.totalAfetados,
    totalApoios: ocorrencia.totalApoios,
    ultimaAtividadeEm: ocorrencia.ultimaAtividadeEm,
    zonaAtencao: emZona(ocorrencia, zonas),
    minhaParticipacao: minhaParticipacaoDe(ocorrencia, uid, participacao),
  };
}

export function paraDetalhe(
  ocorrencia: OcorrenciaRegistro,
  uid: string | null,
  participacao: ParticipacaoDoc | undefined,
  zonas: readonly ZonaAtencao[],
  autor: PerfilDoc | undefined,
): OcorrenciaDetalhe {
  const ehAutor = uid !== null && ocorrencia.autorId === uid;
  const afetado = participacao?.afetado ?? false;
  const concluida = ocorrencia.estado === 'CONCLUIDA';
  const dentroDoPrazo =
    ocorrencia.concluidaEm !== null &&
    Date.now() - new Date(ocorrencia.concluidaEm).getTime() <= LIMITES.diasReabertura * MS.DIA;

  return {
    ...paraResumo(ocorrencia, uid, participacao, zonas),
    descricao: ocorrencia.descricao,
    rua: ocorrencia.rua,
    linha: ocorrencia.linha,
    dataHoraOcorrido: ocorrencia.dataHoraOcorrido,
    fotos: ocorrencia.fotos,
    autor: nomePublico(autor),
    criadaEm: ocorrencia.criadaEm,
    concluidaEm: ocorrencia.concluidaEm,
    conclusao: ocorrencia.conclusao,
    podeEditar: ehAutor && !concluida,
    podeConcluir: ehAutor && !concluida,
    podeReabrir: afetado && concluida && dentroDoPrazo && ocorrencia.categoria !== 'SEGURANCA',
    avisoContagem: AVISO_CONTAGEM,
    ...(ehAutor && oculto(ocorrencia) ? { oculta: true } : {}),
  };
}

/** Lê uma ocorrência direto do servidor. Oculta por moderação → 404 para quem não é o autor. */
export async function buscarOcorrencia(id: string, uid: string | null): Promise<OcorrenciaRegistro> {
  const snapshot = await getDoc(doc(colecoes.ocorrencias, id));
  const dados = snapshot.data();
  if (!dados || (oculto(dados) && dados.autorId !== uid)) throw new ErroApi('NAO_ENCONTRADO', 404);
  return { ...dados, id: snapshot.id };
}

/** Monta o detalhe completo de uma ocorrência já lida (participação do usuário, zonas e autor). */
export async function montarDetalhe(ocorrencia: OcorrenciaRegistro, uid: string | null): Promise<OcorrenciaDetalhe> {
  const [participacoes, todas, perfis] = await Promise.all([
    carregarMinhasParticipacoes(uid),
    carregarOcorrencias(),
    carregarPerfis([ocorrencia.autorId]),
  ]);
  return paraDetalhe(
    ocorrencia,
    uid,
    participacoes.get(ocorrencia.id),
    zonasDe(todas),
    perfis.get(ocorrencia.autorId),
  );
}
