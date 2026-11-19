/** Envio pelo Expo Push Service (https://docs.expo.dev/push-notifications/sending-notifications/). */
const URL_EXPO = 'https://exp.host/--/api/v2/push/send';
const URL_RECIBOS = 'https://exp.host/--/api/v2/push/getReceipts';
/** Tempo para o Expo entregar ao FCM e liberar o recibo de entrega. */
const ESPERA_RECIBOS_MS = 4000;
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
  id?: string;
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
  const ticketPorId = new Map<string, string>();

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
      if (ehRecibo(recibo) && recibo.status === 'ok' && recibo.id && mensagem) ticketPorId.set(recibo.id, mensagem.to);
      if (!ehRecibo(recibo) || recibo.status !== 'error') return;
      const codigo = recibo.details?.error ?? 'ERRO_DESCONHECIDO';
      erros.push(codigo);
      // Detalhe no log da Vercel para diagnóstico (a mensagem do Expo não traz dados pessoais).
      console.warn('Expo Push recusou uma mensagem:', codigo, recibo.message ?? '');
      if (mensagem && codigo === 'DeviceNotRegistered') invalidos.push(mensagem.to);
    });
  }

  await conferirEntregas(ticketPorId, invalidos, erros);
  return { invalidos, erros };
}

/**
 * Lê os recibos de entrega (o "aceito" do envio não garante que o FCM entregou ao aparelho) e registra
 * no log o resultado, sem tokens. Falha aqui nunca derruba o envio, que já foi feito.
 */
async function conferirEntregas(ticketPorId: Map<string, string>, invalidos: string[], erros: string[]): Promise<void> {
  if (ticketPorId.size === 0) return;
  try {
    await new Promise((resolver) => setTimeout(resolver, ESPERA_RECIBOS_MS));
    const resposta = await fetch(URL_RECIBOS, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...ticketPorId.keys()] }),
    });
    const corpo: unknown = await resposta.json();
    const dados: unknown = typeof corpo === 'object' && corpo !== null && 'data' in corpo ? corpo.data : null;
    if (typeof dados !== 'object' || dados === null) return;
    let entregues = 0;
    for (const [id, recibo] of Object.entries(dados)) {
      if (!ehRecibo(recibo)) continue;
      if (recibo.status === 'ok') {
        entregues++;
        continue;
      }
      const codigo = recibo.details?.error ?? 'ERRO_DESCONHECIDO';
      erros.push(codigo);
      console.warn('Entrega do push falhou:', codigo, recibo.message ?? '');
      const token = ticketPorId.get(id);
      if (token && codigo === 'DeviceNotRegistered') invalidos.push(token);
    }
    console.info(`Recibos: ${entregues} entregue(s) ao FCM de ${ticketPorId.size}; pendentes: ${ticketPorId.size - Object.keys(dados).length}`);
  } catch {
    console.warn('Não foi possível ler os recibos do Expo.');
  }
}
