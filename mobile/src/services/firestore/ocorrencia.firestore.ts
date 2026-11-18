import { doc, getDoc, getDocs, query, runTransaction, updateDoc, where, writeBatch } from 'firebase/firestore';

import { CATALOGO_CATEGORIAS } from '@/config/categorias';
import { LINHAS_SEMENTE } from '@/mocks/transporte';
import type { OcorrenciaService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { comErroTratado, db } from '@/services/firebase';
import { geocodificar } from '@/services/geocodificacao';
import type { AreaMapa, Coordenada } from '@/types/api';
import { TIPOS_POR_CATEGORIA, type Categoria, type TipoOcorrencia } from '@/types/categoria';
import type { EstadoOcorrencia } from '@/types/estado';
import type { OcorrenciaSemelhante } from '@/types/ocorrencia';
import { aproximar, dentroDeSaoPaulo, distanciaMetros } from '@/utils/distancia';
import { MS } from '@/utils/formatarData';
import { calcularCalor } from '@/utils/regrasOcorrencia';
import { dataOcorridoValida, descricaoValida, LIMITES } from '@/utils/validacoes';

import {
  buscarOcorrencia,
  carregarMinhasParticipacoes,
  carregarOcorrencias,
  carregarPerfis,
  colecoes,
  exigirUid,
  idDenuncia,
  idParticipacao,
  invalidarCacheFirestore,
  montarDetalhe,
  nomePublico,
  oculto,
  paraResumo,
  uidAtual,
  zonasDe,
  type OcorrenciaDoc,
  type OcorrenciaRegistro,
} from './base';
import { paginar } from './paginar';
import { resolverFotos } from './upload.local';

const ESTADOS_PADRAO: readonly EstadoOcorrencia[] = ['ABERTA', 'EM_ACOMPANHAMENTO'];
const RAIOS_VALIDOS: readonly number[] = [1, 5, 10];
const RAIO_SEMELHANTES_M = 500;
const DIAS_ATIVIDADE_SEMELHANTES = 7;
const MAX_SEMELHANTES = 5;

function tipoPertence(categoria: Categoria, tipo: TipoOcorrencia): boolean {
  const tipos: readonly string[] = TIPOS_POR_CATEGORIA[categoria];
  return tipos.includes(tipo);
}

function participacaoTotal(ocorrencia: OcorrenciaDoc): number {
  return ocorrencia.totalAfetados + ocorrencia.totalApoios;
}

/** Ordenação do contrato: participação decrescente, depois atividade mais recente (RN-DES-02). */
function porParticipacao(a: OcorrenciaDoc, b: OcorrenciaDoc): number {
  return (
    participacaoTotal(b) - participacaoTotal(a) ||
    new Date(b.ultimaAtividadeEm).getTime() - new Date(a.ultimaAtividadeEm).getTime()
  );
}

function dentroDaArea(ponto: Coordenada, area: AreaMapa): boolean {
  return (
    ponto.lat >= area.minLat && ponto.lat <= area.maxLat && ponto.lng >= area.minLng && ponto.lng <= area.maxLng
  );
}

/** Ocorrências visíveis a todos: as ocultas por moderação ficam de fora (RN-MOD-02). */
async function carregarVisiveis(): Promise<{ todas: OcorrenciaRegistro[]; visiveis: OcorrenciaRegistro[] }> {
  const todas = await carregarOcorrencias();
  return { todas, visiveis: todas.filter((ocorrencia) => !oculto(ocorrencia)) };
}

/**
 * Ocorrências no Cloud Firestore. Aplica no app as mesmas regras do doc 07 que o mock aplica,
 * e as regras de segurança (`firestore.rules`) conferem autoria e contagens no servidor.
 * Filtro por distância e ordenação por participação são feitos no aparelho.
 */
export const ocorrenciaFirestore: OcorrenciaService = {
  listarCategorias: () => Promise.resolve(CATALOGO_CATEGORIAS),

  listar(filtros, page, pageSize = 20) {
    return comErroTratado(async () => {
      const uid = uidAtual();
      if (filtros.proximidade && !RAIOS_VALIDOS.includes(filtros.proximidade.raioKm)) {
        throw new ErroApi('REQUISICAO_INVALIDA', 400);
      }
      // RN-CSL-04: por padrão, só as não encerradas.
      const estados = filtros.estados.length > 0 ? filtros.estados : ESTADOS_PADRAO;
      const { proximidade } = filtros;

      const [{ todas, visiveis }, participacoes] = await Promise.all([
        carregarVisiveis(),
        carregarMinhasParticipacoes(uid),
      ]);
      const zonas = zonasDe(todas);

      const itens = visiveis
        .filter((o) => filtros.categorias.length === 0 || filtros.categorias.includes(o.categoria))
        .filter((o) => estados.includes(o.estado))
        .filter((o) => !filtros.linha || o.linha?.codigo === filtros.linha)
        .filter(
          (o) => !proximidade || distanciaMetros(proximidade.centro, o.localizacao) <= proximidade.raioKm * 1000,
        )
        .sort(porParticipacao)
        .map((o) => paraResumo(o, uid, participacoes.get(o.id), zonas));

      return paginar(itens, page, pageSize);
    });
  },

  obter(id) {
    return comErroTratado(async () => {
      const uid = uidAtual();
      return montarDetalhe(await buscarOcorrencia(id, uid), uid);
    });
  },

  linhaDoTempo(id) {
    return comErroTratado(async () => {
      const resultado = await getDocs(colecoes.linhaDoTempo(id));
      return resultado.docs
        .map((item) => item.data())
        .sort((a, b) => new Date(a.em).getTime() - new Date(b.em).getTime());
    });
  },

  apoiadores(id, page) {
    return comErroTratado(async () => {
      const ocorrencia = await buscarOcorrencia(id, uidAtual());
      // RN-PAR-07: em Segurança nenhuma lista é exibida.
      if (ocorrencia.categoria === 'SEGURANCA') return paginar([], page, 20);

      const resultado = await getDocs(query(colecoes.participacoes, where('ocorrenciaId', '==', id)));
      const uids = resultado.docs
        .map((item) => item.data())
        .filter((participacao) => participacao.apoio)
        .sort((a, b) => a.atualizadoEm.localeCompare(b.atualizadoEm))
        .map((participacao) => participacao.uid);

      const perfis = await carregarPerfis(uids);
      const nomes = uids
        .map((uid) => nomePublico(perfis.get(uid)))
        .filter((apoiador) => !apoiador.removido)
        .map(({ nome }) => ({ nome }));
      return paginar(nomes, page, 20);
    });
  },

  mapaDeCalor(area, categoria) {
    return comErroTratado(async () => {
      const { visiveis } = await carregarVisiveis();
      // RN-DES-01: o peso é o número de afetados, não o de ocorrências.
      return calcularCalor(
        visiveis
          .filter((o) => o.estado !== 'CONCLUIDA')
          .filter((o) => !categoria || o.categoria === categoria)
          .filter((o) => dentroDaArea(o.localizacao, area)),
      );
    });
  },

  zonasDeAtencao(area) {
    return comErroTratado(async () => {
      const { todas } = await carregarVisiveis();
      return zonasDe(todas).filter((zona) => dentroDaArea(zona.centro, area));
    });
  },

  semelhantes(busca) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      if (!dentroDeSaoPaulo(busca.localizacao)) throw new ErroApi('LOCALIZACAO_FORA_DO_MUNICIPIO', 422);
      // RN-SEM-04: Segurança nunca sugere semelhantes.
      if (busca.categoria === 'SEGURANCA') return [];

      const [{ todas, visiveis }, participacoes] = await Promise.all([
        carregarVisiveis(),
        carregarMinhasParticipacoes(uid),
      ]);
      const zonas = zonasDe(todas);
      const limiteAtividade = Date.now() - DIAS_ATIVIDADE_SEMELHANTES * MS.DIA;

      return visiveis
        .filter((o) => o.estado !== 'CONCLUIDA')
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
          ...paraResumo(o, uid, participacoes.get(o.id), zonas),
          distanciaMetros: Math.round(distancia),
        }));
    });
  },

  criar(dados, idempotencyKey) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      // A Idempotency-Key é o id do documento: reenviar a mesma ação não cria outra ocorrência.
      const ref = doc(colecoes.ocorrencias, idempotencyKey);
      const existente = (await getDoc(ref)).data();
      if (existente) return montarDetalhe({ ...existente, id: ref.id }, uid);

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
      const fotos = resolverFotos(dados.fotos, uid);
      const { rua, bairro } = await geocodificar(dados.localizacao);
      const agora = new Date().toISOString();

      const nova: OcorrenciaDoc = {
        categoria: dados.categoria,
        tipo: dados.tipo,
        estado: 'ABERTA',
        rua,
        bairro,
        localizacao: dados.localizacao,
        localizacaoAproximada: aproximar(dados.localizacao),
        descricao: dados.descricao.trim(),
        linha: linha ? { codigo: linha.codigo, nome: linha.nome } : null,
        dataHoraOcorrido: dados.dataHoraOcorrido,
        fotos,
        autorId: uid,
        criadaEm: agora,
        ultimaAtividadeEm: agora,
        concluidaEm: null,
        conclusao: null,
        // RN-REG-08: o autor conta automaticamente como afetado.
        totalAfetados: 1,
        totalApoios: 0,
        totalDenuncias: 0,
      };

      // Ocorrência, participação do autor e evento "criada" são gravados juntos, ou nada é gravado.
      const lote = writeBatch(db);
      lote.set(ref, nova);
      lote.set(doc(colecoes.participacoes, idParticipacao(ref.id, uid)), {
        uid,
        ocorrenciaId: ref.id,
        afetado: true,
        apoio: false,
        atualizadoEm: agora,
      });
      lote.set(doc(colecoes.linhaDoTempo(ref.id), 'criada'), {
        tipo: 'CRIADA',
        descricao: 'Ocorrência registrada',
        em: agora,
      });
      await lote.commit();

      invalidarCacheFirestore();
      return montarDetalhe({ ...nova, id: ref.id }, uid);
    });
  },

  editar(id, dados) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      const ocorrencia = await buscarOcorrencia(id, uid);

      // RN-REG-09: só o autor, enquanto não estiver concluída; só descrição e fotos.
      if (ocorrencia.autorId !== uid) throw new ErroApi('SOMENTE_AUTOR', 403);
      if (ocorrencia.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);
      if (dados.descricao !== undefined && !descricaoValida(dados.descricao)) {
        throw new ErroApi('DESCRICAO_TAMANHO_INVALIDO', 422);
      }

      const descricao = dados.descricao === undefined ? ocorrencia.descricao : dados.descricao.trim();
      const fotos =
        dados.fotos === undefined ? ocorrencia.fotos : resolverFotos(dados.fotos, uid, ocorrencia.fotos);

      await updateDoc(doc(colecoes.ocorrencias, id), { descricao, fotos });
      invalidarCacheFirestore();
      return montarDetalhe({ ...ocorrencia, descricao, fotos }, uid);
    });
  },

  concluir(id, dados) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      const ocorrencia = await buscarOcorrencia(id, uid);

      // RN-ACO-04: apenas o autor conclui.
      if (ocorrencia.autorId !== uid) throw new ErroApi('SOMENTE_AUTOR', 403);
      if (ocorrencia.estado === 'CONCLUIDA') throw new ErroApi('OCORRENCIA_CONCLUIDA', 409);
      const feedback = dados.feedback?.trim() ?? '';
      if (feedback.length > LIMITES.feedbackMax) throw new ErroApi('REQUISICAO_INVALIDA', 400);
      const fotos = resolverFotos(dados.fotos, uid);

      const agora = new Date().toISOString();
      const mudanca = {
        estado: 'CONCLUIDA',
        concluidaEm: agora,
        ultimaAtividadeEm: agora,
        // RN-ACO-05: feedback de finalização com texto e fotos.
        conclusao: { motivo: 'AUTOR', feedback: feedback || null, fotos },
      } satisfies Partial<OcorrenciaDoc>;

      // O detalhe de retorno é montado ANTES de gravar: as leituras extras (zonas, autor) podem
      // falhar com a rede instável, e uma falha depois da gravação mostrava erro para uma
      // conclusão que já tinha acontecido.
      const detalhe = await montarDetalhe({ ...ocorrencia, ...mudanca }, uid);

      const lote = writeBatch(db);
      lote.update(doc(colecoes.ocorrencias, id), mudanca);
      lote.set(doc(colecoes.linhaDoTempo(id)), {
        tipo: 'CONCLUIDA',
        descricao: 'Marcada como concluída por quem registrou',
        em: agora,
      });
      await lote.commit();

      invalidarCacheFirestore();
      return detalhe;
    });
  },

  reabrir(id) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      const refOcorrencia = doc(colecoes.ocorrencias, id);
      const agora = new Date().toISOString();
      const mudancaReabertura = {
        estado: 'EM_ACOMPANHAMENTO',
        concluidaEm: null,
        conclusao: null,
        ultimaAtividadeEm: agora,
      } satisfies Partial<OcorrenciaDoc>;
      // Como em `concluir`: o detalhe de retorno é montado antes de gravar. A transação abaixo
      // confere tudo de novo com os dados do servidor.
      const detalhe = await montarDetalhe({ ...(await buscarOcorrencia(id, uid)), ...mudancaReabertura }, uid);

      await runTransaction(db, async (transacao) => {
        const ocorrencia = (await transacao.get(refOcorrencia)).data();
        if (!ocorrencia) throw new ErroApi('NAO_ENCONTRADO', 404);
        const participacao = (
          await transacao.get(doc(colecoes.participacoes, idParticipacao(id, uid)))
        ).data();

        // RN-ACO-07: qualquer afetado reabre em até 7 dias; Segurança não reabre.
        if (!participacao?.afetado) throw new ErroApi('SOMENTE_AFETADO', 403);
        if (ocorrencia.categoria === 'SEGURANCA') throw new ErroApi('REABERTURA_NAO_PERMITIDA', 422);
        if (ocorrencia.estado !== 'CONCLUIDA' || !ocorrencia.concluidaEm) {
          throw new ErroApi('REQUISICAO_INVALIDA', 400);
        }
        const prazo = LIMITES.diasReabertura * MS.DIA;
        if (Date.now() - new Date(ocorrencia.concluidaEm).getTime() > prazo) {
          throw new ErroApi('PRAZO_REABERTURA_EXPIRADO', 422);
        }

        transacao.update(refOcorrencia, mudancaReabertura);
        transacao.set(doc(colecoes.linhaDoTempo(id)), {
          tipo: 'REABERTA',
          descricao: 'Reaberta por uma pessoa afetada',
          em: agora,
        });
      });

      invalidarCacheFirestore();
      return detalhe;
    });
  },

  denunciar(denuncia) {
    return comErroTratado(async () => {
      const uid = exigirUid();
      // RN-MOD-01: uma denúncia por conta por conteúdo (o id do documento garante isso).
      const refDenuncia = doc(colecoes.denuncias, idDenuncia(denuncia.tipoConteudo, denuncia.conteudoId, uid));
      const registro = { uid, ...denuncia, criadoEm: new Date().toISOString() };

      await runTransaction(db, async (transacao) => {
        if ((await transacao.get(refDenuncia)).exists()) throw new ErroApi('DENUNCIA_JA_REGISTRADA', 409);

        // RN-MOD-02: a contagem de denúncias decide quando o conteúdo fica oculto.
        if (denuncia.tipoConteudo === 'OCORRENCIA') {
          const ref = doc(colecoes.ocorrencias, denuncia.conteudoId);
          const conteudo = (await transacao.get(ref)).data();
          if (!conteudo) throw new ErroApi('NAO_ENCONTRADO', 404);
          transacao.update(ref, { totalDenuncias: conteudo.totalDenuncias + 1 });
        } else if (denuncia.tipoConteudo === 'COMENTARIO') {
          const ref = doc(colecoes.comentarios, denuncia.conteudoId);
          const conteudo = (await transacao.get(ref)).data();
          if (!conteudo) throw new ErroApi('NAO_ENCONTRADO', 404);
          transacao.update(ref, { totalDenuncias: conteudo.totalDenuncias + 1 });
        }
        // Fotos não têm documento próprio: a denúncia fica registrada para a revisão da equipe.
        transacao.set(refDenuncia, registro);
      });
      invalidarCacheFirestore();
    });
  },
};
