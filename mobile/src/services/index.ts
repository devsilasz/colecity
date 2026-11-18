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
import { comentarioFirestore } from './firestore/comentario.firestore';
import { ocorrenciaFirestore } from './firestore/ocorrencia.firestore';
import { participacaoFirestore } from './firestore/participacao.firestore';
import { tempoRealFirestore } from './firestore/tempoReal.firestore';
import { transporteFirestore } from './firestore/transporte.firestore';
import { uploadLocal, uploadNuvem } from './firestore/upload.local';
import { userDataFirestore, usuarioFirestore } from './firestore/usuario.firestore';
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
 * ÚNICO ponto que escolhe o adaptador de dados, por `EXPO_PUBLIC_DATA_SOURCE`:
 * - `firestore` (padrão): Firebase Authentication + Cloud Firestore;
 * - `mock`: dados de demonstração guardados no aparelho;
 * - `bff`: API própria via Axios (doc 08 §11), com login pelo Firebase Authentication.
 * Telas e hooks importam os services daqui e não sabem qual adaptador está ativo.
 */
function escolher<T>(opcoes: Record<FonteDados, T>): T {
  return opcoes[env.fonteDados];
}

const semTempoReal: TempoRealService = {
  assinarOcorrencia: () => () => undefined,
  assinarComentarios: () => () => undefined,
};

export const authService: AuthService = escolher({
  firestore: authFirebase,
  mock: authMock,
  bff: authFirebase,
});

export const usuarioService: UsuarioService = escolher({
  firestore: usuarioFirestore,
  mock: usuarioMock,
  bff: usuarioHttp,
});

export const ocorrenciaService: OcorrenciaService = escolher({
  firestore: ocorrenciaFirestore,
  mock: ocorrenciaMock,
  bff: ocorrenciaHttp,
});

export const participacaoService: ParticipacaoService = escolher({
  firestore: participacaoFirestore,
  mock: participacaoMock,
  bff: participacaoHttp,
});

export const comentarioService: ComentarioService = escolher({
  firestore: comentarioFirestore,
  mock: comentarioMock,
  bff: comentarioHttp,
});

/** Transporte ao vivo: simulado no app enquanto o BFF com a SPTrans não existe. */
export const transporteService: TransporteService = escolher({
  firestore: transporteFirestore,
  mock: transporteMock,
  bff: transporteHttp,
});

/**
 * Fotos: na nuvem (Vercel Blob, pela API do Colecity) quando `EXPO_PUBLIC_PUSH_API_URL` está
 * configurada; senão, só no aparelho. Ver `firestore/upload.local.ts`.
 */
export const uploadService: UploadService = escolher({
  firestore: env.pushApiUrl ? uploadNuvem : uploadLocal,
  mock: uploadMock,
  bff: uploadHttp,
});

/** Dados do próprio usuário: preferências, ocorrências silenciadas e última visita. */
export const userDataService: UserDataService = escolher({
  firestore: userDataFirestore,
  mock: userDataLocal,
  bff: userDataFirestore,
});

export const tempoRealService: TempoRealService = escolher({
  firestore: tempoRealFirestore,
  mock: semTempoReal,
  bff: semTempoReal,
});
