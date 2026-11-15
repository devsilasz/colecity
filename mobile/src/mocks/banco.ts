import * as Crypto from 'expo-crypto';

import { NOME_TIPO } from '@/config/categorias';
import { env } from '@/config/env';
import { ErroApi } from '@/services/erros';
import { CHAVES, lerJson, remover, salvarJson } from '@/services/storage';
import type { Coordenada } from '@/types/api';
import type { Categoria, TipoOcorrencia } from '@/types/categoria';
import type { EstadoOcorrencia } from '@/types/estado';
import type { Conclusao, EventoLinhaDoTempo, Foto, TipoConteudo } from '@/types/ocorrencia';
import type { LinhaRef } from '@/types/transporte';
import { VERSAO_TERMOS } from '@/types/usuario';
import { MS } from '@/utils/formatarData';

import { OCORRENCIAS_SEMENTE } from './ocorrencias';
import { LINHAS_SEMENTE } from './transporte';
import { UID_DEMO, USUARIOS_SEMENTE } from './usuarios';

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

function idSemente(prefixo: string, numero: number): string {
  return `${prefixo}000000-0000-4000-8000-${String(numero).padStart(12, '0')}`;
}

/** Foto de exemplo (serviço público de imagens de demonstração). */
export function fotoExemplo(semente: string, dono: string): Foto {
  return {
    id: idSemente('f', Math.abs(hash(semente)) % 1_000_000),
    path: `ocorrencias/${dono}/${semente}.webp`,
    url: `https://picsum.photos/seed/colecity-${semente}/960/720`,
  };
}

function hash(texto: string): number {
  let valor = 0;
  for (let i = 0; i < texto.length; i += 1) valor = (valor * 31 + texto.charCodeAt(i)) | 0;
  return valor;
}

export function tituloOcorrencia(tipo: TipoOcorrencia, rua: string, bairro: string): string {
  const local = rua ? `${rua}, ${bairro}` : bairro || 'Localização aproximada';
  return `${NOME_TIPO[tipo]} – ${local}`;
}

/** Estado derivado das regras RN-ACO-02 e RN-ACO-09. */
export function estadoPorRegra(categoria: Categoria, totalAfetados: number): EstadoOcorrencia {
  if (categoria === 'SEGURANCA') return 'ABERTA';
  return totalAfetados >= 3 ? 'EM_ACOMPANHAMENTO' : 'ABERTA';
}

function criarBancoInicial(): BancoMock {
  const agora = Date.now();
  const iso = (msAtras: number) => new Date(agora - msAtras).toISOString();

  const usuarios: UsuarioMock[] = USUARIOS_SEMENTE.map((semente) => ({
    ...semente,
    aceiteTermosVersao: VERSAO_TERMOS,
    criadoEm: iso(90 * MS.DIA),
    removido: false,
  }));

  const comentarios: ComentarioMock[] = [];

  const ocorrencias: OcorrenciaMock[] = OCORRENCIAS_SEMENTE.map((semente, indice) => {
    const id = idSemente('o', indice + 1);
    const autorId = USUARIOS_SEMENTE[semente.autor].id;
    const criadaEm = iso(semente.criadaDiasAtras * MS.DIA);

    const afetadosIds = [autorId];
    if (semente.demoAfetado && autorId !== UID_DEMO) afetadosIds.push(UID_DEMO);
    const apoiadoresIds: string[] = [];
    if (semente.demoApoio && autorId !== UID_DEMO) apoiadoresIds.push(UID_DEMO);
    // Dois apoiadores identificados, diferentes do autor, quando há apoios suficientes.
    USUARIOS_SEMENTE.filter((u) => u.id !== autorId && u.id !== UID_DEMO)
      .slice(indice % 4, (indice % 4) + 2)
      .forEach((u) => {
        if (apoiadoresIds.length < semente.apoios) apoiadoresIds.push(u.id);
      });

    const linhaDoTempo: EventoLinhaDoTempo[] = [
      { tipo: 'CRIADA', descricao: 'Ocorrência registrada', em: criadaEm },
    ];
    const duracao = semente.criadaDiasAtras * MS.DIA - semente.atividadeHorasAtras * MS.HORA;
    const passo = (fracao: number) => iso(semente.criadaDiasAtras * MS.DIA - duracao * fracao);
    if (semente.categoria !== 'SEGURANCA' && semente.afetados >= 3) {
      linhaDoTempo.push({
        tipo: 'ESTADO_ALTERADO',
        descricao: 'Passou para Em acompanhamento ao atingir 3 afetados',
        em: passo(0.15),
      });
    }
    ([10, 50, 100] as const).forEach((marco, i) => {
      if (semente.afetados >= marco) {
        linhaDoTempo.push({
          tipo: 'MARCO_AFETADOS',
          descricao: `${marco} pessoas afetadas`,
          em: passo(0.3 + i * 0.2),
        });
      }
    });

    let estado = estadoPorRegra(semente.categoria, semente.afetados);
    let concluidaEm: string | null = null;
    let conclusao: Conclusao | null = null;
    if (semente.concluida) {
      estado = 'CONCLUIDA';
      concluidaEm = iso(semente.concluida.diasAtras * MS.DIA);
      conclusao = {
        motivo: semente.concluida.motivo,
        feedback: semente.concluida.feedback ?? null,
        fotos: Array.from({ length: semente.concluida.fotos ?? 0 }, (_, n) =>
          fotoExemplo(`conclusao-${indice}-${n}`, autorId),
        ),
      };
      linhaDoTempo.push({
        tipo: 'CONCLUIDA',
        descricao:
          semente.concluida.motivo === 'AUTOR'
            ? 'Marcada como concluída por quem registrou'
            : 'Encerrada automaticamente por inatividade',
        em: concluidaEm,
      });
    }

    (semente.comentarios ?? []).forEach((comentario, n) => {
      comentarios.push({
        id: idSemente('c', indice * 10 + n + 1),
        ocorrenciaId: id,
        texto: comentario.texto,
        fotos: [],
        autorId: USUARIOS_SEMENTE[comentario.autor].id,
        criadoEm: iso(comentario.horasAtras * MS.HORA),
      });
    });

    const linhaSemente = semente.linha
      ? LINHAS_SEMENTE.find((linha) => linha.codigo === semente.linha)
      : undefined;

    return {
      id,
      categoria: semente.categoria,
      tipo: semente.tipo,
      estado,
      rua: semente.rua,
      bairro: semente.bairro,
      localizacao: { lat: semente.lat, lng: semente.lng },
      descricao: semente.descricao,
      linha: linhaSemente ? { codigo: linhaSemente.codigo, nome: linhaSemente.nome } : null,
      dataHoraOcorrido:
        semente.ocorridoHorasAtras === undefined ? null : iso(semente.ocorridoHorasAtras * MS.HORA),
      fotos: Array.from({ length: semente.fotos ?? 0 }, (_, n) =>
        fotoExemplo(`ocorrencia-${indice}-${n}`, autorId),
      ),
      autorId,
      criadaEm,
      ultimaAtividadeEm: concluidaEm ?? iso(semente.atividadeHorasAtras * MS.HORA),
      concluidaEm,
      conclusao,
      afetadosIds,
      apoiadoresIds,
      afetadosExtras: Math.max(0, semente.afetados - afetadosIds.length),
      apoiosExtras: Math.max(0, semente.apoios - apoiadoresIds.length),
      linhaDoTempo,
    };
  });

  return {
    versao: VERSAO_BANCO,
    sessaoUid: null,
    usuarios,
    ocorrencias,
    comentarios,
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
