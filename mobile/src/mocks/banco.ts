import * as Crypto from 'expo-crypto';

import { env } from '@/config/env';
import { ErroApi } from '@/services/erros';
import { CHAVES, lerJson, remover, salvarJson } from '@/services/storage';
import type { Coordenada } from '@/types/api';
import type { Categoria, TipoOcorrencia } from '@/types/categoria';
import type { EstadoOcorrencia } from '@/types/estado';
import type { Conclusao, EventoLinhaDoTempo, Foto, TipoConteudo } from '@/types/ocorrencia';
import type { LinhaRef } from '@/types/transporte';
import { estadoPorRegra, tituloOcorrencia } from '@/utils/regrasOcorrencia';

import { fotoExemplo, montarSementes } from './sementes';

export { estadoPorRegra, fotoExemplo, tituloOcorrencia };

/**
 * "Banco de dados" do mock: fica em memória e é salvo no AsyncStorage, para que
 * registros e participações feitos no app sobrevivam a um recarregamento.
 * Simula o que o domínio guarda (doc 10); nunca é usado com a API real.
 */

/** Aumente ao mudar as sementes: o banco salvo é descartado e recriado. */
const VERSAO_BANCO = 3;

export interface UsuarioMock {
  id: string;
  nome: string;
  email: string;
  senha: string | null;
  google: boolean;
  aceiteTermosVersao: string;
  criadoEm: string;
  removido: boolean;
}

export interface OcorrenciaMock {
  id: string;
  categoria: Categoria;
  tipo: TipoOcorrencia;
  estado: EstadoOcorrencia;
  rua: string;
  bairro: string;
  /** Localização exata: nunca sai do "domínio" (RN-CSL-08). */
  localizacao: Coordenada;
  descricao: string;
  linha: LinhaRef | null;
  dataHoraOcorrido: string | null;
  fotos: Foto[];
  autorId: string;
  criadaEm: string;
  ultimaAtividadeEm: string;
  concluidaEm: string | null;
  conclusao: Conclusao | null;
  /** Contas identificadas que participam. */
  afetadosIds: string[];
  apoiadoresIds: string[];
  /** Participações de contas que não existem no mock (só para dar volume às contagens). */
  afetadosExtras: number;
  apoiosExtras: number;
  linhaDoTempo: EventoLinhaDoTempo[];
}

export interface ComentarioMock {
  id: string;
  ocorrenciaId: string;
  texto: string;
  fotos: Foto[];
  autorId: string;
  criadoEm: string;
}

export interface DenunciaMock {
  uid: string;
  tipoConteudo: TipoConteudo;
  conteudoId: string;
}

export interface ViagemMock {
  id: string;
  uid: string;
  linha: string;
  sentido: 1 | 2;
  iniciadaEm: string;
  expiraEm: string;
  ativa: boolean;
  totalPosicoes: number;
  /** Posições consecutivas a mais de 300 m do trajeto (RN-TAV-07). */
  foraDoTrajeto: number;
  desvioPerguntado: boolean;
  trechoDesvio: Coordenada[];
  ultimaPosicao: Coordenada | null;
}

export interface BancoMock {
  versao: number;
  sessaoUid: string | null;
  usuarios: UsuarioMock[];
  ocorrencias: OcorrenciaMock[];
  comentarios: ComentarioMock[];
  denuncias: DenunciaMock[];
  viagens: ViagemMock[];
  /** Idempotency-Key → id do recurso criado (doc 10, seção 1.1). */
  idempotencia: Record<string, string>;
  /** Fotos "enviadas ao Storage" pelo mock de upload: path → foto. */
  fotosEnviadas: Record<string, Foto>;
}

export function novoId(): string {
  return Crypto.randomUUID();
}

function criarBancoInicial(): BancoMock {
  return {
    versao: VERSAO_BANCO,
    sessaoUid: null,
    ...montarSementes(Date.now()),
    denuncias: [],
    viagens: [],
    idempotencia: {},
    fotosEnviadas: {},
  };
}

let banco: BancoMock | null = null;
let carregando: Promise<BancoMock> | null = null;

/** Devolve o banco (lê do AsyncStorage na primeira vez, ou cria a partir das sementes). */
export function obterBanco(): Promise<BancoMock> {
  if (banco) return Promise.resolve(banco);
  carregando ??= lerJson<BancoMock>(CHAVES.mockBanco).then((salvo) => {
    banco = salvo && salvo.versao === VERSAO_BANCO ? salvo : criarBancoInicial();
    return banco;
  });
  return carregando;
}

export async function salvarBanco(): Promise<void> {
  if (banco) await salvarJson(CHAVES.mockBanco, banco);
}

/** Volta aos dados iniciais (usado em Perfil → "Restaurar dados de demonstração"). */
export async function resetarBanco(): Promise<void> {
  const sessaoUid = banco?.sessaoUid ?? null;
  banco = criarBancoInicial();
  // Mantém a sessão só se o usuário ainda existir nas sementes.
  banco.sessaoUid = banco.usuarios.some((u) => u.id === sessaoUid) ? sessaoUid : null;
  carregando = Promise.resolve(banco);
  await remover(CHAVES.mockBanco);
  await salvarBanco();
}

let taxaErro: number = env.mockTaxaErro;

/** Ajusta em tempo de execução a chance de erro simulada (0 a 1). */
export function definirTaxaErroMock(taxa: number): void {
  taxaErro = Math.min(Math.max(taxa, 0), 1);
}

export function obterTaxaErroMock(): number {
  return taxaErro;
}

/** Simula a rede: latência de 300 a 800 ms e erro ocasional configurável. */
export async function simularRede(): Promise<BancoMock> {
  const atraso = 300 + Math.random() * 500;
  await new Promise<void>((resolver) => setTimeout(resolver, atraso));
  if (taxaErro > 0 && Math.random() < taxaErro) throw new ErroApi('ERRO_INTERNO', 500);
  return obterBanco();
}

/** Usuário logado no mock, ou `null` para visitante. */
export function uidAtual(db: BancoMock): string | null {
  return db.sessaoUid;
}

/** Endpoints 🔒: exigem usuário logado e não anonimizado (doc 10, seção 1.1). */
export function exigirUsuario(db: BancoMock): UsuarioMock {
  if (!db.sessaoUid) throw new ErroApi('NAO_AUTENTICADO', 401);
  const usuario = db.usuarios.find((u) => u.id === db.sessaoUid);
  if (!usuario || usuario.removido) throw new ErroApi('USUARIO_NAO_CADASTRADO', 403);
  return usuario;
}
