import { randomUUID } from 'node:crypto';

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

import { exigirUsuario } from '../src/auth.js';
import { cabecalho, ErroHttp, lerCorpo, responderErro } from '../src/http.js';

/** Fotos já chegam comprimidas em WebP (≤ 1920 px, qualidade 0,7); 2 MB sobra com folga. */
const TAMANHO_MAXIMO = 2 * 1024 * 1024;
const DESTINOS = ['ocorrencias', 'comentarios'] as const;
type Destino = (typeof DESTINOS)[number];

// O corpo é a imagem crua: a Vercel não deve tentar interpretá-lo como JSON.
export const config = { api: { bodyParser: false } };

function ehDestino(valor: unknown): valor is Destino {
  return typeof valor === 'string' && (DESTINOS as readonly string[]).includes(valor);
}

/** Confere a assinatura do arquivo: WebP começa com "RIFF" e tem "WEBP" no byte 8. */
function ehWebp(bytes: Buffer): boolean {
  return (
    bytes.length > 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

/**
 * POST /fotos?destino=ocorrencias|comentarios — corpo: a foto em WebP (`Content-Type: image/webp`).
 *
 * Guarda a foto de quem está logado no Vercel Blob. O caminho é decidido aqui
 * (`{destino}/{uid}/{id}.webp`, o formato que o domínio aceita, doc 10, seção 3.1), nunca pelo
 * app, e a chave do Blob fica só na Vercel. Devolve `{ id, path, url }`; o app envia só o `path`
 * ao criar a ocorrência ou o comentário.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      throw new ErroHttp(405, 'METODO_NAO_PERMITIDO', 'Use POST.');
    }
    const { uid } = await exigirUsuario(req);

    const destino = req.query.destino;
    if (!ehDestino(destino)) {
      throw new ErroHttp(400, 'REQUISICAO_INVALIDA', 'Informe destino=ocorrencias ou destino=comentarios.');
    }
    // O fetch do Android troca o Content-Type pelo tipo do Blob (às vezes vazio ou genérico):
    // o cabeçalho só barra o que claramente não é imagem; quem decide é a assinatura do arquivo.
    const tipo = (cabecalho(req, 'content-type') ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
    if (tipo && tipo !== 'application/octet-stream' && !tipo.startsWith('image/')) {
      throw new ErroHttp(415, 'FOTO_INVALIDA', 'Envie a foto em WebP (Content-Type: image/webp).');
    }
    if (Number(cabecalho(req, 'content-length') ?? '0') > TAMANHO_MAXIMO) {
      throw new ErroHttp(413, 'FOTO_GRANDE_DEMAIS', 'A foto passa de 2 MB.');
    }

    const bytes = await lerCorpo(req, TAMANHO_MAXIMO, 'FOTO_GRANDE_DEMAIS');
    if (!ehWebp(bytes)) {
      // Diagnóstico sem dado pessoal: tipo declarado, tamanho e assinatura do arquivo.
      console.warn('[fotos] recusada', { tipo, tamanho: bytes.length, inicio: bytes.subarray(0, 12).toString('hex') });
      throw new ErroHttp(415, 'FOTO_INVALIDA', 'O arquivo não é uma imagem WebP.');
    }

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
    responderErro(res, erro, '/fotos');
  }
}
