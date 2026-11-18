import type { VercelRequest, VercelResponse } from '@vercel/node';

import { chaveServico } from '../src/dominio.js';
import { processarEvento, lerEvento } from '../src/eventos.js';
import { cabecalho, ErroHttp, responderErro, segredoConfere } from '../src/http.js';

/**
 * POST /eventos-dominio — chamado **pelo domínio** (outbox), nunca pelo app.
 * Protegido pela mesma credencial de serviço usada nas chamadas BFF → domínio.
 * Responde 2xx quando o evento foi tratado (ou ignorado); 5xx faz o domínio tentar de novo.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      throw new ErroHttp(405, 'METODO_NAO_PERMITIDO', 'Use POST.');
    }
    if (!segredoConfere(cabecalho(req, 'x-service-key'), chaveServico())) {
      throw new ErroHttp(401, 'NAO_AUTENTICADO', 'Credencial de serviço inválida.');
    }

    let corpo: unknown = req.body;
    if (typeof corpo === 'string') {
      try {
        corpo = JSON.parse(corpo);
      } catch {
        corpo = null;
      }
    }
    const evento = lerEvento(corpo);
    if (evento === 'TIPO_DESCONHECIDO') {
      res.status(200).json({ enviado: false, motivo: 'TIPO_DESCONHECIDO' });
      return;
    }

    const resultado = await processarEvento(evento);
    // Log sem uid nem tokens (LGPD).
    console.info('Evento', evento.tipo, evento.eventId, resultado.motivo ?? `${resultado.aparelhos} aparelho(s)`);
    res.status(200).json(resultado);
  } catch (erro) {
    responderErro(res, erro, '/eventos-dominio');
  }
}
