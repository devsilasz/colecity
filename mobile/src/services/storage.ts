import AsyncStorage from '@react-native-async-storage/async-storage';

/** Todas as chaves do AsyncStorage usadas pelo app, em um só lugar. */
export const CHAVES = {
  tema: '@colecity/tema',
  reduzirTransparencia: '@colecity/reduzir-transparencia',
  filtros: '@colecity/filtros',
  rascunhoRegistro: '@colecity/rascunho-registro',
  sessao: '@colecity/sessao',
  filaOffline: '@colecity/fila-offline',
  cacheQuery: '@colecity/cache-query',
  /** Prefixo: os dados ficam em `@colecity/dados-usuario/{uid}`. */
  dadosUsuario: '@colecity/dados-usuario',
  permissaoPushPedida: '@colecity/permissao-push-pedida',
  mockBanco: '@colecity/mock-banco',
} as const;

export type ChaveStorage = (typeof CHAVES)[keyof typeof CHAVES];

/** Lê um valor JSON. Devolve `null` se não existir ou estiver corrompido. */
export async function lerJson<T>(chave: ChaveStorage): Promise<T | null> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    return bruto === null ? null : (JSON.parse(bruto) as T);
  } catch {
    return null;
  }
}

export async function salvarJson<T>(chave: ChaveStorage, valor: T): Promise<void> {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

export async function remover(chave: ChaveStorage): Promise<void> {
  await AsyncStorage.removeItem(chave);
}

export async function removerVarias(chaves: readonly ChaveStorage[]): Promise<void> {
  await AsyncStorage.multiRemove([...chaves]);
}
