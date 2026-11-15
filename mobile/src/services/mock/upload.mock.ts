import { exigirUsuario, novoId, salvarBanco, simularRede } from '@/mocks/banco';
import type { UploadService } from '@/services/contratos';
import { comprimirParaWebp } from '@/services/imagem';
import type { Foto } from '@/types/ocorrencia';

/**
 * Upload simulado: a compressão WebP é real (RN-REG-04); o "Storage" é o próprio arquivo local.
 * O caminho segue o padrão do contrato: `ocorrencias/{uid}/{uuid}.webp`.
 */
export const uploadMock: UploadService = {
  comprimir: comprimirParaWebp,

  async enviar(foto, destino) {
    const db = await simularRede();
    const usuario = exigirUsuario(db);
    const id = novoId();
    const enviada: Foto = { id, path: `${destino}/${usuario.id}/${id}.webp`, url: foto.uri };
    db.fotosEnviadas = { ...db.fotosEnviadas, [enviada.path]: enviada };
    await salvarBanco();
    return enviada;
  },
};
