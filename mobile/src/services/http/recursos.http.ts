import { api, comIdempotencia, del, get, patch, post, put } from '@/services/api';
import type {
  ComentarioService,
  ParticipacaoService,
  TransporteService,
  UploadService,
  UsuarioService,
} from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { comprimirParaWebp } from '@/services/imagem';
import type { Pagina } from '@/types/api';
import type { Comentario, NovoComentario } from '@/types/comentario';
import type { OcorrenciaResumo, RespostaParticipacao } from '@/types/ocorrencia';
import type {
  Linha,
  NovaPosicao,
  RespostaDesvio,
  RespostaPosicao,
  Trajeto,
  Veiculo,
  Viagem,
} from '@/types/transporte';
import type { EdicaoPerfil, Usuario } from '@/types/usuario';

import { rotas } from './rotas';

/** Adaptadores HTTP (BFF) dos demais recursos: modelos do doc 10, caminhos do doc 08 §11. */

export const usuarioHttp: UsuarioService = {
  registrarAcesso: (dados) => put<Usuario, typeof dados>(rotas.usuarioEu, dados),
  obterPerfil: () => get<Usuario>(rotas.usuarioEu),
  atualizarPerfil: (dados) => patch<Usuario, EdicaoPerfil>(rotas.usuarioEu, dados),
  excluirConta: () => del(rotas.usuarioEu),
  minhasOcorrencias: (aba, page) =>
    get<Pagina<OcorrenciaResumo>>(rotas.minhasOcorrencias, { params: { aba, page } }),
};

export const participacaoHttp: ParticipacaoService = {
  marcar: (ocorrenciaId, tipo) => put<RespostaParticipacao>(rotas.participacao(ocorrenciaId, tipo)),

  async retirar(ocorrenciaId, tipo) {
    const resposta = await api.delete<RespostaParticipacao | ''>(rotas.participacao(ocorrenciaId, tipo));
    // 204: não havia participação a retirar.
    return resposta.status === 204 || resposta.data === '' ? null : resposta.data;
  },
};

export const comentarioHttp: ComentarioService = {
  listar: (ocorrenciaId, page) =>
    get<Pagina<Comentario>>(rotas.comentarios(ocorrenciaId), { params: { page } }),
  criar: (ocorrenciaId, dados, idempotencyKey) =>
    post<Comentario, NovoComentario>(rotas.comentarios(ocorrenciaId), dados, comIdempotencia(idempotencyKey)),
  excluir: (comentarioId) => del(rotas.comentario(comentarioId)),
};

export const transporteHttp: TransporteService = {
  buscarLinhas: (busca) => get<Linha[]>(rotas.linhas, { params: { busca } }),
  trajeto: (codigo, sentido) => get<Trajeto>(rotas.trajeto(codigo), { params: { sentido } }),
  veiculos: (codigo, sentido) => get<Veiculo[]>(rotas.veiculos(codigo), { params: { sentido } }),
  iniciarViagem: (linha, sentido) =>
    post<Viagem, { linha: string; sentido: 1 | 2 }>(rotas.viagens, { linha, sentido }),
  enviarPosicao: (viagemId, posicao) =>
    post<RespostaPosicao, NovaPosicao>(rotas.posicoes(viagemId), posicao),
  responderDesvio: (viagemId, confirmado) =>
    post<RespostaDesvio, { confirmado: boolean }>(rotas.desvio(viagemId), { confirmado }),
  encerrarViagem: (viagemId) => post<void>(rotas.encerrarViagem(viagemId)),
};

/**
 * Upload real: o BFF fornece o caminho no Storage e o app envia o arquivo direto ao
 * Firebase Storage (doc 08 §6.1). O envio depende do SDK do Firebase, ligado em etapa posterior.
 */
export const uploadHttp: UploadService = {
  comprimir: comprimirParaWebp,
  enviar() {
    return Promise.reject(new ErroApi('RECURSO_INDISPONIVEL', 501));
  },
};
