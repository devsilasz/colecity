import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

import { autenticacao } from '../src/firebase.js';
import { ErroHttp } from '../src/tipos.js';

/** Fotos já chegam comprimidas em WebP (≤ 1920 px, qualidade 0,7); 2 MB sobra com folga. */
const TAMANHO_MAXIMO = 2 * 1024 * 1024;
const DESTINOS = ['ocorrencias', 'comentarios'] as const;
type Destino = (typeof DESTINOS)[number];

// O corpo é a imagem crua: a Vercel não deve tentar interpretá-lo como JSON.
export const config = { api: { bodyParser: false } };

function ehDestino(valor: unknown): valor is Destino {
  return typeof valor === 'string' && (DESTINOS as readonly string[]).includes(valor);
}

/** Lê o corpo como bytes, abortando acima do limite. */
function lerCorpo(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolver, rejeitar) => {
    const partes: Buffer[] = [];
    let total = 0;
    req.on('data', (parte: Buffer) => {
      total += parte.length;
      if (total > TAMANHO_MAXIMO) {
        rejeitar(new ErroHttp(413, 'FOTO_GRANDE_DEMAIS', 'A foto passa de 2 MB.'));
        req.destroy();
        return;
      }
      partes.push(parte);
    });
    req.on('end', () => resolver(Buffer.concat(partes)));
    req.on('error', rejeitar);
  });
}

/** Confere a assinatura do arquivo: WebP começa com "RIFF" e tem "WEBP" no byte 8. */
function ehWebp(bytes: Buffer): boolean {
  return (
    bytes.length > 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

async function uidDoToken(cabecalho: string | undefined): Promise<string> {
  const token = cabecalho?.startsWith('Bearer ') ? cabecalho.slice('Bearer '.length).trim() : '';
  if (!token) throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Envie o ID token do Firebase.');
  try {
    return (await autenticacao().verifyIdToken(token)).uid;
  } catch {
    throw new ErroHttp(401, 'NAO_AUTENTICADO', 'ID token inválido ou expirado.');
  }
}

/**
 * POST /fotos?destino=ocorrencias|comentarios — corpo: a foto em WebP (`Content-Type: image/webp`).
 *
 * Recebe a foto de quem está logado e guarda no Vercel Blob. O caminho é decidido aqui
 * (`{destino}/{uid}/{id}.webp`), nunca pelo app, e a chave do Blob fica só na Vercel.
 * Devolve `{ id, path, url }`, o mesmo formato de foto usado no Firestore.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ erro: 'METODO_NAO_PERMITIDO', mensagem: 'Use POST.' });
    return;
  }

  try {
    const uid = await uidDoToken(req.headers.authorization);

    const destino = req.query.destino;
    if (!ehDestino(destino)) {
      throw new ErroHttp(400, 'REQUISICAO_INVALIDA', 'Informe destino=ocorrencias ou destino=comentarios.');
    }
    if (req.headers['content-type'] !== 'image/webp') {
      throw new ErroHttp(415, 'FORMATO_INVALIDO', 'Envie a foto em WebP (Content-Type: image/webp).');
    }
    const declarado = Number(req.headers['content-length'] ?? '0');
    if (declarado > TAMANHO_MAXIMO) throw new ErroHttp(413, 'FOTO_GRANDE_DEMAIS', 'A foto passa de 2 MB.');

    const bytes = await lerCorpo(req);
    if (!ehWebp(bytes)) throw new ErroHttp(415, 'FORMATO_INVALIDO', 'O arquivo não é uma imagem WebP.');

    const id = randomUUID();
    const path = `${destino}/${uid}/${id}.webp`;
    const blob = await put(path, bytes, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
      // Fotos nunca mudam: cache longo nos aparelhos e na CDN.
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });

    res.status(201).json({ id, path, url: blob.url });
  } catch (erro) {
    if (erro instanceof ErroHttp) {
      res.status(erro.status).json({ erro: erro.codigo, mensagem: erro.message });
      return;
    }
    console.error('Falha em /fotos:', erro instanceof Error ? erro.message : erro);
    res.status(500).json({ erro: 'ERRO_INTERNO', mensagem: 'Não foi possível guardar a foto.' });
  }
}
