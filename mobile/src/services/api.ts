import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import type { CodigoErro, ProblemDetails } from '@/types/api';

import { ehCodigoErro, ErroApi } from './erros';

/**
 * Cliente HTTP do BFF (doc 09, seção 4.1).
 *
 * Request:  injeta `Authorization: Bearer <ID token>`.
 * Response: 401 → renova o token e repete uma vez; se falhar, encerra a sessão.
 *           429 → "Muitas ações seguidas, aguarde um instante" (RN-GER-12).
 *           sem conexão → erro tipado OFFLINE, tratado pela fila (RN-GER-10).
 */

/** Ligação com a autenticação, registrada pelo AuthContext (evita import circular). */
export interface PonteAutenticacao {
  obterToken: (forcarRenovacao: boolean) => Promise<string | null>;
  encerrarSessao: () => Promise<void>;
}

let ponte: PonteAutenticacao | null = null;

export function configurarAutenticacaoApi(novaPonte: PonteAutenticacao | null): void {
  ponte = novaPonte;
}

type ConfigComRepeticao = InternalAxiosRequestConfig & { _repetida?: boolean };

// eslint-disable-next-line import/no-named-as-default-member -- `axios.create` é a forma documentada.
export const api = axios.create({
  baseURL: env.bffUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await ponte?.obterToken(false);
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

function codigoPorStatus(status: number): CodigoErro {
  if (status === 400) return 'REQUISICAO_INVALIDA';
  if (status === 401) return 'NAO_AUTENTICADO';
  if (status === 403) return 'SEM_PERMISSAO';
  if (status === 404) return 'NAO_ENCONTRADO';
  if (status === 429) return 'MUITAS_REQUISICOES';
  return 'ERRO_INTERNO';
}

function converterErro(erro: AxiosError<ProblemDetails>): ErroApi {
  // Sem resposta do servidor: sem conexão ou tempo esgotado.
  if (!erro.response) return new ErroApi('OFFLINE', 0);

  const { status, data } = erro.response;
  const code = status !== 429 && ehCodigoErro(data?.code) ? data.code : codigoPorStatus(status);
  return new ErroApi(code, status, data?.errors ?? {});
}

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro: AxiosError<ProblemDetails>) => {
    const original = erro.config as ConfigComRepeticao | undefined;

    if (erro.response?.status === 401 && original && !original._repetida && ponte) {
      original._repetida = true;
      const novoToken = await ponte.obterToken(true).catch(() => null);
      if (novoToken) {
        original.headers.set('Authorization', `Bearer ${novoToken}`);
        return api.request(original);
      }
      await ponte.encerrarSessao();
    } else if (erro.response?.status === 401 && original?._repetida && ponte) {
      await ponte.encerrarSessao();
    }

    const convertido = converterErro(erro);
    if (__DEV__) {
      // Log só em desenvolvimento, sem token nem dados pessoais.
      console.warn(`[api] ${original?.method?.toUpperCase()} ${original?.url} → ${convertido.status} ${convertido.code}`);
    }
    return Promise.reject(convertido);
  },
);

/** Atalhos tipados: devolvem direto o corpo da resposta. */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return (await api.get<T>(url, config)).data;
}

export async function post<T, B = undefined>(url: string, corpo?: B, config?: AxiosRequestConfig): Promise<T> {
  return (await api.post<T>(url, corpo, config)).data;
}

export async function put<T, B = undefined>(url: string, corpo?: B, config?: AxiosRequestConfig): Promise<T> {
  return (await api.put<T>(url, corpo, config)).data;
}

export async function patch<T, B = undefined>(url: string, corpo?: B, config?: AxiosRequestConfig): Promise<T> {
  return (await api.patch<T>(url, corpo, config)).data;
}

export async function del<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return (await api.delete<T>(url, config)).data;
}

/** Header de idempotência para criações (doc 10, seção 1.1). */
export function comIdempotencia(chave: string): AxiosRequestConfig {
  return { headers: { 'Idempotency-Key': chave } };
}
