import { ErroHttp } from './http.js';

/**
 * Cliente da API de domínio (C#, doc 10). Toda chamada leva a credencial de serviço e,
 * quando há usuário logado, o uid já validado. O app nunca vê esses headers.
 */
export const VARIAVEIS_DOMINIO = ['DOMINIO_URL', 'DOMINIO_SERVICE_KEY'] as const;

/** O Render gratuito dorme sem uso e leva até ~1 min para acordar. */
const TIMEOUT_MS = 55_000;

export function chaveServico(): string {
  return process.env.DOMINIO_SERVICE_KEY ?? '';
}

function urlBase(): string {
  const url = (process.env.DOMINIO_URL ?? '').replace(/\/+$/, '');
  if (!url || !chaveServico()) {
    throw new ErroHttp(503, 'DOMINIO_NAO_CONFIGURADO', 'Serviço temporariamente indisponível.');
  }
  return url;
}

export interface PedidoDominio {
  metodo: string;
  /** Caminho sob `/api/v1`, sem barra inicial, com a query string. Ex.: `ocorrencias?pagina=1`. */
  caminho: string;
  uid?: string;
  corpo?: Buffer;
  /** Headers extras repassados do app (Content-Type, Idempotency-Key...). */
  headers?: Record<string, string>;
}

export interface RespostaDominio {
  status: number;
  headers: Headers;
  corpo: Buffer;
}

export async function chamarDominio(pedido: PedidoDominio): Promise<RespostaDominio> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...pedido.headers,
    'X-Service-Key': chaveServico(),
  };
  if (pedido.uid) headers['X-User-Id'] = pedido.uid;

  let resposta: Response;
  try {
    resposta = await fetch(`${urlBase()}/api/v1/${pedido.caminho}`, {
      method: pedido.metodo,
      headers,
      body: pedido.corpo && pedido.corpo.length > 0 ? new Uint8Array(pedido.corpo) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (erro) {
    if (erro instanceof ErroHttp) throw erro;
    console.error('Domínio inacessível:', erro instanceof Error ? erro.message : erro);
    throw new ErroHttp(503, 'DOMINIO_INDISPONIVEL', 'Serviço temporariamente indisponível. Tente de novo.');
  }
  return { status: resposta.status, headers: resposta.headers, corpo: Buffer.from(await resposta.arrayBuffer()) };
}

/** `code` de um Problem Details do domínio, se houver. */
export function codigoDoErro(resposta: RespostaDominio): string | null {
  try {
    const corpo: unknown = JSON.parse(resposta.corpo.toString('utf8'));
    return typeof corpo === 'object' && corpo !== null && 'code' in corpo && typeof corpo.code === 'string'
      ? corpo.code
      : null;
  } catch {
    return null;
  }
}

/** `GET /health` do domínio, usado no health check do BFF. */
export async function dominioNoAr(): Promise<boolean> {
  try {
    const url = (process.env.DOMINIO_URL ?? '').replace(/\/+$/, '');
    if (!url) return false;
    const resposta = await fetch(`${url}/health`, { signal: AbortSignal.timeout(8_000) });
    return resposta.ok;
  } catch {
    return false;
  }
}
