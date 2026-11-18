import * as Crypto from 'expo-crypto';

import type { Comentario } from '@/types/comentario';
import type {
  FotoRef,
  NovaOcorrencia,
  OcorrenciaDetalhe,
  RespostaParticipacao,
  TipoParticipacao,
} from '@/types/ocorrencia';

import type { DestinoFoto, FotoLocal } from './contratos';
import { ehErroApi, erroDefinitivo, mensagemDeErro } from './erros';
import { comentarioService, ocorrenciaService, participacaoService, uploadService } from './index';
import { notificacoes } from './notificacoes';
import { CHAVES, lerJson, salvarJson } from './storage';

/**
 * Fila de escritas offline (RN-GER-10, doc 09 §4.3).
 * Registros, participações e comentários feitos sem conexão ficam aqui com status
 * "Aguardando envio" e são enviados em ordem quando a conexão volta.
 * O id local de cada item é usado como `Idempotency-Key`, evitando duplicidade.
 */

export type AcaoOffline =
  | {
      tipo: 'CRIAR_OCORRENCIA';
      dados: Omit<NovaOcorrencia, 'fotos'>;
      /** Fotos já comprimidas (WebP) no aparelho; o upload acontece junto com o envio. */
      fotosLocais: FotoLocal[];
      /** Texto para exibir o item na fila (ex.: "Buraco"). */
      resumo: string;
    }
  | { tipo: 'PARTICIPAR'; ocorrenciaId: string; participacao: TipoParticipacao; marcar: boolean }
  | { tipo: 'COMENTAR'; ocorrenciaId: string; texto: string; fotosLocais: FotoLocal[] };

export type StatusFila = 'AGUARDANDO' | 'ENVIANDO' | 'ERRO';

export interface ItemFila {
  /** Id local único = Idempotency-Key. */
  id: string;
  uid: string;
  acao: AcaoOffline;
  criadoEm: string;
  status: StatusFila;
  /** Mensagem amigável quando o servidor recusou a ação em definitivo. */
  erro?: string;
}

export type ResultadoAcao =
  | { tipo: 'CRIAR_OCORRENCIA'; ocorrencia: OcorrenciaDetalhe }
  | { tipo: 'PARTICIPAR'; resposta: RespostaParticipacao | null }
  | { tipo: 'COMENTAR'; comentario: Comentario };

async function enviarFotos(fotos: readonly FotoLocal[], destino: DestinoFoto): Promise<FotoRef[]> {
  const refs: FotoRef[] = [];
  for (const foto of fotos) {
    const enviada = await uploadService.enviar(foto, destino);
    refs.push({ path: enviada.path });
  }
  return refs;
}

/** Executa uma ação no servidor. Usado tanto no envio imediato quanto pela fila. */
export async function executarAcao(acao: AcaoOffline, idempotencyKey: string): Promise<ResultadoAcao> {
  switch (acao.tipo) {
    case 'CRIAR_OCORRENCIA': {
      const fotos = await enviarFotos(acao.fotosLocais, 'ocorrencias');
      const ocorrencia = await ocorrenciaService.criar({ ...acao.dados, fotos }, idempotencyKey);
      // RN-NOT-01: a permissão de notificação é pedida após o primeiro registro.
      void notificacoes.registrarAparelho({ pedir: true });
      return { tipo: acao.tipo, ocorrencia };
    }
    case 'PARTICIPAR': {
      const resposta = acao.marcar
        ? await participacaoService.marcar(acao.ocorrenciaId, acao.participacao)
        : await participacaoService.retirar(acao.ocorrenciaId, acao.participacao);
      // RN-NOT-01: ...ou após a primeira participação.
      if (acao.marcar) void notificacoes.registrarAparelho({ pedir: true });
      return { tipo: acao.tipo, resposta };
    }
    case 'COMENTAR': {
      const fotos = await enviarFotos(acao.fotosLocais, 'comentarios');
      const comentario = await comentarioService.criar(
        acao.ocorrenciaId,
        { texto: acao.texto, fotos },
        idempotencyKey,
      );
      // Comentário já gravado (também quando sai da fila offline): avisa a API de push.
      void notificacoes.avisarEvento(acao.ocorrenciaId, 'comentario', comentario.id);
      return { tipo: acao.tipo, comentario };
    }
  }
}

export function novaChaveIdempotencia(): string {
  return Crypto.randomUUID();
}

