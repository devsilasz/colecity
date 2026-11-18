import { CATALOGO_CATEGORIAS } from '@/config/categorias';
import {
  estadoPorRegra,
  exigirUsuario,
  novoId,
  salvarBanco,
  simularRede,
  uidAtual,
  type OcorrenciaMock,
} from '@/mocks/banco';
import { LINHAS_SEMENTE } from '@/mocks/transporte';
import type { OcorrenciaService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { geocodificar } from '@/services/geocodificacao';
import { TIPOS_POR_CATEGORIA, type Categoria, type TipoOcorrencia } from '@/types/categoria';
import type { EstadoOcorrencia } from '@/types/estado';
import type { OcorrenciaSemelhante, PontoCalor } from '@/types/ocorrencia';
import { dentroDeSaoPaulo, distanciaMetros } from '@/utils/distancia';
import { MS } from '@/utils/formatarData';
import { dataOcorridoValida, descricaoValida, LIMITES } from '@/utils/validacoes';

import {
  buscarOcorrencia,
  calcularZonas,
  nomePublico,
  oculto,
  paginar,
  paraDetalhe,
  paraResumo,
  participacaoTotal,
  resolverFotos,
  totalAfetados,
} from './conversores';
import { nomesApoiadoresExtras } from './nomes';

const ESTADOS_PADRAO: readonly EstadoOcorrencia[] = ['ABERTA', 'EM_ACOMPANHAMENTO'];
const RAIOS_VALIDOS: readonly number[] = [1, 5, 10];
const RAIO_SEMELHANTES_M = 500;
const DIAS_ATIVIDADE_SEMELHANTES = 7;
const MAX_SEMELHANTES = 5;
/** Célula do mapa de calor: ~550 m. */
const CELULAS_POR_GRAU = 200;

function tipoPertence(categoria: Categoria, tipo: TipoOcorrencia): boolean {
  return (TIPOS_POR_CATEGORIA[categoria] as readonly string[]).includes(tipo);
}

/** Ordenação do contrato: participação decrescente, depois atividade mais recente (RN-DES-02). */
function porParticipacao(a: OcorrenciaMock, b: OcorrenciaMock): number {
  return (
    participacaoTotal(b) - participacaoTotal(a) ||
    new Date(b.ultimaAtividadeEm).getTime() - new Date(a.ultimaAtividadeEm).getTime()
  );
}

export const ocorrenciaMock: OcorrenciaService = {
  async listarCategorias() {
    await simularRede();
    return CATALOGO_CATEGORIAS;
  },

  async listar(filtros, page, pageSize = 20) {
    const db = await simularRede();
    const uid = uidAtual(db);

    if (filtros.proximidade && !RAIOS_VALIDOS.includes(filtros.proximidade.raioKm)) {
      throw new ErroApi('REQUISICAO_INVALIDA', 400);
    }
    const estados = filtros.estados.length > 0 ? filtros.estados : ESTADOS_PADRAO;
    const zonas = calcularZonas(db);

    const itens = db.ocorrencias
      .filter((o) => !oculto(db, 'OCORRENCIA', o.id))
      .filter((o) => filtros.categorias.length === 0 || filtros.categorias.includes(o.categoria))
      .filter((o) => estados.includes(o.estado))
      .filter((o) => !filtros.linha || o.linha?.codigo === filtros.linha)
      .filter(
        (o) =>
          !filtros.proximidade ||
          distanciaMetros(filtros.proximidade.centro, o.localizacao) <= filtros.proximidade.raioKm * 1000,
      )
      .sort(porParticipacao)
      .map((o) => paraResumo(o, uid, zonas));

    return paginar(itens, page, pageSize);
  },

  async obter(id) {
    const db = await simularRede();
    const uid = uidAtual(db);
    return paraDetalhe(db, buscarOcorrencia(db, id, uid), uid, calcularZonas(db));
  },

  async linhaDoTempo(id) {
    const db = await simularRede();
    const ocorrencia = buscarOcorrencia(db, id, uidAtual(db));
    return [...ocorrencia.linhaDoTempo].sort(
      (a, b) => new Date(a.em).getTime() - new Date(b.em).getTime(),
    );
  },

  async apoiadores(id, page) {
    const db = await simularRede();
    const ocorrencia = buscarOcorrencia(db, id, uidAtual(db));
    // RN-PAR-07: em Segurança nenhuma lista é exibida.
    if (ocorrencia.categoria === 'SEGURANCA') return paginar([], page, 20);

    const identificados = ocorrencia.apoiadoresIds
      .map((uid) => nomePublico(db, uid))
      .filter((apoiador) => !apoiador.removido)
      .map(({ nome }) => ({ nome }));
    const extras = nomesApoiadoresExtras(ocorrencia.id, ocorrencia.apoiosExtras).map((nome) => ({ nome }));
    return paginar([...identificados, ...extras], page, 20);
  },

  async mapaDeCalor(area, categoria) {
    const db = await simularRede();
    const celulas = new Map<string, PontoCalor>();

    db.ocorrencias
      .filter((o) => o.estado !== 'CONCLUIDA' && !oculto(db, 'OCORRENCIA', o.id))
      .filter((o) => !categoria || o.categoria === categoria)
      .filter(
        (o) =>
          o.localizacao.lat >= area.minLat &&
          o.localizacao.lat <= area.maxLat &&
          o.localizacao.lng >= area.minLng &&
          o.localizacao.lng <= area.maxLng,
      )
      .forEach((o) => {
        const lat = Math.round(o.localizacao.lat * CELULAS_POR_GRAU) / CELULAS_POR_GRAU;
        const lng = Math.round(o.localizacao.lng * CELULAS_POR_GRAU) / CELULAS_POR_GRAU;
        const chave = `${lat},${lng}`;
        const atual = celulas.get(chave);
        // RN-DES-01: o peso é o número de afetados, não o de ocorrências.
        celulas.set(chave, { lat, lng, peso: (atual?.peso ?? 0) + totalAfetados(o) });
      });

    return [...celulas.values()];
  },

  async zonasDeAtencao(area) {
    const db = await simularRede();
    return calcularZonas(db).filter(
      (zona) =>
        zona.centro.lat >= area.minLat &&
        zona.centro.lat <= area.maxLat &&
        zona.centro.lng >= area.minLng &&
        zona.centro.lng <= area.maxLng,
    );
  },

  async semelhantes(busca) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);

    if (!dentroDeSaoPaulo(busca.localizacao)) throw new ErroApi('LOCALIZACAO_FORA_DO_MUNICIPIO', 422);
    // RN-SEM-04: Segurança nunca sugere semelhantes.
    if (busca.categoria === 'SEGURANCA') return [];

    const limiteAtividade = Date.now() - DIAS_ATIVIDADE_SEMELHANTES * MS.DIA;
    const zonas = calcularZonas(db);

    return db.ocorrencias
      .filter((o) => o.estado !== 'CONCLUIDA' && !oculto(db, 'OCORRENCIA', o.id))
      .filter((o) => o.categoria === busca.categoria && o.tipo === busca.tipo)
      .filter((o) => new Date(o.ultimaAtividadeEm).getTime() >= limiteAtividade)
      .map((o) => ({ o, distancia: distanciaMetros(busca.localizacao, o.localizacao) }))
      .filter(
        ({ o, distancia }) =>
          distancia <= RAIO_SEMELHANTES_M ||
          // RN-SEM-03: mesma linha, independentemente da distância.
          (busca.categoria === 'TRANSPORTE' && busca.linha !== null && o.linha?.codigo === busca.linha),
      )
      .sort((a, b) => participacaoTotal(b.o) - participacaoTotal(a.o))
      .slice(0, MAX_SEMELHANTES)
      .map<OcorrenciaSemelhante>(({ o, distancia }) => ({
        ...paraResumo(o, usuario.id, zonas),
        distanciaMetros: Math.round(distancia),
      }));
  },

  async criar(dados, idempotencyKey) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);

    // Mesma Idempotency-Key devolve a mesma resposta, sem criar de novo.
    const idExistente = db.idempotencia[idempotencyKey];
    const existente = idExistente ? db.ocorrencias.find((o) => o.id === idExistente) : undefined;
    if (existente) return paraDetalhe(db, existente, usuario.id, calcularZonas(db));

    if (!dados.categoria || !dados.tipo || !dados.descricao || !dados.localizacao) {
      throw new ErroApi('CAMPO_OBRIGATORIO', 422);
    }
    if (!descricaoValida(dados.descricao)) throw new ErroApi('DESCRICAO_TAMANHO_INVALIDO', 422);
    if (!tipoPertence(dados.categoria, dados.tipo)) throw new ErroApi('TIPO_INVALIDO_PARA_CATEGORIA', 422);
    if (!dentroDeSaoPaulo(dados.localizacao)) throw new ErroApi('LOCALIZACAO_FORA_DO_MUNICIPIO', 422);

    const linha = dados.linha ? LINHAS_SEMENTE.find((l) => l.codigo === dados.linha) : undefined;
    if (dados.linha && (dados.categoria !== 'TRANSPORTE' || !linha)) {
      throw new ErroApi('LINHA_INVALIDA', 422);
    }
    if (
      dados.dataHoraOcorrido &&
      (dados.categoria !== 'SEGURANCA' || !dataOcorridoValida(dados.dataHoraOcorrido))
    ) {
      throw new ErroApi('DATA_OCORRIDO_INVALIDA', 422);
    }
    const fotos = resolverFotos(db, dados.fotos, usuario.id);

    const { rua, bairro } = await geocodificar(dados.localizacao);
    const agora = new Date().toISOString();
    const nova: OcorrenciaMock = {
      id: novoId(),
      categoria: dados.categoria,
      tipo: dados.tipo,
      estado: 'ABERTA',
      rua,
      bairro,
      localizacao: dados.localizacao,
      descricao: dados.descricao.trim(),
      linha: linha ? { codigo: linha.codigo, nome: linha.nome } : null,
      dataHoraOcorrido: dados.dataHoraOcorrido,
      fotos,
      autorId: usuario.id,
      criadaEm: agora,
      ultimaAtividadeEm: agora,
      concluidaEm: null,
      conclusao: null,
      // RN-REG-08: o autor conta automaticamente como afetado.
      afetadosIds: [usuario.id],
      apoiadoresIds: [],
      afetadosExtras: 0,
      apoiosExtras: 0,
      linhaDoTempo: [{ tipo: 'CRIADA', descricao: 'Ocorrência registrada', em: agora }],
    };

    db.ocorrencias = [nova, ...db.ocorrencias];
    db.idempotencia = { ...db.idempotencia, [idempotencyKey]: nova.id };
    await salvarBanco();
    return paraDetalhe(db, nova, usuario.id, calcularZonas(db));
  },

  async editar(id, dados) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const ocorrencia = buscarOcorrencia(db, id, usuario.id);

    if (ocorrencia.autorId !== usuario.id) throw new ErroApi('SOMENTE_AUTOR', 403);
    if (ocorrencia.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);
    if (dados.descricao !== undefined && !descricaoValida(dados.descricao)) {
      throw new ErroApi('DESCRICAO_TAMANHO_INVALIDO', 422);
    }

    if (dados.descricao !== undefined) ocorrencia.descricao = dados.descricao.trim();
    if (dados.fotos !== undefined) {
      ocorrencia.fotos = resolverFotos(db, dados.fotos, usuario.id, ocorrencia.fotos);
    }
    await salvarBanco();
    return paraDetalhe(db, ocorrencia, usuario.id, calcularZonas(db));
  },

  async concluir(id, dados) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const ocorrencia = buscarOcorrencia(db, id, usuario.id);

    if (ocorrencia.autorId !== usuario.id) throw new ErroApi('SOMENTE_AUTOR', 403);
    if (ocorrencia.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);
    const feedback = dados.feedback?.trim() ?? '';
    if (feedback.length > LIMITES.feedbackMax) throw new ErroApi('REQUISICAO_INVALIDA', 400);
    const fotos = resolverFotos(db, dados.fotos, usuario.id);

    const agora = new Date().toISOString();
    ocorrencia.estado = 'CONCLUIDA';
    ocorrencia.concluidaEm = agora;
    ocorrencia.ultimaAtividadeEm = agora;
    ocorrencia.conclusao = { motivo: 'AUTOR', feedback: feedback || null, fotos };
    ocorrencia.linhaDoTempo = [
      ...ocorrencia.linhaDoTempo,
      { tipo: 'CONCLUIDA', descricao: 'Marcada como concluída por quem registrou', em: agora },
    ];
    await salvarBanco();
    return paraDetalhe(db, ocorrencia, usuario.id, calcularZonas(db));
  },

  async reabrir(id) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const ocorrencia = buscarOcorrencia(db, id, usuario.id);

    if (!ocorrencia.afetadosIds.includes(usuario.id)) throw new ErroApi('SOMENTE_AFETADO', 403);
    if (ocorrencia.categoria === 'SEGURANCA') throw new ErroApi('REABERTURA_NAO_PERMITIDA', 422);
    if (ocorrencia.estado !== 'CONCLUIDA' || !ocorrencia.concluidaEm) {
      throw new ErroApi('REQUISICAO_INVALIDA', 400);
    }
    const prazo = LIMITES.diasReabertura * MS.DIA;
    if (Date.now() - new Date(ocorrencia.concluidaEm).getTime() > prazo) {
      throw new ErroApi('PRAZO_REABERTURA_EXPIRADO', 422);
    }

    const agora = new Date().toISOString();
    // RN-ACO-07: volta para Em acompanhamento.
    ocorrencia.estado = 'EM_ACOMPANHAMENTO';
    ocorrencia.concluidaEm = null;
    ocorrencia.conclusao = null;
    ocorrencia.ultimaAtividadeEm = agora;
    ocorrencia.linhaDoTempo = [
      ...ocorrencia.linhaDoTempo,
      { tipo: 'REABERTA', descricao: 'Reaberta por uma pessoa afetada', em: agora },
    ];
    await salvarBanco();
    return paraDetalhe(db, ocorrencia, usuario.id, calcularZonas(db));
  },

  async denunciar(denuncia) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);

    const repetida = db.denuncias.some(
      (d) =>
        d.uid === usuario.id &&
        d.tipoConteudo === denuncia.tipoConteudo &&
        d.conteudoId === denuncia.conteudoId,
    );
    if (repetida) throw new ErroApi('DENUNCIA_JA_REGISTRADA', 409);

    db.denuncias = [
      ...db.denuncias,
      { uid: usuario.id, tipoConteudo: denuncia.tipoConteudo, conteudoId: denuncia.conteudoId },
    ];
    await salvarBanco();
  },
};

/** Reaproveitado pela participação e pelo transporte: aplica RN-ACO-02 e os marcos de RN-ACO-03. */
export function registrarNovoAfetado(ocorrencia: OcorrenciaMock, agora: string): void {
  const total = totalAfetados(ocorrencia);
  const eventos = [...ocorrencia.linhaDoTempo];

  if (ocorrencia.estado === 'ABERTA' && estadoPorRegra(ocorrencia.categoria, total) === 'EM_ACOMPANHAMENTO') {
    ocorrencia.estado = 'EM_ACOMPANHAMENTO';
    eventos.push({
      tipo: 'ESTADO_ALTERADO',
      descricao: 'Passou para Em acompanhamento ao atingir 3 afetados',
      em: agora,
    });
  }
  if (total === 10 || total === 50 || total === 100) {
    const jaRegistrado = eventos.some(
      (e) => e.tipo === 'MARCO_AFETADOS' && e.descricao.startsWith(`${total} `),
    );
    if (!jaRegistrado) {
      eventos.push({ tipo: 'MARCO_AFETADOS', descricao: `${total} pessoas afetadas`, em: agora });
    }
  }
  ocorrencia.linhaDoTempo = eventos;
  ocorrencia.ultimaAtividadeEm = agora;
}
