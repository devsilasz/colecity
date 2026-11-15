import type { AreaMapa, Pagina } from '@/types/api';
import type { Categoria, CategoriaInfo } from '@/types/categoria';
import type { Comentario, NovoComentario } from '@/types/comentario';
import type {
  AbaMinhas,
  Apoiador,
  BuscaSemelhantes,
  DadosConclusao,
  EdicaoOcorrencia,
  EventoLinhaDoTempo,
  FiltrosOcorrencias,
  Foto,
  NovaDenuncia,
  NovaOcorrencia,
  OcorrenciaDetalhe,
  OcorrenciaResumo,
  OcorrenciaSemelhante,
  PontoCalor,
  RespostaParticipacao,
  TipoParticipacao,
  ZonaAtencao,
} from '@/types/ocorrencia';
import type {
  Linha,
  NovaPosicao,
  RespostaDesvio,
  RespostaPosicao,
  Trajeto,
  Veiculo,
  Viagem,
} from '@/types/transporte';
import type {
  DadosCadastro,
  EdicaoPerfil,
  EstadoOcorrenciaUsuario,
  ResultadoLoginGoogle,
  Usuario,
  UsuarioAuth,
} from '@/types/usuario';

/**
 * Interfaces da camada de dados. Cada uma tem um adaptador `mock` e um `http`
 * (BFF, conforme doc 10); `services/index.ts` escolhe qual usar.
 */

/** Autenticação (Firebase Auth na versão real) — RN-CON. */
export interface AuthService {
  /** Recupera a sessão salva ao abrir o app (RN-GER-13). */
  restaurarSessao(): Promise<UsuarioAuth | null>;
  entrar(email: string, senha: string): Promise<UsuarioAuth>;
  cadastrar(dados: DadosCadastro): Promise<UsuarioAuth>;
  /** `aceiteTermosVersao` é enviado na segunda chamada, após o aceite (RN-CON-11). */
  entrarComGoogle(aceiteTermosVersao?: string): Promise<ResultadoLoginGoogle>;
  /** Sempre resolve, exista ou não o e-mail (RN-CON-09). */
  recuperarSenha(email: string): Promise<void>;
  sair(): Promise<void>;
  obterToken(forcarRenovacao: boolean): Promise<string | null>;
  /** Troca de e-mail exige a senha atual (RN-CON-07). */
  alterarEmail(novoEmail: string, senhaAtual: string): Promise<UsuarioAuth>;
  alterarSenha(senhaAtual: string, novaSenha: string): Promise<void>;
  /** Conta só com Google passa a ter senha (RN-CON-13). */
  definirSenha(novaSenha: string): Promise<UsuarioAuth>;
  atualizarNome(nome: string): Promise<UsuarioAuth>;
  /** Confirmação forte antes de excluir: senha ou novo login Google (RN-CON-08). */
  reautenticar(senha?: string): Promise<void>;
  /** Remove a conta de autenticação e a sessão local. */
  excluirConta(): Promise<void>;
}

/** Usuário do domínio — doc 10, seção 4.1. */
export interface UsuarioService {
  /** `PUT /usuarios/me`: cria ou atualiza no primeiro acesso. */
  registrarAcesso(dados: { nome: string; email: string; aceiteTermosVersao?: string }): Promise<Usuario>;
  obterPerfil(): Promise<Usuario>;
  atualizarPerfil(dados: EdicaoPerfil): Promise<Usuario>;
  /** `DELETE /usuarios/me`: anonimização (RN-CON-08). */
  excluirConta(): Promise<void>;
  minhasOcorrencias(aba: AbaMinhas, page: number): Promise<Pagina<OcorrenciaResumo>>;
}