export type ResultadoEnvio =
  | { enfileirada: false; resultado: ResultadoAcao }
  | { enfileirada: true; item: ItemFila };

/**
 * Envia a ação agora; sem conexão, guarda na fila "Aguardando envio" (RN-GER-10).
 * Erros de regra (4xx) são propagados para a tela tratar.
 */
export async function enviarOuEnfileirar(
  acao: AcaoOffline,
  uid: string,
  online: boolean,
): Promise<ResultadoEnvio> {
  const chave = novaChaveIdempotencia();
  if (!online) return { enfileirada: true, item: await filaOffline.enfileirar(acao, uid, chave) };

  try {
    return { enfileirada: false, resultado: await executarAcao(acao, chave) };
  } catch (erro) {
    if (ehErroApi(erro) && erro.offline) {
      return { enfileirada: true, item: await filaOffline.enfileirar(acao, uid, chave) };
    }
    throw erro;
  }
}

type Ouvinte = () => void;

let itens: readonly ItemFila[] = [];
let carregada = false;
let processando = false;
const ouvintes = new Set<Ouvinte>();

function publicar(novos: readonly ItemFila[]): void {
  itens = novos;
  void salvarJson(CHAVES.filaOffline, novos);
  ouvintes.forEach((ouvinte) => ouvinte());
}

export const filaOffline = {
  /** Para `useSyncExternalStore`. */
  assinar(ouvinte: Ouvinte): () => void {
    ouvintes.add(ouvinte);
    return () => {
      ouvintes.delete(ouvinte);
    };
  },

  obter(): readonly ItemFila[] {
    return itens;
  },

  async carregar(): Promise<void> {
    if (carregada) return;
    carregada = true;
    const salvos = (await lerJson<ItemFila[]>(CHAVES.filaOffline)) ?? [];
    // Um item que ficou "ENVIANDO" quando o app fechou volta a aguardar.
    publicar(salvos.map((item) => (item.status === 'ENVIANDO' ? { ...item, status: 'AGUARDANDO' } : item)));
  },

  async enfileirar(acao: AcaoOffline, uid: string, id: string = novaChaveIdempotencia()): Promise<ItemFila> {
    await filaOffline.carregar();
    const item: ItemFila = { id, uid, acao, criadoEm: new Date().toISOString(), status: 'AGUARDANDO' };
    publicar([...itens, item]);
    return item;
  },

  remover(id: string): void {
    publicar(itens.filter((item) => item.id !== id));
  },

  /** Recoloca um item com erro na fila para nova tentativa. */
  tentarNovamente(id: string): void {
    publicar(
      itens.map((item) => (item.id === id ? { ...item, status: 'AGUARDANDO', erro: undefined } : item)),
    );
  },

  /** Remove os itens de um usuário (logout ou exclusão de conta). */
  limparDoUsuario(uid: string): void {
    publicar(itens.filter((item) => item.uid !== uid));
  },

  /**
   * Envia, em ordem, os itens pendentes do usuário logado.
   * Para na primeira falha de conexão; erros definitivos ficam marcados para o usuário ver.
   * Devolve quantas ações foram sincronizadas.
   */
  async processar(uid: string): Promise<number> {
    await filaOffline.carregar();
    if (processando) return 0;
    processando = true;
    let enviados = 0;

    try {
      for (;;) {
        const proximo = itens.find((item) => item.uid === uid && item.status === 'AGUARDANDO');
        if (!proximo) break;

        publicar(itens.map((item) => (item.id === proximo.id ? { ...item, status: 'ENVIANDO' } : item)));
        try {
          await executarAcao(proximo.acao, proximo.id);
          publicar(itens.filter((item) => item.id !== proximo.id));
          enviados += 1;
        } catch (erro) {
          const definitivo = erroDefinitivo(erro);
          publicar(
            itens.map((item) =>
              item.id === proximo.id
                ? { ...item, status: definitivo ? 'ERRO' : 'AGUARDANDO', erro: definitivo ? mensagemDeErro(erro) : undefined }
                : item,
            ),
          );
          // Sem conexão ou falha temporária: tenta de novo quando a conexão voltar.
          if (!definitivo) break;
          if (ehErroApi(erro) && erro.code === 'NAO_AUTENTICADO') break;
        }
      }
    } finally {
      processando = false;
    }
    return enviados;
  },
};
