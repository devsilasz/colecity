import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';

import { env } from '@/config/env';
import type { UploadService } from '@/services/contratos';
import { ErroApi } from '@/services/erros';
import { auth } from '@/services/firebase';
import { comprimirParaWebp } from '@/services/imagem';
import type { Foto } from '@/types/ocorrencia';

/** Resposta de `POST /fotos` do BFF. */
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
 * Fotos no Vercel Blob, enviadas pelo BFF (`POST /fotos`). O BFF confere o login, decide o caminho
 * (`{destino}/{uid}/{id}.webp`) e guarda a imagem; o app nunca tem a chave do armazenamento.
 * O domínio recebe só o `path` (doc 10, seção 3.1). Sem conexão, o erro é `OFFLINE` e a ação vai
 * para a fila offline.
 *
 * Usa `fetch` (e não o Axios) porque o corpo é o arquivo binário, não JSON.
 */
export const uploadHttp: UploadService = {
  comprimir: comprimirParaWebp,

  async enviar(foto, destino) {
    const uid = auth.currentUser?.uid;
    const token = await auth.currentUser?.getIdToken();
    if (!uid || !token) throw new ErroApi('NAO_AUTENTICADO', 401);

    let resposta: Response;
    try {
      // Bytes lidos direto do arquivo e enviados pelo fetch do Expo: o Blob do React Native passa por
      // base64 e, no Android, chegava ao BFF sem a assinatura WebP (415).
      const bytes = await new File(foto.uri).bytes();
      resposta = await fetch(`${env.bffUrl}/fotos?destino=${destino}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/webp' },
        body: bytes,
      });
    } catch {
      throw new ErroApi('OFFLINE', 0);
    }

    if (resposta.status === 401) throw new ErroApi('NAO_AUTENTICADO', 401);
    if (resposta.status === 413 || resposta.status === 415) throw new ErroApi('FOTO_INVALIDA', 422);
    if (!resposta.ok) throw new ErroApi('ERRO_INTERNO', resposta.status);

    const enviada: unknown = await resposta.json();
    // Só aceita o caminho que o BFF montou para esta conta.
    if (!ehFotoEnviada(enviada) || !enviada.path.startsWith(`${destino}/${uid}/`)) {
      throw new ErroApi('ERRO_INTERNO', 500);
    }
    return enviada;
  },
};
