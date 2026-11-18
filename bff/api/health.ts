import type { VercelRequest, VercelResponse } from '@vercel/node';

import { dominioNoAr, VARIAVEIS_DOMINIO } from '../src/dominio.js';
import { chavePrivadaValida, variaveisFaltando } from '../src/firebase.js';
import { baseDasFotos } from '../src/fotos.js';

/**
 * GET /health — mostra se o BFF está no ar e configurado, e se o domínio responde.
 * Não revela valores, só nomes de variáveis ausentes.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  const faltando = [...variaveisFaltando(), ...VARIAVEIS_DOMINIO.filter((nome) => !process.env[nome])];
  const firebaseOk = variaveisFaltando().length === 0 && chavePrivadaValida();
  const dominio = await dominioNoAr();
  const ok = faltando.length === 0 && firebaseOk;

  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'configuracao-incompleta',
    servico: 'colecity-bff',
    variaveisFaltando: faltando,
    chavePrivadaValida: firebaseOk,
    // O Render gratuito dorme: `false` aqui pode ser só o domínio acordando.
    dominioNoAr: dominio,
    fotosConfiguradas: baseDasFotos() !== null,
    hora: new Date().toISOString(),
  });
}