/** Ocorrências — doc 10, seções 4.2 a 4.4 e 4.7. */
export interface OcorrenciaService {
  listarCategorias(): Promise<CategoriaInfo[]>;
  listar(filtros: FiltrosOcorrencias, page: number, pageSize?: number): Promise<Pagina<OcorrenciaResumo>>;
  obter(id: string): Promise<OcorrenciaDetalhe>;
  linhaDoTempo(id: string): Promise<EventoLinhaDoTempo[]>;
  apoiadores(id: string, page: number): Promise<Pagina<Apoiador>>;
  mapaDeCalor(area: AreaMapa, categoria?: Categoria): Promise<PontoCalor[]>;
  zonasDeAtencao(area: AreaMapa): Promise<ZonaAtencao[]>;
  semelhantes(busca: BuscaSemelhantes): Promise<OcorrenciaSemelhante[]>;
  criar(dados: NovaOcorrencia, idempotencyKey: string): Promise<OcorrenciaDetalhe>;
  editar(id: string, dados: EdicaoOcorrencia): Promise<OcorrenciaDetalhe>;
  concluir(id: string, dados: DadosConclusao): Promise<OcorrenciaDetalhe>;
  reabrir(id: string): Promise<OcorrenciaDetalhe>;
  denunciar(denuncia: NovaDenuncia): Promise<void>;
}

/** Participação — doc 10, seção 4.5. */
export interface ParticipacaoService {
  marcar(ocorrenciaId: string, tipo: TipoParticipacao): Promise<RespostaParticipacao>;
  /** Retirar o que não existe devolve `null` (204). */
  retirar(ocorrenciaId: string, tipo: TipoParticipacao): Promise<RespostaParticipacao | null>;
}

/** Comentários — doc 10, seção 4.6. */
export interface ComentarioService {
  listar(ocorrenciaId: string, page: number): Promise<Pagina<Comentario>>;
  criar(ocorrenciaId: string, dados: NovoComentario, idempotencyKey: string): Promise<Comentario>;
  excluir(comentarioId: string): Promise<void>;
}

/** Transporte ao vivo — doc 10, seção 4.8. */
export interface TransporteService {
  buscarLinhas(busca: string): Promise<Linha[]>;
  trajeto(codigo: string, sentido: 1 | 2): Promise<Trajeto>;
  veiculos(codigo: string, sentido: 1 | 2): Promise<Veiculo[]>;
  iniciarViagem(linha: string, sentido: 1 | 2): Promise<Viagem>;
  enviarPosicao(viagemId: string, posicao: NovaPosicao): Promise<RespostaPosicao>;
  responderDesvio(viagemId: string, confirmado: boolean): Promise<RespostaDesvio>;
  encerrarViagem(viagemId: string): Promise<void>;
}

/** Foto já comprimida no aparelho, pronta para envio (RN-REG-04). */
export interface FotoLocal {
  uri: string;
  largura: number;
  altura: number;
}

export type DestinoFoto = 'ocorrencias' | 'comentarios';

/** Compressão WebP + upload ao Storage — doc 08, seção 6.1. */
export interface UploadService {
  /** Converte para WebP, maior lado ≤ 1920 px, qualidade 0,7. */
  comprimir(uri: string): Promise<FotoLocal>;
  /** Envia ao Storage e devolve a referência (`path`) e a URL pública. */
  enviar(foto: FotoLocal, destino: DestinoFoto): Promise<Foto>;
}

/** Dados do próprio usuário (Firestore na versão real) — doc 08, seção 8. */
export interface UserDataService {
  obterNotificacoesAtivas(uid: string): Promise<boolean>;
  definirNotificacoesAtivas(uid: string, ativas: boolean): Promise<void>;
  obterEstados(uid: string): Promise<Record<string, EstadoOcorrenciaUsuario>>;
  /** Silencia ou reativa as notificações de uma ocorrência (RN-NOT-04). */
  definirSilenciada(uid: string, ocorrenciaId: string, silenciada: boolean): Promise<void>;
  /** Registra a visita, base do indicador de "novidade" (RN-MIN-04). */
  registrarVisita(uid: string, ocorrenciaId: string): Promise<void>;
  /** Apaga os dados locais do usuário (exclusão de conta, RN-CON-08). */
  limpar(uid: string): Promise<void>;
}
