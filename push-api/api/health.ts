import type { VercelRequest, VercelResponse } from '@vercel/node';

import { chavePrivadaValida, variaveisFaltando } from '../src/firebase.js';

/** GET /health — mostra se a API está no ar e configurada. Não revela valores, só nomes ausentes. */
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  const faltando = variaveisFaltando();
  const chaveOk = faltando.length === 0 && chavePrivadaValida();
  // Armazenamento de fotos (Vercel Blob): a variável é criada pela Vercel ao conectar o Blob.
  const fotosConfiguradas = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  res.status(chaveOk ? 200 : 503).json({
    status: chaveOk ? 'ok' : 'configuracao-incompleta',
    servico: 'colecity-push-api',
    variaveisFaltando: faltando,
    chavePrivadaValida: chaveOk,
    fotosConfiguradas,
    hora: new Date().toISOString(),
  });
}
