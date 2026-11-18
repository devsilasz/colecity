/** Envio pelo Expo Push Service (https://docs.expo.dev/push-notifications/sending-notifications/). */
const URL_EXPO = 'https://exp.host/--/api/v2/push/send';
const LOTE = 100;

export interface MensagemPush {
  to: string;
  title: string;
  body: string;
  data: { occurrenceId: string };
  channelId: string;
  sound: 'default';
  priority: 'high';
}

interface Recibo {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

function ehRecibo(valor: unknown): valor is Recibo {
  return typeof valor === 'object' && valor !== null && 'status' in valor;
}

/** Formato dos tokens emitidos pelo Expo; qualquer outro valor é descartado antes do envio. */
export function ehTokenExpo(token: string): boolean {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}

export interface ResultadoEnvio {
  /** Tokens que o Expo informou como não registrados (`DeviceNotRegistered`). */
  invalidos: string[];
  /** Códigos de erro devolvidos pelo Expo (ex.: `InvalidCredentials`), sem tokens. */
  erros: string[];
}

/** Envia as mensagens em lotes de 100 e devolve os tokens inválidos e os erros do Expo. */
export async function enviarPush(mensagens: readonly MensagemPush[]): Promise<ResultadoEnvio> {
  const invalidos: string[] = [];
  const erros: string[] = [];

  for (let inicio = 0; inicio < mensagens.length; inicio += LOTE) {
    const lote = mensagens.slice(inicio, inicio + LOTE);
    const resposta = await fetch(URL_EXPO, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(lote),
    });
    if (!resposta.ok) throw new Error(`Expo Push Service respondeu ${resposta.status}`);

    const corpo: unknown = await resposta.json();
    const recibos: unknown =
      typeof corpo === 'object' && corpo !== null && 'data' in corpo ? corpo.data : null;
    if (!Array.isArray(recibos)) continue;

    recibos.forEach((recibo: unknown, indice) => {
      const mensagem = lote[indice];
      if (!ehRecibo(recibo) || recibo.status !== 'error') return;
      const codigo = recibo.details?.error ?? 'ERRO_DESCONHECIDO';
      erros.push(codigo);
      // Detalhe no log da Vercel para diagnóstico (a mensagem do Expo não traz dados pessoais).
      console.warn('Expo Push recusou uma mensagem:', codigo, recibo.message ?? '');
      if (mensagem && codigo === 'DeviceNotRegistered') invalidos.push(mensagem.to);
    });
  }
  return { invalidos, erros };
}
