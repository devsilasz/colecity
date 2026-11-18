import {
  tituloOcorrencia,
  type BancoMock,
  type ComentarioMock,
  type OcorrenciaMock,
  type UsuarioMock,
} from '@/mocks/banco';
import { ErroApi } from '@/services/erros';
import type { Pagina } from '@/types/api';
import type { Comentario } from '@/types/comentario';
import type {
  Foto,
  FotoRef,
  MinhaParticipacao,
  OcorrenciaDetalhe,
  OcorrenciaResumo,
  TipoConteudo,
  ZonaAtencao,
} from '@/types/ocorrencia';
import type { ProvedorLogin, Usuario, UsuarioAuth } from '@/types/usuario';
import { aproximar } from '@/utils/distancia';
import { MS } from '@/utils/formatarData';
import { calcularZonas as calcularZonasDe, emZona } from '@/utils/regrasOcorrencia';
import { LIMITES } from '@/utils/validacoes';

/** Converte os registros internos do mock nos modelos do contrato (doc 10, seção 3). */

export const AVISO_CONTAGEM =
  'Participações registradas no Colecity; não representam o total de afetados.';

const NOME_REMOVIDO = 'Usuário removido';
const DENUNCIAS_PARA_OCULTAR = 5;

export function totalAfetados(o: OcorrenciaMock): number {
  return o.afetadosIds.length + o.afetadosExtras;
}

export function totalApoios(o: OcorrenciaMock): number {
  return o.apoiadoresIds.length + o.apoiosExtras;
}

export function participacaoTotal(o: OcorrenciaMock): number {
  return totalAfetados(o) + totalApoios(o);
}

export function minhaParticipacao(o: OcorrenciaMock, uid: string | null): MinhaParticipacao | null {
  if (!uid) return null;
  return {
    afetado: o.afetadosIds.includes(uid),
    apoio: o.apoiadoresIds.includes(uid),
    autor: o.autorId === uid,
  };
}

/** RN-MOD-02: com 5 denúncias de contas distintas o conteúdo fica oculto. */
export function oculto(db: BancoMock, tipoConteudo: TipoConteudo, conteudoId: string): boolean {
  const contas = new Set(
    db.denuncias
      .filter((d) => d.tipoConteudo === tipoConteudo && d.conteudoId === conteudoId)
      .map((d) => d.uid),
  );
  return contas.size >= DENUNCIAS_PARA_OCULTAR;
}

/** RN-ZON-01 a 03, sobre as ocorrências do banco mock. */
export function calcularZonas(db: BancoMock): ZonaAtencao[] {
  return calcularZonasDe(db.ocorrencias);
}

export function paraResumo(
  o: OcorrenciaMock,
  uid: string | null,
  zonas: readonly ZonaAtencao[],
): OcorrenciaResumo {
  return {
    id: o.id,
    titulo: tituloOcorrencia(o.tipo, o.rua, o.bairro),
    categoria: o.categoria,
    tipo: o.tipo,
    estado: o.estado,
    bairro: o.bairro,
    localizacaoAproximada: aproximar(o.localizacao),
    totalAfetados: totalAfetados(o),
    totalApoios: totalApoios(o),
    ultimaAtividadeEm: o.ultimaAtividadeEm,
    zonaAtencao: emZona(o, zonas),
    minhaParticipacao: minhaParticipacao(o, uid),
  };
}

function buscarUsuario(db: BancoMock, id: string): UsuarioMock | undefined {
  return db.usuarios.find((u) => u.id === id);
}

export function nomePublico(db: BancoMock, id: string): { nome: string; removido: boolean } {
  const usuario = buscarUsuario(db, id);
  const removido = !usuario || usuario.removido;
  return { nome: removido ? NOME_REMOVIDO : usuario.nome, removido };
}

