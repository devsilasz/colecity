import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { createPrivateKey } from 'node:crypto';

/** Nomes das variáveis de ambiente (cadastradas na Vercel; nunca no repositório). */
const VARIAVEIS = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'] as const;

/** Variáveis obrigatórias que estão faltando (usado pelo health check). */
export function variaveisFaltando(): string[] {
  return VARIAVEIS.filter((nome) => !process.env[nome]);
}

/**
 * A chave colada no painel da Vercel costuma chegar com aspas em volta, com "\n" literais
 * (barra invertida + n) no lugar das quebras de linha, ou com "\r". Normaliza para o PEM
 * que o Admin SDK espera.
 */
function chavePrivada(): string {
  let chave = (process.env.FIREBASE_PRIVATE_KEY ?? '').trim();
  if ((chave.startsWith('"') && chave.endsWith('"')) || (chave.startsWith("'") && chave.endsWith("'"))) {
    chave = chave.slice(1, -1);
  }
  return chave.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r/g, '');
}

/** `true` quando a chave privada é um PEM válido (usado pelo health check; não expõe a chave). */
export function chavePrivadaValida(): boolean {
  try {
    createPrivateKey(chavePrivada());
    return true;
  } catch {
    return false;
  }
}

function iniciar(): App {
  const existente = getApps()[0];
  if (existente) return existente;

  const faltando = variaveisFaltando();
  if (faltando.length > 0) throw new Error(`Variáveis de ambiente ausentes: ${faltando.join(', ')}`);

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: chavePrivada(),
    }),
  });
}

/** Admin SDK: valida o ID token e lê/grava o Firestore ignorando as regras de segurança. */
export function autenticacao(): Auth {
  return getAuth(iniciar());
}

export function banco(): Firestore {
  return getFirestore(iniciar());
}
