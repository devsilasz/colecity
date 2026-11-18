import type { IncomingMessage, ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';

/**
 * Erro do BFF com status HTTP e `code` estável. Vai ao app no mesmo formato dos erros do
 * domínio (Problem Details, doc 10, seção 1.2), para o app tratar tudo de um jeito só.
 */
export class ErroHttp extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

export function enviarProblema(res: ServerResponse, status: number, codigo: string, titulo: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/problem+json; charset=utf-8');
  res.end(JSON.stringify({ type: 'about:blank', title: titulo, status, code: codigo }));
}

/** Responde um erro: `ErroHttp` vira Problem Details; o resto vira 500 genérico (detalhe só no log). */
export function responderErro(res: ServerResponse, erro: unknown, contexto: string): void {
  if (erro instanceof ErroHttp) {
    enviarProblema(res, erro.status, erro.codigo, erro.message);
    return;
  }
  console.error(`Falha em ${contexto}:`, erro instanceof Error ? erro.message : erro);
  enviarProblema(res, 500, 'ERRO_INTERNO', 'Erro inesperado. Tente novamente.');
}

/** Lê o corpo cru da requisição, abortando acima do limite. */
export function lerCorpo(req: IncomingMessage, limite: number, codigoExcesso = 'CORPO_GRANDE_DEMAIS'): Promise<Buffer> {
  return new Promise((resolver, rejeitar) => {
    const partes: Buffer[] = [];
    let total = 0;
    req.on('data', (parte: Buffer) => {
      total += parte.length;
      if (total > limite) {
        rejeitar(new ErroHttp(413, codigoExcesso, 'A requisição passa do tamanho permitido.'));
        req.destroy();
        return;
      }
      partes.push(parte);
    });
    req.on('end', () => resolver(Buffer.concat(partes)));
    req.on('error', rejeitar);
  });
}

/** Compara segredos em tempo constante. */
export function segredoConfere(recebido: string | undefined, esperado: string): boolean {
  if (!recebido || !esperado) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Primeiro valor de um header (o Node pode entregar string[]). */
export function cabecalho(req: IncomingMessage, nome: string): string | undefined {
  const valor = req.headers[nome.toLowerCase()];
  return Array.isArray(valor) ? valor[0] : valor;
}