export function paraDetalhe(
  db: BancoMock,
  o: OcorrenciaMock,
  uid: string | null,
  zonas: readonly ZonaAtencao[],
): OcorrenciaDetalhe {
  const autor = uid !== null && o.autorId === uid;
  const afetado = uid !== null && o.afetadosIds.includes(uid);
  const concluida = o.estado === 'CONCLUIDA';
  const dentroDoPrazo =
    o.concluidaEm !== null &&
    Date.now() - new Date(o.concluidaEm).getTime() <= LIMITES.diasReabertura * MS.DIA;

  return {
    ...paraResumo(o, uid, zonas),
    descricao: o.descricao,
    rua: o.rua,
    linha: o.linha,
    dataHoraOcorrido: o.dataHoraOcorrido,
    fotos: o.fotos,
    autor: nomePublico(db, o.autorId),
    criadaEm: o.criadaEm,
    concluidaEm: o.concluidaEm,
    conclusao: o.conclusao,
    podeEditar: autor && !concluida,
    podeConcluir: autor && !concluida,
    podeReabrir: afetado && concluida && dentroDoPrazo && o.categoria !== 'SEGURANCA',
    avisoContagem: AVISO_CONTAGEM,
    ...(autor && oculto(db, 'OCORRENCIA', o.id) ? { oculta: true } : {}),
  };
}

export function paraComentario(db: BancoMock, c: ComentarioMock, uid: string | null): Comentario {
  const ocorrencia = db.ocorrencias.find((o) => o.id === c.ocorrenciaId);
  const autor = nomePublico(db, c.autorId);
  const proprio = uid !== null && c.autorId === uid;
  return {
    id: c.id,
    texto: c.texto,
    fotos: c.fotos,
    autor: { ...autor, afetado: ocorrencia?.afetadosIds.includes(c.autorId) ?? false },
    criadoEm: c.criadoEm,
    podeExcluir: proprio,
    ...(proprio && oculto(db, 'COMENTARIO', c.id) ? { oculto: true } : {}),
  };
}

export function paraUsuario(u: UsuarioMock): Usuario {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    aceiteTermosVersao: u.aceiteTermosVersao,
    criadoEm: u.criadoEm,
  };
}

export function paraUsuarioAuth(u: UsuarioMock): UsuarioAuth {
  const provedores: ProvedorLogin[] = [];
  if (u.senha !== null) provedores.push('senha');
  if (u.google) provedores.push('google');
  return { uid: u.id, nome: u.nome, email: u.email, provedores };
}

export function paginar<T>(itens: readonly T[], page: number, pageSize: number): Pagina<T> {
  const tamanho = Math.min(Math.max(pageSize, 1), 50);
  const pagina = Math.max(page, 1);
  const inicio = (pagina - 1) * tamanho;
  return { items: itens.slice(inicio, inicio + tamanho), page: pagina, pageSize: tamanho, total: itens.length };
}

export function buscarOcorrencia(db: BancoMock, id: string, uid: string | null): OcorrenciaMock {
  const ocorrencia = db.ocorrencias.find((o) => o.id === id);
  // Oculta por moderação → 404 para quem não é o autor (doc 10, GET /ocorrencias/{id}).
  if (!ocorrencia || (oculto(db, 'OCORRENCIA', id) && ocorrencia.autorId !== uid)) {
    throw new ErroApi('NAO_ENCONTRADO', 404);
  }
  return ocorrencia;
}

/**
 * Valida as referências de fotos (doc 10, seção 3.1) e devolve as fotos completas.
 * `existentes` são fotos que o recurso já tinha (podem ser mantidas numa edição).
 */
export function resolverFotos(
  db: BancoMock,
  refs: readonly FotoRef[] | undefined,
  uid: string,
  existentes: readonly Foto[] = [],
): Foto[] {
  const lista = refs ?? [];
  if (lista.length > LIMITES.fotosMax) throw new ErroApi('LIMITE_FOTOS_EXCEDIDO', 422);

  return lista.map((ref) => {
    const jaExistente = existentes.find((foto) => foto.path === ref.path);
    if (jaExistente) return jaExistente;

    const pastaValida =
      ref.path.startsWith(`ocorrencias/${uid}/`) || ref.path.startsWith(`comentarios/${uid}/`);
    const enviada = db.fotosEnviadas[ref.path];
    if (!ref.path.endsWith('.webp') || !pastaValida || !enviada) {
      throw new ErroApi('FOTO_INVALIDA', 422);
    }
    return enviada;
  });
}
