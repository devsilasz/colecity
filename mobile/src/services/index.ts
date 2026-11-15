import { env } from '@/config/env';

import type {
  AuthService,
  ComentarioService,
  OcorrenciaService,
  ParticipacaoService,
  TransporteService,
  UploadService,
  UserDataService,
  UsuarioService,
} from './contratos';
import { ocorrenciaHttp } from './http/ocorrencia.http';
import {
  comentarioHttp,
  participacaoHttp,
  transporteHttp,
  uploadHttp,
  usuarioHttp,
} from './http/recursos.http';
import { authMock } from './mock/auth.mock';
import { comentarioMock } from './mock/comentario.mock';
import { ocorrenciaMock } from './mock/ocorrencia.mock';
import { participacaoMock } from './mock/participacao.mock';
import { transporteMock } from './mock/transporte.mock';
import { uploadMock } from './mock/upload.mock';
import { usuarioMock } from './mock/usuario.mock';
import { userDataLocal } from './userDataService';

/**
 * ÚNICO ponto que escolhe o adaptador de dados.
 * `EXPO_PUBLIC_USE_MOCK=true` (padrão) → mock; `false` → BFF via Axios (doc 10).
 * Telas e hooks importam os services daqui e não sabem qual adaptador está ativo.
 */
const mock = env.usarMock;

export const ocorrenciaService: OcorrenciaService = mock ? ocorrenciaMock : ocorrenciaHttp;
export const participacaoService: ParticipacaoService = mock ? participacaoMock : participacaoHttp;
export const comentarioService: ComentarioService = mock ? comentarioMock : comentarioHttp;
export const transporteService: TransporteService = mock ? transporteMock : transporteHttp;
export const usuarioService: UsuarioService = mock ? usuarioMock : usuarioHttp;
export const uploadService: UploadService = mock ? uploadMock : uploadHttp;

/** Autenticação: mock até o Firebase Authentication ser ligado (etapa posterior). */
export const authService: AuthService = authMock;

/** Dados do próprio usuário: AsyncStorage até o Firestore ser ligado (etapa posterior). */
export const userDataService: UserDataService = userDataLocal;
