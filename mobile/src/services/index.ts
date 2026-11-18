import { env, type FonteDados } from '@/config/env';

import type {
  AuthService,
  ComentarioService,
  OcorrenciaService,
  ParticipacaoService,
  TempoRealService,
  TransporteService,
  UploadService,
  UserDataService,
  UsuarioService,
} from './contratos';
import { authFirebase } from './firestore/auth.firebase';
import { userDataFirestore } from './firestore/userData.firestore';
import { ocorrenciaHttp } from './http/ocorrencia.http';
import { comentarioHttp, participacaoHttp, transporteHttp, usuarioHttp } from './http/recursos.http';
import { tempoRealHttp } from './http/tempoReal.http';
import { uploadHttp } from './http/upload.http';
import { authMock } from './mock/auth.mock';
import { comentarioMock } from './mock/comentario.mock';
import { ocorrenciaMock } from './mock/ocorrencia.mock';
import { participacaoMock } from './mock/participacao.mock';
import { transporteMock } from './mock/transporte.mock';
import { uploadMock } from './mock/upload.mock';
import { usuarioMock } from './mock/usuario.mock';
import { userDataLocal } from './userDataService';

/**
 * ÚNICO ponto que escolhe o adaptador de dados, por `EXPO_PUBLIC_DATA_SOURCE`:
 * - `bff` (padrão): login pelo Firebase Authentication; dados do domínio pelo BFF (Axios, doc 08 §11),
 *   que repassa à API C#; Firestore só com os dados do próprio usuário (`users/{uid}`).
 * - `mock`: tudo simulado no aparelho, para desenvolvimento sem rede.
 * Telas e hooks importam os services daqui e não sabem qual adaptador está ativo.
 */
function escolher<T>(opcoes: Record<FonteDados, T>): T {
  return opcoes[env.fonteDados];
}

const semTempoReal: TempoRealService = {
  assinarOcorrencia: () => () => undefined,
  assinarComentarios: () => () => undefined,
};

export const authService: AuthService = escolher({ bff: authFirebase, mock: authMock });

export const usuarioService: UsuarioService = escolher({ bff: usuarioHttp, mock: usuarioMock });

export const ocorrenciaService: OcorrenciaService = escolher({ bff: ocorrenciaHttp, mock: ocorrenciaMock });

export const participacaoService: ParticipacaoService = escolher({ bff: participacaoHttp, mock: participacaoMock });

export const comentarioService: ComentarioService = escolher({ bff: comentarioHttp, mock: comentarioMock });

/** Transporte ao vivo: SPTrans e GTFS pela API de domínio; no mock, simulado no app. */
export const transporteService: TransporteService = escolher({ bff: transporteHttp, mock: transporteMock });

/** Fotos: Vercel Blob pelo BFF (`POST /fotos`); o domínio guarda só o `path`. */
export const uploadService: UploadService = escolher({ bff: uploadHttp, mock: uploadMock });

/** Dados do próprio usuário: aceite dos termos, preferências, silenciadas e última visita. */
export const userDataService: UserDataService = escolher({ bff: userDataFirestore, mock: userDataLocal });

/** "Ao vivo": polling enquanto a tela está aberta (o domínio não tem canal de tempo real). */
export const tempoRealService: TempoRealService = escolher({ bff: tempoRealHttp, mock: semTempoReal });
