import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient, type Query } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { AppState } from 'react-native';

import type { AreaMapa } from '@/types/api';
import type { Categoria } from '@/types/categoria';
import type { AbaMinhas, BuscaSemelhantes, FiltrosOcorrencias } from '@/types/ocorrencia';

import { erroDefinitivo } from './erros';
import { CHAVES } from './storage';

/**
 * TanStack Query com cache persistido no AsyncStorage (doc 09, seção 4.3).
 * Sem conexão, as leituras ficam pausadas e as telas mostram o último cache (RN-GER-09).
 */

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      // Precisa ser ≥ maxAge do persister para o cache offline não ser descartado.
      gcTime: UM_DIA_MS,
      // Não repete erro de regra de negócio/permissão; demais erros, até 2 tentativas.
      retry: (tentativas, erro) => !erroDefinitivo(erro) && tentativas < 2,
    },
    mutations: {
      // As escritas decidem sozinhas se enviam ou enfileiram (fila "Aguardando envio").
      networkMode: 'always',
      retry: false,
    },
  },
});

/** Liga o estado online/offline do TanStack Query ao NetInfo. */
onlineManager.setEventListener((definirOnline) =>
  NetInfo.addEventListener((estado) => {
    definirOnline(estado.isConnected !== false && estado.isInternetReachable !== false);
  }),
);

/** Revalida ao voltar para o app. */
focusManager.setEventListener((definirFoco) => {
  const inscricao = AppState.addEventListener('change', (estado) => definirFoco(estado === 'active'));
  return () => inscricao.remove();
});

/** Chaves que não vale a pena guardar: mudam a cada poucos segundos ou são da sessão. */
const NAO_PERSISTIR: readonly string[] = ['transporte-veiculos', 'semelhantes'];

export const opcoesPersistencia: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createAsyncStoragePersister({
    storage: AsyncStorage,
    key: CHAVES.cacheQuery,
    throttleTime: 1000,
  }),
  maxAge: UM_DIA_MS,
  // Mude ao alterar o formato dos dados em cache.
  buster: 'v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) =>
      query.state.status === 'success' && !NAO_PERSISTIR.includes(String(query.queryKey[0])),
  },
};

/** Fábrica de `queryKey`, para leituras e invalidações usarem sempre as mesmas chaves. */
export const chaves = {
  categorias: ['categorias'] as const,
  ocorrencias: ['ocorrencias'] as const,
  listaOcorrencias: (filtros: FiltrosOcorrencias) => ['ocorrencias', 'lista', filtros] as const,
  ocorrencia: (id: string) => ['ocorrencias', 'detalhe', id] as const,
  linhaDoTempo: (id: string) => ['ocorrencias', 'linha-do-tempo', id] as const,
  apoiadores: (id: string) => ['ocorrencias', 'apoiadores', id] as const,
  comentarios: (id: string) => ['ocorrencias', 'comentarios', id] as const,
  minhas: (aba: AbaMinhas) => ['ocorrencias', 'minhas', aba] as const,
  todasMinhas: ['ocorrencias', 'minhas'] as const,
  mapaCalor: (area: AreaMapa, categoria?: Categoria) => ['mapa', 'calor', area, categoria ?? null] as const,
  mapaZonas: (area: AreaMapa) => ['mapa', 'zonas', area] as const,
  mapa: ['mapa'] as const,
  semelhantes: (busca: BuscaSemelhantes) => ['semelhantes', busca] as const,
  linhas: (busca: string) => ['transporte-linhas', busca] as const,
  trajeto: (codigo: string, sentido: 1 | 2) => ['transporte-trajeto', codigo, sentido] as const,
  veiculos: (codigo: string, sentido: 1 | 2) => ['transporte-veiculos', codigo, sentido] as const,
  perfil: ['perfil'] as const,
  dadosUsuario: (uid: string) => ['dados-usuario', uid] as const,
} as const;
