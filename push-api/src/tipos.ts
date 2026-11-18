export const EVENTOS = ['comentario', 'concluida', 'reaberta'] as const;
export type Evento = (typeof EVENTOS)[number];

/** Corpo de `POST /notificar`. O app nunca envia destinatários nem texto. */
export interface PedidoNotificacao {
  ocorrenciaId: string;
  evento: Evento;
  eventoId: string;
}

export type MotivoIgnorado = 'DUPLICADO' | 'SEM_DESTINATARIOS';

export interface ResultadoNotificacao {
  enviado: boolean;
  /** Preenchido quando nada foi enviado. */
  motivo?: MotivoIgnorado;
  destinatarios: number;
  aparelhos: number;
  tokensDesativados: number;
  /** Erros devolvidos pelo Expo Push Service, quando houver (diagnóstico). */
  errosEnvio?: string[];
}

/** Erro com status HTTP e código estável, devolvido ao app como JSON. */
export class ErroHttp extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

// ── Documentos do Firestore lidos pela API (mesma estrutura do app) ──────────────────────
export interface OcorrenciaDoc {
  tipo: string;
  estado: 'ABERTA' | 'EM_ACOMPANHAMENTO' | 'CONCLUIDA';
  rua: string;
  bairro: string;
  autorId: string;
  concluidaEm: string | null;
}

export interface ParticipacaoDoc {
  uid: string;
  ocorrenciaId: string;
  afetado: boolean;
  apoio: boolean;
}

export interface ComentarioDoc {
  ocorrenciaId: string;
  autorId: string;
}

export interface DeviceDoc {
  token: string;
  plataforma: string;
  enabled: boolean;
  updatedAt: string;
}
