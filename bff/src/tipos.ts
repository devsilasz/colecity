/** Envelope enviado pelo domínio em `POST /eventos-dominio` (doc 10, seção 5). */
export const TIPOS_EVENTO = [
  'ocorrencia.estado_alterado',
  'ocorrencia.comentario_criado',
  'transporte.desvio_confirmado',
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export type EstadoOcorrencia = 'ABERTA' | 'EM_ACOMPANHAMENTO' | 'CONCLUIDA';

export interface EventoDominio {
  eventId: string;
  tipo: TipoEvento;
  ocorridoEm: string;
  dados: {
    ocorrenciaId: string;
    /** "Tipo – Rua, Bairro": já é público. */
    titulo: string;
    destinatariosUids: string[];
    novoEstado?: EstadoOcorrencia;
    linha?: string;
  };
}

export type MotivoIgnorado = 'DUPLICADO' | 'SEM_DESTINATARIOS' | 'TIPO_DESCONHECIDO';

export interface ResultadoEvento {
  enviado: boolean;
  /** Preenchido quando nada foi enviado. */
  motivo?: MotivoIgnorado;
  destinatarios: number;
  aparelhos: number;
  tokensDesativados: number;
  /** Erros devolvidos pelo Expo Push Service, quando houver (diagnóstico). */
  errosEnvio?: string[];
}

/** Aparelho em `users/{uid}/devices/{id}`, gravado pelo app. */
export interface DeviceDoc {
  token: string;
  plataforma: string;
  enabled: boolean;
  updatedAt: string;
  /** Canal do Android criado por esta versão do app. Ausente nos aparelhos com APK antigo. */
  canal?: string;
}
