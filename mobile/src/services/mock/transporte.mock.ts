import {
  exigirUsuario,
  novoId,
  salvarBanco,
  simularRede,
  type OcorrenciaMock,
  type ViagemMock,
} from '@/mocks/banco';
import { LINHAS_SEMENTE, type LinhaSemente } from '@/mocks/transporte';
import type { TransporteService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import type { Coordenada } from '@/types/api';
import type { Veiculo } from '@/types/transporte';
import { distanciaAoTrajeto, pontoNoTrajeto } from '@/utils/distancia';
import { MS } from '@/utils/formatarData';

import { registrarNovoAfetado } from './ocorrencia.mock';

/** RN-TAV-07: mais de 300 m do trajeto por 3 posições consecutivas (≈ 2 min). */
const DISTANCIA_DESVIO_M = 300;
const POSICOES_PARA_DESVIO = 3;
/** RN-TAV-05: 10 min parado fora do trajeto encerra a viagem. */
const POSICOES_PARA_ENCERRAR = 10;
const DURACAO_VIAGEM_MS = 2 * MS.HORA;
/** Tempo que um ônibus simulado leva para percorrer a linha. */
const CICLO_MS = 25 * MS.MINUTO;
/**
 * Demonstração: se quem testa está longe da linha (em casa, por exemplo), o mock troca a
 * posição real por uma simulada que percorre o trajeto e depois desvia, para exibir o fluxo.
 */
const DISTANCIA_SIMULAR_M = 2000;
const POSICAO_INICIO_DESVIO = 2;

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function buscarLinha(codigo: string): LinhaSemente {
  const linha = LINHAS_SEMENTE.find((l) => l.codigo === codigo);
  if (!linha) throw new ErroApi('NAO_ENCONTRADO', 404);
  return linha;
}

function trajetoDoSentido(linha: LinhaSemente, sentido: 1 | 2): Coordenada[] {
  return sentido === 1 ? linha.trajeto : [...linha.trajeto].reverse();
}

function fracaoAtual(indice: number, total: number, deslocamento = 0): number {
  return ((Date.now() % CICLO_MS) / CICLO_MS + indice / total + deslocamento) % 1;
}

function posicaoSimulada(viagem: ViagemMock, trajeto: Coordenada[]): Coordenada {
  const noTrajeto = pontoNoTrajeto(trajeto, 0.2 + viagem.totalPosicoes * 0.025);
  if (viagem.totalPosicoes < POSICAO_INICIO_DESVIO || viagem.desvioPerguntado) return noTrajeto;
  // Afasta ~450 m do trajeto para simular o desvio de rota.
  const passos = viagem.totalPosicoes - POSICAO_INICIO_DESVIO + 1;
  return { lat: noTrajeto.lat + 0.004, lng: noTrajeto.lng + 0.0015 * passos };
}

export const transporteMock: TransporteService = {
  async buscarLinhas(busca) {
    await simularRede();
    const termo = semAcento(busca.trim());
    // Contrato: mínimo de 2 caracteres.
    if (termo.length < 2) return [];
    return LINHAS_SEMENTE.filter(
      (l) => semAcento(l.codigo).includes(termo) || semAcento(l.nome).includes(termo),
    ).map(({ codigo, nome, sentidos }) => ({ codigo, nome, sentidos }));
  },

  async trajeto(codigo, sentido) {
    await simularRede();
    return { pontos: trajetoDoSentido(buscarLinha(codigo), sentido) };
  },

  async veiculos(codigo, sentido) {
    const db = await simularRede();
    const linha = buscarLinha(codigo);
    const trajeto = trajetoDoSentido(linha, sentido);
    const agora = new Date().toISOString();

    // RN-TAV-03: posições "SPTrans" (Olho Vivo na versão real).
    const sptrans: Veiculo[] = Array.from({ length: linha.frota }, (_, i) => ({
      fonte: 'SPTRANS',
      prefixo: `${linha.codigo.slice(0, 1)}${sentido} ${String(1200 + i * 37).padStart(4, '0')}`,
      posicao: pontoNoTrajeto(trajeto, fracaoAtual(i, linha.frota)),
      atualizadoEm: agora,
      acessivel: i % 2 === 0,
    }));

    // RN-TAV-04/06: posição agregada das viagens ativas; nunca identifica o passageiro.
    const ativas = db.viagens.filter(
      (v) => v.ativa && v.linha === codigo && v.sentido === sentido && v.ultimaPosicao,
    );
    const passageiros: Veiculo[] = [
      // Um ônibus relatado por outros passageiros, para a demonstração.
      {
        fonte: 'PASSAGEIROS',
        prefixo: null,
        posicao: pontoNoTrajeto(trajeto, fracaoAtual(0, linha.frota, 0.5 / linha.frota)),
        atualizadoEm: agora,
        acessivel: null,
      },
    ];
    if (ativas.length > 0) {
      passageiros.push({
        fonte: 'PASSAGEIROS',
        prefixo: null,
        posicao: {
          lat: ativas.reduce((s, v) => s + (v.ultimaPosicao?.lat ?? 0), 0) / ativas.length,
          lng: ativas.reduce((s, v) => s + (v.ultimaPosicao?.lng ?? 0), 0) / ativas.length,
        },
        atualizadoEm: agora,
        acessivel: null,
      });
    }

    return [...sptrans, ...passageiros];
  },

  async iniciarViagem(linha, sentido) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    buscarLinha(linha);

    const agora = Date.now();
    const viagem: ViagemMock = {
      id: novoId(),
      uid: usuario.id,
      linha,
      sentido,
      iniciadaEm: new Date(agora).toISOString(),
      expiraEm: new Date(agora + DURACAO_VIAGEM_MS).toISOString(),
      ativa: true,
      totalPosicoes: 0,
      foraDoTrajeto: 0,
      desvioPerguntado: false,
      trechoDesvio: [],
      ultimaPosicao: null,
    };
    // RN-TAV-04: no máximo uma viagem ativa por usuário; iniciar outra encerra a anterior.
    db.viagens = [...db.viagens.filter((v) => v.uid !== usuario.id), viagem];
    await salvarBanco();
    return { viagemId: viagem.id, expiraEm: viagem.expiraEm };
  },

  async enviarPosicao(viagemId, nova) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const viagem = db.viagens.find((v) => v.id === viagemId && v.uid === usuario.id);

    if (!viagem || !viagem.ativa || Date.now() > new Date(viagem.expiraEm).getTime()) {
      if (viagem) viagem.ativa = false;
      return { ativa: false, desvioSuspeito: false, trechoDesvio: null };
    }

    const trajeto = trajetoDoSentido(buscarLinha(viagem.linha), viagem.sentido);
    const longeDaLinha = distanciaAoTrajeto(nova.posicao, trajeto) > DISTANCIA_SIMULAR_M;
    const posicao = longeDaLinha ? posicaoSimulada(viagem, trajeto) : nova.posicao;

    viagem.totalPosicoes += 1;
    viagem.ultimaPosicao = posicao;

    if (distanciaAoTrajeto(posicao, trajeto) > DISTANCIA_DESVIO_M) {
      viagem.foraDoTrajeto += 1;
      viagem.trechoDesvio = [...viagem.trechoDesvio, posicao];
    } else {
      viagem.foraDoTrajeto = 0;
      viagem.trechoDesvio = [];
    }

    if (viagem.foraDoTrajeto >= POSICOES_PARA_ENCERRAR) viagem.ativa = false;

    const desvioSuspeito =
      viagem.ativa && viagem.foraDoTrajeto >= POSICOES_PARA_DESVIO && !viagem.desvioPerguntado;
    if (desvioSuspeito) viagem.desvioPerguntado = true;

    await salvarBanco();
    return {
      ativa: viagem.ativa,
      desvioSuspeito,
      trechoDesvio: desvioSuspeito ? viagem.trechoDesvio : null,
    };
  },

  async responderDesvio(viagemId, confirmado) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const viagem = db.viagens.find((v) => v.id === viagemId && v.uid === usuario.id);
    if (!viagem) throw new ErroApi('NAO_ENCONTRADO', 404);

    if (!confirmado) {
      viagem.foraDoTrajeto = 0;
      viagem.trechoDesvio = [];
      await salvarBanco();
      return { ocorrenciaId: null };
    }

    const linha = buscarLinha(viagem.linha);
    const agora = new Date().toISOString();
    const evento = {
      tipo: 'DESVIO_DETECTADO' as const,
      descricao: `Desvio de rota confirmado por passageiro na linha ${linha.codigo}`,
      em: agora,
    };

    // RN-TAV-07: cria ou reforça a ocorrência "Alteração de rota sem aviso" da linha.
    let ocorrencia = db.ocorrencias.find(
      (o) =>
        o.estado !== 'CONCLUIDA' &&
        o.categoria === 'TRANSPORTE' &&
        o.tipo === 'ALTERACAO_ROTA_SEM_AVISO' &&
        o.linha?.codigo === linha.codigo,
    );

    if (ocorrencia) {
      ocorrencia.linhaDoTempo = [...ocorrencia.linhaDoTempo, evento];
      if (!ocorrencia.afetadosIds.includes(usuario.id)) {
        ocorrencia.afetadosIds = [...ocorrencia.afetadosIds, usuario.id];
        registrarNovoAfetado(ocorrencia, agora);
      }
      ocorrencia.ultimaAtividadeEm = agora;
    } else {
      const local = viagem.trechoDesvio[0] ?? viagem.ultimaPosicao ?? linha.trajeto[0];
      const nova: OcorrenciaMock = {
        id: novoId(),
        categoria: 'TRANSPORTE',
        tipo: 'ALTERACAO_ROTA_SEM_AVISO',
        estado: 'ABERTA',
        rua: '',
        bairro: `Linha ${linha.codigo}`,
        localizacao: local,
        descricao: `Desvio de rota detectado pelo Transporte ao vivo na linha ${linha.codigo} (${linha.nome}).`,
        linha: { codigo: linha.codigo, nome: linha.nome },
        dataHoraOcorrido: null,
        fotos: [],
        autorId: usuario.id,
        criadaEm: agora,
        ultimaAtividadeEm: agora,
        concluidaEm: null,
        conclusao: null,
        afetadosIds: [usuario.id],
        apoiadoresIds: [],
        afetadosExtras: 0,
        apoiosExtras: 0,
        linhaDoTempo: [{ tipo: 'CRIADA', descricao: 'Ocorrência registrada', em: agora }, evento],
      };
      db.ocorrencias = [nova, ...db.ocorrencias];
      ocorrencia = nova;
    }

    viagem.foraDoTrajeto = 0;
    await salvarBanco();
    return { ocorrenciaId: ocorrencia.id };
  },

  async encerrarViagem(viagemId) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    db.viagens = db.viagens.filter((v) => !(v.id === viagemId && v.uid === usuario.id));
    await salvarBanco();
  },
};
