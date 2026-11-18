/**
 * O domínio guarda só o `path` das fotos (doc 10, seção 3.1); a URL pública é montada aqui.
 * As fotos ficam no Vercel Blob com o próprio `path` como nome (sem sufixo aleatório).
 */
const PATH_FOTO = /^(ocorrencias|comentarios)\/[^/]+\/[^/]+\.webp$/;

/**
 * Endereço público do Blob. `BLOB_BASE_URL` tem prioridade; senão, sai do id da loja,
 * que faz parte do token (`vercel_blob_rw_<loja>_<segredo>`), como o próprio SDK faz.
 */
export function baseDasFotos(): string | null {
  const configurada = process.env.BLOB_BASE_URL?.replace(/\/+$/, '');
  if (configurada) return configurada;
  const loja = (process.env.BLOB_READ_WRITE_TOKEN ?? '').split('_')[3];
  return loja ? `https://${loja.toLowerCase()}.public.blob.vercel-storage.com` : null;
}

/** Percorre o JSON e acrescenta `url` a todo objeto `{ path }` que seja uma foto. */
export function acrescentarUrls(valor: unknown, base: string): void {
  if (Array.isArray(valor)) {
    for (const item of valor) acrescentarUrls(item, base);
    return;
  }
  if (typeof valor !== 'object' || valor === null) return;

  const objeto = valor as Record<string, unknown>;
  if (typeof objeto.path === 'string' && PATH_FOTO.test(objeto.path) && objeto.url === undefined) {
    objeto.url = `${base}/${objeto.path}`;
  }
  for (const filho of Object.values(objeto)) acrescentarUrls(filho, base);
}
