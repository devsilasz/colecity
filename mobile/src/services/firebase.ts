import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError, getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

import firebaseConfig from '../../firebaseConfig.json';

import { ErroApi } from './erros';

/**
 * Inicialização única do Firebase (JS SDK modular), compatível com Expo Go e development build.
 * `firebaseConfig.json` traz só a configuração pública do SDK cliente; a proteção dos dados
 * vem das regras de segurança (`firestore.rules`). Nenhuma credencial administrativa entra no app.
 */

function iniciarAuth(aplicativo: FirebaseApp): Auth {
  try {
    // Sessão persistida no AsyncStorage: o login sobrevive ao fechamento do app (RN-GER-13).
    return initializeAuth(aplicativo, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Já inicializado (Fast Refresh recarrega o módulo): reaproveita a instância.
    return getAuth(aplicativo);
  }
}

const jaIniciado = getApps().length > 0;
const app = jaIniciado ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = jaIniciado ? getAuth(app) : iniciarAuth(app);
/**
 * No React Native o canal de streaming padrão do Firestore (WebChannel) cai com frequência
 * ("transport errored") e os listeners param de atualizar. Long polling é o modo recomendado
 * para o SDK JS em React Native.
 */
export const db: Firestore = jaIniciado
  ? getFirestore(app)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

/** `true` quando o erro veio do SDK do Firebase. */
export function ehErroFirebase(erro: unknown): erro is FirebaseError {
  return erro instanceof FirebaseError;
}

/**
 * Converte erros do Firestore no erro tipado do app, com mensagem amigável (RN-GER-11).
 * Erros de regra de negócio (`ErroApi`) passam direto.
 */
export function converterErroFirestore(erro: unknown): ErroApi {
  if (erro instanceof ErroApi) return erro;
  if (!ehErroFirebase(erro)) return new ErroApi('ERRO_INTERNO', 500);

  switch (erro.code) {
    case 'permission-denied':
      return new ErroApi('SEM_PERMISSAO', 403);
    case 'unauthenticated':
      return new ErroApi('NAO_AUTENTICADO', 401);
    case 'not-found':
      return new ErroApi('NAO_ENCONTRADO', 404);
    case 'resource-exhausted':
      return new ErroApi('MUITAS_REQUISICOES', 429);
    case 'unavailable':
    case 'deadline-exceeded':
      return new ErroApi('OFFLINE', 0);
    default:
      return new ErroApi('ERRO_INTERNO', 500);
  }
}

/** Executa uma operação do Firestore devolvendo sempre `ErroApi` em caso de falha. */
export async function comErroTratado<T>(operacao: () => Promise<T>): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    const convertido = converterErroFirestore(erro);
    if (__DEV__ && ehErroFirebase(erro)) {
      // Log só em desenvolvimento, sem dados pessoais.
      console.warn(`[firestore] ${erro.code}`);
    }
    throw convertido;
  }
}
