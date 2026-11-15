import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { FotoLocal } from './contratos';

/** RN-REG-04: WebP, maior lado ≤ 1920 px, qualidade 0,7. */
export const FOTO_MAIOR_LADO = 1920;
export const FOTO_QUALIDADE = 0.7;

/**
 * Processa a foto no aparelho antes do envio: redimensiona mantendo a proporção
 * e converte para WebP. Usado pelos adaptadores mock e real.
 */
export async function comprimirParaWebp(uri: string): Promise<FotoLocal> {
  const contexto = ImageManipulator.manipulate(uri);
  let imagem = await contexto.renderAsync();

  if (Math.max(imagem.width, imagem.height) > FOTO_MAIOR_LADO) {
    contexto.resize(
      imagem.width >= imagem.height ? { width: FOTO_MAIOR_LADO } : { height: FOTO_MAIOR_LADO },
    );
    imagem = await contexto.renderAsync();
  }

  const resultado = await imagem.saveAsync({ format: SaveFormat.WEBP, compress: FOTO_QUALIDADE });
  return { uri: resultado.uri, largura: resultado.width, altura: resultado.height };
}
