import * as Crypto from 'expo-crypto';

import { env } from '@/config/env';

import type { UploadService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { comprimirParaWebp } from '@/services/imagem';
import type { Foto, FotoRef } from '@/types/ocorrencia';
import { LIMITES } from '@/utils/validacoes';

import { auth } from '@/services/firebase';

import { exigirUid } from './base';

/**
 * Fotos guardadas só no aparelho: usado quando a API do Colecity não está configurada
 * (`EXPO_PUBLIC_PUSH_API_URL` vazia). O caminho normal é `uploadNuvem`, abaixo.
 * A foto é comprimida para WebP (RN-REG-04) e fica no aparelho de quem tirou: o Firestore guarda
 * apenas o caminho lógico e o endereço local do arquivo, nunca a imagem em Base64.
 * Consequência: outros aparelhos não conseguem abrir essas fotos e veem a imagem padrão.
 * Com o Storage ativo, basta trocar `enviar` por um upload para `ocorrencias/{uid}/` e
 * `comentarios/{uid}/`, sem mudar as telas.
 */

/** Fotos preparadas nesta sessão: caminho → foto (com o endereço local). */
const preparadas = new Map<string, Foto>();

export const uploadLocal: UploadService = {
  comprimir: comprimirParaWebp,

  enviar(foto, destino) {
    const uid = exigirUid();
    const id = Crypto.randomUUID();
    const preparada: Foto = { id, path: `${destino}/${uid}/${id}.webp`, url: foto.uri };
    preparadas.set(preparada.path, preparada);
    return Promise.resolve(preparada);
  },
};

/** Resposta de `POST /fotos` da API do Colecity. */
function ehFotoEnviada(valor: unknown): valor is Foto {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'id' in valor &&
    'path' in valor &&
    'url' in valor &&
    typeof valor.id === 'string' &&
    typeof valor.path === 'string' &&
    typeof valor.url === 'string'
  );
}

/**
 * Fotos na nuvem (Vercel Blob), enviadas pela API do Colecity (`push-api/`, `POST /fotos`).
 * A API confere o login do Firebase, decide o caminho (`{destino}/{uid}/{id}.webp`) e guarda a
 * imagem; o app nunca tem a chave do armazenamento. O Firestore guarda só o caminho e a URL
 * pública, nunca a imagem. Sem conexão, o erro é `OFFLINE` e a ação vai para a fila offline.
 */
export const uploadNuvem: UploadService = {
  comprimir: comprimirParaWebp,

  async enviar(foto, destino) {
    const uid = exigirUid();
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new ErroApi('NAO_AUTENTICADO', 401);

    let resposta: Response;
    try {
      const arquivo = await (await fetch(foto.uri)).blob();
      resposta = await fetch(`${env.pushApiUrl.replace(/\/+$/, '')}/fotos?destino=${destino}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/webp' },
        body: arquivo,
      });
    } catch {
      throw new ErroApi('OFFLINE', 0);
    }

    if (resposta.status === 401) throw new ErroApi('NAO_AUTENTICADO', 401);
    if (resposta.status === 413 || resposta.status === 415) throw new ErroApi('FOTO_INVALIDA', 422);
    if (!resposta.ok) throw new ErroApi('ERRO_INTERNO', resposta.status);

    const enviada: unknown = await resposta.json();
    // Só aceita o caminho que a API montou para esta conta.
    if (!ehFotoEnviada(enviada) || !enviada.path.startsWith(`${destino}/${uid}/`)) {
      throw new ErroApi('ERRO_INTERNO', 500);
    }
    preparadas.set(enviada.path, enviada);
    return enviada;
  },
};

/**
 * Valida as referências de fotos (doc 10, seção 3.1) e devolve as fotos completas.
 * `existentes` são as que o recurso já tinha e podem ser mantidas numa edição.
 */
export function resolverFotos(
  refs: readonly FotoRef[] | undefined,
  uid: string,
  existentes: readonly Foto[] = [],
): Foto[] {
  const lista = refs ?? [];
  if (lista.length > LIMITES.fotosMax) throw new ErroApi('LIMITE_FOTOS_EXCEDIDO', 422);

  return lista.map((ref) => {
    const jaExistente = existentes.find((foto) => foto.path === ref.path);
    if (jaExistente) return jaExistente;

    const pastaValida =
      ref.path.startsWith(`ocorrencias/${uid}/`) || ref.path.startsWith(`comentarios/${uid}/`);
    const preparada = preparadas.get(ref.path);
    if (!ref.path.endsWith('.webp') || !pastaValida || !preparada) {
      throw new ErroApi('FOTO_INVALIDA', 422);
    }
    return preparada;
  });
}
