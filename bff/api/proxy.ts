import type { VercelRequest, VercelResponse } from '@vercel/node';

import { usuarioDaRequisicao } from '../src/auth.js';
import { chamarDominio, codigoDoErro, type RespostaDominio } from '../src/dominio.js';
import { acrescentarUrls, baseDasFotos } from '../src/fotos.js';
import { cabecalho, enviarProblema, ErroHttp, lerCorpo, responderErro } from '../src/http.js';
import { caminhoNoDominio } from '../src/rotas.js';
import { esquecerUsuario, guardarAceite, prepararCadastro, recadastrar } from '../src/usuarios.js';

/** O corpo é repassado cru ao domínio. */
export const config = { api: { bodyParser: false } };

const LIMITE_CORPO = 256 * 1024;
const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
/** Headers do app que seguem para o domínio. `X-Service-Key`/`X-User-Id` nunca vêm do app. */
const REPASSADOS = ['content-type', 'idempotency-key', 'accept-language'];
/** Headers da resposta do domínio que voltam ao app. */
const DEVOLVIDOS = ['retry-after', 'location', 'etag'];

/** Caminho original pedido pelo app (o `vercel.json` reescreve tudo para cá com `__rota`). */
function caminhoEQuery(req: VercelRequest): { caminho: string; query: string } {
  const url = new URL(req.url ?? '/', 'http://bff');
  const rota = url.searchParams.get('__rota') ?? url.pathname;
  url.searchParams.delete('__rota');
  const query = url.searchParams.toString();
  return { caminho: rota, query: query ? `?${query}` : '' };
}

function devolver(res: VercelResponse, resposta: RespostaDominio): void {
  res.statusCode = resposta.status;
  for (const nome of DEVOLVIDOS) {
    const valor = resposta.headers.get(nome);
    if (valor) res.setHeader(nome, valor);
  }

  const tipo = resposta.headers.get('content-type') ?? '';
  if (resposta.corpo.length === 0) {
    res.end();
    return;
  }
  res.setHeader('Content-Type', tipo || 'application/json; charset=utf-8');

  // Respostas JSON de sucesso ganham a URL pública das fotos.
  const base = baseDasFotos();
  if (base && tipo.includes('json') && resposta.status < 300) {
    try {
      const json: unknown = JSON.parse(resposta.corpo.toString('utf8'));
      acrescentarUrls(json, base);
      res.end(JSON.stringify(json));
      return;
    } catch {
      // Corpo não era JSON válido: devolve como veio.
    }
  }
  res.end(resposta.corpo);
}

/**
 * Todas as rotas do app (doc 08, seção 11) que espelham o domínio (doc 10).
 * Com `Authorization`, valida o ID token e envia o uid como `X-User-Id`; sem ele, a rota é
 * repassada sem usuário (as consultas públicas funcionam, as 🔒 voltam 401 do domínio).
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const metodo = req.method ?? 'GET';
    if (!METODOS.includes(metodo)) throw new ErroHttp(405, 'METODO_NAO_PERMITIDO', 'Método não permitido.');

    const { caminho, query } = caminhoEQuery(req);
    const destino = caminhoNoDominio(caminho);
    if (!destino) throw new ErroHttp(404, 'ROTA_NAO_ENCONTRADA', 'Recurso não encontrado.');

    const usuario = await usuarioDaRequisicao(req);
    let corpo = metodo === 'GET' || metodo === 'DELETE' ? Buffer.alloc(0) : await lerCorpo(req, LIMITE_CORPO);

    const headers: Record<string, string> = {};
    for (const nome of REPASSADOS) {
      const valor = cabecalho(req, nome);
      if (valor) headers[nome] = valor;
    }

    // Cadastro: o e-mail vem do token, e o aceite dos termos é guardado para recadastros.
    const ehCadastro = metodo === 'PUT' && destino === 'usuarios/me' && usuario !== null;
    let aceite: string | null = null;
    if (ehCadastro) {
      ({ corpo, aceite } = prepararCadastro(corpo, usuario));
      headers['content-type'] = 'application/json';
    }

    const pedido = { metodo, caminho: `${destino}${query}`, uid: usuario?.uid, corpo, headers };
    let resposta = await chamarDominio(pedido);

    // Domínio não conhece o uid (primeiro acesso ou banco recriado): cadastra e repete uma vez.
    if (
      usuario &&
      !ehCadastro &&
      resposta.status === 403 &&
      codigoDoErro(resposta) === 'USUARIO_NAO_CADASTRADO' &&
      (await recadastrar(usuario))
    ) {
      resposta = await chamarDominio(pedido);
    }

    if (ehCadastro && aceite && resposta.status < 300) await guardarAceite(usuario.uid, aceite);
    // Conta excluída (anonimizada no domínio): o BFF não pode recadastrá-la depois.
    if (usuario && metodo === 'DELETE' && destino === 'usuarios/me' && resposta.status < 300) {
      await esquecerUsuario(usuario.uid);
    }

    devolver(res, resposta);
  } catch (erro) {
    if (res.headersSent) return;
    if (erro instanceof ErroHttp) {
      enviarProblema(res, erro.status, erro.codigo, erro.message);
      return;
    }
    responderErro(res, erro, 'proxy');
  }
}
